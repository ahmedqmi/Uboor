import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, ImageUp, RefreshCw, Check, TriangleAlert } from 'lucide-react';
import { recognize, toCanvas, preprocess, type ScanMode } from './ocr';
import { parseMrz, formatMrzDate, type MrzResult } from './mrz';
import { normalizePlate } from './plate';
import './ScannerModal.css';

export type ScanResult =
  | { mode: 'mrz'; data: MrzResult }
  | { mode: 'plate'; plate: string };

interface Props {
  mode: ScanMode;
  onClose: () => void;
  onResult: (result: ScanResult) => void;
}

// Where the guide sits within the frame, in 0..1 coordinates. The overlay below is
// positioned with the same numbers so the crop matches exactly what the user framed.
const GUIDES: Record<ScanMode, { x: number; y: number; width: number; height: number }> = {
  mrz: { x: 0.04, y: 0.6, width: 0.92, height: 0.3 },
  plate: { x: 0.1, y: 0.33, width: 0.8, height: 0.34 },
};

const COPY: Record<ScanMode, { title: string; hint: string }> = {
  mrz: {
    title: 'مسح وثيقة السفر',
    hint: 'ضع الأسطر السفلية من الجواز أو الهوية داخل الإطار',
  },
  plate: {
    title: 'مسح لوحة السيارة',
    hint: 'ضع اللوحة داخل الإطار - تُقرأ الأحرف والأرقام اللاتينية في السطر السفلي',
  },
};

type Phase = 'camera' | 'working' | 'review' | 'nocamera';

export function ScannerModal({ mode, onClose, onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('camera');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [mrz, setMrz] = useState<MrzResult | null>(null);
  const [plate, setPlate] = useState('');

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPhase('nocamera');
        setMessage('الكاميرا غير متاحة في هذا المتصفح');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) {
          setPhase('nocamera');
          setMessage('تعذر الوصول للكاميرا - يمكنك رفع صورة بدلاً من ذلك');
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const process = useCallback(
    async (source: HTMLVideoElement | HTMLImageElement, useGuide: boolean) => {
      setPhase('working');
      setProgress(0);
      setMessage('');
      try {
        const canvas = preprocess(toCanvas(source, useGuide ? GUIDES[mode] : undefined));
        const text = await recognize(canvas, mode, setProgress);

        if (mode === 'mrz') {
          const parsed = parseMrz(text);
          if (!parsed) {
            setPhase('camera');
            setMessage('لم يتم العثور على منطقة القراءة الآلية - حاول مرة أخرى');
            return;
          }
          setMrz(parsed);
        } else {
          const value = normalizePlate(text);
          if (!value) {
            setPhase('camera');
            setMessage('تعذرت قراءة اللوحة - حاول مرة أخرى');
            return;
          }
          setPlate(value);
        }
        setPhase('review');
      } catch (error) {
        console.error('Scan failed:', error);
        setPhase('camera');
        setMessage('حدث خطأ أثناء المعالجة');
      }
    },
    [mode]
  );

  const capture = () => {
    if (videoRef.current) process(videoRef.current, true);
  };

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = new Image();
    image.onload = () => {
      process(image, false);
      URL.revokeObjectURL(image.src);
    };
    image.src = URL.createObjectURL(file);
    event.target.value = '';
  };

  const accept = () => {
    stopCamera();
    if (mode === 'mrz' && mrz) onResult({ mode: 'mrz', data: mrz });
    if (mode === 'plate' && plate) onResult({ mode: 'plate', plate });
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  const guide = GUIDES[mode];

  return (
    <div className="scan-overlay" role="dialog" aria-modal="true">
      <div className="scan-modal">
        <header className="scan-header">
          <h3>{COPY[mode].title}</h3>
          <button className="scan-close" onClick={close} aria-label="إغلاق">
            <X size={18} strokeWidth={2.25} />
          </button>
        </header>

        {phase !== 'review' && (
          <>
            <div className="scan-stage">
              {phase === 'nocamera' ? (
                <div className="scan-nocamera">
                  <Camera size={40} strokeWidth={1.5} />
                  <p>{message}</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="scan-video" />
                  <div
                    className="scan-guide"
                    style={{
                      insetInlineStart: `${guide.x * 100}%`,
                      top: `${guide.y * 100}%`,
                      width: `${guide.width * 100}%`,
                      height: `${guide.height * 100}%`,
                    }}
                  />
                </>
              )}

              {phase === 'working' && (
                <div className="scan-working">
                  <div className="scan-progress-ring" />
                  <p>جاري القراءة... {Math.round(progress * 100)}%</p>
                </div>
              )}
            </div>

            <p className="scan-hint">{COPY[mode].hint}</p>
            {message && phase === 'camera' && <p className="scan-message">{message}</p>}

            <div className="scan-actions">
              <button
                className="v2-btn v2-btn-primary scan-capture"
                onClick={capture}
                disabled={phase !== 'camera'}
              >
                <Camera size={17} strokeWidth={2.25} /> التقاط
              </button>
              <button
                className="v2-btn v2-btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={phase === 'working'}
              >
                <ImageUp size={17} strokeWidth={2.25} /> رفع صورة
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onFile}
                hidden
              />
            </div>
          </>
        )}

        {phase === 'review' && (
          <div className="scan-review">
            {mode === 'mrz' && mrz && (
              <>
                {!mrz.valid && (
                  <div className="scan-warning">
                    <TriangleAlert size={16} strokeWidth={2.25} />
                    تحقق من البيانات - بعض الحقول لم تجتز التحقق الآلي
                  </div>
                )}
                <dl className="scan-fields">
                  <Field label="الاسم" value={mrz.fullName} />
                  <Field
                    label="رقم الوثيقة"
                    value={mrz.documentNumber}
                    ok={mrz.checks.documentNumber}
                  />
                  <Field
                    label="نوع الوثيقة"
                    value={mrz.documentType === 'passport' ? 'جواز سفر' : 'بطاقة هوية'}
                  />
                  <Field label="الجنسية" value={mrz.nationality} />
                  <Field
                    label="تاريخ الميلاد"
                    value={formatMrzDate(mrz.birthDate, true)}
                    ok={mrz.checks.birthDate}
                  />
                  <Field
                    label="تاريخ الانتهاء"
                    value={formatMrzDate(mrz.expiryDate, false)}
                    ok={mrz.checks.expiryDate}
                  />
                </dl>
              </>
            )}

            {mode === 'plate' && (
              <label className="scan-plate-field">
                <span>رقم اللوحة المقروء</span>
                <input value={plate} onChange={(e) => setPlate(e.target.value)} />
                <small>راجع الرقم وعدّله عند الحاجة قبل الاعتماد</small>
              </label>
            )}

            <div className="scan-actions">
              <button className="v2-btn v2-btn-primary" onClick={accept} disabled={mode === 'plate' && !plate.trim()}>
                <Check size={17} strokeWidth={2.25} /> اعتماد البيانات
              </button>
              <button
                className="v2-btn v2-btn-ghost"
                onClick={() => {
                  setPhase(streamRef.current ? 'camera' : 'nocamera');
                  setMessage('');
                }}
              >
                <RefreshCw size={17} strokeWidth={2.25} /> إعادة المسح
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="scan-field">
      <dt>{label}</dt>
      <dd>
        {value || '—'}
        {ok === false && <TriangleAlert size={13} strokeWidth={2.5} className="scan-field-warn" />}
      </dd>
    </div>
  );
}

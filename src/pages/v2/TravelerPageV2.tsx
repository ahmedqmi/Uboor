import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Car, Users, ClipboardCheck, Check, Plane, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTravelContext } from '../../context/TravelContext';
import type { Passenger, TravelRequest } from '../../types';
import './TravelerPageV2.css';

interface PassengerForm {
  id: string;
  name: string;
  documentType: 'passport' | 'id_card';
  documentNumber: string;
}

const STEPS = [
  { label: 'بيانات السيارة', Icon: Car },
  { label: 'المسافرون', Icon: Users },
  { label: 'المراجعة والإرسال', Icon: ClipboardCheck },
];

function emptyPassenger(): PassengerForm {
  return { id: uuidv4(), name: '', documentType: 'passport', documentNumber: '' };
}

export function TravelerPageV2() {
  const { addTravelRequest } = useTravelContext();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stepError, setStepError] = useState('');

  const [carPlateNumber, setCarPlateNumber] = useState('');
  const [carType, setCarType] = useState('');
  const [carColor, setCarColor] = useState('');
  const [passengers, setPassengers] = useState<PassengerForm[]>([emptyPassenger()]);

  const addPassenger = () => setPassengers([...passengers, emptyPassenger()]);

  const removePassenger = (id: string) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((p) => p.id !== id));
    }
  };

  const updatePassenger = (id: string, field: keyof PassengerForm, value: string) => {
    setPassengers(passengers.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const goNext = () => {
    setStepError('');
    if (step === 0) {
      if (!carPlateNumber || !carType || !carColor) {
        setStepError('يرجى إدخال جميع بيانات السيارة قبل المتابعة');
        return;
      }
    }
    if (step === 1) {
      const invalid = passengers.some((p) => !p.name || !p.documentNumber);
      if (invalid) {
        setStepError('يرجى إدخال جميع بيانات المسافرين قبل المتابعة');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setStepError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const goToStep = (target: number) => {
    if (target < step) {
      setStepError('');
      setStep(target);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const travelRequest: TravelRequest = {
      id: uuidv4(),
      carPlateNumber,
      carType,
      carColor,
      passengers: passengers as Passenger[],
      submittedAt: new Date(),
      status: 'pending',
    };

    try {
      await addTravelRequest(travelRequest);

      setCarPlateNumber('');
      setCarType('');
      setCarColor('');
      setPassengers([emptyPassenger()]);
      setStep(0);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit travel request:', error);
      setStepError('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="v2-page traveler-v2">
      <div className="v2-page-header">
        <span className="v2-eyebrow">
          <Plane size={14} strokeWidth={2.25} /> نقطة العبور الذكية
        </span>
        <h1>مسافر</h1>
        <p>أدخل بيانات السيارة والمسافرين للعبور في ثلاث خطوات بسيطة</p>
      </div>

      {showSuccess && (
        <>
          <div className="tv2-success-overlay" onClick={() => setShowSuccess(false)}></div>
          <div className="tv2-success-message">
            <span className="tv2-success-icon">
              <Check size={28} strokeWidth={3} />
            </span>
            <h3>تم الإرسال بنجاح!</h3>
            <p>تم إرسال طلب العبور وسيتم مراجعته من قبل الإدارة</p>
          </div>
        </>
      )}

      <div className="tv2-stepper">
        {STEPS.map((s, i) => (
          <div key={s.label} className="tv2-step-wrap">
            <button
              type="button"
              className={`tv2-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => goToStep(i)}
              disabled={i >= step}
            >
              <span className="tv2-step-circle">
                {i < step ? <Check size={20} strokeWidth={2.5} /> : <s.Icon size={20} strokeWidth={2} />}
              </span>
              <span className="tv2-step-label">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`tv2-step-line ${i < step ? 'done' : ''}`} />}
          </div>
        ))}
      </div>

      <div className="tv2-card v2-glass">
        {step === 0 && (
          <section className="tv2-section">
            <div className="tv2-form-grid">
              <div className="tv2-field">
                <label htmlFor="carPlate">رقم اللوحة</label>
                <input
                  type="text"
                  id="carPlate"
                  value={carPlateNumber}
                  onChange={(e) => setCarPlateNumber(e.target.value)}
                  placeholder="أدخل رقم لوحة السيارة"
                />
              </div>
              <div className="tv2-field">
                <label htmlFor="carType">نوع السيارة</label>
                <input
                  type="text"
                  id="carType"
                  value={carType}
                  onChange={(e) => setCarType(e.target.value)}
                  placeholder="مثال: تويوتا كامري"
                />
              </div>
              <div className="tv2-field">
                <label htmlFor="carColor">لون السيارة</label>
                <input
                  type="text"
                  id="carColor"
                  value={carColor}
                  onChange={(e) => setCarColor(e.target.value)}
                  placeholder="مثال: أبيض"
                />
              </div>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="tv2-section">
            <div className="tv2-section-top">
              <span className="tv2-passenger-count">{passengers.length} مسافر</span>
            </div>
            <div className="tv2-passengers-list">
              {passengers.map((passenger, index) => (
                <div key={passenger.id} className="tv2-passenger-card">
                  <div className="tv2-passenger-header">
                    <span className="tv2-passenger-number">المسافر {index + 1}</span>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        className="tv2-remove-btn"
                        onClick={() => removePassenger(passenger.id)}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <div className="tv2-form-grid">
                    <div className="tv2-field">
                      <label>الاسم الكامل</label>
                      <input
                        type="text"
                        value={passenger.name}
                        onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                        placeholder="أدخل الاسم الكامل"
                      />
                    </div>
                    <div className="tv2-field">
                      <label>نوع الوثيقة</label>
                      <select
                        value={passenger.documentType}
                        onChange={(e) =>
                          updatePassenger(passenger.id, 'documentType', e.target.value as 'passport' | 'id_card')
                        }
                      >
                        <option value="passport">جواز سفر</option>
                        <option value="id_card">بطاقة هوية</option>
                      </select>
                    </div>
                    <div className="tv2-field">
                      <label>
                        {passenger.documentType === 'passport' ? 'رقم جواز السفر' : 'رقم بطاقة الهوية'}
                      </label>
                      <input
                        type="text"
                        value={passenger.documentNumber}
                        onChange={(e) => updatePassenger(passenger.id, 'documentNumber', e.target.value)}
                        placeholder="أدخل رقم الوثيقة"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="tv2-add-passenger-btn" onClick={addPassenger}>
              <Plus size={18} strokeWidth={2.5} /> إضافة مسافر
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="tv2-section">
            <div className="tv2-review-block">
              <div className="tv2-review-title">
                <Car size={18} strokeWidth={2} /> بيانات السيارة
                <button type="button" className="tv2-edit-link" onClick={() => setStep(0)}>
                  تعديل
                </button>
              </div>
              <div className="tv2-review-row">
                <span className="tv2-review-chip">{carPlateNumber}</span>
                <span>{carType}</span>
                <span>{carColor}</span>
              </div>
            </div>

            <div className="tv2-review-block">
              <div className="tv2-review-title">
                <Users size={18} strokeWidth={2} /> المسافرون ({passengers.length})
                <button type="button" className="tv2-edit-link" onClick={() => setStep(1)}>
                  تعديل
                </button>
              </div>
              <div className="tv2-review-passengers">
                {passengers.map((p, i) => (
                  <div key={p.id} className="tv2-review-passenger">
                    <span className="tv2-review-avatar">{p.name ? p.name[0] : i + 1}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <span>
                        {p.documentType === 'passport' ? 'جواز سفر' : 'بطاقة هوية'}: {p.documentNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {stepError && <div className="tv2-error">{stepError}</div>}

        <div className="tv2-nav-buttons">
          {step > 0 && (
            <button type="button" className="v2-btn v2-btn-ghost" onClick={goBack}>
              <ArrowRight size={16} strokeWidth={2.25} /> رجوع
            </button>
          )}
          <div className="tv2-nav-spacer" />
          {step < STEPS.length - 1 ? (
            <button type="button" className="v2-btn v2-btn-primary" onClick={goNext}>
              التالي <ArrowLeft size={16} strokeWidth={2.25} />
            </button>
          ) : (
            <button
              type="button"
              className="v2-btn v2-btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'جاري الإرسال...'
              ) : (
                <>
                  إرسال طلب العبور <Check size={17} strokeWidth={2.5} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

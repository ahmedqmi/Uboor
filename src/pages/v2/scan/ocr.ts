import type { Worker } from 'tesseract.js';

export type ScanMode = 'mrz' | 'plate';

const MRZ_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<';
// Plates are read from their Latin row: the Arabic row comes out as noise, and a
// whitelist containing Arabic characters degrades the LSTM decoder badly.
const PLATE_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const LANGS: Record<ScanMode, string> = { mrz: 'eng', plate: 'eng' };

// Workers pull their language data over the network, so keep them for the page's lifetime.
const workers = new Map<string, Promise<Worker>>();

function getWorker(mode: ScanMode, onProgress?: (ratio: number) => void): Promise<Worker> {
  const lang = LANGS[mode];
  let worker = workers.get(lang);
  if (!worker) {
    worker = (async () => {
      const { createWorker } = await import('tesseract.js');
      // Engine and language data are served from this origin (public/ocr), so scanning
      // keeps working offline and no document image pipeline depends on a third party.
      return createWorker(lang, 1, {
        workerPath: '/ocr/worker.min.js',
        // Pinned to one build rather than a directory: pointing at a directory makes the
        // worker probe for whichever SIMD variant the browser supports, and we ship one.
        corePath: '/ocr/tesseract-core-simd-lstm.wasm.js',
        langPath: '/ocr/lang',
        gzip: true,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text' || m.status.startsWith('loading')) {
            onProgress?.(m.progress);
          }
        },
      });
    })();
    workers.set(lang, worker);
  }
  return worker;
}

/** Grayscale + Otsu threshold. Tesseract is markedly more accurate on clean bitonal input. */
export function preprocess(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const histogram = new Array(256).fill(0);
  const gray = new Uint8ClampedArray(pixels.length / 4);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const value = (pixels[i] * 299 + pixels[i + 1] * 587 + pixels[i + 2] * 114) / 1000;
    gray[p] = value;
    histogram[Math.round(value)]++;
  }

  // Otsu: pick the threshold that maximises between-class variance.
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumBackground = 0;
  let weightBackground = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * histogram[t];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (variance > best) {
      best = variance;
      threshold = t;
    }
  }

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const value = gray[p] > threshold ? 255 : 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Draw a source image or video frame onto a canvas, optionally cropping to a
 * region given in 0..1 coordinates relative to the source.
 */
export function toCanvas(
  source: HTMLVideoElement | HTMLImageElement,
  crop?: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const sourceWidth = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sourceHeight = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;

  const region = crop
    ? {
        x: crop.x * sourceWidth,
        y: crop.y * sourceHeight,
        width: crop.width * sourceWidth,
        height: crop.height * sourceHeight,
      }
    : { x: 0, y: 0, width: sourceWidth, height: sourceHeight };

  // Upscale small crops - OCR needs roughly 30px of glyph height to read reliably.
  const scale = Math.min(3, Math.max(1, 1000 / Math.max(1, region.width)));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(region.width * scale);
  canvas.height = Math.round(region.height * scale);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      source,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  }
  return canvas;
}

export async function recognize(
  canvas: HTMLCanvasElement,
  mode: ScanMode,
  onProgress?: (ratio: number) => void
): Promise<string> {
  const worker = await getWorker(mode, onProgress);
  await worker.setParameters({
    tessedit_char_whitelist: mode === 'mrz' ? MRZ_WHITELIST : PLATE_WHITELIST,
    // 6 = assume a single uniform block of text
    tessedit_pageseg_mode: '6' as never,
  });
  const { data } = await worker.recognize(canvas);
  return data.text;
}

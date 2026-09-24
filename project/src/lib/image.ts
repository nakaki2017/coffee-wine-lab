const MAX_IMAGE_BYTES = 800 * 1024;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_EDGE = 1600;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read image'));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to compress image'));
    }, 'image/webp', quality);
  });
}

export async function compressImage(file: File): Promise<Blob> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error('Unsupported image type');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Image is too large');
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image compression is unavailable');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let blob = await canvasBlob(canvas, quality);
  while (blob.size > MAX_IMAGE_BYTES && quality > 0.42) {
    quality -= 0.08;
    blob = await canvasBlob(canvas, quality);
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('Image cannot be compressed below 800KB');
  }
  return blob;
}

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type);
}

export const IMAGE_LIMITS = {
  maxBeanImages: 3,
  maxRecipeImages: 5,
  maxBytes: MAX_IMAGE_BYTES,
  maxEdge: MAX_EDGE,
};

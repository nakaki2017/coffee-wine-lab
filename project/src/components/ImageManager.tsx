import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import AdaptiveImage from './AdaptiveImage';

export interface ManagedImage {
  id: string;
  url?: string;
}

interface ImageManagerProps {
  images: ManagedImage[];
  maxImages: number;
  busy?: boolean;
  onAdd: (files: File[]) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onReorder: (imageIds: string[]) => Promise<void> | void;
}

export default function ImageManager({
  images,
  maxImages,
  busy = false,
  onAdd,
  onRemove,
  onReorder,
}: ImageManagerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const move = (index: number, nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    void onReorder(next.map(image => image.id));
  };

  const setCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    void onReorder(next.map(image => image.id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label mb-0">{t('images.title')}</p>
          <p className="text-xs text-espresso-500 dark:text-espresso-400">
            {t('images.limit_hint', { count: maxImages })}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          disabled={busy || images.length >= maxImages}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {t('images.upload')}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={event => {
            const files = Array.from(event.target.files || []).slice(0, maxImages - images.length);
            event.target.value = '';
            if (files.length > 0) void onAdd(files);
          }}
        />
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 w-full flex-col items-center justify-center gap-2 border border-dashed border-cream-300 bg-cream-50 text-espresso-500 transition-colors hover:border-coffee-400 hover:text-coffee-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-espresso-700 dark:bg-espresso-900/40 dark:text-espresso-400"
        >
          <ImagePlus className="h-7 w-7" />
          <span className="text-sm font-medium">{t('images.add_first')}</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div key={image.id} className="min-w-0 border border-cream-200 bg-cream-50 dark:border-espresso-700 dark:bg-espresso-900">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-cream-200 dark:bg-espresso-800">
                {image.url && <AdaptiveImage src={image.url} alt="" fit="contain" />}
                {index === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-espresso-900/80 px-2 py-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3 fill-current" />
                    {t('images.cover')}
                  </span>
                )}
              </div>
              <div className="flex h-10 items-center justify-between px-1">
                <div className="flex">
                  <button type="button" className="btn-ghost btn-icon" disabled={busy || index === 0} onClick={() => move(index, index - 1)} title={t('images.move_left')}>
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button type="button" className="btn-ghost btn-icon" disabled={busy || index === images.length - 1} onClick={() => move(index, index + 1)} title={t('images.move_right')}>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex">
                  {index > 0 && (
                    <button type="button" className="btn-ghost btn-icon" disabled={busy} onClick={() => setCover(index)} title={t('images.set_cover')}>
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" className="btn-ghost btn-icon text-terracotta-600" disabled={busy} onClick={() => void onRemove(image.id)} title={t('images.remove')}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {busy && <p className="text-xs text-coffee-600 dark:text-coffee-400">{t('images.processing')}</p>}
    </div>
  );
}

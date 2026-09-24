import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import AdaptiveImage from './AdaptiveImage';

export interface LightboxImage {
  id: string;
  url: string;
}

interface ImageLightboxProps {
  open: boolean;
  images: LightboxImage[];
  currentId: string;
  alt: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function ImageLightbox({
  open,
  images,
  currentId,
  alt,
  onSelect,
  onClose,
}: ImageLightboxProps) {
  const { t } = useTranslation();
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const currentIndex = Math.max(0, images.findIndex(image => image.id === currentId));
  const current = images[currentIndex];
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;
  const previousId = canGoPrevious ? images[currentIndex - 1].id : null;
  const nextId = canGoNext ? images[currentIndex + 1].id : null;
  const imagesKey = images.map(image => `${image.id}:${image.url}`).join('|');
  const failedSet = useMemo(() => new Set(failedIds), [failedIds]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && previousId) {
        onSelect(previousId);
      } else if (event.key === 'ArrowRight' && nextId) {
        onSelect(nextId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextId, onClose, onSelect, open, previousId]);

  useEffect(() => {
    setFailedIds([]);
  }, [imagesKey]);

  if (!open || !current) return null;

  const previous = () => {
    if (previousId) onSelect(previousId);
  };
  const next = () => {
    if (nextId) onSelect(nextId);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('images.fullscreen')}
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-end">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:bg-white/10"
          onClick={onClose}
          aria-label={t('common.close')}
          title={t('common.close')}
          autoFocus
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-2 sm:gap-4" onClick={event => event.stopPropagation()}>
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-20"
          disabled={!canGoPrevious}
          onClick={previous}
          aria-label={t('images.previous')}
          title={t('images.previous')}
        >
          <ChevronLeft className="h-7 w-7" />
        </button>

        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center self-stretch">
          {failedSet.has(current.id) ? (
            <div className="text-sm text-white/70">{t('images.load_failed')}</div>
          ) : (
            <AdaptiveImage
              src={current.url}
              alt={alt + ' ' + (currentIndex + 1)}
              fit="contain"
              className="select-none"
              onError={() => setFailedIds(previousIds => (
                previousIds.includes(current.id) ? previousIds : [...previousIds, current.id]
              ))}
            />
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-white transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-20"
          disabled={!canGoNext}
          onClick={next}
          aria-label={t('images.next')}
          title={t('images.next')}
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>

      <div className="shrink-0 pt-3 text-center text-sm text-white/80">
        {t('images.position', { current: currentIndex + 1, total: images.length })}
      </div>
    </div>,
    document.body,
  );
}

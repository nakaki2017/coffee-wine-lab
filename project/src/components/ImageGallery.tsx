import { useEffect, useState } from 'react';
import { ImageIcon, Maximize2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import AdaptiveImage from './AdaptiveImage';
import ImageLightbox from './ImageLightbox';

interface GalleryImage {
  id: string;
  url?: string;
}
interface ImageGalleryProps {
  images: GalleryImage[];
  fallbackUrl?: string | null;
  alt: string;
}

export default function ImageGallery({ images, fallbackUrl, alt }: ImageGalleryProps) {
  const { t } = useTranslation();
  const urls = images.flatMap(image => image.url ? [{ id: image.id, url: image.url }] : []);
  if (urls.length === 0 && fallbackUrl) urls.push({ id: 'legacy', url: fallbackUrl });
  const [selected, setSelected] = useState(urls[0]?.id || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setSelected(urls[0]?.id || '');
    setLightboxOpen(false);
  }, [images, fallbackUrl]);

  const current = urls.find(image => image.id === selected) || urls[0];

  return (
    <div className="space-y-2">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-cream-200 dark:bg-espresso-800 sm:aspect-[4/3]">
        {current ? (
          <button
            type="button"
            className="group flex h-full w-full cursor-zoom-in items-center justify-center"
            onClick={() => setLightboxOpen(true)}
            aria-label={t('images.open_fullscreen')}
            title={t('images.open_fullscreen')}
          >
            <AdaptiveImage src={current.url} alt={alt} fit="contain" />
            <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center bg-black/55 text-white opacity-80 transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <ImageIcon className="h-12 w-12 text-espresso-300 dark:text-espresso-600" />
        )}
      </div>

      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 bg-cream-200 dark:bg-espresso-800 ' + (selected === image.id ? 'border-coffee-600' : 'border-transparent')}
              onClick={() => setSelected(image.id)}
              aria-label={t('images.select', { current: index + 1 })}
            >
              <AdaptiveImage src={image.url} alt="" fit="adaptive" />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        open={lightboxOpen}
        images={urls}
        currentId={current?.id || ''}
        alt={alt}
        onSelect={setSelected}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

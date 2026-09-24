import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

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
  const urls = images.flatMap(image => image.url ? [{ id: image.id, url: image.url }] : []);
  if (urls.length === 0 && fallbackUrl) urls.push({ id: 'legacy', url: fallbackUrl });
  const [selected, setSelected] = useState(urls[0]?.id || '');
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    setSelected(urls[0]?.id || '');
    setFailed([]);
  }, [images, fallbackUrl]);

  const current = urls.find(image => image.id === selected) || urls[0];
  const currentFailed = !current || failed.includes(current.id);

  return (
    <div className="space-y-2">
      <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-cream-200 dark:bg-espresso-800">
        {current && !currentFailed ? (
          <img
            src={current.url}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setFailed(previous => [...previous, current.id])}
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-espresso-300 dark:text-espresso-600" />
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map(image => (
            <button
              key={image.id}
              type="button"
              className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${selected === image.id ? 'border-coffee-600' : 'border-transparent'}`}
              onClick={() => setSelected(image.id)}
            >
              {failed.includes(image.id) ? (
                <span className="flex h-full w-full items-center justify-center bg-cream-200 dark:bg-espresso-800">
                  <ImageIcon className="h-5 w-5 text-espresso-400" />
                </span>
              ) : (
                <img src={image.url} alt="" className="h-full w-full object-cover" onError={() => setFailed(previous => [...previous, image.id])} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

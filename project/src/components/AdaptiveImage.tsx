import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export type ImageFitMode = 'contain' | 'adaptive';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  fit: ImageFitMode;
  onError?: () => void;
  className?: string;
}

interface ImageState {
  src: string;
  portrait: boolean;
  failed: boolean;
}

export default function AdaptiveImage({
  src,
  alt,
  fit,
  onError,
  className = '',
}: AdaptiveImageProps) {
  const [state, setState] = useState<ImageState>({
    src,
    portrait: false,
    failed: false,
  });
  const currentState = state.src === src
    ? state
    : { src, portrait: false, failed: false };

  if (currentState.failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="flex h-full w-full items-center justify-center text-espresso-300 dark:text-espresso-600"
      >
        <ImageIcon className="h-8 w-8" />
      </span>
    );
  }

  const shouldContain = fit === 'contain' || currentState.portrait;
  const fitClass = shouldContain
    ? 'h-auto w-auto max-h-full max-w-full object-contain'
    : 'h-full w-full object-cover';

  return (
    <img
      src={src}
      alt={alt}
      className={[fitClass, className].filter(Boolean).join(' ')}
      onLoad={event => {
        const image = event.currentTarget;
        setState({
          src,
          portrait: image.naturalHeight > image.naturalWidth,
          failed: false,
        });
      }}
      onError={() => {
        setState({ src, portrait: false, failed: true });
        onError?.();
      }}
    />
  );
}


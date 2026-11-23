import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface FeatureImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectClassName?: string;
  fallbackTitle?: string;
  loading?: 'lazy' | 'eager';
  scrim?: boolean;
  children?: React.ReactNode;
}

const FeatureImage: React.FC<FeatureImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectClassName = 'aspect-[16/10]',
  fallbackTitle,
  loading = 'lazy',
  scrim = true,
  children,
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#0E0E12] ${aspectClassName} ${containerClassName}`}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover object-center transition-transform duration-300 ease-out ${className}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900 via-[#111114] to-zinc-950 p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-amber-400">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-slate-300 line-clamp-2">
            {fallbackTitle || alt}
          </span>
        </div>
      )}

      {scrim && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B]/85 via-[#09090B]/20 to-transparent"
        />
      )}

      {children}
    </div>
  );
};

export default FeatureImage;

import React from 'react';
import SocialIcon from '@/components/SocialIcon';

interface Props {
  logoUrl?: string | null;
  platform?: string;
  size?: number;
  className?: string;
  rounded?: 'xl' | '2xl' | 'full';
}

const ProductLogo: React.FC<Props> = ({ logoUrl, platform, size = 48, className = '', rounded = 'xl' }) => {
  const radius = rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl';
  const box = `${radius} bg-card/80 border border-border/40 flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`;
  const dim = { width: size, height: size };

  if (logoUrl) {
    return (
      <div className={box} style={dim}>
        <img
          src={logoUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={box} style={dim}>
      <SocialIcon platform={platform || ''} size={Math.round(size * 0.55)} />
    </div>
  );
};

export default ProductLogo;

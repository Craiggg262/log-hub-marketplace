import React from 'react';
import { Facebook, Instagram, Music, Twitter, Shield } from 'lucide-react';

interface SocialIconProps {
  platform: string;
  size?: number;
  className?: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({ platform, size = 24, className = "" }) => {
  const iconSize = { width: size, height: size };

  switch (platform.toLowerCase()) {
    case 'facebook':
      return <Facebook {...iconSize} className={`text-[#1877F2] ${className}`} />;
    case 'instagram':
      return <Instagram {...iconSize} className={`text-[#E4405F] ${className}`} />;
    case 'tiktok':
      return <Music {...iconSize} className={`text-black ${className}`} />;
    case 'twitter':
      return <Twitter {...iconSize} className={`text-[#1DA1F2] ${className}`} />;
    case 'vpn/streaming':
      return <Shield {...iconSize} className={`text-[#8B5CF6] ${className}`} />;
    default:
      return <Shield {...iconSize} className={`text-muted-foreground ${className}`} />;
  }
};

export default SocialIcon;
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHATSAPP_URL = 'https://wa.me/12252801497';

const AISupport: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
        <Button
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#25D366] hover:bg-[#1da851] text-white"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </a>
    </div>
  );
};

export default AISupport;
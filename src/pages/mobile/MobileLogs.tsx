import React from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import Marketplace from '@/components/marketplace/Marketplace';

const MobileLogs = () => {
  return (
    <MobileLayout title="Marketplace">
      <div className="p-4">
        <Marketplace />
      </div>
    </MobileLayout>
  );
};

export default MobileLogs;

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentPointAccount from './PaymentPointAccount';
import PayscribeAccount from './PayscribeAccount';

const AutoFundingSelector: React.FC = () => {
  return (
    <Tabs defaultValue="paymentpoint" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="paymentpoint">PaymentPoint</TabsTrigger>
        <TabsTrigger value="payscribe">Payscribe</TabsTrigger>
      </TabsList>
      <TabsContent value="paymentpoint" className="mt-4">
        <PaymentPointAccount />
      </TabsContent>
      <TabsContent value="payscribe" className="mt-4">
        <PayscribeAccount />
      </TabsContent>
    </Tabs>
  );
};

export default AutoFundingSelector;

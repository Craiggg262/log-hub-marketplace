import React from 'react';

const Terms = () => (
  <div className="min-h-screen bg-background silk-gradient px-5 py-10">
    <div className="max-w-3xl mx-auto glass-card rounded-3xl p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gradient">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Log Hub Marketplace — operated by Craig Analytics. Last updated: August 2026.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Accounts</h2>
        <p className="text-sm text-muted-foreground">
          You must be at least 18 years old and provide accurate information. You are
          responsible for all activity on your account and for keeping your password safe.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Wallet and payments</h2>
        <p className="text-sm text-muted-foreground">
          Purchases are paid from your in-app wallet, funded via bank transfer, virtual account
          or supported crypto gateways. Wallet balance is not a bank deposit and earns no
          interest. Prices are displayed in NGN or USD using the rate shown in the app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Service delivery and refunds</h2>
        <p className="text-sm text-muted-foreground">
          Airtime, data, cable, electricity, eSIM and verification services are delivered by
          third-party providers. Where a provider fails, times out or cancels an order, the
          amount is automatically refunded to your wallet. Successfully delivered digital
          items are non-refundable.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Acceptable use</h2>
        <p className="text-sm text-muted-foreground">
          You may not use the service for fraud, impersonation, spam, or any activity that is
          illegal in your jurisdiction. Accounts found abusing the platform may be suspended
          and remaining balances withheld pending review.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Availability</h2>
        <p className="text-sm text-muted-foreground">
          Services are provided "as is". We do not guarantee uninterrupted availability and are
          not liable for indirect losses arising from provider downtime.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p className="text-sm text-muted-foreground">
          Questions about these terms:{' '}
          <a href="https://t.me/craiganalytics" className="text-primary underline">
            t.me/craiganalytics
          </a>
        </p>
      </section>
    </div>
  </div>
);

export default Terms;

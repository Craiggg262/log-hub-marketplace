import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, MessageCircle } from 'lucide-react';

const AccountDeletion = () => (
  <div className="min-h-screen bg-background silk-gradient px-5 py-10">
    <div className="max-w-2xl mx-auto glass-card rounded-3xl p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <div className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center">
          <Trash2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gradient">Delete your account</h1>
        <p className="text-sm text-muted-foreground">
          App: Log Hub Marketplace · Developer: Craig Analytics
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How to request deletion</h2>
        <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
          <li>Open the app and go to Profile → Settings, or use the button below.</li>
          <li>Send us a deletion request with the email address on your account.</li>
          <li>We verify ownership and delete the account within 7 days.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What gets deleted</h2>
        <p className="text-sm text-muted-foreground">
          Your profile, email, name, wallet balance, saved virtual accounts, cart and referral
          data are permanently removed. Withdraw any remaining wallet balance first — it cannot
          be recovered after deletion.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">What we keep</h2>
        <p className="text-sm text-muted-foreground">
          Anonymised transaction records are retained for up to 7 years where financial and tax
          law requires it. These records no longer identify you.
        </p>
      </section>

      <a
        href="https://t.me/craiganalytics"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button className="w-full gradient-primary text-primary-foreground rounded-xl h-12 gap-2">
          <MessageCircle className="h-5 w-5" />
          Request account deletion
        </Button>
      </a>
      <p className="text-xs text-center text-muted-foreground">
        Or email support@loghubmarketplace.site with the subject "Delete my account".
      </p>
    </div>
  </div>
);

export default AccountDeletion;

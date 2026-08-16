import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => (
  <div className="min-h-screen bg-background silk-gradient px-5 py-10">
    <div className="max-w-3xl mx-auto glass-card rounded-3xl p-6 md:p-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gradient">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Log Hub Marketplace — operated by Craig Analytics. Last updated: August 2026.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Information we collect</h2>
        <p className="text-sm text-muted-foreground">
          We collect the email address and full name you provide at sign up, your wallet
          balance and transaction history, the orders and services you purchase, and basic
          technical data (device type, browser, IP address) needed to keep the account secure.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How we use it</h2>
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>To create and secure your account and sign you in.</li>
          <li>To process wallet funding, purchases, refunds and order delivery.</li>
          <li>To send transactional emails and order notifications.</li>
          <li>To prevent fraud, abuse and to comply with legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Sharing with service providers</h2>
        <p className="text-sm text-muted-foreground">
          To deliver the services you order we share the minimum necessary data with our
          payment and service partners (PaymentPoint, Payscribe, NOWPayments, FPayment,
          BetaSub/VTU providers, SMS verification providers, CitrusSim and PikaSim for eSIMs).
          We never sell your personal data to anyone.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Data storage and security</h2>
        <p className="text-sm text-muted-foreground">
          Data is stored on Supabase infrastructure with row-level security so each account can
          only access its own records. Passwords are hashed and never visible to us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Your rights and account deletion</h2>
        <p className="text-sm text-muted-foreground">
          You may request a copy of your data or delete your account at any time from{' '}
          <Link to="/account-deletion" className="text-primary underline">
            our account deletion page
          </Link>
          . Financial records may be retained where required by law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Children</h2>
        <p className="text-sm text-muted-foreground">
          The service is not intended for anyone under 18 years old.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p className="text-sm text-muted-foreground">
          Craig Analytics — support via Telegram:{' '}
          <a href="https://t.me/craiganalytics" className="text-primary underline">
            t.me/craiganalytics
          </a>
          . Email: support@loghubmarketplace.site
        </p>
      </section>
    </div>
  </div>
);

export default Privacy;


# Full Site & App Redesign — Log Hub Marketplace

This is a large, multi-area change. Colors and palette stay the same (dark + blue/orange). Visual language shifts to a more polished "liquid glass" look modeled on the screenshots from ultimatelogsmarketplace.com. Below is what I'll build and where, so you can confirm before I touch the code.

---

## 1. Landing / website (logged-out)

- New hero modeled after Ultimate Logs: tagline "Digital solutions for every market", big headline "Buy Verified Accounts & Logins", primary CTAs **Browse Accounts** and **Log In**.
- Live-purchases ticker chip ("User 0x… just bought …") on hero.
- Trust badges row: "100% Verified Logins", "Instant Auto-Delivery", "Escrow protection", "Live help desk".
- Service cards section (glass cards): Social Accounts, Email Rentals, Number Rentals, VTU & Bill Payments, each with "In Stock" / "Coming Soon" pill + Buy Now.
- Closing CTA band: "Ready To Purchase Premium Logs?" with Register / Browse buttons.
- Stronger liquid-glass styling everywhere: layered blurs, soft inner highlight, subtle shine.

## 2. Dashboard — remove scattered logs

- Dashboard no longer renders the logs grid. Replace with:
  - Balance card (glass) + Add Funds / History.
  - **Browse Marketplace** primary CTA card → routes to `/app/marketplace`.
  - Quick actions: Buy Numbers, Buy Email, VTU, Referrals.
  - Recent transactions table (compact).
  - Referral card with code + copy.
- Same change on mobile home.

## 3. New Marketplace flow (replaces current logs-on-dashboard)

Route `/app/marketplace`:
1. **Server picker step**: two big glass cards — King Server / Lite Server (uses existing `useServerSelection`).
2. **Categories step**: grid of category cards (Facebook, Instagram, VPN, Email, etc.) each with a logo + count of products.
3. **Category page**: list of products in that category, each card shows product logo, name, "X Available" stock dot, price, **Buy** button — matches the AFRICA FACEBOOK / ASIA FACEBOOK / VPN screenshots.
4. **Buy modal**: opens on Buy click → shows logo, account name, description, available quantity, quantity selector, total price, **Checkout** button. On success → auto-redirect to `/app/orders`.

## 4. Admin: per-log logo upload

- Add `logo_url` to `logs` table (migration) + Supabase storage bucket `log-logos` (public).
- Admin log create/edit form: image upload field (uploads to bucket, stores public URL on the row).
- User-facing product cards and buy modal render `logo_url` (fallback to category icon if missing).

## 5. Wallet redesign (credit-card style)

- "AVAILABLE FUNDS" card on top (glass, large balance).
- **Virtual account(s) as credit-card visuals**: gradient card with bank logo top-right, big spaced account number ("6526 9208 30"), "ACCOUNT NAME" + name below, "VIRTUAL PAYMENT METHOD" label. If both PaymentPoint and Payscribe exist, render two stacked cards with an "OR" divider (keeps the rule you set earlier).
- "Other Payment Option" section for manual funding (keeps Moniepoint details you set).
- Recent Transactions table styled like the screenshot.
- Same card visuals on mobile wallet.

## 6. SMS Verification — professional look

- Top: "Buy Number — Purchase virtual numbers for SMS verification" + "Instant refund if no OTP received" pill.
- "Choose a category to get started" — glass cards for:
  - USA Numbers (Short-Term)
  - Global Numbers Option 1 / Option 2 (the existing 5sim portals you asked about earlier)
  - Long-term rentals
- Country picker grid: each country card shows real flag + name + ISO code (like the screenshot). Click → service list for that country → buy → number + Request Code panel.
- Keep existing pricing fix (display price = charged price) and expireStale refund logic.

## 7. Sidebar / navigation polish

- Drawer matches Ultimate Logs structure:
  - MARKETPLACE: Dashboard, Buy Social Accounts, Buy Number, Buy Emails, Manage Rentals, Bill Payments (NEW pill).
  - HISTORY: Order History, Transactions, Wallet.
  - ACCOUNT: Profile Settings, Developer API, Help Center.
  - Footer card: "Log Hub News — Join WhatsApp" → existing Telegram support link.
- Mobile bottom tabs stay (Home / Number / Menu / Settings / Wallet).

## 8. Liquid-glass system upgrades

- Add new utility classes: `.glass-card-elevated`, `.glass-credit-card` (with gradient + inner shine), `.glass-pill`.
- Slightly increase blur + add subtle inner top highlight + soft border gradient on cards. All via `index.css` tokens — no color changes.

---

## Technical notes (for me)

- New routes: `/app/marketplace`, `/app/marketplace/:server`, `/app/marketplace/:server/:categoryId`.
- New components: `MarketplaceServerPicker`, `MarketplaceCategoryGrid`, `MarketplaceProductGrid`, `ProductBuyModal` (reuse `BuyProductModal`), `VirtualAccountCard`, `CountryGridPicker`.
- DB migration: `ALTER TABLE public.logs ADD COLUMN logo_url text;` + create `log-logos` storage bucket with public read + admin write policy.
- Admin form (`src/pages/Admin.tsx` log editor) gains a file input that uploads to `log-logos`.
- Dashboard/MobileHome: remove logs grid section; add Browse Marketplace CTA.
- Wallet + MobileWallet: replace plain account list with `VirtualAccountCard` components.
- SmsVerification: restructure into category-picker → country-picker → service/buy flow; flags via `https://flagcdn.com/w80/{iso}.png`.
- Keep all existing business logic (pricing, refunds, webhooks, support link, etc.) untouched.

---

## Out of scope (confirm if you want these too)

- Changing color palette (you said keep the same).
- Replacing payment providers or wallet logic.
- Reworking VTU/airtime/data/cable/electricity forms beyond visual polish.

Reply **"go"** to start, or tell me anything to change/cut. This is a multi-step build — I'll ship it in one pass once approved.

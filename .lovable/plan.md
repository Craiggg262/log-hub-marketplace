## Plan

### 1. Boosting pricing fix
- In `supabase/functions/boosting-proxy/index.ts`, treat provider `rate` as **NGN per 1000** (not USD). Remove the `NAIRA_PER_DOLLAR` conversion. New formula: `displayRate = providerRate * 2`. Apply to both `services` listing and `add` charge calculation.

### 2. Remove LogPay (temporarily)
- Remove `LogPayFund` import and card from `src/pages/Wallet.tsx` and `src/pages/FundWallet.tsx` (wherever it renders). Keep the edge function files and component file in place so I can re-enable later; just unmount from UI.

### 3. Public logo bucket + logos showing on user end
- Call `supabase--storage_update_bucket` on `log-logos` with `public=true` (if workspace allows; otherwise fall back to long-lived signed URLs generated in `ProductLogo`/log fetches).
- In `useLogs`/`useUniversalLogs` and `BuyProductModal`, resolve `logo_url` (either stored public URL or `getPublicUrl`) and render via `ProductLogo` on marketplace tiles + product details.
- Add category image on `categories` table (new `image_url` column) and display it as (a) the category tile thumbnail and (b) header banner inside the category view in `Marketplace.tsx` / `UniversalLogs.tsx`.

### 4. Admin dropdowns for category (both places)
- In `src/pages/Admin.tsx`:
  - **Edit Log form**: add Category `<Select>` bound to `categories` list.
  - **Add Sub-Account (bulk upload)**: add Category `<Select>` at the top so uploads target a chosen category/log correctly.
- Ensure the "Add Log" form's category select shows all categories (already partly done) and creating a new category works.

### 5. Admin image uploads for categories and logs
- Add migration: `ALTER TABLE public.categories ADD COLUMN image_url text;` + GRANTs already in place.
- In `Admin.tsx`:
  - New "Categories" management panel: list categories with inline image upload (uploads to `log-logos` bucket under `categories/<id>.<ext>`), save URL back.
  - In Add Log + Edit Log forms, keep the existing `logo_url` upload; verify it saves and displays.
- Storage policies: add public read policy on `log-logos` if bucket flip is rejected.

### 6. Dark / Light mode toggle everywhere
- Add a `ThemeProvider` (`src/hooks/useTheme.tsx`) that toggles `document.documentElement.classList` between `dark` and `light`, persisted to `localStorage`.
- Verify `tailwind.config.ts` has `darkMode: 'class'` (add if missing) and that `src/index.css` defines light-mode tokens under `:root` and dark tokens under `.dark` (currently dark is default). Reorganize tokens so both themes render correctly.
- Add `<ThemeToggle />` (sun/moon icon Button) rendered in:
  - Desktop top header (inside `Layout.tsx` header area)
  - `Settings.tsx` (row with switch)
  - `MobileProfile.tsx` (row with switch)
- Wrap the app in `ThemeProvider` in `main.tsx` or `App.tsx`.

### 7. Boosting visible on Dashboard (web + web app)
- Add a "Boosting" quick-action card to:
  - `src/pages/Dashboard.tsx` (web) — alongside Marketplace / Wallet CTAs.
  - `src/pages/mobile/MobileHome.tsx` (mobile web app) — as a quick action tile linking to `/app/boosting`.
- Uses the `Rocket` icon and the same glass-card style already in use.

### 8. Verification
- `bun run build` (auto).
- Restart dev server if needed after theme CSS changes.
- Spot-check with a Playwright screenshot on `/dashboard` and `/boosting` to confirm the boosting card renders and the theme toggle works.

### Technical notes
- No changes to order/wallet business logic beyond removing LogPay UI mount.
- Public bucket flip may be blocked by workspace policy; if so I'll use `getPublicUrl` with existing bucket + a permissive `SELECT` policy on `storage.objects` where `bucket_id = 'log-logos'`.
- Boosting price change is display-only; provider request payload unchanged.

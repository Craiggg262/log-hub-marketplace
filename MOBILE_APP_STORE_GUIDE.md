# Log Hub Marketplace — Play Store & App Store release pack

Everything that can be prepared in the codebase is done. This file is your copy-paste
pack for signing up the developer accounts and shipping the Android release.

---

## 1. App identity (already configured)

| Field | Value |
| --- | --- |
| App name | Log Hub Marketplace |
| Short name | Log Hub |
| Developer / publisher name | **Craig Analytics** |
| Android package / iOS bundle ID | `site.loghubmarketplace.app` |
| Website | https://loghubmarketplace.site |
| Privacy policy URL | https://loghubmarketplace.site/privacy |
| Terms URL | https://loghubmarketplace.site/terms |
| Account deletion URL | https://loghubmarketplace.site/account-deletion |
| Support contact | https://t.me/craiganalytics |
| Support email | support@loghubmarketplace.site |
| Category | Finance (alt: Business) |
| Content rating | 18+ / Mature — financial transactions |
| Ads | No ads |
| In-app purchases | No (wallet is funded outside the app) |

> Publish the site first so `/privacy`, `/terms` and `/account-deletion` are live — Google
> checks those URLs during review.

---

## 2. Sign-up details

### Google Play Console — https://play.google.com/console (US$25 one-time)
- Account type: **Organisation** if you have a registered business (needs the business name,
  address, and a website); otherwise Personal.
- Developer name (public): `Craig Analytics`
- Contact email + phone: your real, reachable ones (Google verifies by code).
- Payments profile: business/personal name, address, and a bank account for payouts.
- Complete **identity verification** (ID + address document) — do this first, it can take
  a couple of days.

### Apple Developer Program — https://developer.apple.com/programs (US$99/year)
- To show **Craig Analytics** as the seller name you must enrol as an **Organization**,
  which requires a **D-U-N-S number** (free, apply at https://developer.apple.com/enroll/duns-lookup).
- Individual enrolment shows your personal legal name instead.
- Have ready: legal entity name, D-U-N-S, business address, website, and a work email
  on your domain.

---

## 3. Android release — the automated route

A GitHub Action is already in the repo: `.github/workflows/android-release.yml`.
It builds a **signed .aab** (for Play) and a **.apk** (for testing) in the cloud, so you
do not need Android Studio.

### Step 1 — create your signing key (once, on any computer with Java installed)

```bash
keytool -genkey -v -keystore loghub-release.keystore -alias loghub \
  -keyalg RSA -keysize 2048 -validity 10000
```

Back this file and its passwords up forever — losing it means you can never update the app.

### Step 2 — turn the key into text

```bash
base64 -i loghub-release.keystore | tr -d '\n' > keystore.txt   # macOS/Linux
```

### Step 3 — add GitHub secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.txt` |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password you chose |
| `ANDROID_KEY_ALIAS` | `loghub` |
| `ANDROID_KEY_PASSWORD` | the key password you chose |

### Step 4 — run the build

GitHub → **Actions** → **Android Release (AAB + APK)** → **Run workflow**
→ version name `1.0.0`, version code `1` → Run.

When it finishes, download the **loghub-android-release** artifact. It contains
`app-release.aab` (upload to Play) and `app-release.apk` (install on your phone to test).

Every future release: bump version code (2, 3, 4 …) and re-run.

### Manual alternative (Android Studio)

```bash
git pull && npm install && npm run build
npx cap add android && npx cap sync
npx cap open android
```
Then **Build → Generate Signed Bundle / APK → Android App Bundle**.

---

## 4. Play Console listing — copy-paste content

**App name (30 chars max)**
```
Log Hub Marketplace
```

**Short description (80 chars max)**
```
Fund your wallet and buy airtime, data, eSIMs, bills and verification services.
```

**Full description (4000 chars max)**
```
Log Hub Marketplace is your all-in-one digital services wallet.

Fund your wallet by bank transfer, virtual account or supported crypto gateways, then pay for the services you use every day — instantly.

WHAT YOU CAN DO
• Buy airtime and data for MTN, Airtel, Glo and 9mobile
• Pay electricity bills and cable TV subscriptions
• Buy eSIMs for travel — data-only plans and all-inclusive plans with calls and texts, covering countries, regions and global packages
• Get phone verification numbers from multiple international portals
• Social media growth services
• Track every order and transaction in a clean history view

WALLET
• Instant virtual account funding
• Manual bank transfer with proof of payment
• Crypto funding options
• Live balance, switchable between NGN and USD

BUILT FOR SPEED
• Clean, fast interface with light and dark mode
• Automatic refunds when a provider fails or an order is cancelled
• Referral programme that pays you commission
• Responsive support on Telegram

Log Hub Marketplace is operated by Craig Analytics.
Support: https://t.me/craiganalytics
```

**Graphics you must supply**
- App icon: 512×512 PNG (use `public/icon-512.png`)
- Feature graphic: 1024×500 PNG
- Phone screenshots: at least 2 (recommended 4–8), 1080×1920 — dashboard, wallet, services, orders

**Data safety form answers**
| Question | Answer |
| --- | --- |
| Does the app collect or share user data? | Yes |
| Data collected | Name, Email address, Purchase history, App interactions, Device/other IDs |
| Is data shared with third parties? | Yes — payment and service providers, to fulfil orders |
| Is data encrypted in transit? | Yes |
| Can users request deletion? | Yes — https://loghubmarketplace.site/account-deletion |

**Content rating questionnaire**: category Finance; no violence, no sexual content, no gambling;
answer "Yes" to "does the app allow users to purchase digital goods".

---

## 5. Release checklist

- [ ] Site published so /privacy, /terms and /account-deletion load
- [ ] Play Console account verified under Craig Analytics
- [ ] Keystore created and backed up; GitHub secrets added
- [ ] Workflow run; `.aab` downloaded
- [ ] `.apk` installed on a real phone and tested (login, funding, a purchase)
- [ ] Store listing text, icon, feature graphic and screenshots uploaded
- [ ] Data safety + content rating forms submitted
- [ ] Internal testing track first, then Production

---

## 6. iOS (after Apple enrolment)

```bash
npx cap add ios && npm run build && npx cap sync
npx cap open ios
```
In Xcode: select your Team, confirm bundle ID `site.loghubmarketplace.app`, set version,
add the 1024×1024 icon, then **Product → Archive → Distribute App → App Store Connect**.
Set the seller name to **Craig Analytics** in App Store Connect.

Note for review: Apple may require In-App Purchase for purely digital goods. Keep the
listing focused on real-world services (airtime, data, bills, eSIM, SIM services).

---

Read more about mobile development with Lovable:
https://lovable.dev/blogs/TODO

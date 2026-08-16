# Publishing Log Hub Marketplace to Play Store & App Store

Developer / publisher name: **Craig Analytics**

App identity (already set in `capacitor.config.ts`):
- App ID (bundle ID): `site.loghubmarketplace.app`
- App name: `Log Hub Marketplace`

> The Lovable sandbox live-reload URL is now OFF by default. Store builds bundle the
> real web build. For local development against the sandbox run:
> `CAP_LIVE_RELOAD=1 npx cap sync`

---

## 1. One-time setup on your own computer

1. Click **Export to GitHub** in Lovable, then `git clone` your repo.
2. Install dependencies: `npm install`
3. Add the native platforms:
   ```bash
   npx cap add android
   npx cap add ios
   ```
4. Build and sync:
   ```bash
   npm run build
   npx cap sync
   ```

Whenever you pull new changes from Lovable: `git pull && npm install && npm run build && npx cap sync`

---

## 2. Android (Google Play)

Requirements: Android Studio, a Google Play Developer account ($25 one-time).

1. In Play Console, create the developer account with the **developer name: Craig Analytics**
   (Play Console → Setup → Store settings → Developer name).
2. Open the project: `npx cap open android`
3. Set the version in `android/app/build.gradle` (`versionCode`, `versionName`).
4. Create a signing key:
   ```bash
   keytool -genkey -v -keystore loghub-release.keystore -alias loghub -keyalg RSA -keysize 2048 -validity 10000
   ```
   Keep this file and its passwords safe — you need them for every future update.
5. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
6. Upload the `.aab` in Play Console → Production → Create new release.
7. Fill in: app icon (512×512), feature graphic (1024×500), at least 2 phone screenshots,
   short + full description, privacy policy URL (https://loghubmarketplace.site/privacy),
   data safety form, and content rating questionnaire.

---

## 3. iOS (App Store)

Requirements: a Mac with Xcode, Apple Developer Program membership ($99/year).

1. Enroll in the Apple Developer Program **as Craig Analytics** (organization enrollment
   requires a D-U-N-S number; individual enrollment shows your legal name instead — for the
   "Craig Analytics" seller name you should enroll as an organization).
2. Open the project: `npx cap open ios`
3. In Xcode → Signing & Capabilities: select your Team, confirm bundle ID
   `site.loghubmarketplace.app`.
4. Set version and build number in the General tab.
5. Add app icons in `Assets.xcassets` (1024×1024 marketing icon required).
6. **Product → Archive**, then **Distribute App → App Store Connect**.
7. In App Store Connect: create the app record, set the **Seller / Developer name to
   Craig Analytics**, add screenshots (6.7" and 5.5" iPhone), description, keywords,
   support URL, privacy policy URL, and submit for review.

---

## 4. Review checklist (avoid rejections)

- Privacy policy page must be live and linked in-app and in the store listing.
- Account deletion path must exist in-app (Apple requirement if users can sign up).
- Do not describe the app as a "website wrapper"; highlight native features.
- Payments: digital goods purchased inside an iOS app can require Apple In-App Purchase.
  Wallet funding for services delivered outside the app (SIM/eSIM, airtime, data) is
  usually fine, but keep wording focused on physical/real-world services.
- Test on a real device before submitting: `npx cap run android` / `npx cap run ios`.

---

Read more about mobile development with Lovable:
https://lovable.dev/blogs/TODO

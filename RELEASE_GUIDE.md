# Peptide South Africa — Google Play Release Guide

**App ID:** `app.peptidesa` (PERMANENT — never change)
**Track:** Production
**Content rating:** Mature 17+ / Adult
**Developer account ID:** 8427019085313968947

---

## Part A — Local build setup (one-time)

> Requires: **Android Studio** installed (https://developer.android.com/studio), Java JDK 17+, Node.js 20+.

```bash
# 1. Export project to your GitHub via Lovable's "Export to GitHub" button, then:
git clone <your-repo-url>
cd <your-repo>

# 2. Install dependencies
npm install

# 3. Add Android platform
npx cap add android

# 4. Build the web bundle
npm run build

# 5. Sync into the native Android project
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

---

## Part B — Generate release signing keystore (CRITICAL — one-time)

> **IF YOU LOSE THIS KEYSTORE OR PASSWORD, YOU CAN NEVER UPDATE THE APP AGAIN.** Back it up to a password manager + offline encrypted drive.

```bash
keytool -genkey -v \
  -keystore peptidesa-release.keystore \
  -alias peptidesa \
  -keyalg RSA -keysize 2048 -validity 10000
```

When prompted:
- Keystore password: **(strong password — save it!)**
- Key password: **(can be same as keystore password)**
- Name / Org: Peptide South Africa
- City / Country: your details

Move the file somewhere safe (NOT inside the git repo):
```bash
mv peptidesa-release.keystore ~/keys/
```

---

## Part C — Configure Android signing

### 1. Create `android/keystore.properties` (DO NOT commit to git)

```properties
storeFile=/Users/YOUR_USER/keys/peptidesa-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=peptidesa
keyPassword=YOUR_KEY_PASSWORD
```

Add to `.gitignore`:
```
android/keystore.properties
*.keystore
```

### 2. Edit `android/app/build.gradle` — add at the top:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { ... }` block, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 3. Set version in `android/app/build.gradle` `defaultConfig` block:
```gradle
versionCode 1
versionName "1.0.0"
```

> For each future release: bump `versionCode` (1 → 2 → 3) and `versionName` ("1.0.0" → "1.0.1").

---

## Part D — Build the AAB (App Bundle)

In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Select your keystore, enter passwords
4. Build variant: **release**
5. Click **Finish**

Output: `android/app/release/app-release.aab` ← this is what you upload to Play Store.

---

## Part E — Google Play Console setup

1. Go to https://play.google.com/console (sign in with developer account `8427019085313968947`)
2. **Create app**:
   - App name: **Peptide South Africa**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
   - Confirm declarations (Developer Program Policies, US export laws)

3. Complete the **Dashboard tasks** in this order:

### Set up your app
- **App access**: All functionality available without restrictions (or provide test login if behind auth)
- **Ads**: No, my app does not contain ads
- **Content rating**: see Part F below
- **Target audience**: Ages 18+
- **News app**: No
- **COVID-19 contact tracing**: No
- **Data safety**: see Part G below
- **Government app**: No
- **Financial features**: No
- **Health features**: Yes — health/wellness tracking
- **Store listing**: see `STORE_LISTING.md`

---

## Part F — Content rating questionnaire

Category: **Reference, News, or Educational**

Answer the questionnaire honestly. Key answers for Peptide South Africa:
- **References to illegal drugs**: No (peptides are research compounds, not illegal drugs — but mentioned for educational purposes)
- **Drugs / alcohol / tobacco**: **Yes — references to controlled substances/medication for educational purposes**
- **Violence**: No
- **Sexual content**: No
- **Profanity**: No
- **User-generated content**: No (unless you enable forums)
- **Shares user location**: No

Expected rating: **Mature 17+ / PEGI 16-18**

---

## Part G — Data safety form

**Data collected:**
| Data | Collected | Shared | Purpose | Optional |
|------|-----------|--------|---------|----------|
| Email address | Yes | No | Account management | Required |
| Name | Yes | No | Account management | Optional |
| Health info (doses, biomarkers, body composition) | Yes | No | App functionality | Required |
| Photos (progress photos) | Yes | No | App functionality | Optional |

**Security practices:**
- ✅ Data is encrypted in transit (HTTPS)
- ✅ Users can request data deletion (in-app account deletion)
- ✅ Committed to Play Families Policy: No (app is 18+)
- ✅ Independent security review: No

---

## Part H — Upload AAB & submit for review

1. Left sidebar → **Production**
2. **Create new release**
3. **Upload** → select `app-release.aab`
4. **Release name**: `1.0.0` (auto-filled)
5. **Release notes** (English):
   ```
   Initial release of Peptide South Africa — research-grade peptide protocol tracker.

   Features:
   • Track peptide doses, cycles, and protocols
   • Bloodwork tracking with 20+ biomarkers
   • Stack builder & compatibility matrix
   • Dose reminders with native notifications
   • Reconstitution calculator
   • Body composition tracking
   ```
6. Click **Next → Save → Review release → Start rollout to Production**

**Review timeline:** typically 1–7 days for the first submission.

---

## Future updates (after first release)

```bash
# 1. In android/app/build.gradle, bump:
#    versionCode  N → N+1
#    versionName  "1.0.0" → "1.0.1"

# 2. Rebuild
npm run build
npx cap sync android

# 3. In Android Studio: Build → Generate Signed Bundle → AAB
# 4. In Play Console → Production → Create new release → upload new AAB
```

---

## Troubleshooting

- **"Package name already exists"**: Someone (likely you in a previous attempt) registered `app.peptidesa`. Use a variant or contact Play support.
- **"App not signed with upload key"**: Wrong keystore. You MUST use the original `peptidesa-release.keystore`.
- **Build fails — "minSdkVersion"**: Open `android/variables.gradle`, ensure `minSdkVersion = 23` or higher.
- **White screen on launched APK**: Confirm `capacitor.config.ts` has NO `server.url` set (it's already removed).

---

## Need a Mac for iOS too?
When ready: separate guide. Requires Xcode + $99/yr Apple Developer account + `npx cap add ios`.

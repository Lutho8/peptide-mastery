# Peptide South Africa — Android Build Checklist

Print this or keep it open. Tick each box as you go. Total time: ~1 hour the first time.

> **Stuck?** Each step has a "If this fails" note underneath.

---

## Phase 1 — Install the tools (one time, ~30 min)

### ☐ 1. Install Node.js LTS
- Go to https://nodejs.org → click the green **LTS** button.
- Run the installer. **Leave "Add to PATH" CHECKED.**
- **Restart your PC** when done.
- Verify: open Command Prompt and run `node -v`. You should see `v20.x.x`.

> If `node -v` doesn't work → see `scripts/fix-node-path.md`.

### ☐ 2. Install Android Studio
- Go to https://developer.android.com/studio → Download.
- Run the installer with all defaults.
- On first launch, accept the SDK download (it'll grab ~3 GB).
- Wait until you see the **"Welcome to Android Studio"** screen.

> If installer fails → make sure you have ~10 GB free on C:.

### ☐ 3. Pull the latest project code
- Open **GitHub Desktop**.
- Top toolbar → **Fetch origin** → **Pull origin**.
- You should now see `scripts/setup-android.bat` in the file list.

---

## Phase 2 — Generate the Android project (one time, ~5 min)

### ☐ 4. Run the one-click setup script
- Open **File Explorer** and go to your project folder.  
  Probably: `C:\Users\YourName\Documents\GitHub\peptide-mastery`  
  (or wherever GitHub Desktop cloned it — see Repository → Show in Explorer)
- Double-click `scripts\setup-android.bat`.
- A black window opens. Wait — it'll take 3–5 minutes.
- When you see **"DONE! Android project is ready."** → close the window.

> If it stops with an error → read the message in the window. Most common fix is in `scripts/fix-node-path.md`.

### ☐ 5. Open the android folder in Android Studio
- Launch **Android Studio**.
- Click **File → Open** (or "Open" on the welcome screen).
- Navigate to your project folder → select the **`android`** subfolder → click **OK**.
- Bottom status bar will say **"Gradle sync in progress…"**. Wait until it says **"Gradle sync finished"** (3–10 min the first time).

> If Gradle sync fails → click the error link, usually it'll offer to install missing SDK components. Click "Install".

---

## Phase 3 — Create your signing key (one time, ~5 min) ⚠️ CRITICAL

> **The keystore file you make in this step IS your app's identity on Google Play. If you lose it or forget the password, you can NEVER update your app again.** Back it up to a password manager AND a USB drive.

### ☐ 6. Generate the keystore
- Open Command Prompt.
- Paste this command (one line) and press Enter:

```
keytool -genkey -v -keystore "%USERPROFILE%\peptidesa-release.keystore" -alias peptidesa -keyalg RSA -keysize 2048 -validity 10000
```

- It'll ask for a password — type a strong one and **save it in your password manager NOW**.
- It'll ask the same questions again (name, org, city, country) — fill them in.
- When done, the file lives at `C:\Users\YourName\peptidesa-release.keystore`.

> If `keytool` is not recognized → it ships with Java. Open Android Studio → File → Project Structure → SDK Location → copy the JDK path. Then use the full path: `"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey ...`

### ☐ 7. Back up the keystore
- Copy `peptidesa-release.keystore` to:
  - A USB stick
  - A cloud drive (Google Drive, Dropbox)
  - Email it to yourself
- Save the password in your password manager.

---

## Phase 4 — Build the signed AAB (~10 min)

### ☐ 8. Generate signed bundle
In Android Studio:
- Top menu → **Build → Generate Signed Bundle / APK…**
- Select **Android App Bundle** → Next.
- **Key store path**: click folder icon → select your `peptidesa-release.keystore`.
- **Key store password**: paste from password manager.
- **Key alias**: `peptidesa`.
- **Key password**: same as keystore password (or whatever you set).
- Tick **"Remember passwords"** → Next.
- Build variant: **release**.
- Click **Finish**.

A notification appears bottom-right when done: **"locate"** → click it.  
Your file: `android\app\release\app-release.aab` ✅

> If build fails with "minSdkVersion" → open `android\variables.gradle`, set `minSdkVersion = 23`, then Build → Clean Project → repeat.

---

## Phase 5 — Upload to Google Play (~30 min, then 1–7 day review)

### ☐ 9. Create the app in Play Console
- Go to https://play.google.com/console
- **Create app** → fill in:
  - Name: **Peptide South Africa**
  - Default language: **English (United States)**
  - App: **App** (not Game)
  - Free
- Tick the declarations.

### ☐ 10. Complete the dashboard tasks
Use the copy in `STORE_LISTING.md` and the answers in `RELEASE_GUIDE.md` (Parts F–G):
- ☐ App access
- ☐ Ads (No)
- ☐ Content rating questionnaire (→ Mature 17+)
- ☐ Target audience (18+)
- ☐ Data safety form
- ☐ Store listing (title, descriptions, screenshots, feature graphic)
- ☐ Privacy policy URL: `https://peptide-south-africa.co.za/privacy`

### ☐ 11. Upload your AAB
- Left sidebar → **Production** → **Create new release**.
- Upload `app-release.aab`.
- Release notes: copy from `RELEASE_GUIDE.md` Part H.
- **Save → Review release → Start rollout to Production**.

### ☐ 12. Wait for review
Typically 1–7 days for the first submission. You'll get an email.

---

## Future updates (after first release)

1. Make changes in Lovable → push to GitHub.
2. In GitHub Desktop: **Pull origin**.
3. Open `android\app\build.gradle`, bump:
   - `versionCode 1` → `versionCode 2`
   - `versionName "1.0.0"` → `versionName "1.0.1"`
4. Double-click `scripts\build-release-aab.bat`.
5. Android Studio → **Build → Generate Signed Bundle** → use the SAME keystore.
6. Play Console → Production → **Create new release** → upload the new `.aab`.

---

## Quick reference

| File | Purpose |
|------|---------|
| `scripts\setup-android.bat` | First-time setup. Double-click. |
| `scripts\build-release-aab.bat` | Rebuild for every new release. Double-click. |
| `scripts\fix-node-path.md` | Fix "node is not recognized". |
| `RELEASE_GUIDE.md` | Detailed reference for every step. |
| `STORE_LISTING.md` | Copy-paste store listing text. |

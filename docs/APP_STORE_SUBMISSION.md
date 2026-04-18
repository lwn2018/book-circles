# App Store Submission Checklist

## ✅ Code Changes Complete

### iOS
- [x] URL Scheme (`pagepass://`) configured in Info.plist
- [x] Associated Domains entitlements file created
- [x] Xcode project updated to use entitlements
- [x] Camera usage description present
- [x] App icon (1024px) present

### Web
- [x] Privacy Policy at /privacy
- [x] Terms of Service at /terms
- [x] Apple App Site Association file configured
- [x] Android Asset Links file present (needs fingerprint)

---

## 🔧 Manual Steps Required

### 1. Supabase - Add Redirect URL
**Dashboard:** https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration

Add to "Redirect URLs":
```
pagepass://auth/callback
```

### 2. Android - Get SHA-256 Fingerprint
Run this command with your release keystore:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

Then update `public/.well-known/assetlinks.json` replacing `FINGERPRINT_PLACEHOLDER` with the actual SHA-256 fingerprint.

### 3. Apple - Create Test Account
Create `applereview@pagepass.app` test account:
1. Go to pagepass.app and sign up with that email
2. Add some books and join a circle
3. Note the password for App Store Connect

### 4. Apple Developer Portal
Ensure Associated Domains capability is enabled:
1. Go to Certificates, Identifiers & Profiles
2. Select your App ID (app.pagepass)
3. Enable "Associated Domains" capability

### 5. Build & Submit

**iOS:**
```bash
npx cap sync ios
cd ios/App
pod install
# Open in Xcode, archive, and upload to App Store Connect
```

**Android:**
```bash
npx cap sync android
cd android
./gradlew bundleRelease
# Upload AAB to Play Console
```

---

## App Store Connect Metadata

**App Name:** PagePass
**Subtitle:** Share books with your circle
**Category:** Books (Primary), Social Networking (Secondary)
**Age Rating:** 4+

**Keywords:** books, lending, sharing, library, reading, book club, friends, community, borrow

**Description:**
PagePass is the easiest way to share physical books with friends, family, and neighbors. Create a circle, add your books, and start lending!

📚 **Build Your Library** - Add books by scanning barcodes or searching by title
👥 **Create Circles** - Invite friends, family, or neighbors to share books
🔄 **Track Lending** - See who has your books and what's available to borrow
🎁 **Gift Books** - Mark books as gifts when lending them out

No more lost books or forgotten loans. PagePass keeps everyone in the loop.

**Privacy Policy URL:** https://pagepass.app/privacy
**Support URL:** https://pagepass.app (or dedicated support page)

---

Last updated: April 18, 2026

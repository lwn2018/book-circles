# Capacitor Setup Notes

## Supabase Configuration

### Required: Add Native Redirect URL

In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:

Add:
```
pagepass://auth/callback
```

This allows the native app to receive auth callbacks (email verification, password reset).

---

## Deep Links Verification

### iOS (Universal Links)

The `apple-app-site-association` file is served at:
```
https://pagepass.app/.well-known/apple-app-site-association
```

To verify it's working:
1. Deploy the latest build
2. Visit the URL — should return JSON
3. Check Apple's CDN cache: https://app-site-association.cdn-apple.com/a/v1/pagepass.app

Apple caches this file. Changes may take 24-48 hours to propagate.

### Android (App Links)

The `assetlinks.json` file is at:
```
https://pagepass.app/.well-known/assetlinks.json
```

**Note:** The Android fingerprint placeholder needs to be replaced with the actual signing certificate fingerprint when building release APKs.

To get the fingerprint:
```bash
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

---

## App Store Submission Checklist

### Before Submitting to Apple

1. **App Icon** — Add 1024x1024 PNG to Xcode Assets
2. **Privacy Policy** — Verify https://pagepass.app/privacy is live
3. **Terms of Service** — Verify https://pagepass.app/terms is live
4. **Test Account** — Create `applereview@pagepass.app` with test data
5. **Camera Permission String** — Already set: "PagePass needs camera access to scan book barcodes"
6. **Report Button** — Required for apps with user-generated content (add before submission)

### Apple Review Notes Template

```
Test Account:
Email: applereview@pagepass.app
Password: [password]

App Description:
PagePass is a book-sharing app that lets friends lend physical books to each other. 
Users can scan book barcodes to add books to their library, then share them within 
their circles (friend groups).

Key Features to Test:
1. Sign up / Sign in
2. Create a circle (friend group)
3. Add a book by scanning barcode
4. Browse books in a circle
5. Request to borrow a book

Camera Usage:
The camera is used to scan book barcodes (ISBN) when adding books to your library.
```

---

## Common Issues

### Build Fails in Xcode
- Run `npx cap sync ios` again
- Clean build folder: Product → Clean Build Folder
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`

### Deep Links Not Working
- Apple caches the association file — wait 24-48 hours
- Verify JSON is valid: `curl https://pagepass.app/.well-known/apple-app-site-association | jq`
- Check Team ID matches in both Xcode and the JSON file

### Camera Permission Denied
- User needs to go to Settings → PagePass → Camera → Enable
- The app shows a helpful message when this happens

---

## Files Added

```
capacitor.config.ts          # Capacitor configuration
ios/                         # iOS native project
android/                     # Android native project
lib/platform.ts              # Platform detection utilities
lib/barcodeScanner.ts        # Barcode scanner abstraction
lib/externalLinks.ts         # External link handler
public/.well-known/          # Deep link association files
docs/NATIVE_APP_TESTING.md   # Testing checklist
docs/CAPACITOR_SETUP_NOTES.md # This file
```

# PagePass Native App Testing Checklist

## Pre-Test Setup

### On Your Mac
```bash
# Pull latest
cd book-circles
git pull origin main

# Sync Capacitor (installs pods)
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### In Xcode
1. Select your **Apple Developer Team** in Signing & Capabilities
2. Verify bundle ID is `app.pagepass`
3. Connect your iPhone via USB
4. Select your iPhone as build target
5. Click **Run** (▶️)

### In Supabase Dashboard
Add this redirect URL (Authentication → URL Configuration → Redirect URLs):
```
pagepass://auth/callback
```

---

## Testing Checklist

### Core Functionality
- [ ] App loads `pagepass.app` in WebView
- [ ] Login works (enter credentials, tap sign in)
- [ ] Signup works (create new account)
- [ ] Email verification link opens back in the native app (not Safari)
- [ ] Password reset link opens in the native app

### Barcode Scanner
- [ ] Tap "📷 Scan" button in Add Book modal
- [ ] Camera permission prompt appears on first use
- [ ] Scanning a book ISBN captures correct number
- [ ] Book details auto-populate after scan
- [ ] Non-book barcodes show helpful error message
- [ ] Tapping outside/cancelling returns to modal

### Deep Links
- [ ] Invite links (`pagepass.app/join/CODE`) open in native app
- [ ] Auth links (`pagepass.app/auth/*`) open in native app
- [ ] Test: send yourself an invite link via iMessage, tap it

### External Links
- [ ] "Buy on Amazon" opens Safari (not in-app)
- [ ] Indigo links open Safari
- [ ] Email links (mailto:) open Mail app

### Navigation & UI
- [ ] Bottom nav works (Circles, Library, Shelf)
- [ ] Back button works correctly
- [ ] Sticky header renders correctly
- [ ] Filter bar works
- [ ] No CSS issues with iPhone notch
- [ ] Keyboard doesn't break layout

### Notifications
- [ ] Bell icon shows notification count
- [ ] Tapping notification deep-links to correct page
- [ ] Email notifications still work

### Other
- [ ] PostHog events fire (check PostHog dashboard)
- [ ] Circle browsing works
- [ ] Book detail pages load
- [ ] Handoff flow works
- [ ] Settings page accessible

---

## Known Issues to Watch

1. **CSS `100vh`** — May behave differently with notch. Check My Shelf page.
2. **`position: fixed`** — Sticky bar might need adjustment.
3. **Keyboard** — Virtual keyboard may cause viewport issues.

---

## If Something Breaks

1. Check Safari Web Inspector (Develop → [Your iPhone] → pagepass.app)
2. Check Xcode console for native errors
3. Note the exact steps to reproduce
4. Screenshot/screen record if possible

---

## Android Testing (Optional)

If you have Android Studio installed:
```bash
npx cap sync android
npx cap open android
```

Build and run on emulator (barcode scanner won't work in emulator — need real device).

---

## Ready for App Store?

Before submission, ensure:
- [ ] App icon added (1024x1024 PNG in Xcode)
- [ ] Splash screen configured
- [ ] `applereview@pagepass.app` test account created
- [ ] Privacy policy live at `pagepass.app/privacy`
- [ ] Terms live at `pagepass.app/terms`
- [ ] All checklist items above pass

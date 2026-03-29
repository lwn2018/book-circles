import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pagepass',
  appName: 'PagePass',
  server: {
    url: 'https://pagepass.app/circles',
    cleartext: false,
    // Keep all navigation inside the WebView
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pagepass',
    // Allow navigation to pagepass.app URLs
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    // Keep external links (like Amazon) opening in browser
    // but keep pagepass.app URLs inside the app
    Browser: {
      // external links open in browser
    }
  }
};

export default config;

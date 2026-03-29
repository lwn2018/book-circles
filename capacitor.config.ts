import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pagepass',
  appName: 'PagePass',
  server: {
    url: 'https://pagepass.app',
    cleartext: false,
    hostname: 'pagepass.app',
    iosScheme: 'https',
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pagepass',
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: false
  },
  android: {
    allowMixedContent: false
  },
  plugins: {}
};

export default config;

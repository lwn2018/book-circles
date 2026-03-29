import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pagepass',
  appName: 'PagePass',
  server: {
    url: 'https://pagepass.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pagepass',
    allowsLinkPreview: false,
  },
  android: {
    allowMixedContent: false
  },
  plugins: {}
};

export default config;

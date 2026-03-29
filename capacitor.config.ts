import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pagepass',
  appName: 'PagePass',
  server: {
    url: 'https://www.pagepass.app',
    cleartext: false,
    hostname: 'www.pagepass.app',
    iosScheme: 'https',
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'pagepass',
    allowsLinkPreview: false,
    backgroundColor: '#121212'
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#121212'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#121212'
    }
  }
};

export default config;

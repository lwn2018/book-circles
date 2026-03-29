'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

export default function NativeInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#121212' });
      }).catch(console.error);
    }
  }, []);

  return null;
}

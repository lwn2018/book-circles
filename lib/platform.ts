import { Capacitor } from '@capacitor/core';

/**
 * Check if running in a native Capacitor app (iOS/Android)
 */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Get the current platform
 * @returns 'ios', 'android', or 'web'
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => 
  Capacitor.getPlatform() as 'ios' | 'android' | 'web';

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => getPlatform() === 'ios';

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => getPlatform() === 'android';

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => getPlatform() === 'web';

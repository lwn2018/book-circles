import { isNative } from './platform';

export interface ScanResult {
  isbn: string;
  format: 'EAN_13' | 'EAN_8' | 'UPC_A' | 'UPC_E' | string;
}

export interface ScanError {
  code: 'PERMISSION_DENIED' | 'CANCELLED' | 'NOT_SUPPORTED' | 'INVALID_BARCODE' | 'UNKNOWN';
  message: string;
}

/**
 * Validate that a barcode is a valid book ISBN
 * ISBN-13: starts with 978 or 979, exactly 13 digits
 * ISBN-10: exactly 10 digits (last digit can be X)
 */
export function validateISBN(barcode: string): { valid: boolean; type: 'ISBN-13' | 'ISBN-10' | null; message?: string } {
  const cleaned = barcode.replace(/[-\s]/g, '');
  
  // ISBN-13 check
  if (/^\d{13}$/.test(cleaned)) {
    if (cleaned.startsWith('978') || cleaned.startsWith('979')) {
      return { valid: true, type: 'ISBN-13' };
    }
    return { 
      valid: false, 
      type: null, 
      message: "This doesn't look like a book barcode. Try scanning the barcode on the back cover that starts with 978." 
    };
  }
  
  // ISBN-10 check
  if (/^\d{9}[\dXx]$/.test(cleaned)) {
    return { valid: true, type: 'ISBN-10' };
  }
  
  return { 
    valid: false, 
    type: null, 
    message: "This doesn't look like a book barcode. Try scanning the barcode on the back cover." 
  };
}

/**
 * Scan a barcode using the best available method
 * Returns null if scanning was cancelled or failed
 */
export async function scanBarcode(): Promise<ScanResult | null> {
  if (isNative()) {
    return scanNative();
  }
  return scanWeb();
}

/**
 * Check if barcode scanning is available on this device
 */
export async function isScanningAvailable(): Promise<boolean> {
  if (isNative()) {
    return true; // Native always has camera access (with permissions)
  }
  // Check for getUserMedia support (web camera access)
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Check and request camera permissions for scanning
 */
export async function checkScanPermissions(): Promise<{
  granted: boolean;
  canRequest: boolean;
  message?: string;
}> {
  if (isNative()) {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
    const { camera } = await BarcodeScanner.checkPermissions();
    
    if (camera === 'granted') {
      return { granted: true, canRequest: false };
    }
    
    if (camera === 'denied') {
      return { 
        granted: false, 
        canRequest: false,
        message: 'Camera access is needed to scan barcodes. Go to Settings → PagePass → Camera to enable it.'
      };
    }
    
    // Can request permission
    return { granted: false, canRequest: true };
  }
  
  // Web: We can try to request, but can't easily check beforehand
  return { granted: false, canRequest: true };
}

/**
 * Request camera permission for scanning
 */
export async function requestScanPermission(): Promise<boolean> {
  if (isNative()) {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
    const result = await BarcodeScanner.requestPermissions();
    return result.camera === 'granted';
  }
  
  // Web: Try to get camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop()); // Stop immediately
    return true;
  } catch {
    return false;
  }
}

async function scanNative(): Promise<ScanResult | null> {
  try {
    const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
    
    // Check permissions first
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera === 'denied') {
      throw { code: 'PERMISSION_DENIED', message: 'Camera permission denied' };
    }
    
    if (camera === 'prompt' || camera === 'prompt-with-rationale') {
      const result = await BarcodeScanner.requestPermissions();
      if (result.camera === 'denied') {
        throw { code: 'PERMISSION_DENIED', message: 'Camera permission denied' };
      }
    }
    
    // Start scanning
    const { barcodes } = await BarcodeScanner.scan({
      formats: [
        BarcodeFormat.Ean13, 
        BarcodeFormat.Ean8, 
        BarcodeFormat.UpcA, 
        BarcodeFormat.UpcE
      ]
    });
    
    if (barcodes.length > 0) {
      return {
        isbn: barcodes[0].rawValue,
        format: barcodes[0].format
      };
    }
    
    return null;
  } catch (error: unknown) {
    // User cancelled
    if (error && typeof error === 'object' && 'code' in error) {
      const e = error as { code: string; message?: string };
      if (e.code === 'CANCELLED' || e.code === 'USER_CANCELLED') {
        return null;
      }
      throw error;
    }
    throw error;
  }
}

async function scanWeb(): Promise<ScanResult | null> {
  // Web fallback - for now, return null to indicate web scanning not implemented
  // Most beta users will be on native app
  // Could integrate html5-qrcode here if needed
  console.log('[Barcode Scanner] Web scanning not fully implemented - use native app');
  return null;
}

import { isNative } from './platform';

/**
 * Open a URL in the external system browser
 * In native apps, this opens Safari/Chrome outside the WebView
 * On web, this opens a new tab
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Open Amazon affiliate link in external browser
 */
export async function openAmazonLink(isbn: string): Promise<void> {
  // Using Amazon Canada with affiliate tag
  const affiliateTag = 'pagepass0b-20'; // Replace with actual tag
  const amazonUrl = `https://www.amazon.ca/dp/${isbn}?tag=${affiliateTag}`;
  await openExternal(amazonUrl);
}

/**
 * Open email compose
 */
export async function openEmailCompose(email: string, subject?: string, body?: string): Promise<void> {
  let mailtoUrl = `mailto:${email}`;
  const params: string[] = [];
  
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    mailtoUrl += `?${params.join('&')}`;
  }
  
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: mailtoUrl });
  } else {
    window.location.href = mailtoUrl;
  }
}

/**
 * Open SMS compose
 */
export async function openSMS(phone: string, body?: string): Promise<void> {
  let smsUrl = `sms:${phone}`;
  
  if (body) {
    // iOS uses &body=, Android uses ?body=
    smsUrl += `?body=${encodeURIComponent(body)}`;
  }
  
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: smsUrl });
  } else {
    window.location.href = smsUrl;
  }
}

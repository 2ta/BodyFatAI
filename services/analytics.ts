// Your Google Analytics Measurement ID
// TODO: Replace 'G-REPLACE_ME' with your actual ID from analytics.google.com
const MEASUREMENT_ID = 'G-REPLACE_ME';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initAnalytics = () => {
  if (MEASUREMENT_ID === 'G-REPLACE_ME') {
    console.warn('Analytics: Measurement ID not set.');
    return;
  }

  // Prevent double initialization
  if (document.getElementById('ga-script')) return;

  // Inject Google Analytics Script
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize Data Layer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    send_page_view: true,
    anonymize_ip: true, // Privacy friendly
  });
};

// Log specific actions
export const logEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
};

// Pre-defined events for consistency
export const AnalyticsEvents = {
  UPLOAD_IMAGE: 'upload_image',
  OPEN_CAMERA: 'open_camera',
  ANALYSIS_START: 'analysis_start',
  ANALYSIS_SUCCESS: 'analysis_success',
  ANALYSIS_ERROR: 'analysis_error',
  SHARE_RESULT: 'share_result',
  DOWNLOAD_RESULT: 'download_result',
  CLICK_PRO_UNLOCK: 'click_pro_unlock',
  CLICK_AFFILIATE: 'click_affiliate',
};
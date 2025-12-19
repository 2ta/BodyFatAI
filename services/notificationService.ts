import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// --- CONFIGURATION ---
// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

// VAPID Key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
const VAPID_KEY = "REPLACE_WITH_YOUR_PUBLIC_VAPID_KEY";

let messaging: any = null;

// Initialize Firebase securely
try {
  // Only initialize if config is replaced (basic check)
  if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log("Firebase initialized successfully");
  } else {
    console.debug("Firebase config not set. Push notifications will be simulated locally.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Key for local storage
const REMINDER_KEY = 'bodyfatai_next_reminder';

/**
 * Checks if a reminder is currently due based on local storage
 */
export const checkReminderDue = (): boolean => {
  const dueStr = localStorage.getItem(REMINDER_KEY);
  if (!dueStr) return false;
  
  const dueDate = parseInt(dueStr, 10);
  // If current time is past due date, return true
  return Date.now() > dueDate;
};

/**
 * Clears the current reminder (e.g. after user checks in)
 */
export const clearReminder = () => {
  localStorage.removeItem(REMINDER_KEY);
};

/**
 * Request notification permissions from the browser
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error("Error requesting permission:", error);
    return false;
  }
};

/**
 * Automatically sets up a notification reminder for 2 weeks from now
 * Uses Firebase if available and permitted, otherwise relies on local storage check.
 */
export const setupTwoWeekReminder = async (): Promise<void> => {
  // 1. Calculate Date (2 weeks = 14 days)
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  // For testing: 10 seconds
  // const twoWeeksMs = 10 * 1000; 
  const dueDate = Date.now() + twoWeeksMs;
  
  // 2. Save to Local Storage (Always works as a fallback)
  localStorage.setItem(REMINDER_KEY, dueDate.toString());
  console.log("Local reminder scheduled for:", new Date(dueDate).toLocaleString());

  // 3. Try Firebase Push Notification if permission granted
  if (messaging && Notification.permission === 'granted') {
    try {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        // In a real app, you would send this token to your backend
        // e.g. await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ token, dueDate }) });
        console.log("FCM Token generated for push notification:", token);
      }
    } catch (error) {
      console.error("Error setting up push notification:", error);
    }
  }
};

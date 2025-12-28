// Firebase client configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging, onMessage } from 'firebase/messaging';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Firebase config - these should be set as environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
};

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  
  if (app) {
    return app;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Check if config is available
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase Client] Firebase config not available. Push notifications will not work.');
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase Client] Initialized successfully');
    return app;
  } catch (error) {
    console.error('[Firebase Client] Failed to initialize:', error);
    return null;
  }
}

export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  
  if (messaging) {
    return messaging;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error('[Firebase Client] Failed to get messaging:', error);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    console.warn('[FCM] Messaging not available');
    return null;
  }

  try {
    // Get or register service worker
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }
    
    // Send Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig,
      });
    } else if (registration.installing) {
      registration.installing.addEventListener('statechange', () => {
        if (registration?.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig,
          });
        }
      });
    }
    
    await navigator.serviceWorker.ready;
    
    // Get FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: firebaseConfig.vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[FCM] No registration token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === 'undefined') return null;

  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    return null;
  }

  try {
    return onMessage(messagingInstance, callback);
  } catch (error) {
    console.error('[FCM] Error setting up foreground message handler:', error);
    return null;
  }
}


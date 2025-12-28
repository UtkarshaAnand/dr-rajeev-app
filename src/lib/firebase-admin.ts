// Firebase Admin SDK initialization for server-side FCM
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let app: App | null = null;

export function getFirebaseAdminApp(): App {
  if (app) {
    return app;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  // Initialize Firebase Admin
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  }

  try {
    const serviceAccountJson = JSON.parse(serviceAccount);
    
    app = initializeApp({
      credential: cert(serviceAccountJson),
    });

    return app;
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error);
    throw error;
  }
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string> {
  try {
    const app = getFirebaseAdminApp();
    const messaging = getMessaging(app);

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high' as const,
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        },
      },
    };

    const response = await messaging.send(message);
    return response;
  } catch (error: any) {
    console.error('[FCM] Error sending message:', error);
    
    // Handle invalid token errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('[FCM] Invalid or unregistered token, should be removed from database');
      throw new Error('INVALID_TOKEN');
    }
    
    throw error;
  }
}

export async function sendPushNotificationToMultiple(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: number; failure: number; failedTokens: string[] }> {
  const results = {
    success: 0,
    failure: 0,
    failedTokens: [] as string[],
  };

  for (const token of fcmTokens) {
    try {
      await sendPushNotification(token, title, body, data);
      results.success++;
    } catch (error: any) {
      results.failure++;
      if (error.message === 'INVALID_TOKEN') {
        results.failedTokens.push(token);
      }
    }
  }

  return results;
}


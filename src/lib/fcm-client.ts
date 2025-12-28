// Client-side FCM token registration for PWA
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getFCMToken, onForegroundMessage } from './firebase-client';

export function useFCMRegistration() {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Check if service workers and notifications are supported
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    ) {
      setIsSupported(true);
      requestNotificationPermission();
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerFCMToken();
      } else {
        console.log('[FCM] Notification permission denied');
      }
    } catch (error) {
      console.error('[FCM] Error requesting permission:', error);
    }
  };

  const registerFCMToken = useCallback(async () => {
    try {
      // Get FCM token using Firebase SDK
      const fcmToken = await getFCMToken();
      
      if (!fcmToken) {
        console.warn('[FCM] Failed to get FCM token');
        return;
      }

      setToken(fcmToken);

      // Register token with backend
      const response = await fetch('/api/doctor/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fcmToken }),
      });

      if (response.ok) {
        console.log('[FCM] Token registered successfully');
        setIsRegistered(true);
      } else {
        const error = await response.json();
        console.error('[FCM] Failed to register token:', error);
      }
    } catch (error) {
      console.error('[FCM] Error registering token:', error);
    }
  }, []);

  // Set up foreground message handler (when app is open)
  useEffect(() => {
    if (!isRegistered) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[FCM] Foreground message received:', payload);
      
      // Show notification even when app is in foreground
      if (payload.notification) {
        new Notification(payload.notification.title || 'New Message', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isRegistered]);

  return { 
    token, 
    isSupported, 
    isRegistered,
    requestNotificationPermission,
    registerFCMToken,
  };
}


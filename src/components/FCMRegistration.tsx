"use client";

import { useEffect } from 'react';
import { useFCMRegistration } from '@/lib/fcm-client';

export default function FCMRegistration() {
  const { isSupported, registerFCMToken, isRegistered } = useFCMRegistration();

  // Register FCM token if supported and not already registered
  // This is a fallback in case token wasn't registered during login
  useEffect(() => {
    if (isSupported && !isRegistered) {
      // Small delay to ensure service worker is ready
      const timer = setTimeout(() => {
        // Only register if we're on a protected route (doctor is logged in)
        // This is checked by the API endpoint itself
        registerFCMToken();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isRegistered, registerFCMToken]);

  // This component doesn't render anything
  return null;
}


"use client";

import { useEffect } from 'react';
import { useFCMRegistration } from '@/lib/fcm-client';

export default function FCMRegistration() {
  const { isSupported, registerFCMToken, isRegistered } = useFCMRegistration();

  useEffect(() => {
    // Only register if supported and not already registered
    if (isSupported && !isRegistered) {
      // Small delay to ensure service worker is ready
      const timer = setTimeout(() => {
        registerFCMToken();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, isRegistered, registerFCMToken]);

  // This component doesn't render anything
  return null;
}


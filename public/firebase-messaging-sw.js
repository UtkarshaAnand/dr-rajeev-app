// Service Worker for Firebase Cloud Messaging
// This file must be in the public directory
// Firebase config will be injected by the client

// Import Firebase scripts at top level (required for service workers)
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
} catch (error) {
  console.error('[FCM SW] Failed to load Firebase scripts:', error);
}

// Default config - will be overridden by client
let firebaseConfig = null;
let messaging = null;
let isInitialized = false;

// Listen for config from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (isInitialized) {
    return; // Already initialized
  }

  if (!firebaseConfig || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[FCM SW] Firebase config not available');
    return;
  }

  // Check if firebase is available
  if (typeof firebase === 'undefined') {
    console.error('[FCM SW] Firebase scripts not loaded');
    return;
  }

  try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Retrieve an instance of Firebase Messaging
    messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {

      const notificationTitle = payload.notification?.title || 'New Message';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: payload.data || {},
        tag: payload.data?.chatId || 'new-message',
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

    isInitialized = true;
  } catch (error) {
    console.error('[FCM SW] Error initializing Firebase:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {  
  event.notification.close();

  // Get the chatId from notification data
  const chatId = event.notification.data?.chatId;
  
  if (chatId) {
    // Open the chat when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(`/chat/${chatId}`) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(`/chat/${chatId}`);
        }
      })
    );
  } else {
    // Open inbox if no chatId
    event.waitUntil(
      clients.openWindow('/inbox')
    );
  }
});

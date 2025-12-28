// Service Worker for Firebase Cloud Messaging
// This file must be in the public directory
// Firebase config will be injected by the client

// Default config - will be overridden by client
let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

// Listen for config from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[FCM SW] Firebase config not available');
    return;
  }

  // Import Firebase scripts dynamically
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Retrieve an instance of Firebase Messaging
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

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
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  
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

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Naye Zingoo Project ke credentials se initialize kiya gaya hai
firebase.initializeApp({
    apiKey: "AIzaSyD9dd-bAdi-bXicIUp4THO0VGExzPn3FsI",
    authDomain: "zingoo-ae309.firebaseapp.com",
    databaseURL: "https://zingoo-ae309-default-rtdb.firebaseio.com",
    projectId: "zingoo-ae309",
    storageBucket: "zingoo-ae309.firebasestorage.app",
    messagingSenderId: "276852537232",
    appId: "1:276852537232:web:6b345eb808a5afa1b4e515"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || 'https://api.dicebear.com/7.x/avataaars/svg?seed=zingoo',
    data: payload.data
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

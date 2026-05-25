importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCYujgtEDDfvnJePhDKiKm9DkftoGAq9t8",
    authDomain: "benchtopinnovations12.firebaseapp.com",
    databaseURL: "https://benchtopinnovations12-default-rtdb.firebaseio.com",
    projectId: "benchtopinnovations12",
    storageBucket: "benchtopinnovations12.firebasestorage.app",
    messagingSenderId: "113274194106",
    appId: "1:113274194106:web:c2548c12c1ea20c5b69a83"
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

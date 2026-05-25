const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration to allow your frontend
app.use(cors());
app.use(express.json());

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://benchtopinnovations12-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Admin Initialized Successfully");
} catch (error) {
    console.error("Firebase Admin Init Error:", error.message);
}

// ============================================================
// 1. LIVEKIT TOKEN GENERATION (Common for Video & Audio)
// ============================================================
app.get('/get-token', async (req, res) => {
    const room = req.query.room;
    const identity = req.query.identity;

    if (!room || !identity) {
        return res.status(400).json({ error: 'Missing room or identity' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Server API keys not configured' });
    }

    try {
        const at = new AccessToken(apiKey, apiSecret, {
            identity: identity,
            ttl: '2h'
        });

        at.addGrant({ 
            roomJoin: true, 
            room: room, 
            canPublish: true, 
            canSubscribe: true 
        });

        const token = await at.toJwt();
        res.json({ token: token });
    } catch (error) {
        res.status(500).json({ error: 'Token generation failed' });
    }
});

// ============================================================
// 2. NOTIFICATION: VIDEO LIVE START (For live.html)
// ============================================================
app.post('/notify-live', async (req, res) => {
    const { hostName, hostAvatar, roomTitle } = req.body;

    try {
        const db = admin.database();
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        
        const tokens = [];
        for (let key in users) {
            if (users[key].fcmToken && users[key].name !== hostName) {
                tokens.push(users[key].fcmToken);
            }
        }

        if (tokens.length === 0) return res.json({ message: "No tokens found" });

        const message = {
            notification: {
                title: `${hostName} is LIVE! 🔴`,
                body: `Vibe with me: ${roomTitle || 'Live Stream'}`,
            },
            data: {
                type: "live_video",
                screen: "live.html"
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ success: true, sent: response.successCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 3. NOTIFICATION: AUDIO ROOM START (For audio.html)
// ============================================================
app.post('/notify-audio', async (req, res) => {
    const { hostName, roomName } = req.body;

    try {
        const db = admin.database();
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        
        const tokens = [];
        for (let key in users) {
            if (users[key].fcmToken && users[key].name !== hostName) {
                tokens.push(users[key].fcmToken);
            }
        }

        if (tokens.length === 0) return res.json({ message: "No tokens found" });

        const message = {
            notification: {
                title: `Audio Party Started! 🎙️`,
                body: `${hostName} invited you to join: ${roomName}`,
            },
            data: {
                type: "audio_room",
                screen: "audio.html"
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        res.json({ success: true, sent: response.successCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 4. NOTIFICATION: PRIVATE CHAT (For home.html)
// ============================================================
app.post('/notify-chat', async (req, res) => {
    const { senderName, receiverName, messageText } = req.body;

    try {
        const db = admin.database();
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();

        let targetToken = null;
        for (let key in users) {
            if (users[key].name === receiverName) {
                targetToken = users[key].fcmToken;
                break;
            }
        }

        if (!targetToken) return res.json({ message: "Receiver token not found" });

        const message = {
            notification: {
                title: `New Message from ${senderName} 💬`,
                body: messageText.length > 50 ? messageText.substring(0, 47) + "..." : messageText,
            },
            data: {
                type: "chat_msg",
                sender: senderName
            },
            token: targetToken
        };

        await admin.messaging().send(message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root path status check
app.get('/', (req, res) => {
    res.send('Zingoo Multi-Notification Server is Running Live.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

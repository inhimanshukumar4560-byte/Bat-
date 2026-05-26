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
        // Naye Zingoo Database URL ke sath connect kiya gaya hai
        databaseURL: "https://zingoo-ae309-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Admin Initialized Successfully");
} catch (error) {
    console.error("Firebase Admin Init Error:", error.message);
}

// ============================================================
// ONESIGNAL CONFIGURATION
// ============================================================
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

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
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ["Subscribed Users"],
                headings: { en: `${hostName} is LIVE! 🔴` },
                contents: { en: `Vibe with me: ${roomTitle || 'Live Stream'}` },
                data: {
                    type: "live_video",
                    screen: "live.html"
                }
            })
        });

        const resData = await response.json();
        res.json({ success: true, response: resData });
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
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ["Subscribed Users"],
                headings: { en: `Audio Party Started! 🎙️` },
                contents: { en: `${hostName} invited you to join: ${roomName}` },
                data: {
                    type: "audio_room",
                    screen: "audio.html"
                }
            })
        });

        const resData = await response.json();
        res.json({ success: true, response: resData });
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
        const truncatedMsg = messageText.length > 50 ? messageText.substring(0, 47) + "..." : messageText;

        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Basic ${ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_aliases: {
                    external_id: [receiverName]
                },
                target_channel: "push",
                headings: { en: `New Message from ${senderName} 💬` },
                contents: { en: truncatedMsg },
                data: {
                    type: "chat_msg",
                    sender: senderName
                }
            })
        });

        const resData = await response.json();
        res.json({ success: true, response: resData });
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

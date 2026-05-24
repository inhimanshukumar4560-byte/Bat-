const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Isse sirf aapki website se requests allow hongi
const allowedOrigins = [
  'https://zingoo.online',
  'https://www.zingoo.online',
  'http://127.0.0.1:5500' // Local testing ke liye (Optional)
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

// Token generation API endpoint
app.get('/get-token', async (req, res) => {
  const room = req.query.room;
  const identity = req.query.identity;

  // Parameters validation
  if (!room || !identity) {
    return res.status(400).json({ error: 'Missing "room" or "identity" query parameter.' });
  }

  // Render me set kiye gaye environment variables ko read karna
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Server configuration error: LiveKit API keys not found.' });
  }

  try {
    // LiveKit server SDK se token generate karna
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      ttl: '2h' // Token ki validity (2 ghante)
    });

    // permissions set karna (join, publish video/audio, subscribe)
    at.addGrant({ 
      roomJoin: true, 
      room: room, 
      canPublish: true, 
      canSubscribe: true 
    });

    const token = await at.toJwt();
    res.json({ token: token });

  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Root path par server status check karne ke liye helper endpoint
app.get('/', (req, res) => {
  res.send('Zingoo LiveKit Token Server is up and running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

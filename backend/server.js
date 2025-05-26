require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

const puppeteer = require('puppeteer');


const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Spotify API wrapper
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });
  
  // 1) Redirect user to Spotify's authorization page
  app.get('/auth/login', (req, res) => {
    const scopes = ['playlist-modify-private'];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
  });

  // 2) Spotify will redirect here with ?code=...
    app.get('/auth/callback', async (req, res) => {
        const { code, error } = req.query;
        if (error) return res.status(400).send(`Callback Error: ${error}`);
        try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;
    
        // Save tokens on the Spotify API client for future calls
        spotifyApi.setAccessToken(access_token);
        spotifyApi.setRefreshToken(refresh_token);
    
        // For now, just return the tokens as JSON so you can inspect them
        res.json({ access_token, refresh_token, expires_in });
        } catch (err) {
        console.error('Error getting Tokens:', err);
        res.status(500).send('Failed to get tokens');
        }
    });
  
  

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// POST /api/scrape
app.post('/api/scrape', async (req, res) => {
    // for now, just echo back a fake track list
    // later we’ll plug in Puppeteer to grab from Amazon Music
    const { url } = req.body;
    console.log('Scraping playlist URL:', url);
    res.json([
      { title: 'Track One', artist: 'Artist A' },
      { title: 'Track Two', artist: 'Artist B' },
    ]);
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
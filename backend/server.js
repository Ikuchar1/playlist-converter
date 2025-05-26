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

app.get('/test', (req, res) => {
    res.send('🎉 Backend is up and running!');
});
  
  

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).send('Playlist URL is required');
  
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });
  
      // Select all divs that hold track info in their aria-label
      const tracks = await page.$$eval('div.a11y[aria-label]', divs =>
        divs.map(div => {
          // aria-label = "Title, Artist, [maybe repeated]"
          const parts = div.getAttribute('aria-label').split(',').map(s => s.trim());
          return {
            title: parts[0] || 'Unknown Title',
            artist: parts[1] || 'Unknown Artist',
          };
        })
      );
  
      return res.json(tracks);
    } catch (err) {
      console.error('Scrape error:', err);
      return res.status(500).send('Failed to scrape playlist');
    } finally {
      if (browser) await browser.close();
    }
  });

// POST /api/sync
app.post('/api/sync', async (req, res) => {
    const { tracks, playlistName, access_token, refresh_token } = req.body;
  
    if (!access_token || !refresh_token) {
      return res.status(400).send('Missing Spotify access or refresh token');
    }
  
    // Re-hydrate the client for this request
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
  
    try {
      // 1) Get current user’s Spotify ID
      const me = await spotifyApi.getMe();
      const userId = me.body.id;
  
      // 2) Create a new private playlist
      const created = await spotifyApi.createPlaylist(userId, playlistName || 'Converted Playlist', {
        public: false,
      });
      const playlistId = created.body.id;
  
      // 3) Search & collect URIs
      const uris = [];
      for (const { title, artist } of tracks) {
        const result = await spotifyApi.searchTracks(`track:${title} artist:${artist}`, { limit: 1 });
        if (result.body.tracks.items.length) {
          uris.push(result.body.tracks.items[0].uri);
        }
      }
  
      // 4) Add tracks in batches of 100
      for (let i = 0; i < uris.length; i += 100) {
        await spotifyApi.addTracksToPlaylist(playlistId, uris.slice(i, i + 100));
      }
  
      res.json({ added: uris.length, total: tracks.length });
    } catch (err) {
      console.error('Sync Error:', err);
      res.status(500).send('Failed to sync to Spotify');
    }
  });
  
  
  
  
  
  

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
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
  
  
  
  

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
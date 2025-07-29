require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { scrapeArtistRevenue } = require('./spotify-scraper');
const { searchArtists, getArtistInfo, getTrendingArtists, extractArtistIdFromUrl } = require('./spotify-api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Fonction pour extraire l'ID artiste de l'URL Spotify
function extractArtistId(spotifyUrl) {
  // Patterns possibles:
  // https://open.spotify.com/artist/4YRxDV8wJFPHPTeXepOstw
  // https://open.spotify.com/artist/4YRxDV8wJFPHPTeXepOstw?si=...
  const match = spotifyUrl.match(/\/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Fonction pour construire l'URL Spotify
function buildSpotifyUrl(artistId) {
  return `https://open.spotify.com/artist/${artistId}`;
}

// Route principale pour scraper un artiste
app.post('/api/artist-revenue', async (req, res) => {
  try {
    const { artistUrl, artistId } = req.body;
    
    console.log('📊 Nouvelle demande de scraping:', { artistUrl, artistId });
    
    if (!artistUrl && !artistId) {
      return res.status(400).json({ 
        error: 'Veuillez fournir soit artistUrl soit artistId' 
      });
    }
    
    // Construire l'URL finale
    let finalUrl;
    if (artistId) {
      finalUrl = buildSpotifyUrl(artistId);
    } else {
      const extractedId = extractArtistId(artistUrl);
      if (!extractedId) {
        return res.status(400).json({ 
          error: 'URL Spotify invalide. Format attendu: https://open.spotify.com/artist/...' 
        });
      }
      finalUrl = buildSpotifyUrl(extractedId);
    }
    
    console.log(`🎯 Scraping: ${finalUrl}`);
    
    // Lancer le scraping avec ton algorithme
    const startTime = Date.now();
    const result = await scrapeArtistRevenue(finalUrl);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Scraping terminé en ${duration}ms`);
    
    // Réponse avec tes données + métadonnées
    res.json({
      success: true,
      duration: `${duration}ms`,
      url: finalUrl,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur scraping:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route pour rechercher des artistes via l'API Spotify
app.get('/api/search-artist', async (req, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Paramètre de recherche "q" requis' 
      });
    }
    
    const artists = await searchArtists(q, parseInt(limit) || 10);
    
    res.json({
      success: true,
      query: q,
      artists: artists
    });
    
  } catch (error) {
    console.error('❌ Erreur recherche artiste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour obtenir les informations détaillées d'un artiste
app.get('/api/artist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const artistInfo = await getArtistInfo(id);
    
    res.json({
      success: true,
      artist: artistInfo
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération artiste:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour obtenir les artistes tendance
app.get('/api/trending-artists', async (req, res) => {
  try {
    const trendingArtists = await getTrendingArtists();
    
    res.json({
      success: true,
      artists: trendingArtists
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération tendances:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Spotify Revenue Estimator API',
    timestamp: new Date().toISOString()
  });
});

// Route d'info sur l'API
app.get('/', (req, res) => {
  res.json({
    service: 'Spotify Revenue Estimator API',
    version: '1.0.0',
    endpoints: {
      'POST /api/artist-revenue': 'Calculer les revenus d\'un artiste',
      'GET /api/search-artist?q=nom': 'Rechercher des artistes par nom',
      'GET /api/artist/:id': 'Informations détaillées d\'un artiste',
      'GET /api/trending-artists': 'Artistes populaires du moment',
      'GET /health': 'Status de l\'API'
    },
    algorithm: 'Algorithme intelligent avec analyse du top 5 + pondération'
  });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('💥 Erreur non gérée:', error);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Spotify Revenue Estimator API démarrée sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
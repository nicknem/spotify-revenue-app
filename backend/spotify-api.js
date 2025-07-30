const SpotifyWebApi = require('spotify-web-api-node');

// Configuration de l'API Spotify
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token d'authentification (Client Credentials flow)
let tokenExpirationTime = 0;

// Cache ultra-rapide pour l'autocomplete (2 minutes seulement)
const autocompleteCache = new Map();
const AUTOCOMPLETE_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Nettoyage automatique du cache autocomplete toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, cached] of autocompleteCache.entries()) {
    if (now - cached.timestamp >= AUTOCOMPLETE_CACHE_TTL) {
      autocompleteCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache autocomplete nettoyé: ${cleaned} entrées supprimées`);
  }
}, 5 * 60 * 1000); // Toutes les 5 minutes

/**
 * Filtre les artistes pour ne garder que ceux qui semblent français
 * @param {Array} artists - Liste d'artistes à filtrer
 * @returns {Array} Artistes filtrés
 */
function filterFrenchArtists(artists) {
  // Genres typiquement français
  const frenchGenres = [
    'chanson française', 'chanson francaise', 'french pop', 'rap français', 'rap francais',
    'variété française', 'variete francaise', 'french rock', 'french indie', 'nouvelle chanson française',
    'electro français', 'electro francais', 'french electronic', 'french house', 'french hip hop',
    'yé-yé', 'ye-ye', 'varieté', 'variete', 'zouk', 'kompa', 'raï', 'rai'
  ];
  
  // Artistes français populaires connus (liste curatée)
  const knownFrenchArtists = [
    'stromae', 'angèle', 'angele', 'aya nakamura', 'jul', 'sch', 'pnl', 'ninho',
    'dadju', 'maître gims', 'maitre gims', 'bigflo oli', 'bigflo & oli', 'soprano',
    'nekfeu', 'orelsan', 'damso', 'lomepal', 'gradur', 'booba', 'kaaris',
    'christophe maé', 'christophe mae', 'patrick bruel', 'calogero', 'zazie',
    'mylène farmer', 'mylene farmer', 'céline dion', 'celine dion', 'indila',
    'louane', 'vianney', 'kendji girac', 'slimane', 'amir', 'claudio capéo',
    'claudio capeo', 'thomas dutronc', 'clara luciani', 'pomme', 'suzane',
    'lous and the yakuza', 'grand corps malade', 'mcfly carlito', 'mcfly & carlito'
  ];
  
  return artists.filter(artist => {
    // Vérifier par nom d'artiste (liste curatée)
    const artistNameLower = artist.name.toLowerCase();
    if (knownFrenchArtists.some(french => artistNameLower.includes(french) || french.includes(artistNameLower))) {
      return true;
    }
    
    // Vérifier par genres
    if (artist.genres && artist.genres.length > 0) {
      const artistGenres = artist.genres.map(g => g.toLowerCase());
      if (artistGenres.some(genre => 
        frenchGenres.some(frenchGenre => genre.includes(frenchGenre) || frenchGenre.includes(genre))
      )) {
        return true;
      }
    }
    
    // Si l'artiste a une très haute popularité en France mais faible globalement,
    // c'est probablement un artiste français/francophone
    if (artist.popularity > 60 && artist.followers < 1000000) {
      return true;
    }
    
    return false;
  });
}

/**
 * Obtenir un token d'accès via Client Credentials Flow
 * Ce flow est parfait pour nos besoins (recherche publique, pas d'accès utilisateur)
 */
async function getAccessToken() {
  const now = Date.now();
  
  // Si le token est encore valide, le réutiliser
  if (now < tokenExpirationTime) {
    return;
  }
  
  try {
    console.log('🔑 Demande de nouveau token Spotify...');
    const data = await spotifyApi.clientCredentialsGrant();
    
    // Configurer le token et sa durée de vie
    spotifyApi.setAccessToken(data.body['access_token']);
    tokenExpirationTime = now + (data.body['expires_in'] * 1000) - (5 * 60 * 1000); // -5min de sécurité
    
    console.log(`✅ Token Spotify obtenu, expire dans ${data.body['expires_in']} secondes`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'obtention du token Spotify:', error);
    throw new Error('Impossible de s\'authentifier avec l\'API Spotify');
  }
}

/**
 * Rechercher des artistes par nom
 * @param {string} query - Nom de l'artiste à rechercher
 * @param {number} limit - Nombre de résultats (défaut: 10)
 * @param {string} locale - Locale utilisateur (ex: 'fr', 'en')
 * @param {boolean} localizedOnly - Si true, filtre pour artistes locaux
 * @returns {Array} Liste d'artistes avec leurs informations
 */
async function searchArtists(query, limit = 10, locale = 'fr', localizedOnly = false) {
  // Normaliser la requête pour le cache (inclure locale et filtrage)
  const cacheKey = `${query.toLowerCase().trim()}_${limit}_${locale}_${localizedOnly}`;
  
  // Vérifier le cache en premier (réponse instantanée)
  const cached = autocompleteCache.get(cacheKey);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < AUTOCOMPLETE_CACHE_TTL) {
      console.log(`⚡ Autocomplete cache hit pour "${query}" (${locale})`);
      return cached.data;
    } else {
      autocompleteCache.delete(cacheKey);
    }
  }
  
  await getAccessToken();
  
  try {
    console.log(`🔍 Recherche Spotify (nouvelle): "${query}" (locale: ${locale}, localized: ${localizedOnly})`);
    
    // Définir le marché selon la locale
    const market = locale === 'fr' ? 'FR' : locale === 'es' ? 'ES' : locale === 'de' ? 'DE' : 'US';
    
    const results = await spotifyApi.searchArtists(query, { 
      limit: Math.min(limit, localizedOnly ? 15 : 10), // Plus de résultats si filtrage pour compenser
      market: market
    });
    
    let artists = results.body.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      url: artist.external_urls.spotify,
      image: artist.images.length > 0 ? artist.images[0].url : null,
      followers: artist.followers.total,
      popularity: artist.popularity,
      genres: artist.genres
    }));

    // Appliquer le filtrage par locale si demandé
    if (localizedOnly && locale === 'fr') {
      artists = filterFrenchArtists(artists);
      artists = artists.slice(0, limit); // Réduire au nombre demandé après filtrage
    }
    
    // Sauvegarder en cache pour les prochaines requêtes identiques
    autocompleteCache.set(cacheKey, {
      data: artists,
      timestamp: Date.now()
    });
    
    console.log(`✅ ${artists.length} artistes trouvés et cachés pour "${query}"`);
    return artists;
    
  } catch (error) {
    console.error('❌ Erreur recherche Spotify:', error);
    throw new Error('Erreur lors de la recherche d\'artistes');
  }
}

/**
 * Obtenir les informations détaillées d'un artiste par son ID
 * @param {string} artistId - ID Spotify de l'artiste
 * @returns {Object} Informations détaillées de l'artiste
 */
async function getArtistInfo(artistId) {
  await getAccessToken();
  
  try {
    console.log(`📊 Récupération infos artiste: ${artistId}`);
    
    const artist = await spotifyApi.getArtist(artistId);
    const topTracks = await spotifyApi.getArtistTopTracks(artistId, 'FR');
    
    return {
      id: artist.body.id,
      name: artist.body.name,
      url: artist.body.external_urls.spotify,
      image: artist.body.images.length > 0 ? artist.body.images[0].url : null,
      followers: artist.body.followers.total,
      popularity: artist.body.popularity,
      genres: artist.body.genres,
      topTracks: topTracks.body.tracks.slice(0, 5).map(track => ({
        name: track.name,
        popularity: track.popularity,
        preview_url: track.preview_url
      }))
    };
    
  } catch (error) {
    console.error('❌ Erreur récupération artiste:', error);
    throw new Error('Impossible de récupérer les informations de l\'artiste');
  }
}

/**
 * Obtenir les artistes populaires du moment
 * On utilise une playlist populaire comme proxy
 * @returns {Array} Liste des artistes tendance
 */
async function getTrendingArtists() {
  await getAccessToken();
  
  try {
    console.log('🔥 Récupération artistes tendance...');
    
    // Recherche d'artistes populaires via différentes requêtes
    const trendingQueries = ['rap français', 'pop française', 'electro', 'rock'];
    const allArtists = [];
    
    for (const query of trendingQueries) {
      const results = await searchArtists(query, 5);
      allArtists.push(...results);
    }
    
    // Dédoublonner et trier par popularité
    const uniqueArtists = allArtists
      .filter((artist, index, self) => 
        index === self.findIndex(a => a.id === artist.id)
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12); // Top 12
    
    console.log(`✅ ${uniqueArtists.length} artistes tendance récupérés`);
    return uniqueArtists;
    
  } catch (error) {
    console.error('❌ Erreur récupération tendances:', error);
    throw new Error('Impossible de récupérer les artistes tendance');
  }
}

/**
 * Extraire l'ID artiste d'une URL Spotify
 * @param {string} url - URL Spotify de l'artiste
 * @returns {string|null} ID de l'artiste ou null si invalide
 */
function extractArtistIdFromUrl(url) {
  const match = url.match(/\/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

module.exports = {
  searchArtists,
  getArtistInfo,
  getTrendingArtists,
  extractArtistIdFromUrl
};
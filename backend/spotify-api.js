const SpotifyWebApi = require('spotify-web-api-node');

// Configuration de l'API Spotify
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token d'authentification (Client Credentials flow)
let tokenExpirationTime = 0;

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
 * @returns {Array} Liste d'artistes avec leurs informations
 */
async function searchArtists(query, limit = 10) {
  await getAccessToken();
  
  try {
    console.log(`🔍 Recherche Spotify: "${query}"`);
    
    const results = await spotifyApi.searchArtists(query, { 
      limit: Math.min(limit, 50), // Limite API Spotify: 50
      market: 'FR' // Marché français pour la pertinence
    });
    
    const artists = results.body.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      url: artist.external_urls.spotify,
      image: artist.images.length > 0 ? artist.images[0].url : null,
      followers: artist.followers.total,
      popularity: artist.popularity,
      genres: artist.genres
    }));
    
    console.log(`✅ ${artists.length} artistes trouvés pour "${query}"`);
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
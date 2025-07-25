/**
 * API Service
 * 
 * Ce fichier contient toutes les fonctions pour communiquer avec notre backend Express.js.
 * Le backend utilise Puppeteer pour scraper les données Spotify et calculer les revenus.
 * 
 * Configuration:
 * - Backend sur le port 3001 (voir backend/server.js)
 * - Frontend sur le port 5173 (dev) ou autre en production
 * - CORS activé côté backend pour permettre les requêtes cross-origin
 */

// Configuration de l'URL de base de notre API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fonction utilitaire pour faire des requêtes HTTP avec gestion d'erreur
 * 
 * @param {string} url - L'URL complète de l'endpoint
 * @param {object} options - Options fetch() (method, headers, body, etc.)
 * @returns {Promise} - Promise qui résout avec les données JSON ou rejette avec une erreur
 */
async function apiRequest(url, options = {}) {
  try {
    console.log(`🌐 Requête API: ${options.method || 'GET'} ${url}`);
    
    // Faire la requête HTTP avec fetch()
    const response = await fetch(url, {
      // Headers par défaut
      headers: {
        'Content-Type': 'application/json',
        ...options.headers, // Permettre de surcharger les headers si nécessaire
      },
      ...options, // Étaler toutes les autres options (method, body, etc.)
    });

    // Vérifier si la requête a réussi (status 200-299)
    if (!response.ok) {
      // Si la réponse contient du JSON avec un message d'erreur, l'utiliser
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Si on ne peut pas parser le JSON, garder le message générique
      }
      
      throw new Error(errorMessage);
    }

    // Parser la réponse JSON
    const data = await response.json();
    console.log('✅ Réponse API reçue:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    // Améliorer les messages d'erreur pour l'utilisateur
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
    }
    
    // Relancer l'erreur pour que le composant puisse la gérer
    throw error;
  }
}

/**
 * Analyser les revenus d'un artiste à partir de son URL Spotify
 * 
 * Cette fonction envoie l'URL de l'artiste à notre backend qui va :
 * 1. Extraire l'ID artiste de l'URL
 * 2. Scraper la page Spotify avec Puppeteer
 * 3. Récupérer les auditeurs mensuels
 * 4. Analyser le top 5 des titres
 * 5. Calculer les revenus estimés avec notre algorithme
 * 
 * @param {string} artistUrl - URL complète de l'artiste Spotify
 * @returns {Promise<object>} - Objet contenant les résultats d'analyse
 */
export async function analyzeArtistRevenue(artistUrl) {
  console.log(`🎵 Analyse des revenus pour: ${artistUrl}`);
  
  return await apiRequest(`${API_BASE_URL}/api/artist-revenue`, {
    method: 'POST',
    body: JSON.stringify({
      artistUrl: artistUrl, // Envoyer l'URL dans le body de la requête
    }),
  });
}

/**
 * Rechercher des artistes par nom via l'API Spotify
 * 
 * @param {string} query - Nom de l'artiste à rechercher
 * @param {number} limit - Nombre de résultats (défaut: 10)
 * @returns {Promise<Array>} - Liste d'artistes avec photos et infos
 */
export async function searchArtist(query, limit = 10) {
  console.log(`🔍 Recherche d'artiste: ${query}`);
  
  const response = await apiRequest(`${API_BASE_URL}/api/search-artist?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.artists || [];
}

/**
 * Obtenir les informations détaillées d'un artiste
 * 
 * @param {string} artistId - ID Spotify de l'artiste
 * @returns {Promise<object>} - Informations détaillées avec photo
 */
export async function getArtistInfo(artistId) {
  console.log(`📊 Récupération infos artiste: ${artistId}`);
  
  const response = await apiRequest(`${API_BASE_URL}/api/artist/${artistId}`);
  return response.artist;
}

/**
 * Obtenir les artistes populaires du moment
 * 
 * @returns {Promise<Array>} - Liste des artistes tendance avec photos
 */
export async function getTrendingArtists() {
  console.log(`🔥 Récupération artistes tendance...`);
  
  const response = await apiRequest(`${API_BASE_URL}/api/trending-artists`);
  return response.artists || [];
}

/**
 * Vérifier le statut de santé de l'API backend
 * 
 * Utile pour s'assurer que le backend est opérationnel avant de faire
 * des requêtes plus complexes.
 * 
 * @returns {Promise<object>} - Statut du serveur
 */
export async function checkHealth() {
  return await apiRequest(`${API_BASE_URL}/health`);
}

/**
 * Récupérer les informations sur l'API (endpoints disponibles, version, etc.)
 * 
 * @returns {Promise<object>} - Informations sur l'API
 */
export async function getApiInfo() {
  return await apiRequest(`${API_BASE_URL}/`);
}

/**
 * Configuration et constantes exportées pour utilisation dans les composants
 */
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  DEFAULT_TIMEOUT: 30000, // 30 secondes (le scraping peut prendre du temps)
  RETRY_ATTEMPTS: 3,
};

/**
 * Messages d'erreur standardisés pour l'interface utilisateur
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  INVALID_URL: 'URL Spotify invalide. Vérifiez le format de l\'URL.',
  SCRAPING_FAILED: 'Impossible d\'analyser cette page Spotify. L\'artiste existe-t-il ?',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  TIMEOUT: 'L\'analyse prend trop de temps. Veuillez réessayer.',
};
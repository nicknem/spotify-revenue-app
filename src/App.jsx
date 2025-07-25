import { useState } from 'react'
import './App.css'
import ArtistAutocomplete from './components/ArtistAutocomplete'
import RevenueResults from './components/RevenueResults'
import { analyzeArtistRevenue, ERROR_MESSAGES } from './services/api'

/**
 * App Component - Composant principal de l'application
 * 
 * Cette application permet d'estimer les revenus d'artistes Spotify en :
 * 1. Acceptant une URL d'artiste Spotify
 * 2. Envoyant cette URL à notre backend pour scraping
 * 3. Affichant les résultats d'analyse des revenus
 * 
 * États de l'application :
 * - 'input' : Affichage du formulaire de saisie URL
 * - 'loading' : Analyse en cours
 * - 'results' : Affichage des résultats
 * - 'error' : Affichage d'une erreur
 */
function App() {
  // État pour gérer l'étape actuelle de l'application
  const [currentView, setCurrentView] = useState('input'); // 'input' | 'loading' | 'results' | 'error'
  
  // État pour stocker les résultats de l'analyse
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // État pour stocker le message d'erreur éventuel
  const [errorMessage, setErrorMessage] = useState('');
  
  // État booléen pour indiquer si une requête est en cours
  const [isLoading, setIsLoading] = useState(false);
  
  // État pour les messages de progression
  const [progressMessage, setProgressMessage] = useState('');

  /**
   * Fonction appelée quand l'utilisateur sélectionne un artiste
   * 
   * @param {Object} artist - Artiste sélectionné avec URL ou nom
   */
  const handleAnalyzeArtist = async (artist) => {
    // Utiliser l'URL de l'artiste (soit depuis l'autocomplete, soit directement saisie)
    const artistUrl = artist.url || `https://open.spotify.com/artist/${artist.id}`;
    
    console.log(`🚀 Début de l'analyse pour: ${artist.name || 'Artiste'} (${artistUrl})`);
    
    // Réinitialiser les états précédents
    setErrorMessage('');
    setAnalysisResults(null);
    setIsLoading(true);
    setCurrentView('loading');
    setProgressMessage('🔍 Connexion à Spotify...');

    try {
      // Simulation de progression pour l'UX
      setTimeout(() => setProgressMessage('📊 Analyse des auditeurs mensuels...'), 1000);
      setTimeout(() => setProgressMessage('🎵 Scraping des titres populaires...'), 3000);
      setTimeout(() => setProgressMessage('💰 Calcul des revenus estimés...'), 5000);
      
      // Appeler notre API backend pour analyser l'artiste
      // Cette requête peut prendre 10-30 secondes car elle fait du scraping
      const results = await analyzeArtistRevenue(artistUrl);
      
      console.log('✅ Analyse terminée avec succès:', results);
      
      // Si l'analyse réussit, stocker les résultats et changer la vue
      setAnalysisResults(results); // Le backend renvoie { success: true, data: {...}, timestamp, duration }
      setCurrentView('results');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse:', error);
      
      // Définir un message d'erreur user-friendly basé sur le type d'erreur
      let userFriendlyMessage = ERROR_MESSAGES.SERVER_ERROR;
      
      if (error.message.includes('contacter le serveur')) {
        userFriendlyMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error.message.includes('invalide')) {
        userFriendlyMessage = ERROR_MESSAGES.INVALID_URL;
      } else if (error.message.includes('impossible')) {
        userFriendlyMessage = ERROR_MESSAGES.SCRAPING_FAILED;
      } else if (error.message.includes('timeout')) {
        userFriendlyMessage = ERROR_MESSAGES.TIMEOUT;
      }
      
      setErrorMessage(userFriendlyMessage);
      setCurrentView('error');
      
    } finally {
      // Dans tous les cas, arrêter l'indicateur de chargement
      setIsLoading(false);
    }
  };

  /**
   * Fonction pour revenir à l'écran de saisie (reset)
   * Appelée depuis le composant RevenueResults ou l'écran d'erreur
   */
  const handleReset = () => {
    console.log('🔄 Reset de l\'application');
    
    setCurrentView('input');
    setAnalysisResults(null);
    setErrorMessage('');
    setIsLoading(false);
  };

  /**
   * Rendu conditionnel basé sur l'état actuel de l'application
   */
  return (
    <div className="app">
      {/* Conteneur principal avec classe CSS pour le styling */}
      <div className="app-container">
        
        {/* Vue : Saisie avec autocomplete (état initial) */}
        {currentView === 'input' && (
          <>
            {/* Spotify-inspired logo */}
            <div className="spotify-logo">
              <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="62" cy="62" r="62" fill="#1DB954"/>
                <path d="M88.5 49.7C77.1 44.3 62.4 43.1 47.7 46.2C45.9 46.6 44.6 48.3 45 50.1C45.4 51.9 47.1 53.2 48.9 52.8C61.5 50.2 74.2 51.2 83.7 55.7C85.4 56.6 87.4 55.9 88.3 54.2C89.2 52.5 88.5 50.5 86.8 49.6L88.5 49.7ZM87.2 62.4C86.5 60.9 84.7 60.3 83.2 61C74.8 65.4 59.4 66.9 47.1 63.1C45.5 62.6 43.8 63.4 43.3 65C42.8 66.6 43.6 68.3 45.2 68.8C59.2 73.2 75.9 71.5 85.6 66.4C87.1 65.7 87.7 63.9 87 62.4H87.2ZM82.6 74.6C82.1 73.4 80.6 73 79.4 73.5C72.1 77.3 58.9 78.4 47.7 75.4C46.4 75 45 75.7 44.6 77C44.2 78.3 44.9 79.7 46.2 80.1C58.5 83.4 72.8 82.2 81.2 77.8C82.4 77.3 82.8 75.8 82.3 74.6H82.6Z" fill="black"/>
              </svg>
            </div>
            
            {/* Main application title */}
            <h1>Les streams ça paye ?</h1>
            
            {/* Subtitle explaining what the app does */}
            <p className="subtitle">
              Découvrez combien gagnent vos artistes préférés sur Spotify
            </p>
            
            <ArtistAutocomplete 
              onSelectArtist={handleAnalyzeArtist}
              loading={isLoading}
            />
          </>
        )}
        
        {/* Vue : Chargement pendant l'analyse */}
        {currentView === 'loading' && (
          <div className="loading-view">
            <div className="loading-spinner">⏳</div>
            <h2>Analyse en cours...</h2>
            <p className="progress-message">{progressMessage}</p>
            <div className="loading-steps">
              <div className="loading-step">🔍 Accès à la page artiste</div>
              <div className="loading-step">👥 Récupération des auditeurs mensuels</div>
              <div className="loading-step">🎵 Analyse du top 5 des titres</div>
              <div className="loading-step">💰 Calcul des revenus estimés</div>
            </div>
            <p className="loading-note">
              Cette opération prend maintenant ~4-6 secondes (optimisé!)
            </p>
          </div>
        )}
        
        {/* Vue : Résultats de l'analyse */}
        {currentView === 'results' && (
          <RevenueResults 
            results={analysisResults}
            onReset={handleReset}
          />
        )}
        
        {/* Vue : Erreur */}
        {currentView === 'error' && (
          <div className="error-view">
            <div className="error-icon">❌</div>
            <h2>Erreur lors de l'analyse</h2>
            <p className="error-message">{errorMessage}</p>
            
            <div className="error-actions">
              <button onClick={handleReset} className="retry-button">
                🔄 Essayer une autre URL
              </button>
            </div>
            
            <div className="error-help">
              <h3>💡 Conseils de dépannage</h3>
              <ul>
                <li>Vérifiez que le backend est démarré sur le port 3001</li>
                <li>Assurez-vous que l'URL Spotify est correcte et accessible</li>
                <li>L'artiste doit avoir une page publique sur Spotify</li>
                <li>Réessayez dans quelques instants</li>
              </ul>
            </div>
          </div>
        )}
        
      </div>
      
      {/* Footer avec informations sur l'app */}
      <footer className="app-footer">
        <p>
          🎵 Spotify Revenue Estimator - Analyse des revenus par scraping web
        </p>
        <p className="footer-note">
          Données estimatives à des fins informatives uniquement
        </p>
      </footer>
    </div>
  )
}

export default App

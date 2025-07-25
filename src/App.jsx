import { useState } from 'react'
import './App.css'
import ArtistInput from './components/ArtistInput'
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
   * Fonction appelée quand l'utilisateur soumet une URL d'artiste
   * 
   * @param {string} artistUrl - URL de l'artiste Spotify à analyser
   */
  const handleAnalyzeArtist = async (artistUrl) => {
    console.log(`🚀 Début de l'analyse pour: ${artistUrl}`);
    
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
        
        {/* Vue : Saisie d'URL (état initial) */}
        {currentView === 'input' && (
          <ArtistInput 
            onSubmit={handleAnalyzeArtist}
            loading={isLoading}
          />
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

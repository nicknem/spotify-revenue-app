/**
 * RevenueResults Component
 * 
 * Ce composant affiche les résultats de l'analyse de revenus retournés par notre backend.
 * Les données viennent du scraping web (pas de l'API Spotify officielle).
 * 
 * Données affichées :
 * - Nombre d'auditeurs mensuels (scrapé depuis Spotify)
 * - Streams mensuels estimés (calculé par notre algorithme)
 * - Revenus mensuels estimés (basé sur $0.004 par stream)
 * - Données du top 5 des titres (si disponibles via scraping)
 * - Explication de la méthodologie de calcul
 * 
 * Props:
 * - results: Objet contenant les résultats d'analyse du backend
 * - onReset: Fonction appelée quand l'utilisateur veut analyser un autre artiste
 */
function RevenueResults({ results, onReset }) {
  // Si aucun résultat n'est fourni, ne rien afficher
  if (!results) return null;

  // Déstructuration de l'objet results pour extraire les données nécessaires
  // Cette structure correspond à ce que retourne le backend dans server.js
  const {
    data,               // Contient les données d'analyse de l'artiste
    duration,           // Temps pris pour l'analyse
    timestamp           // Moment où l'analyse a été effectuée
  } = results;
  
  const {
    monthlyListeners,    // Nombre brut d'auditeurs mensuels (scrapé)
    estimates,           // Objet contenant streams, revenue, et ratio calculés
    top5Data,           // Données sur le top 5 des titres (peut être null)
    formatted,          // Nombres pré-formatés pour l'affichage (ex: "1.2M", "500K")
    artistName,         // Nom de l'artiste (si disponible)
    artistImage,        // Image de l'artiste (si disponible)
    url                 // URL Spotify de l'artiste
  } = data;

  return (
    <div className="revenue-results">
      {/* En-tête avec artiste */}
      <div className="results-header" style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <div className="artist-header" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          maxWidth: '400px'
        }}>
          {artistImage && (
            <div className="artist-image" style={{
              width: '80px',
              height: '80px',
              flexShrink: 0
            }}>
              <img src={artistImage} alt={artistName || 'Artiste'} style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '3px solid rgba(29, 185, 84, 0.3)'
              }} />
            </div>
          )}
          <div className="artist-details">
            <h2 style={{margin: '0 0 8px 0'}}>{artistName || 'Artiste analysé'}</h2>
            <p style={{margin: 0, color: '#b3b3b3'}}>Analyse terminée en {duration}</p>
          </div>
        </div>
      </div>

      {/* Métriques principales - revenus en premier */}
      <div className="metrics-grid">
        <div className="metric-item revenue-highlight">
          <span className="metric-label">Revenus mensuels estimés</span>
          <span className="metric-value highlight">€{formatted.revenue}</span>
        </div>
        
        <div className="metric-item secondary">
          <span className="metric-label">Auditeurs mensuels</span>
          <span className="metric-value">{monthlyListeners.toLocaleString()}</span>
        </div>
        
        <div className="metric-item secondary">
          <span className="metric-label">Streams mensuels estimés</span>
          <span className="metric-value">{Math.round(estimates.streams).toLocaleString()}</span>
        </div>
        
      </div>


      {/* Méthodologie simple */}
      <div className="methodology">
        <h4>Méthodologie</h4>
        <p>Données extraites du web Spotify. Revenus basés sur 0,004$/stream + conversion EUR.</p>
        <p>Le titre principal est pondéré à 80% pour réduire les biais. Les estimations sont approximatives.</p>
      </div>

      {/* Bouton reset */}
      <button onClick={onReset} className="reset-button">
        Analyser un autre artiste
      </button>
    </div>
  );
}

export default RevenueResults;
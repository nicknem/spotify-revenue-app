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
  } = data;

  return (
    <div className="revenue-results">
      {/* En-tête minimaliste */}
      <div className="results-header">
        <h2>Analysis complete</h2>
        <p>Processed in {duration}</p>
      </div>

      {/* Métriques principales - revenus en premier */}
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Estimated monthly revenue</span>
          <span className="metric-value highlight">€{formatted.revenue}</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Monthly listeners</span>
          <span className="metric-value">{monthlyListeners.toLocaleString()}</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Estimated monthly streams</span>
          <span className="metric-value">{Math.round(estimates.streams).toLocaleString()}</span>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Streams per listener ratio</span>
          <span className="metric-value">{estimates.ratio.toFixed(2)}</span>
        </div>
      </div>

      {/* Tracks analysés (si disponibles) */}
      {top5Data && top5Data.tracks && top5Data.tracks.length > 0 && (
        <div className="top-tracks">
          <h4>Top {top5Data.tracks.length} tracks analyzed</h4>
          <ul className="track-list">
            {top5Data.tracks.map((streams, index) => (
              <li key={index} className="track-item">
                <span className="track-name">#{index + 1}</span>
                <span className="track-streams">{streams.toLocaleString()} streams</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Méthodologie simple */}
      <div className="methodology">
        <h4>Methodology</h4>
        <p>Data scraped from Spotify Web. Revenue based on $0.004/stream + EUR conversion.</p>
        <p>Top track weighted at 80% to reduce hit bias. Estimations are approximate.</p>
      </div>

      {/* Bouton reset */}
      <button onClick={onReset} className="reset-button">
        Analyze another artist
      </button>
    </div>
  );
}

export default RevenueResults;
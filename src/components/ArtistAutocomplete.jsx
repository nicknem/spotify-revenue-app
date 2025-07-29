import { useState, useEffect, useRef } from 'react';
import { searchArtist, getTrendingArtists } from '../services/api';

function ArtistAutocomplete({ onSelectArtist, loading }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trendingArtists, setTrendingArtists] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Charger les artistes tendance au démarrage
  useEffect(() => {
    const loadTrendingArtists = async () => {
      try {
        const trending = await getTrendingArtists();
        setTrendingArtists(trending.slice(0, 8)); // Limite à 8
      } catch (error) {
        console.error('Erreur chargement tendances:', error);
      }
    };

    loadTrendingArtists();
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const artists = await searchArtist(query, 6);
        setSuggestions(artists);
        setError('');
      } catch (error) {
        console.error('Erreur recherche:', error);
        setError('Erreur de recherche');
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleArtistSelect = (artist) => {
    setQuery(artist.name);
    setShowSuggestions(false);
    onSelectArtist(artist);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // Si c'est une URL Spotify, utiliser directement
      if (query.includes('open.spotify.com/artist/')) {
        onSelectArtist({ url: query.trim(), name: 'Artiste' });
      } else {
        // Sinon, utiliser le premier résultat de recherche
        if (suggestions.length > 0) {
          handleArtistSelect(suggestions[0]);
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const allSuggestions = [...suggestions, ...trendingArtists];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleArtistSelect(allSuggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const renderArtistItem = (artist, index, isSelected) => (
    <div
      key={artist.id}
      className="artist-suggestion"
      onClick={() => handleArtistSelect(artist)}
      style={{
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'center', 
        padding: '10px 16px',
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="artist-avatar-box" style={{
        width: '56px', 
        height: '56px', 
        marginRight: '16px',
        flexShrink: 0
      }}>
        {artist.image ? (
          <img src={artist.image} alt={artist.name} style={{
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            display: 'block',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }} />
        ) : (
          <div className="avatar-placeholder" style={{
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: 'rgba(255, 255, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '20px',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}>🎵</div>
        )}
      </div>
      <div className="artist-info-box" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          margin: 0, 
          fontSize: '15px',
          fontWeight: '600',
          color: '#ffffff'
        }}>{artist.name}</div>
        <div style={{
          margin: 0,
          fontSize: '13px',
          color: '#b3b3b3'
        }}>
          {artist.followers?.toLocaleString()} auditeurs
          {artist.genres?.length > 0 && ` • ${artist.genres[0]}`}
        </div>
      </div>
    </div>
  );

  return (
    <div className="artist-autocomplete">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-group">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Nom d'artiste ou URL Spotify..."
              className="url-input"
              disabled={loading}
            />
            
            {showSuggestions && (query.length >= 2 || trendingArtists.length > 0) && (
              <div className="autocomplete-dropdown" ref={suggestionsRef}>
                
                {/* Résultats de recherche */}
                {query.length >= 2 && (
                  <div className="suggestions-section">
                    {isSearching && (
                      <div className="autocomplete-loading">Recherche...</div>
                    )}
                    
                    {!isSearching && suggestions.length > 0 && (
                      <>
                        <div className="suggestions-header">Résultats</div>
                        {suggestions.map((artist, index) => 
                          renderArtistItem(artist, index, index === selectedIndex)
                        )}
                      </>
                    )}
                    
                    {!isSearching && query.length >= 2 && suggestions.length === 0 && (
                      <div className="no-results">Aucun artiste trouvé</div>
                    )}
                  </div>
                )}
                
                {/* Artistes tendance */}
                {query.length < 2 && trendingArtists.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-header">🔥 Tendances</div>
                    {trendingArtists.map((artist, index) => 
                      renderArtistItem(
                        artist, 
                        suggestions.length + index, 
                        suggestions.length + index === selectedIndex
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="analyze-button"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
}

export default ArtistAutocomplete;
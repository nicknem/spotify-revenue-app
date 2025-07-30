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
      className={`artist-suggestion ${isSelected ? 'selected' : ''}`}
      onClick={() => handleArtistSelect(artist)}
    >
      <div className="artist-suggestion-content">
        <div className="avatar avatar-md">
          {artist.image ? (
            <img src={artist.image} alt={artist.name} />
          ) : (
            <div className="flex items-center justify-center w-full h-full" style={{
              background: 'rgba(255, 255, 255, 0.1)', 
              fontSize: '20px'
            }}>🎵</div>
          )}
        </div>
        <div className="artist-info">
          <div className="artist-name">{artist.name}</div>
          <div className="artist-details-text">
            {artist.followers?.toLocaleString()} auditeurs
            {artist.genres?.length > 0 && ` • ${artist.genres[0]}`}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="search-section flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="Nom d'artiste ou URL Spotify..."
              className="search-input input"
              disabled={loading}
            />
            
            {showSuggestions && (query.length >= 2 || trendingArtists.length > 0) && (
              <div className="autocomplete-dropdown dropdown" ref={suggestionsRef}>
                
                {/* Résultats de recherche */}
                {query.length >= 2 && (
                  <div className="suggestions-section">
                    {isSearching && (
                      <div className="p-md text-center">
                        <span className="text-spotify-light-gray">Recherche...</span>
                      </div>
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
                      <div className="p-md text-center">
                        <span className="text-spotify-light-gray" style={{fontStyle: 'italic'}}>
                          Aucun artiste trouvé
                        </span>
                      </div>
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
            className="btn btn-primary btn-md"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
        </div>
        
        {error && (
          <div className="error-message mt-md p-md text-center" style={{
            color: 'var(--spotify-red)',
            fontSize: 'var(--font-size-sm)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: 'var(--radius-md)'
          }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default ArtistAutocomplete;
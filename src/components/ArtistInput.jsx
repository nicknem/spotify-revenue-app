import { useState, useEffect, useRef } from 'react';
import { searchArtist } from '../services/api';

/**
 * ArtistInput Component - Phase 1: URL Input Only
 * 
 * This is the first version that only handles Spotify artist URL input.
 * Future versions will include:
 * - Spotify API search functionality
 * - Artist name search with autocomplete
 * - Both URL and search options in the same interface
 * 
 * Props:
 * - onSubmit: Function called when form is submitted with valid URL
 * - loading: Boolean indicating if analysis is in progress
 */
function ArtistInput({ onSubmit, loading }) {
  // State to store the current URL input value
  const [url, setUrl] = useState('https://open.spotify.com/intl-fr/artist/5imgjumuHUmnzZF3vOEmso');
  
  // State to store any validation error messages
  const [error, setError] = useState('');
  
  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'search'
  
  const searchRef = useRef(null);

  /**
   * Handles form submission for URL input
   * - Prevents default form behavior (page refresh)
   * - Validates the URL format to ensure it's a valid Spotify artist URL
   * - Calls the parent's onSubmit function if validation passes
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // Stop the browser from refreshing the page
    setError(''); // Clear any previous error messages

    // Basic validation: check if the input field is empty
    if (!url.trim()) {
      setError('Veuillez entrer une URL Spotify');
      return;
    }

    // Validate that this is actually a Spotify artist URL
    // The URL must contain the specific pattern for Spotify artist pages
    // Support both standard and internationalized URLs (e.g., /intl-fr/)
    if (!url.includes('open.spotify.com') || !url.includes('/artist/')) {
      setError('URL Spotify invalide. Format attendu: https://open.spotify.com/artist/...');
      return;
    }

    // If all validation passes, send the cleaned URL to the parent component
    // The trim() removes any extra whitespace the user might have added
    onSubmit(url.trim());
  };

  // Debounced search function
  useEffect(() => {
    if (inputMode === 'search' && searchQuery.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await searchArtist(searchQuery, 5);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, inputMode]);

  // Handle artist selection from suggestions
  const handleArtistSelect = (artist) => {
    setSearchQuery(artist.name);
    setUrl(artist.url);
    setShowSuggestions(false);
    setError('');
  };

  // Handle input mode switch
  const switchToSearch = () => {
    setInputMode('search');
    setUrl('');
    setError('');
  };

  const switchToUrl = () => {
    setInputMode('url');
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (url && url.includes('open.spotify.com')) {
      onSubmit(url.trim());
    } else if (suggestions.length > 0) {
      handleArtistSelect(suggestions[0]);
    }
  };

  return (
    <div className="artist-input">
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
      
      {/* Mode selector tabs */}
      <div className="input-mode-tabs">
        <button 
          className={`tab ${inputMode === 'search' ? 'active' : ''}`}
          onClick={switchToSearch}
          type="button"
        >
          🔍 Rechercher par nom
        </button>
        <button 
          className={`tab ${inputMode === 'url' ? 'active' : ''}`}
          onClick={switchToUrl}
          type="button"
        >
          🔗 URL Spotify
        </button>
      </div>

      {/* Search mode */}
      {inputMode === 'search' && (
        <form onSubmit={handleSearchSubmit} className="input-form">
          <div className="input-group search-input-group" ref={searchRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tapez le nom d'un artiste..."
              className="search-input"
              disabled={loading}
            />
            
            <button 
              type="submit" 
              className="analyze-button"
              disabled={loading || (!url && suggestions.length === 0)}
            >
              {loading ? 'Analyse en cours...' : 'Analyser'}
            </button>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((artist) => (
                  <div 
                    key={artist.id}
                    className="suggestion-item"
                    onClick={() => handleArtistSelect(artist)}
                  >
                    <div className="artist-avatar">
                      {artist.image ? (
                        <img src={artist.image} alt={artist.name} />
                      ) : (
                        <div className="avatar-placeholder">🎵</div>
                      )}
                    </div>
                    <div className="artist-info">
                      <span className="artist-name">{artist.name}</span>
                      <span className="artist-followers">
                        {artist.followers?.toLocaleString()} followers
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="search-loading">Recherche en cours...</div>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </form>
      )}

      {/* URL mode */}
      {inputMode === 'url' && (
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              className="url-input"
              disabled={loading}
            />
            
            <button 
              type="submit" 
              className="analyze-button"
              disabled={loading || !url.trim()}
            >
              {loading ? 'Analyse en cours...' : 'Analyser'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </form>
      )}

    </div>
  );
}

export default ArtistInput;
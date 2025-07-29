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
  // Single unified input state
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const inputRef = useRef(null);

  // Detect if input is URL or artist name
  const isSpotifyUrl = (input) => {
    return input.includes('open.spotify.com') && input.includes('/artist/');
  };

  // Unified form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!inputValue.trim()) {
      setError('Recherchez un artiste ou collez une URL Spotify');
      return;
    }

    // If it's a Spotify URL, submit directly
    if (isSpotifyUrl(inputValue)) {
      onSubmit(inputValue.trim());
      return;
    }

    // If it's a search and we have a selected suggestion, use it
    if (suggestions.length > 0) {
      const firstSuggestion = suggestions[0];
      onSubmit(firstSuggestion.url);
      return;
    }

    // If no suggestions, show error
    setError('Aucun artiste trouvé. Essayez une URL Spotify ou un autre nom.');
  };

  // Debounced search for artist names
  useEffect(() => {
    const trimmedValue = inputValue.trim();
    
    // Don't search if it's a URL or too short
    if (isSpotifyUrl(trimmedValue) || trimmedValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchArtist(trimmedValue, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Handle artist selection from suggestions
  const handleArtistSelect = (artist) => {
    setInputValue(artist.name);
    setShowSuggestions(false);
    setError('');
    // Submit immediately when artist is selected
    setTimeout(() => onSubmit(artist.url), 100);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setError('');
  };

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      {/* Unified search form */}
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-group unified-search-group" ref={inputRef}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Tapez le nom d'un artiste ou collez une URL Spotify..."
            className="unified-search-input"
            disabled={loading}
          />
          
          <button 
            type="submit" 
            className="analyze-button"
            disabled={loading || !inputValue.trim()}
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>

          {/* Suggestions dropdown - only show for non-URL searches */}
          {showSuggestions && suggestions.length > 0 && !isSpotifyUrl(inputValue) && (
            <div className="suggestions-dropdown">
              {suggestions.map((artist) => (
                <div 
                  key={artist.id}
                  className="suggestion-item"
                  onClick={() => handleArtistSelect(artist)}
                >
                  <div className="suggestion-image-container">
                    {artist.image ? (
                      <img src={artist.image} alt={artist.name} className="suggestion-image" />
                    ) : (
                      <div className="suggestion-image-placeholder">🎵</div>
                    )}
                  </div>
                  <div className="suggestion-text">
                    <div className="suggestion-name">{artist.name}</div>
                    <div className="suggestion-followers">
                      {artist.followers?.toLocaleString()} followers
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isSearching && !isSpotifyUrl(inputValue) && (
            <div className="search-loading">Recherche en cours...</div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </form>

    </div>
  );
}

export default ArtistInput;
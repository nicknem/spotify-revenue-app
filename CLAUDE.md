# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Spotify Revenue Estimator web application that analyzes Spotify artists and estimates their monthly revenue based on streaming data. The project consists of:

- **Frontend**: React app built with Vite with modern UI and full integration to backend API
- **Backend**: Express.js API server with Puppeteer-based web scraping functionality

## Development Commands

### Frontend (Root Directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (backend/ Directory)
- `cd backend && npm start` - Start the Express API server (port 3001)
- `cd backend && npm run dev` - Start the Express API server (same as start)
- Backend has no test scripts configured yet

## Architecture

### Backend API Structure

The backend (`backend/server.js`) provides a REST API with these key endpoints:

- `POST /api/artist-revenue` - Main endpoint that accepts Spotify artist URL or ID and returns revenue estimates
- `GET /api/search-artist` - Placeholder for future artist search functionality  
- `GET /health` - Health check endpoint
- `GET /` - API information endpoint

### Web Scraping Engine

The core scraping logic is in `backend/spotify-scraper.js` and includes:

- **Top 5 Track Analysis** (`analyzeTop5Tracks`): Scrapes streaming numbers from an artist's popular tracks
- **Monthly Listeners Detection** (`getMonthlyListeners`): Extracts monthly listener count from artist page
- **Intelligent Revenue Calculation** (`calculateRevenue`): Uses cached top 5 data and artist size categories to estimate streams per listener ratio
- **Fallback Algorithms**: Multiple strategies for data extraction when primary methods fail

### Revenue Calculation Algorithm

The system uses a sophisticated approach:
1. Scrapes actual streaming numbers from top 5 tracks
2. Applies weighted calculation (reduces hit song influence by 50%)
3. Categorizes artists by monthly listeners (emerging, growing, established, mainstream)
4. Calculates streams-per-listener ratio based on category and actual data
5. Estimates monthly revenue using $0.004 per stream rate

### Technology Stack

- **Frontend**: React 19, Vite, ESLint
- **Backend**: Express.js, Puppeteer, CORS
- **Language**: JavaScript (ES modules for frontend, CommonJS for backend)

## Current State

The application is fully functional with:
- **Complete React frontend** with modern UI (Spotify-inspired design)
- **Full integration** between frontend and backend
- **Working components**: ArtistInput, RevenueResults, API service layer
- **Responsive design** with error handling and loading states
- **Ready for production** build and deployment

## Frontend Components

- `src/components/ArtistInput.jsx` - URL input form with validation
- `src/components/RevenueResults.jsx` - Results display with metrics and analysis
- `src/services/api.js` - API service for backend communication  
- `src/App.jsx` - Main app with state management and routing
- `src/App.css` - Complete styling with Spotify-inspired theme

## Development Notes

- Backend runs on port 3001 by default
- Frontend development server typically runs on port 5173 (Vite default)
- The scraping system includes extensive logging and error handling
- Revenue calculations use EUR currency with USD conversion
- The system handles various Spotify URL formats and ID extraction
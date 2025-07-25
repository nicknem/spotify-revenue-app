const puppeteer = require('puppeteer');
const fs = require('fs');

// Variable pour cache (comme dans ton extension)
let cachedTop5Data = null;

// Fonction pour écrire dans un fichier de debug
function debugLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  console.log(`🔍 SCRAPER DEBUG: ${message}`); // Logger clairement dans la console du serveur
  // En production, on évite d'écrire des fichiers, on utilise juste la console
  if (process.env.NODE_ENV !== 'production') {
    try {
      fs.appendFileSync('./debug-scraper.log', logMessage);
    } catch (err) {
      // Ignore les erreurs de fichier en production
    }
  }
}

// Fonction pour analyser le top 5 des titres populaires (version améliorée)
async function analyzeTop5Tracks(page) {
  debugLog('🔍 Analyse des titres populaires avec clic sur "Afficher plus"...');
  
  // ÉTAPE 1: Compter les titres AVANT le clic
  const trackCountBefore = await page.evaluate(() => {
    const tracks = document.querySelectorAll('[data-testid="tracklist-row"]');
    return tracks.length;
  });
  debugLog(`📊 AVANT clic: ${trackCountBefore} titres trouvés`);

  // ÉTAPE 2: Essayer plusieurs méthodes de clic jusqu'à ce que le HTML change
  try {
    debugLog('🔍 Recherche du bouton "Afficher plus"...');
    
    // Méthodes d'activation du bouton à essayer (ordre optimisé)
    const clickMethods = [
      {
        name: 'Clic JavaScript',
        action: async () => {
          await page.evaluate(() => {
            const button = document.querySelector('#main-view > div > div.main-view-container__scroll-node.ZjfaJlGQZ42nCWjD3FDm > div:nth-child(1) > div > main > section > div > div.EmeHQXR87mUskYK6xEde > div.contentSpacing > div:nth-child(1) > div > div.fnphAtjtCDYY99lYBfLK.PHHrto0Qhh4dJcnnPhwu > button');
            if (button) button.click();
          });
        }
      },
      {
        name: 'Recherche par texte (fallback)',
        action: async () => {
          const buttons = await page.$$('button');
          for (let button of buttons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text && text.includes('Afficher plus')) {
              await button.evaluate(btn => btn.click());
              break;
            }
          }
        }
      }
    ];

    // Vérifier si le bouton existe et le rendre visible
    const showMoreButton = await page.$('#main-view > div > div.main-view-container__scroll-node.ZjfaJlGQZ42nCWjD3FDm > div:nth-child(1) > div > main > section > div > div.EmeHQXR87mUskYK6xEde > div.contentSpacing > div:nth-child(1) > div > div.fnphAtjtCDYY99lYBfLK.PHHrto0Qhh4dJcnnPhwu > button');
    
    if (showMoreButton) {
      const isVisible = await showMoreButton.isIntersectingViewport();
      const buttonText = await page.evaluate(el => el.textContent, showMoreButton);
      debugLog(`✅ Bouton trouvé - Visible: ${isVisible}, Texte: "${buttonText}"`);
      
      if (!isVisible) {
        debugLog('🔄 Scroll vers le bouton...');
        await showMoreButton.scrollIntoView();
        await new Promise(resolve => setTimeout(resolve, 500)); // Réduit de 1s à 500ms
      }
    }

    // Capturer l'état HTML initial
    let initialState = await page.evaluate(() => {
      const container = document.querySelector('#main-view > div > div.main-view-container__scroll-node.ZjfaJlGQZ42nCWjD3FDm > div:nth-child(1) > div > main > section > div > div.EmeHQXR87mUskYK6xEde > div.contentSpacing > div:nth-child(1) > div > div.fnphAtjtCDYY99lYBfLK.PHHrto0Qhh4dJcnnPhwu');
      return {
        html: container ? container.innerHTML.length : 0,
        tracks: document.querySelectorAll('[data-testid="tracklist-row"]').length
      };
    });
    
    debugLog(`🔍 État initial - HTML: ${initialState.html} chars, Tracks: ${initialState.tracks}`);

    // Essayer chaque méthode jusqu'à ce que le HTML change
    let contentLoaded = false;
    
    for (let i = 0; i < clickMethods.length && !contentLoaded; i++) {
      const method = clickMethods[i];
      debugLog(`🖱️ Tentative ${i + 1}: ${method.name}`);
      
      try {
        await method.action();
        debugLog(`✅ ${method.name} exécuté`);
        
        // Surveiller les changements HTML pendant 1 seconde max (React est très rapide)
        const startTime = Date.now();
        const timeout = 1000; // 1 seconde suffit
        
        while (!contentLoaded && (Date.now() - startTime) < timeout) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Vérifier toutes les 50ms (plus fréquent)
          
          const currentState = await page.evaluate(() => {
            const container = document.querySelector('#main-view > div > div.main-view-container__scroll-node.ZjfaJlGQZ42nCWjD3FDm > div:nth-child(1) > div > main > section > div > div.EmeHQXR87mUskYK6xEde > div.contentSpacing > div:nth-child(1) > div > div.fnphAtjtCDYY99lYBfLK.PHHrto0Qhh4dJcnnPhwu');
            return {
              html: container ? container.innerHTML.length : 0,
              tracks: document.querySelectorAll('[data-testid="tracklist-row"]').length
            };
          });
          
          const htmlChange = currentState.html - initialState.html;
          const trackChange = currentState.tracks - initialState.tracks;
          
          if (htmlChange > 1000 || trackChange > 0) { // Changement significatif
            debugLog(`🎉 SUCCÈS! HTML: +${htmlChange} chars, Tracks: +${trackChange}`);
            debugLog(`📊 ${method.name} a fonctionné après ${((Date.now() - startTime)).toFixed(0)}ms`);
            contentLoaded = true;
            break;
          }
        }
        
        if (!contentLoaded) {
          debugLog(`⚠️ ${method.name} - Pas de changement détecté après 1s`);
        }
        
      } catch (error) {
        debugLog(`❌ ${method.name} échoué: ${error.message}`);
      }
    }
    
    if (!contentLoaded) {
      debugLog('⚠️ Aucune méthode n\'a réussi à charger plus de contenu');
      debugLog('🔄 Utilisation des 5 tracks de base');
    }
    
  } catch (error) {
    debugLog('⚠️ Erreur lors du clic sur "Afficher plus": ' + error.message);
  }

  // ÉTAPE 3: Compter les titres APRÈS le clic avec data-testid
  const trackCountAfter = await page.evaluate(() => {
    const tracks = document.querySelectorAll('[data-testid="tracklist-row"]');
    return tracks.length;
  });
  debugLog(`📊 APRÈS clic: ${trackCountAfter} titres trouvés`);
  debugLog(`📈 Différence: +${trackCountAfter - trackCountBefore} nouveaux titres`);
  
  return await page.evaluate(() => {
    // Scanner TOUS les titres APRÈS le clic avec data-testid
    const trackRows = document.querySelectorAll('[data-testid="tracklist-row"]');
    console.log(`🎵 ${trackRows.length} lignes de titres trouvées APRÈS le clic`);
    
    const allStreams = [];
    
    // Analyser TOUS les titres trouvés
    console.log(`🎵 Analyse de tous les ${trackRows.length} titres`);
    for (let i = 0; i < trackRows.length; i++) {
      const row = trackRows[i];
      const rowText = row.textContent;
      
      console.log(`📊 Ligne ${i+1}: "${rowText.substring(0, 100)}..."`);
      
      // Chercher le div avec la classe qui contient les streams
      const streamDivs = row.querySelectorAll('div[class*="encore-text"]');
      
      for (let div of streamDivs) {
        const divText = div.textContent.trim();
        
        // Chercher un pattern de streams (nombre avec ou sans espaces, pas de : pour durée)
        if (!divText.includes(':') && divText.match(/^\d{1,3}(?:\s\d{3})*$|^\d{1,3}\s\d{3}$|^\d{4,7}$/)) {
          const streamCount = parseInt(divText.replace(/\s/g, ''));
          
          if (streamCount > 100 && streamCount < 50000000) { // Limite plus basse pour petits artistes
            console.log(`🎯 Stream trouvé ligne ${i+1}: ${streamCount.toLocaleString()} (texte: "${divText}")`);
            allStreams.push(streamCount);
            break; // Passer au titre suivant
          }
        }
      }
    }
    
    // Fallback si pas de trackRows : ancienne méthode
    if (trackRows.length === 0) {
      console.log('🔄 Fallback: recherche par H2 Populaires...');
      
      // Chercher le h2 "Populaires"
      const h2Elements = document.querySelectorAll('h2');
      let popularesH2 = null;
      
      for (let h2 of h2Elements) {
        if (h2.textContent.trim() === 'Populaires') {
          popularesH2 = h2;
          console.log('✅ H2 "Populaires" trouvé !');
          break;
        }
      }
      
      if (popularesH2) {
        // Chercher la section parent qui contient les titres
        let popularSection = popularesH2.closest('section') || popularesH2.parentElement;
        
        if (popularSection) {
          console.log('✅ Section Populaires trouvée !');
          
          // Fallback avec parsing manuel des nombres séparés par espaces
          const sectionText = popularSection.textContent;
          console.log(`📄 Texte section (300 chars): "${sectionText.substring(0, 300)}..."`);
          
          // Pattern spécial pour nombres avec espaces comme "1 791 149"
          const spaceNumberPattern = /\b(\d{1,3}(?:\s\d{3}){1,2})\b/g;
          const matches = sectionText.match(spaceNumberPattern);
          
          console.log(`🔍 Nombres avec espaces trouvés: ${matches ? matches.join(', ') : 'aucun'}`);
          
          if (matches) {
            for (let match of matches) {
              const streamCount = parseInt(match.replace(/\s/g, ''));
              
              if (streamCount > 10000 && streamCount < 50000000) {
                console.log(`🎵 Stream validé (fallback): ${streamCount.toLocaleString()}`);
                allStreams.push(streamCount);
              }
            }
          }
        }
      }
    }
    
    if (allStreams.length >= 3) {
      // Trier par ordre décroissant et prendre TOUS les titres trouvés (pas seulement 5)
      allStreams.sort((a, b) => b - a);
      const finalTracks = allStreams; // Prendre tous les titres
      
      // Pondération : réduire le hit principal de 20% (moins agressive)
      const weightedTracks = [...finalTracks];
      if (weightedTracks.length > 0) {
        const originalTop1 = weightedTracks[0];
        weightedTracks[0] = Math.round(weightedTracks[0] * 0.8);
        console.log(`⚖️ Pondération du hit principal: ${originalTop1.toLocaleString()} → ${weightedTracks[0].toLocaleString()}`);
      }
      
      const average = weightedTracks.reduce((sum, streams) => sum + streams, 0) / weightedTracks.length;
      
      console.log(`✅ Top ${finalTracks.length} streams trouvés:`);
      finalTracks.forEach((streams, i) => {
        if (i === 0) {
          console.log(`   ${i+1}. ${streams.toLocaleString()} streams (pondéré: ${weightedTracks[0].toLocaleString()})`);
        } else {
          console.log(`   ${i+1}. ${streams.toLocaleString()} streams`);
        }
      });
      console.log(`✅ Moyenne pondérée: ${Math.round(average).toLocaleString()} streams`);
      
      return {
        tracks: finalTracks,
        average: average,
        count: finalTracks.length
      };
    }
    
    console.log(`❌ Pas assez de streams trouvés (${allStreams.length}/3 minimum)`);
    return null;
  });
}

// Fonction pour trouver le nombre d'auditeurs mensuels (adaptée de ton code)
async function getMonthlyListeners(page) {
  return await page.evaluate(() => {
    console.log('🔍 Recherche des auditeurs mensuels...');
    
    // Stratégie 1: Chercher dans les éléments visibles seulement
    const visibleElements = document.querySelectorAll('span, div, p, h1, h2, h3');
    console.log(`👀 Nombre d'éléments visibles à analyser: ${visibleElements.length}`);
    
    // Patterns multilingues à rechercher
    const patterns = [
      'auditeurs mensuels',
      'monthly listeners', 
      'mensuel',
      'listeners',
      'écoutes mensuelles'
    ];
    
    for (let element of visibleElements) {
      const text = element.textContent;
      
      // Vérifier chaque pattern de langue
      for (let pattern of patterns) {
        if (text && text.toLowerCase().includes(pattern) && text.length < 100) {
          console.log(`✅ Trouvé texte avec "${pattern}": "${text}"`);
          console.log(`📝 Longueur: ${text.length} caractères`);
          
          // Pattern pour extraire les nombres (multi-format)
          const numberMatch = text.match(/(\d[\d\s,\.]*\d|\d+)\s*(auditeurs mensuels|monthly listeners|mensuel|listeners)/i);
          if (numberMatch && numberMatch[1]) {
            const number = parseInt(numberMatch[1].replace(/[\s,\.]/g, ''));
            console.log(`🎯 Nombre extrait: ${number}`);
            
            // Vérification de sanité: entre 1 et 100 millions
            if (number > 0 && number < 100000000) {
              return number;
            }
          }
        }
      }
    }
    
    // Stratégie 2: Chercher n'importe quel gros nombre qui pourrait être les auditeurs
    console.log('🔄 Stratégie 2: recherche de gros nombres dans le contenu');
    
    const allNumbers = [];
    for (let element of visibleElements) {
      const text = element.textContent;
      
      if (text && text.length < 100) {
        // Chercher des nombres de format "X,XXX,XXX" ou "X XXX XXX"
        const bigNumbers = text.match(/\d[\d\s,\.]{4,}/g);
        if (bigNumbers) {
          bigNumbers.forEach(numStr => {
            const cleanNum = parseInt(numStr.replace(/[\s,\.]/g, ''));
            if (cleanNum > 100000 && cleanNum < 100000000) { // Entre 100K et 100M
              allNumbers.push({number: cleanNum, context: text});
              console.log(`🔢 Nombre candidat: ${cleanNum.toLocaleString()} dans "${text}"`);
            }
          });
        }
      }
    }
    
    // Si on a trouvé des nombres, prendre le plus gros (probablement les auditeurs mensuels)
    if (allNumbers.length > 0) {
      const biggest = allNumbers.sort((a, b) => b.number - a.number)[0];
      console.log(`🎯 Plus gros nombre trouvé: ${biggest.number.toLocaleString()}`);
      return biggest.number;
    }
    
    // Stratégie 3: Recherche spécifique pour "auditeurs" en français
    console.log('🔄 Stratégie 3: recherche spécifique texte français');
    
    for (let element of visibleElements) {
      const text = element.textContent;
      
      if (text && text.length < 50 && text.includes('auditeurs')) {
        console.log(`🔍 Texte candidat: "${text}"`);
        
        // Chercher pattern "17 525 auditeurs mensuels" ou similaire
        const match = text.match(/(\d{1,3}(?:\s\d{3})*)\s*auditeurs/);
        if (match && match[1]) {
          const number = parseInt(match[1].replace(/\s/g, ''));
          console.log(`🎯 Nombre trouvé stratégie 2: ${number}`);
          if (number > 0 && number < 100000000) {
            return number;
          }
        }
      }
    }
    
    console.log('❌ Aucun auditeur mensuel trouvé');
    return null;
  });
}

// Fonction pour calculer streams par auditeur intelligemment (adaptée de ton code)
function calculateStreamsPerListener(monthlyListeners) {
  console.log(`🎯 Calcul intelligent pour ${monthlyListeners} auditeurs`);
  
  // Étape 1: Utiliser les données en cache si disponibles
  if (cachedTop5Data) {
    console.log('💾 Utilisation des données top 5 en cache');
    // Calcul basé sur les données réelles
    const hitRatio = cachedTop5Data.average / monthlyListeners;
    console.log(`📊 Hit ratio: ${hitRatio.toFixed(2)}`);
    
    // Algorithme adaptatif hybride
    const baseCoeff = 0.6; // Base augmentée
    const hitRatioFactor = Math.min(1.5, 0.7 + hitRatio / 15); // Formule moins pénalisante
    
    // Multiplicateur par taille d'audience
    let sizeMultiplier, category;
    if (monthlyListeners < 50000) {
      sizeMultiplier = 1.0; // Fans plus engagés
      category = 'Artiste émergent';
    } else if (monthlyListeners < 500000) {
      sizeMultiplier = 0.85;
      category = 'Artiste en croissance';
    } else if (monthlyListeners < 2000000) {
      sizeMultiplier = 0.7;
      category = 'Artiste établi';
    } else {
      sizeMultiplier = 0.6;
      category = 'Artiste mainstream';
    }
    
    const adaptiveCoeff = baseCoeff * hitRatioFactor * sizeMultiplier;
    const calculatedRatio = hitRatio * adaptiveCoeff;
    const finalRatio = Math.max(0.5, Math.min(50, calculatedRatio));
    
    console.log(`📈 Catégorie: ${category}`);
    console.log(`📈 Base coeff: ${baseCoeff}, Hit factor: ${hitRatioFactor.toFixed(2)}, Size mult: ${sizeMultiplier}`);
    console.log(`📈 Coefficient adaptatif: ${adaptiveCoeff.toFixed(3)}`);
    console.log(`✅ Ratio intelligent: ${finalRatio.toFixed(2)} streams/auditeur`);
    
    return finalRatio;
  } else {
    // Fallback sur la courbe classique
    console.log('🔄 Fallback sur la courbe classique (pas de données top 5)');
    return calculateStreamsPerListenerFallback(monthlyListeners);
  }
}

// Fonction de fallback (adaptée de ton code)
function calculateStreamsPerListenerFallback(monthlyListeners) {
  let baseRatio;
  let variationRange;
  
  if (monthlyListeners < 50000) {
    baseRatio = 4;
    variationRange = 1;
    console.log('📊 Fallback - Catégorie: Artiste émergent');
  } else if (monthlyListeners < 500000) {
    baseRatio = 6.5;
    variationRange = 1.5;
    console.log('📊 Fallback - Catégorie: Artiste en croissance');
  } else if (monthlyListeners < 2000000) {
    baseRatio = 5;
    variationRange = 1;
    console.log('📊 Fallback - Catégorie: Artiste établi');
  } else {
    baseRatio = 3;
    variationRange = 1;
    console.log('📊 Fallback - Catégorie: Artiste mainstream');
  }
  
  const randomFactor = (Math.random() - 0.5) * variationRange;
  const finalRatio = Math.max(1, baseRatio + randomFactor);
  
  console.log(`✅ Ratio fallback: ${finalRatio.toFixed(1)} streams/auditeur`);
  return finalRatio;
}

// Fonction pour calculer les revenus estimés (adaptée de ton code)
function calculateRevenue(monthlyListeners) {
  // Utilise la courbe intelligente au lieu d'un ratio fixe
  const streamsPerListener = calculateStreamsPerListener(monthlyListeners);
  const revenuePerStream = 0.004; // $0.004 par stream
  const usdToEur = 0.92; // Taux de change approximatif USD -> EUR
  
  const monthlyStreams = monthlyListeners * streamsPerListener;
  const monthlyRevenueUSD = monthlyStreams * revenuePerStream;
  const monthlyRevenueEUR = monthlyRevenueUSD * usdToEur;
  
  return {
    streams: monthlyStreams,
    revenue: monthlyRevenueEUR,
    ratio: streamsPerListener
  };
}

// Fonction pour formater les nombres (adaptée de ton code)
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  } else {
    return num.toString();
  }
}

// Fonction pour formater les revenus (adaptée de ton code)
function formatRevenue(revenue) {
  return Math.round(revenue).toLocaleString('fr-FR');
}

// Fonction principale pour scraper un artiste
async function scrapeArtistRevenue(artistUrl) {
  console.log(`🚀 Scraping artist: ${artistUrl}`);
  
  // IMPORTANT: Vider le cache pour forcer une nouvelle analyse
  cachedTop5Data = null;
  console.log('🗑️ Cache vidé - nouvelle analyse forcée');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Performance
      '--disable-accelerated-2d-canvas', // Performance
      '--disable-gpu', // Performance
      '--disable-background-timer-throttling', // Performance
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--single-process' // Plus rapide mais plus de mémoire
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Capturer les logs de la page pour débugger
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    
    // Simuler un vrai navigateur
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📍 Navigation vers la page artiste...');
    await page.goto(artistUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }); // Plus rapide que networkidle0
    
    // Attente réduite - le DOM est déjà chargé
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔍 Recherche des auditeurs mensuels...');
    const monthlyListeners = await getMonthlyListeners(page);
    
    if (!monthlyListeners) {
      throw new Error('Impossible de trouver le nombre d\'auditeurs mensuels');
    }
    
    console.log('🔍 Analyse du top 5...');
    cachedTop5Data = await analyzeTop5Tracks(page);
    
    console.log('💰 Calcul des revenus...');
    const estimates = calculateRevenue(monthlyListeners);
    
    const result = {
      monthlyListeners,
      estimates: {
        streams: estimates.streams,
        revenue: estimates.revenue,
        ratio: estimates.ratio
      },
      top5Data: cachedTop5Data,
      formatted: {
        listeners: formatNumber(monthlyListeners),
        streams: formatNumber(estimates.streams),
        revenue: formatRevenue(estimates.revenue)
      }
    };
    
    console.log('✅ Scraping terminé avec succès !');
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeArtistRevenue,
  calculateRevenue,
  formatNumber,
  formatRevenue
};
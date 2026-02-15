// --- Ethicy vegan brands scraper & fuzzy matcher ---

const ETHICY_VEGAN_URL = 'https://ethicy.com/vegan-brands';
let veganBrandCache = null;
let veganCacheTimestamp = 0;
const VEGAN_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function extractVeganBrandNames(html) {
  const brands = [];
  // Match anchor tags whose href contains "/question/is-"
  const regex = /<a[^>]+href="[^"]*\/question\/is-[^"]*"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name) brands.push(name);
  }
  return brands;
}

async function fetchAllVeganBrands() {
  if (veganBrandCache && Date.now() - veganCacheTimestamp < VEGAN_CACHE_TTL) {
    return veganBrandCache;
  }

  const res = await fetch(ETHICY_VEGAN_URL);
  const html = await res.text();
  const brands = extractVeganBrandNames(html);

  veganBrandCache = [...new Set(brands)];
  veganCacheTimestamp = Date.now();
  return veganBrandCache;
}

// Reuse the fuzzy matching utilities from leapingBunnyScraper.js
// (normalize, levenshtein, similarity, fuzzyMatch are already available)

// Expose for use via importScripts in background.js
self.fetchAllVeganBrands = fetchAllVeganBrands;

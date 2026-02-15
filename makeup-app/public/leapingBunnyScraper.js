// --- Leaping Bunny scraper & fuzzy matcher ---

const LEAPING_BUNNY_URL = 'https://www.leapingbunny.org/shopping-guide';
let brandCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function extractBrandNames(html) {
  const brands = [];
  // Match anchor tags whose href contains "/brand/"
  const regex = /<a[^>]+href="\/brand\/[^"]*"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const name = match[1].trim();
    if (name) brands.push(name);
  }
  return brands;
}

async function fetchAllBrands() {
  // Return cached results if still fresh
  if (brandCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return brandCache;
  }

  const allBrands = [];

  // Fetch the initial page
  const firstRes = await fetch(LEAPING_BUNNY_URL);
  const firstHtml = await firstRes.text();
  allBrands.push(...extractBrandNames(firstHtml));

  // Paginate through additional pages until we get no new brands
  let page = 1;
  while (true) {
    try {
      const res = await fetch(`${LEAPING_BUNNY_URL}?page=${page}`);
      const html = await res.text();
      const brands = extractBrandNames(html);
      if (brands.length === 0) break;
      allBrands.push(...brands);
      page++;
    } catch {
      break;
    }
  }

  // Deduplicate
  brandCache = [...new Set(allBrands)];
  cacheTimestamp = Date.now();
  return brandCache;
}

// --- Fuzzy matching ---

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function fuzzyMatch(query, brandList) {
  const normQuery = normalize(query);
  let bestMatch = null;
  let bestScore = 0;

  for (const brand of brandList) {
    const normBrand = normalize(brand);

    // Exact normalized match
    if (normQuery === normBrand) {
      return { found: true, bestMatch: brand, score: 1.0 };
    }

    // Substring check (either direction)
    if (normBrand.includes(normQuery) || normQuery.includes(normBrand)) {
      const subScore = Math.min(normQuery.length, normBrand.length) /
        Math.max(normQuery.length, normBrand.length);
      // Boost substring matches
      const boosted = 0.5 + subScore * 0.5;
      if (boosted > bestScore) {
        bestScore = boosted;
        bestMatch = brand;
      }
      continue;
    }

    // Levenshtein similarity
    const sim = similarity(normQuery, normBrand);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = brand;
    }
  }

  return {
    found: bestScore >= 0.6,
    bestMatch,
    score: Math.round(bestScore * 100) / 100,
  };
}

// Expose for use via importScripts in background.js
self.fetchAllBrands = fetchAllBrands;
self.fuzzyMatch = fuzzyMatch;

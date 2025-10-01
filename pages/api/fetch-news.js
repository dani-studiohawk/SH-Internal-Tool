const { withAuth } = require('../../lib/auth-middleware');
async function handler(req, res) {
  // User session is available in req.session (provided by withAuth)
  console.log(`API accessed by user: ${req.session.user.email}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword, country = 'au' } = req.body; // Default to Australia

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  // Validate country code
  const validCountries = ['au', 'us', 'gb'];
  const selectedCountry = validCountries.includes(country) ? country : 'au';

  try {
    const apiKey = process.env.GNEWS_API_KEY;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&lang=en&country=${selectedCountry}&max=10&apikey=${apiKey}`;

    console.log('Fetching news articles for keyword:', keyword, 'from country:', selectedCountry);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GNews API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform GNews format to match our expected format
    const articles = data.articles.map(article => ({
      title: article.title,
      description: article.description,
      publishedAt: article.publishedAt,
      source: { name: article.source.name },
      url: article.url,
      image: article.image
    }));

    console.log(`Found ${articles.length} articles for keyword: ${keyword} from ${selectedCountry.toUpperCase()}`);
    
    res.status(200).json({ articles });
  } catch (error) {
    console.error('Error fetching news articles:', error);
    res.status(500).json({ error: `Failed to fetch news articles: ${error.message}` });
  }
}

// Export the handler wrapped with authentication
export default withAuth(handler);
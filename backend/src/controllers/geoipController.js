const fetch = require('node-fetch');

const COUNTRY_MAP = {
  'US': 'Estados Unidos',
  'CA': 'Canadá',
  'GB': 'Reino Unido',
  'ES': 'España',
  'FR': 'Francia',
  'DE': 'Alemania',
  'IT': 'Italia',
  'CN': 'China',
  'JP': 'Japón',
  'MX': 'México',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'EC': 'Ecuador',
  'AU': 'Australia',
};

const geoip = async (req, res) => {
  try {
    const response = await fetch('https://ipinfo.io/json');
    const data = await response.json();

    if (data.country) {
      res.json({
        success: true,
        country: COUNTRY_MAP[data.country] || data.country,
        countryCode: data.country,
      });
    } else {
      res.status(404).json({ success: false, error: 'No se pudo detectar el país' });
    }
  } catch (err) {
    console.error('GeoIP error:', err.message);
    res.status(500).json({ success: false, error: 'Error al detectar ubicación' });
  }
};

module.exports = { geoip };

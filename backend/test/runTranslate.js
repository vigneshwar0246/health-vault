const { translateText } = require('../lib/translator');

(async () => {
  try {
    const res = await translateText('Hello world from HealthHub', 'ta');
    console.log('Translated text:', res);
  } catch (err) {
    console.error('Translate call failed:', err);
  }
})();
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: puppeteer.executablePath() });
  const page = await browser.newPage();
  const html = '<html><body><h1>Test</h1><img src="data:image/png;base64," /></body></html>';
  try {
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf();
    console.log('PDF generated, size:', pdf.length);
  } catch(e) {
    console.error('Error:', e);
  }
  await browser.close();
})();

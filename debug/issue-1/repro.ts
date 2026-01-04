import { AsyncWebCrawler } from '../../src/index';

async function main() {
  console.log('Starting crawler...');
  const crawler = new AsyncWebCrawler({
    headless: true,
    stealth: true, // Commented out to reproduce
  });
  await crawler.start();

  try {
    console.log('Navigating to fansale.it...');
    const result = await crawler.arun(
      'https://www.fansale.it/tickets/all/blanco/769090',
    );

    if (result.success) {
      console.log('Success!');
      console.log(result.markdown?.slice(0, 500));
    } else {
      console.error('Failed:', result.error);
    }
  } catch (e) {
    console.error('Crash:', e);
  } finally {
    await crawler.close();
  }
}

main();

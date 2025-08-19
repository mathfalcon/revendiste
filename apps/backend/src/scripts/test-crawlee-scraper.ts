import {writeFileSync} from 'fs';
import {EntrasteScraper} from '../services/scraping/entraste';

const entrasteScraper = new EntrasteScraper();

entrasteScraper.scrapeEvents().then(events => {
  writeFileSync('events.json', JSON.stringify(events, null, 2));
});

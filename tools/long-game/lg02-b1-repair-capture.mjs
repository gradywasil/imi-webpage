import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8191/tools/balance.html?lg02-b1-repair-capture');
  const fixture = await page.evaluate(() => {
    Bot.start({ profile: 'active', strategy: 'collect', seed: 1, activeMinutes: 15 });
    Bot.run(15);
    IMI.ops.extensions.save();
    Economy.saveScore(IMI.bananas.get());
    const state = JSON.parse(localStorage.getItem('imi-ops-v1'));
    state.unknownLG02B1Repair = { retain: 'root' };
    state.prem.unknownLG02B1Repair = { retain: 'prem' };
    return { 'imi-ops-v1': JSON.stringify(state), 'imi-score': localStorage.getItem('imi-score') };
  });
  if (JSON.parse(fixture['imi-ops-v1']).economyVersion !== 1 || JSON.parse(fixture['imi-score']).economyVersion !== 1) throw Error('Unversioned fixture');
  await writeFile(process.argv[2], JSON.stringify(fixture, null, 2) + '\n', { flag: 'wx' });
} finally {
  await browser.close();
}

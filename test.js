// Run: npm test            (visible browser)
//      HEADLESS=1 npm test (for Jenkins/CI)
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const email = `user${Date.now()}@test.com`, pass = 'secret123';
let driver, failed = 0;

const el = id => driver.findElement(By.id(id));
const type = (id, text) => el(id).sendKeys(text);
const click = id => el(id).click();
const fill = async (n, e, p) => { await type('name', n); await type('email', e); await type('password', p); };
const waitText = (id, text) => driver.wait(async () =>
  (await el(id).getText()).includes(text), 5000, `"${text}" not found in #${id}`);

async function run(id, name, fn) {
  console.log(`RUN  ${id} ${name}`);
  try { await driver.get(BASE); await fn(); console.log(`PASS ${id}`); }
  catch (err) { failed++; console.log(`FAIL ${id}: ${err.message}`); }
}

(async () => {
  const opts = new chrome.Options().addArguments(
    ...(process.env.HEADLESS ? ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'] : ['--start-maximized']));
  driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();
  try {
    await run('TC01', 'Open registration page', async () => {
      await driver.wait(until.elementLocated(By.id('regBtn')), 5000);
      assert.strictEqual(await driver.getTitle(), 'Event Registration');
    });
    await run('TC02', 'Register with valid details', async () => {
      await fill('Test User', email, pass); await click('regBtn');
      await waitText('msg', 'Registration successful');
    });
    await run('TC03', 'Submit empty form', async () => {
      await click('regBtn'); await waitText('msg', 'All fields are required');
    });
    await run('TC04', 'Enter invalid email', async () => {
      await fill('Test User', 'not-an-email', pass); await click('regBtn');
      await waitText('msg', 'Invalid email');
    });
    await run('TC05', 'Register with duplicate email', async () => {
      await fill('Test User', email, pass); await click('regBtn');
      await waitText('msg', 'Email already registered');
    });
    await run('TC06', 'Login with valid credentials', async () => {
      await type('lemail', email); await type('lpassword', pass); await click('loginBtn');
      await driver.wait(until.elementIsVisible(el('dashboard')), 5000);
      await waitText('welcome', 'Welcome, Test User');
    });
    await run('TC07', 'View registered events', async () => {
      await type('lemail', email); await type('lpassword', pass); await click('loginBtn');
      await driver.wait(until.elementLocated(By.css('.reg')), 5000);
      await driver.findElement(By.css('.reg')).click();          // first event (Tech Fest)
      await waitText('confirm', 'Registration confirmed');
      await waitText('myEvents', 'Tech Fest');
    });
  } finally {
    await driver.quit();
    process.exit(failed ? 1 : 0);
  }
})();
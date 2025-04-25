const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const UserAgent = require('user-agents');
const fs = require('fs');

(async () => {
    const start = Date.now();

    const PROXY = '194.4.57.200:3128';
    const randomUA = new UserAgent({ deviceCategory: 'desktop' });
    const cookies = JSON.parse(fs.readFileSync('./cookie_quest_ozon.json', 'utf-8'));

    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    options.addArguments(`--proxy-server=${PROXY}`);
    options.addArguments(`user-agent=${randomUA.toString()}`);

    // Подделка WebDriver
    options.setUserPreferences({
        'profile.managed_default_content_settings.images': 2, // Отключаем изображения
    });

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        const url = 'https://www.ozon.ru/product/shlepantsy-1696053588/';
        // Маскировка Selenium (антибот-обход)
        await driver.executeScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        });
        await driver.get(url);
        for (const cookie of cookies) {
            try {
                await driver.manage().addCookie({
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain.replace(/^\./, ''),
                    path: cookie.path || '/',
                    secure: cookie.secure || false,
                    httpOnly: cookie.httpOnly || false,
                });
            } catch (err) {
                console.warn(`⚠️ Пропущена кука ${cookie.name}: ${err.message}`);
            }
        }
        // Скриншот
        await driver.takeScreenshot().then(base64 => {
            fs.writeFileSync('ozon_debug.png', base64, 'base64');
        });

        // Ожидаем элемента
        await driver.wait(until.elementLocated(By.css('[data-widget="webPrice"]')), 30000);

        const title = await driver.findElement(By.css('h1')).getText();
        const priceWithout = await driver.findElement(By.css('[data-widget="webPrice"] span')).getText();
        let priceWith = null;
        try {
            priceWith = await driver.findElement(By.css('[data-widget="ozonCardPrice"] span')).getText();
        } catch {}

        const result = {
            title,
            priceWithoutWallet: parseInt(priceWithout.replace(/\D/g, '')) || null,
            priceWithWallet: priceWith ? parseInt(priceWith.replace(/\D/g, '')) : null,
        };

        fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
        console.log('✅ Результат записан в result.json');
    } catch (err) {
        fs.writeFileSync('result.json', JSON.stringify({ error: 'Ошибка парсинга', details: err.message }, null, 2));
        await driver.takeScreenshot().then((image) => {
            fs.writeFileSync('ozon_error.png', image, 'base64');
            console.log('🧩 Скриншот ошибки сохранён в ozon_error.png');
        });
    } finally {
        await driver.quit();
    }
})();

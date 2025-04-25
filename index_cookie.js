const fs = require('fs');
const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Настройки Chrome
const options = new chrome.Options();
options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-setuid-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
);
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.add_argument('--disable-software-rasterizer')
options.add_argument('--disable-setuid-sandbox')
options.add_argument('--disable-setuid-sandbox')
# если Chromium 110+

(async () => {
    const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

    const url = 'https://www.ozon.ru/product/shlepantsy-1696053588/';
    const cookies = JSON.parse(fs.readFileSync('./cookie_quest_ozon.json', 'utf-8'));

    try {
        // Заходим на Ozon, чтобы установить домен
        await driver.get('https://www.ozon.ru');

        // Устанавливаем куки
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

        // ⏱ Замер времени
        const start = Date.now();

        // Переход к карточке товара
        await driver.get(url);
        await driver.sleep(3000); // Подождём чуть больше, чтобы контент подгрузился

        // Маскировка Selenium (антибот-обход)
        await driver.executeScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        });

        // Поиск элементов
        const title = await driver.findElement(By.css('h1')).getText();
        const priceWithoutWallet = await driver.findElement(By.css('[data-widget="webPrice"] span')).getText();
        const priceWithWallet = await driver.findElement(By.css('[data-widget="ozonCardPrice"] span')).getText();

        const result = {
            title,
            priceWithoutWallet,
            priceWithWallet,
            duration_seconds: ((Date.now() - start) / 1000).toFixed(2)
        };

        fs.writeFileSync('result.json', JSON.stringify(result, null, 2), 'utf-8');
        console.log('✅ Результат сохранён в result.json');

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await driver.takeScreenshot().then((image) => {
            fs.writeFileSync('ozon_error.png', image, 'base64');
            console.log('🧩 Скриншот ошибки сохранён в ozon_error.png');
        });
    } finally {
        await driver.quit();
    }
})();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Подключаем плагин скрытия headless-флагов
puppeteer.use(StealthPlugin());

const COOKIE_FILE = './cookie_quest_ozon.json'; // файл с куками
const PRODUCT_URL = 'https://www.ozon.ru/product/1696053588/';
// const PROXY = 'http://username:password@yourproxy:port'; // если нужен прокси

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
            // `--proxy-server=${PROXY}` // убери если не используешь прокси
        ]
    });

    const page = await browser.newPage();

    // Подгрузка cookies
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));
    await page.setCookie(...cookies);

    // Навигация на карточку товара
    await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Проверка на блокировку
    if ((await page.title()).includes('Доступ ограничен')) {
        await page.screenshot({ path: 'access_denied.png', fullPage: true });
        console.error('Блокировка доступа. См. access_denied.png');
        await browser.close();
        return;
    }

    // Ожидание нужных элементов (может потребоваться адаптация под структуру)
    await page.waitForSelector('h1', { timeout: 30000 });

    // Парсим данные
    const result = await page.evaluate(() => {
        const title = document.querySelector('h1')?.innerText || null;
        const priceWithoutWallet = document.querySelector('[data-widget="webPrice"]')?.innerText || null;
        const priceWithWallet = document.querySelector('[data-widget="priceWithOzonCard"]')?.innerText || null;

        return {
            title,
            priceWithoutWallet,
            priceWithWallet,
            timestamp: new Date().toISOString()
        };
    });

    // Сохраняем результат
    fs.writeFileSync('ozon_product.json', JSON.stringify(result, null, 2));
    console.log('✅ Результат сохранён в ozon_product.json');

    await browser.close();
})();

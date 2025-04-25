import json, time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- 1) Загрузка и конвертация cookies ---
with open("cookie_realuser_ozon.json", "r") as f:
    raw = json.load(f)

cookies = []
for ck in raw:
    cookie = {
        "name": ck["name"],
        "value": ck["value"],
        "domain": ck["domain"].lstrip("."),
        "path": ck.get("path", "/"),
        "secure": ck.get("secure", False),
        "httpOnly": ck.get("httpOnly", False),
        # sameSite: только Strict, Lax, None
        "sameSite": "Lax" if ck.get("sameSite","").lower()=="lax"
                    else "Strict" if ck.get("sameSite","").lower()=="strict"
                    else "None"
    }
    cookies.append(cookie)

# --- 2) Запуск undetected‑Chromedriver ---
options = uc.ChromeOptions()
options.headless = False
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--disable-gpu')
options.add_argument('--headless=new')  # если Chromium 110+
options.add_argument('--disable-setuid-sandbox')
options.add_argument('--disable-software-rasterizer')
options.add_argument('--disable-extensions')
options.add_argument('--disable-blink-features=AutomationControlled')
options.add_argument('--remote-debugging-port=9222')  # опционально
# Опционально: прокси
# options.add_argument("--proxy-server=http://USER:PASS@HOST:PORT")

driver = uc.Chrome(options=options)
wait = WebDriverWait(driver, 30)

try:
    # 3) Открываем главную, ставим куки
    driver.get("https://www.ozon.ru")
    for ck in cookies:
        try:
            driver.add_cookie(ck)
        except Exception as e:
            print(f"⚠️ Пропущена кука {ck['name']}: {e}")

    # 4) Переходим на товар
    start = time.time()
    driver.get("https://www.ozon.ru/product/shlepantsy-1696053588/")

    # 5) Эмулируем поведение пользователя
    driver.execute_script("window.scrollBy(0, document.body.scrollHeight/3);")
    time.sleep(1)
    driver.execute_script("window.scrollBy(0, document.body.scrollHeight/3);")
    time.sleep(1)

    # 6) Ждём, пока отобразятся цены
    price_sel = '[data-widget="webPrice"] span'
    card_sel  = '[data-widget="ozonCardPrice"] span'

    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, price_sel)))
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, card_sel)))

    # 7) Сбор данных
    title = driver.find_element(By.CSS_SELECTOR, "h1").text.strip()
    price_without = driver.find_element(By.CSS_SELECTOR, price_sel).text.strip()
    price_with    = driver.find_element(By.CSS_SELECTOR, card_sel).text.strip()
    duration = round(time.time() - start, 2)

    result = {
        "title": title,
        "price_without_wallet": price_without,
        "price_with_wallet": price_with,
        "duration_seconds": duration
    }

except Exception as e:
    # При ошибке — делаем скрин и возвращаем ошибку
    driver.save_screenshot("ozon_error.png")
    result = {
        "error": str(e),
        "duration_seconds": round(time.time() - start, 2)
    }
finally:
    driver.quit()

# 8) Сохраняем в JSON
with open("result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Готово — см. result.json")

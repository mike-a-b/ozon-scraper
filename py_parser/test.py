import undetected_chromedriver as uc

options = uc.ChromeOptions()
options.headless = True
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = uc.Chrome(options=options)
driver.get("https://ozon.ru")
driver.save_screenshot("test_screen.png")
driver.quit()
RUN apt-get update && йййййй \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Установка Python-зависимостей
COPY py_parser/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Копируем скрипты и cookie-файл
COPY . /app
WORKDIR /app

CMD ["python3", "py_parser/ozon-parser.py"]

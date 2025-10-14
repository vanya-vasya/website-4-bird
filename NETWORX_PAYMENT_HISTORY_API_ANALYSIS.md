# Анализ API Networx Pay: Получение истории платежей клиента

## Краткое описание
Данный отчет содержит детальный анализ API Networx Payment Gateway для получения истории платежей клиента в веб-приложении. Документ охватывает эндпоинты, методы аутентификации, пагинацию, обработку ошибок и использование вебхуков.

---

## 1. API-эндпоинты и методы запросов

### 1.1 Основной эндпоинт для получения отчетов

**URL:** `https://backoffice.networxpay.com/api/reports`  
**HTTP-метод:** `POST`  
**Ссылка на документацию:** https://docs.networxpay.com/en/payment_management/reports/reports_shop/

### 1.2 Эндпоинт для постраничных отчетов (для больших объемов данных)

**Применимость:** Используется когда ожидается более 1000 транзакций  
**Ссылка на документацию:** https://docs.networxpay.com/en/payment_management/reports/paginated_report/

---

## 2. Схема аутентификации

### HTTP Basic Authentication

**Учетные данные:**
- **Username (Имя пользователя):** Shop ID (ID магазина)
- **Password (Пароль):** Secret Key (Секретный ключ магазина)

**Как получить:**
Учетные данные доступны в личном кабинете Networx Payment Gateway (back office).

**Ссылка на документацию:** https://docs.networxpay.com/en/using_api/shop_id_and_secret_key/

---

## 3. Обязательные заголовки запроса

```http
Content-Type: application/json
X-Api-Version: 2
Authorization: Basic {base64_encoded_credentials}
```

---

## 4. Параметры запроса и фильтрация

### Структура тела запроса

```json
{
  "report_params": {
    "date_type": "created_at",
    "date": "2024-10-10",
    "status": "all",
    "payment_method_type": "credit_card",
    "time_zone": "Europe/Moscow"
  }
}
```

### 4.1 Параметр `date_type` (обязательный)

Определяет тип даты для фильтрации транзакций:

- **`created_at`** - дата создания транзакции
- **`paid_at`** - дата успешной оплаты
- **`settled_at`** - дата расчета (settlement)

### 4.2 Параметр `date` (обязательный)

**Формат:** `YYYY-MM-DD`  
**Пример:** `2024-10-10`

**Важно:** API возвращает транзакции за указанную дату. Для получения диапазона дат необходимо делать несколько запросов или использовать API постраничных отчетов.

### 4.3 Параметр `status` (обязательный)

Фильтрация по статусу транзакции:

- **`all`** - все транзакции
- **`successful`** - успешные платежи
- **`failed`** - неудачные платежи
- **`pending`** - ожидающие обработки
- **`incomplete`** - незавершенные транзакции

**Ссылка на статусы транзакций:** https://docs.networxpay.com/en/integration/api_for_card_payments/transaction_statuses/

### 4.4 Параметр `payment_method_type` (обязательный)

Тип платежного метода:

- **`credit_card`** - банковские карты
- Другие методы: `neteller`, `paysafecard`, `skrill` (альтернативные платежные методы)

**Ссылка на платежные методы:** https://docs.networxpay.com/en/payment_methods/

### 4.5 Параметр `time_zone` (обязательный)

**Формат:** IANA Time Zone Database  
**Примеры:** 
- `Europe/Moscow`
- `Etc/UTC`
- `Europe/London`
- `America/New_York`

---

## 5. Схема ответа API

### 5.1 Успешный ответ

**HTTP Status Code:** 200 OK

```json
{
  "transactions": [
    {
      "uid": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
      "status": "successful",
      "amount": 100,
      "currency": "EUR",
      "description": "Order #12345",
      "type": "payment",
      "payment_method_type": "credit_card",
      "tracking_id": "tracking_id_000",
      "message": "Successfully processed",
      "test": false,
      "created_at": "2024-10-14T13:07:01.836Z",
      "updated_at": "2024-10-14T13:07:05.530Z",
      "paid_at": "2024-10-14T13:07:05.495Z",
      "expired_at": null,
      "closed_at": null,
      "settled_at": null,
      "language": "en",
      "credit_card": {
        "holder": "John Doe",
        "stamp": "d9a78f040a8427c65da2c5569e6411c3641a5537fcfd2d2bf9f866abf3611c7d",
        "brand": "visa",
        "last_4": "1006",
        "first_1": "4",
        "bin": "401200",
        "issuer_country": "US",
        "issuer_name": "Example Bank",
        "product": "CREDIT",
        "exp_month": 10,
        "exp_year": 2027,
        "token": "card_token_example"
      },
      "customer": {
        "ip": "127.0.0.1",
        "email": "john@example.com",
        "device_id": "12312312321fff67",
        "birth_date": "1980-01-31"
      },
      "billing_address": {
        "first_name": "John",
        "last_name": "Doe",
        "address": "1st Street",
        "country": "US",
        "city": "Denver",
        "zip": "96002",
        "state": "CO",
        "phone": "4567898765467"
      },
      "payment": {
        "auth_code": "654321",
        "bank_code": "05",
        "rrn": "999",
        "ref_id": "777888",
        "message": "Payment was approved",
        "amount": 100,
        "currency": "EUR",
        "billing_descriptor": "COMPANY*PRODUCT",
        "gateway_id": 645,
        "status": "successful"
      },
      "receipt_url": "https://backoffice.networxpay.com/customer/transactions/dd6ee60c-d30a-4348-b84c-86a4ef1a137d/receipt"
    }
  ]
}
```

### 5.2 Ключевые поля ответа

| Поле | Тип | Описание |
|------|-----|----------|
| `uid` | string | Уникальный идентификатор транзакции |
| `status` | string | Статус транзакции (successful, failed, pending, etc.) |
| `amount` | number | Сумма транзакции (в минимальных единицах валюты, напр. центы) |
| `currency` | string | Код валюты ISO 4217 (EUR, USD, RUB, etc.) |
| `type` | string | Тип транзакции (payment, refund, authorization, etc.) |
| `payment_method_type` | string | Способ оплаты |
| `tracking_id` | string | Внешний идентификатор заказа из вашей системы |
| `created_at` | string (ISO 8601) | Дата и время создания транзакции |
| `paid_at` | string (ISO 8601) | Дата и время успешной оплаты |
| `test` | boolean | Флаг тестовой транзакции |
| `customer.email` | string | Email клиента |
| `credit_card.last_4` | string | Последние 4 цифры карты |
| `credit_card.brand` | string | Платежная система (visa, master, etc.) |
| `receipt_url` | string | URL для получения чека |

---

## 6. Пагинация и работа с большими объемами данных

### 6.1 Ограничения базового API

- Стандартный эндпоинт `/api/reports` не имеет встроенной пагинации
- Рекомендуется для запросов с ожидаемым результатом **менее 1000 транзакций**

### 6.2 API постраничных отчетов

**Когда использовать:**
- Более 1000 транзакций за период
- Необходимость пошаговой загрузки данных
- Работа с историческими данными за длительный период

**Эндпоинт:** Специализированный API для постраничных отчетов  
**Ссылка на документацию:** https://docs.networxpay.com/en/payment_management/reports/paginated_report/

**Рекомендации:**
- Для получения истории за большой период разбивайте запросы по датам (день за днем)
- Используйте параметр `date` для последовательной загрузки данных
- Сохраняйте результаты локально для уменьшения нагрузки на API

---

## 7. Диапазоны дат: стратегии получения истории

### 7.1 Получение данных за один день

```json
{
  "report_params": {
    "date_type": "paid_at",
    "date": "2024-10-10",
    "status": "all",
    "payment_method_type": "credit_card",
    "time_zone": "Europe/Moscow"
  }
}
```

### 7.2 Получение данных за период (требует нескольких запросов)

**Стратегия 1: Последовательные запросы**

```
Запрос 1: date = "2024-10-01"
Запрос 2: date = "2024-10-02"
...
Запрос N: date = "2024-10-10"
```

**Стратегия 2: Использование API постраничных отчетов**

Для больших периодов используйте специализированный API, который поддерживает диапазоны дат.

---

## 8. Обработка ошибок

### 8.1 Коды ошибок HTTP

| Код | Описание | Причина | Действие |
|-----|----------|---------|----------|
| 400 | Bad Request | Неверные параметры запроса | Проверьте формат параметров |
| 401 | Unauthorized | Неверные учетные данные | Проверьте Shop ID и Secret Key |
| 403 | Forbidden | Доступ запрещен | Проверьте права доступа |
| 404 | Not Found | Эндпоинт не найден | Проверьте URL |
| 500 | Internal Server Error | Ошибка сервера | Повторите запрос позже |
| 503 | Service Unavailable | Сервис временно недоступен | Используйте retry с экспоненциальной задержкой |

### 8.2 Формат ошибки

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

**Ссылка на коды ошибок:** https://docs.networxpay.com/en/using_api/api_v3_and_api_v2_error_codes/

### 8.3 Рекомендации по обработке ошибок

1. **Валидация данных на клиенте:**
   - Проверяйте формат даты перед отправкой
   - Убедитесь, что все обязательные параметры заполнены

2. **Retry Logic (логика повторных попыток):**
   - Используйте экспоненциальную задержку (exponential backoff)
   - Максимум 3-5 попыток
   - Интервалы: 1s, 2s, 4s, 8s, 16s

3. **Логирование:**
   - Записывайте все ошибки API
   - Сохраняйте контекст запроса для отладки

---

## 9. Ограничения по частоте запросов (Rate Limits)

### 9.1 Документированные ограничения

**Статус:** Официальная документация Networx Pay не предоставляет конкретных численных значений rate limits.

**Рекомендация:** Свяжитесь с технической поддержкой Networx Payment Gateway для получения точной информации об ограничениях для вашего аккаунта.

### 9.2 Общие рекомендации

1. **Избегайте чрезмерных запросов:**
   - Не делайте более 10 запросов в секунду
   - Используйте локальное кэширование результатов

2. **Оптимизация запросов:**
   - Группируйте запросы за несколько дней
   - Избегайте дублирования запросов
   - Используйте вебхуки для получения обновлений в реальном времени

3. **Обработка ответа 429 (Too Many Requests):**
   - Проверяйте заголовок `Retry-After`
   - Реализуйте автоматическую задержку перед повторной попыткой

---

## 10. Webhook-уведомления для истории платежей

### 10.1 Концепция вебхуков

Вебхуки позволяют получать уведомления о событиях платежей в реальном времени, избегая необходимости постоянного опроса API.

**Ссылка на документацию:** https://docs.networxpay.com/en/using_api/webhooks/

### 10.2 Настройка webhook URL

**В запросе на создание транзакции:**

```json
{
  "notification_url": "https://your-domain.com/api/webhooks/networx",
  ...
}
```

### 10.3 Аутентификация вебхука

**Метод:** HTTP Basic Authentication  
**Учетные данные:** Shop ID (username) и Secret Key (password)

### 10.4 Проверка подлинности вебхука

Каждый webhook-запрос содержит заголовок `Content-Signature` с RSA-подписью:

```http
Content-Signature: {base64_encoded_signature}
```

**Алгоритм проверки:**
1. Получите публичный RSA-ключ из back office Networx
2. Извлеките raw body запроса (без десериализации)
3. Проверьте подпись используя SHA256
4. Сравните с подписью из заголовка `Content-Signature`

**Пример PHP-кода проверки подписи:**

```php
$rawBody = file_get_contents('php://input');
$signature = $_SERVER['HTTP_CONTENT_SIGNATURE'];

$public_key = str_replace(["\r\n", "\n"], '', $shop_public_key);
$public_key = chunk_split($public_key, 64);
$public_key = "-----BEGIN PUBLIC KEY-----\n$public_key-----END PUBLIC KEY-----";

$signature = base64_decode($signature);
$key = openssl_pkey_get_public($public_key);
$isValid = openssl_verify($rawBody, $signature, $key, OPENSSL_ALGO_SHA256);
```

### 10.5 Формат webhook-уведомления

Webhook содержит те же данные, что и ответ API транзакции:

```json
{
  "transaction": {
    "uid": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
    "status": "successful",
    "amount": 100,
    "currency": "EUR",
    "description": "Test transaction",
    "type": "payment",
    "payment_method_type": "credit_card",
    "tracking_id": "tracking_id_000",
    "test": false,
    "created_at": "2024-10-14T13:07:01.836Z",
    "paid_at": "2024-10-14T13:07:05.495Z",
    "customer": {
      "email": "john@example.com"
    },
    "credit_card": {
      "last_4": "1006",
      "brand": "visa"
    }
  }
}
```

### 10.6 Обработка вебхуков

**Требования к вашему серверу:**
1. Возвращайте HTTP 200 OK в течение 10 секунд
2. Обрабатывайте вебхук асинхронно (в фоне)
3. Обеспечьте идемпотентность обработки

**Пример ответа:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "received"
}
```

### 10.7 График повторных попыток (Retry Schedule)

Если ваш сервер не ответил или вернул ошибку, Networx выполнит повторные попытки:

**Для платежных транзакций (15 попыток):**

| Попытка | Задержка | Суммарное время |
|---------|----------|-----------------|
| 1 | 15 секунд | 15 секунд |
| 2 | 46 секунд – 2.5 минуты | ~3 минуты |
| 3 | 4–10 минут | ~13 минут |
| 4 | 13–21 минут | ~34 минуты |
| 5 | 30–40 минут | ~1 час 14 минут |
| 15 | ~35.5–37 часов | ~37 часов |

### 10.8 Преимущества использования вебхуков

1. **Режим реального времени:**
   - Мгновенные обновления статусов платежей
   - Не требуется polling API

2. **Снижение нагрузки:**
   - Меньше запросов к API
   - Экономия ресурсов сервера

3. **Надежность:**
   - Автоматические повторные попытки
   - Гарантия доставки уведомлений

---

## 11. Шаги реализации (без изменения кода)

### 11.1 На стороне сервера (Backend)

**Этап 1: Подготовка учетных данных**
1. Войдите в back office Networx Payment Gateway
2. Получите Shop ID и Secret Key
3. Сохраните в переменных окружения (environment variables)

**Этап 2: Создание эндпоинта для запроса истории**
1. Создайте серверный маршрут (endpoint), например: `/api/payment-history`
2. Реализуйте HTTP Basic Auth с использованием Shop ID и Secret Key
3. Формируйте POST-запрос к `https://backoffice.networxpay.com/api/reports`
4. Добавьте необходимые заголовки (`Content-Type`, `X-Api-Version`)
5. Передавайте параметры фильтрации из клиентского запроса

**Этап 3: Обработка ответа**
1. Десериализуйте JSON-ответ
2. Обработайте ошибки (коды 400, 401, 500)
3. Верните данные клиенту в удобном формате

**Этап 4: Настройка вебхуков**
1. Создайте эндпоинт для приема вебхуков: `/api/webhooks/networx`
2. Реализуйте проверку подписи `Content-Signature`
3. Обработайте уведомления асинхронно
4. Верните HTTP 200 OK немедленно
5. Сохраняйте данные транзакций в базу данных

### 11.2 На стороне клиента (Frontend)

**Этап 1: Создание UI для фильтрации**
1. Форма с полями:
   - Диапазон дат (date picker)
   - Статус транзакции (dropdown)
   - Способ оплаты (dropdown)
2. Кнопка "Получить историю"

**Этап 2: Запрос к серверу**
1. При отправке формы вызывается серверный эндпоинт `/api/payment-history`
2. Передаются параметры фильтрации
3. Отображается индикатор загрузки

**Этап 3: Отображение результатов**
1. Таблица с колонками:
   - Дата и время
   - ID транзакции
   - Сумма и валюта
   - Статус
   - Способ оплаты
   - Ссылка на чек
2. Пагинация (если данных много)
3. Экспорт в CSV/Excel (опционально)

### 11.3 Обработка ошибок на клиенте

1. **Timeout (таймаут):**
   - Установите таймаут запроса 30 секунд
   - Показывайте сообщение об ошибке с возможностью повтора

2. **Network errors:**
   - Проверьте соединение с интернетом
   - Предложите повторить запрос

3. **API errors:**
   - Отображайте понятные сообщения пользователю
   - Логируйте технические детали для разработчиков

---

## 12. Примеры запросов и ответов из документации

### 12.1 Пример 1: Получение всех успешных платежей за день

**Запрос:**

```http
POST https://backoffice.networxpay.com/api/reports
Content-Type: application/json
X-Api-Version: 2
Authorization: Basic c2hvcF9pZDpzZWNyZXRfa2V5

{
  "report_params": {
    "date_type": "paid_at",
    "date": "2024-10-14",
    "status": "successful",
    "payment_method_type": "credit_card",
    "time_zone": "Europe/Moscow"
  }
}
```

**Ответ:**

```json
{
  "transactions": [
    {
      "uid": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
      "status": "successful",
      "amount": 10000,
      "currency": "RUB",
      "description": "Order #12345",
      "type": "payment",
      "payment_method_type": "credit_card",
      "tracking_id": "ORDER-12345",
      "test": false,
      "created_at": "2024-10-14T10:30:00.000Z",
      "paid_at": "2024-10-14T10:30:15.000Z",
      "customer": {
        "email": "customer@example.com"
      },
      "credit_card": {
        "brand": "visa",
        "last_4": "4242"
      }
    }
  ]
}
```

### 12.2 Пример 2: Получение неудачных платежей

**Запрос:**

```http
POST https://backoffice.networxpay.com/api/reports
Content-Type: application/json
X-Api-Version: 2
Authorization: Basic c2hvcF9pZDpzZWNyZXRfa2V5

{
  "report_params": {
    "date_type": "created_at",
    "date": "2024-10-14",
    "status": "failed",
    "payment_method_type": "credit_card",
    "time_zone": "Etc/UTC"
  }
}
```

**Ответ:**

```json
{
  "transactions": [
    {
      "uid": "abc123-failed-transaction",
      "status": "failed",
      "amount": 5000,
      "currency": "EUR",
      "description": "Subscription renewal",
      "type": "payment",
      "payment_method_type": "credit_card",
      "tracking_id": "SUB-789",
      "message": "Insufficient funds",
      "test": false,
      "created_at": "2024-10-14T08:15:00.000Z",
      "customer": {
        "email": "user@example.com"
      },
      "credit_card": {
        "brand": "master",
        "last_4": "5555"
      }
    }
  ]
}
```

### 12.3 Пример 3: Webhook-уведомление о платеже

**Входящий HTTP-запрос на ваш сервер:**

```http
POST https://your-domain.com/api/webhooks/networx
Content-Type: application/json
Content-Signature: SGVsbG8gV29ybGQhIFRoaXMgaXMgYSB0ZXN0IHNpZ25hdHVyZQ==
Authorization: Basic c2hvcF9pZDpzZWNyZXRfa2V5

{
  "transaction": {
    "uid": "dd6ee60c-d30a-4348-b84c-86a4ef1a137d",
    "status": "successful",
    "amount": 100,
    "currency": "EUR",
    "description": "Test transaction",
    "type": "payment",
    "payment_method_type": "credit_card",
    "tracking_id": "tracking_id_000",
    "message": "Successfully processed",
    "test": false,
    "created_at": "2024-10-14T13:07:01.836Z",
    "updated_at": "2024-10-14T13:07:05.530Z",
    "paid_at": "2024-10-14T13:07:05.495Z",
    "credit_card": {
      "holder": "John Doe",
      "brand": "visa",
      "last_4": "1006",
      "exp_month": 10,
      "exp_year": 2027
    },
    "customer": {
      "ip": "127.0.0.1",
      "email": "john@example.com"
    },
    "payment": {
      "auth_code": "654321",
      "message": "Payment was approved",
      "amount": 100,
      "currency": "EUR"
    }
  }
}
```

**Ваш ответ:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "received"
}
```

---

## 13. Дополнительные соображения

### 13.1 Безопасность

1. **Хранение учетных данных:**
   - Никогда не храните Secret Key в клиентском коде
   - Используйте переменные окружения на сервере
   - Применяйте шифрование для хранения в базе данных

2. **HTTPS:**
   - Все запросы к API должны использовать HTTPS
   - Проверяйте SSL-сертификаты

3. **Проверка вебхуков:**
   - Обязательно проверяйте подпись `Content-Signature`
   - Валидируйте структуру полученных данных

### 13.2 Производительность

1. **Кэширование:**
   - Кэшируйте результаты запросов на сервере
   - Используйте Redis или Memcached
   - Время жизни кэша: 5-15 минут

2. **Индексация базы данных:**
   - Создайте индексы на `tracking_id`, `customer.email`, `created_at`
   - Это ускорит поиск по истории платежей

3. **Асинхронная обработка:**
   - Обрабатывайте вебхуки в фоновых задачах (background jobs)
   - Используйте очереди (Redis Queue, Bull, etc.)

### 13.3 Мониторинг

1. **Логирование:**
   - Логируйте все запросы к API
   - Записывайте время ответа
   - Отслеживайте ошибки

2. **Алерты:**
   - Настройте уведомления при высоком проценте ошибок
   - Мониторьте доступность API

3. **Аналитика:**
   - Отслеживайте количество транзакций
   - Анализируйте причины неудачных платежей

---

## 14. Тестирование

### 14.1 Тестовый режим

Networx Pay поддерживает тестовый режим (test mode) для безопасного тестирования интеграции.

**Ссылка на документацию:** https://docs.networxpay.com/en/using_api/test_mode/

**Тестовые данные карт:** https://docs.networxpay.com/en/integration/api_for_card_payments/test_card_data/

### 14.2 Параметр `test` в транзакциях

Все тестовые транзакции имеют флаг:

```json
{
  "test": true
}
```

**Рекомендация:** Фильтруйте тестовые транзакции в производственной среде.

---

## 15. Полезные ссылки на документацию

### Основные разделы

1. **Главная страница документации:**  
   https://docs.networxpay.com/

2. **Отчеты для магазинов (Reports for shops):**  
   https://docs.networxpay.com/en/payment_management/reports/reports_shop/

3. **API постраничных отчетов (Paginated reports):**  
   https://docs.networxpay.com/en/payment_management/reports/paginated_report/

4. **Webhook-уведомления:**  
   https://docs.networxpay.com/en/using_api/webhooks/

5. **Shop ID и Secret Key:**  
   https://docs.networxpay.com/en/using_api/shop_id_and_secret_key/

6. **Статусы транзакций:**  
   https://docs.networxpay.com/en/integration/api_for_card_payments/transaction_statuses/

7. **Типы транзакций:**  
   https://docs.networxpay.com/en/integration/api_for_card_payments/transaction_types/

8. **Коды ошибок API:**  
   https://docs.networxpay.com/en/using_api/api_v3_and_api_v2_error_codes/

9. **Тестовый режим:**  
   https://docs.networxpay.com/en/using_api/test_mode/

10. **Тестовые данные карт:**  
    https://docs.networxpay.com/en/integration/api_for_card_payments/test_card_data/

### Дополнительные материалы

11. **Платежные методы:**  
    https://docs.networxpay.com/en/payment_methods/

12. **Проверка транзакций:**  
    https://docs.networxpay.com/en/using_api/transaction_verification/

13. **Идемпотентные запросы:**  
    https://docs.networxpay.com/en/using_api/idempotent_requests/

14. **Postman-коллекция:**  
    https://docs.networxpay.com/en/using_api/postman_collection/

15. **Tokenization service:**  
    https://docs.networxpay.com/en/additional_services/tokenization_service/

---

## 16. Заключение и рекомендации

### Ключевые выводы

1. **Для получения истории платежей используйте:**
   - Эндпоинт: `https://backoffice.networxpay.com/api/reports`
   - Метод: POST
   - Аутентификация: HTTP Basic Auth

2. **Для больших объемов данных (>1000 транзакций):**
   - Используйте API постраничных отчетов
   - Разбивайте запросы по датам

3. **Для обновлений в реальном времени:**
   - Настройте webhook-уведомления
   - Реализуйте проверку подписи

### Рекомендуемый подход к реализации

**Шаг 1:** Реализуйте базовый функционал получения истории через API  
**Шаг 2:** Добавьте обработку вебхуков для режима реального времени  
**Шаг 3:** Оптимизируйте производительность (кэширование, индексы)  
**Шаг 4:** Настройте мониторинг и логирование  
**Шаг 5:** Проведите тестирование в test mode  

### Критически важные аспекты

⚠️ **Безопасность:**
- Храните Secret Key только на сервере
- Проверяйте подписи вебхуков
- Используйте HTTPS для всех запросов

⚠️ **Надежность:**
- Реализуйте retry logic для ошибок API
- Обрабатывайте вебхуки идемпотентно
- Возвращайте HTTP 200 для вебхуков в течение 10 секунд

⚠️ **Производительность:**
- Кэшируйте результаты запросов
- Избегайте излишних обращений к API
- Обрабатывайте вебхуки асинхронно

---

**Дата составления отчета:** 10 октября 2024  
**Версия API:** 2  
**Источник документации:** https://docs.networxpay.com/




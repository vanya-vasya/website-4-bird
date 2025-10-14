# 🔧 Neon + Vercel Integration Fix

**Issue**: `Failed to set env vars in please make sure that all required env vars are set`  
**Причина**: Neon интеграция не может автоматически установить переменные  
**Решение**: Установить вручную через Vercel Dashboard

---

## ✅ ШАГ 1: Добавьте ВСЕ переменные в Vercel

### Важно! Нужно добавить ИМЕННО DATABASE_URL

Neon интеграция ищет эту переменную. Добавьте её ПЕРВОЙ.

### 1.1 Откройте Environment Variables:
```
https://vercel.com/vladis-projects-8c520e18/website-3/settings/environment-variables
```

### 1.2 Добавьте DATABASE_URL (КРИТИЧНО!)

**Нажмите "Add New"**

```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
Environments: ✅ Production ✅ Preview ✅ Development
```

**Нажмите "Save"**

---

### 1.3 Добавьте WEBHOOK_SECRET (для Clerk)

**Нажмите "Add New"**

```
Name: WEBHOOK_SECRET
Value: whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj
Type: Secret (включите галочку "Sensitive")
Environments: ✅ Production ✅ Preview ✅ Development
```

**Нажмите "Save"**

---

### 1.4 Добавьте PostgreSQL переменные (для совместимости)

**PGHOST**:
```
Name: PGHOST
Value: ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
Environments: ✅ Production ✅ Preview ✅ Development
```

**PGUSER**:
```
Name: PGUSER
Value: neondb_owner
Environments: ✅ Production ✅ Preview ✅ Development
```

**PGDATABASE**:
```
Name: PGDATABASE
Value: neondb
Environments: ✅ Production ✅ Preview ✅ Development
```

**PGPASSWORD**:
```
Name: PGPASSWORD
Value: npg_ePTqtkSN7G3W
Type: Secret (включите галочку "Sensitive")
Environments: ✅ Production ✅ Preview ✅ Development
```

---

## ✅ ШАГ 2: Проверьте интеграцию Neon

### 2.1 Откройте Integrations:
```
https://vercel.com/vladis-projects-8c520e18/website-3/settings/integrations
```

### 2.2 Найдите Neon интеграцию

**Если НЕ установлена**:
1. Нажмите "Browse Marketplace"
2. Найдите "Neon"
3. Нажмите "Add Integration"
4. Выберите проект: `website-3`
5. В Neon выберите: `br-muddy-shape-admsxe51`
6. Confirm

**Если установлена, но не работает**:
1. Нажмите на интеграцию Neon
2. Нажмите "Configure"
3. Проверьте что проект правильно связан
4. Если нужно - переподключите

---

## ✅ ШАГ 3: Альтернатива - Отключить интеграцию Neon

**Если интеграция продолжает ругаться**, отключите её и работайте напрямую:

### 3.1 Удалите интеграцию Neon:
```
Integrations → Neon → Configure → Remove Integration
```

### 3.2 Убедитесь что переменные установлены вручную:

Проверьте в Environment Variables:
- ✅ DATABASE_URL
- ✅ WEBHOOK_SECRET
- ✅ PGHOST, PGUSER, PGDATABASE, PGPASSWORD

### 3.3 Это работает БЕЗ интеграции!

Вам не нужна интеграция Neon, если у вас есть DATABASE_URL. Prisma подключится напрямую.

---

## ✅ ШАГ 4: Redeploy

После добавления переменных:

```bash
cd /Users/vladi/Documents/Projects/webapps/yum-mi

git commit --allow-empty -m "Add DATABASE_URL and WEBHOOK_SECRET"
git push origin production/migrate-to-yum-mi-domain
```

Или через Dashboard:
```
Deployments → Latest → "..." → Redeploy
```

---

## ✅ ШАГ 5: Проверка

После deploy проверьте:

### 5.1 Check Deployment Logs:
```
Vercel Dashboard → Deployments → Latest → Logs
```

Ищите:
- ✅ "Prisma generated" - Prisma клиент сгенерирован
- ✅ "Build completed" - Билд успешен
- ❌ Любые ошибки DATABASE_URL

### 5.2 Test Production Site:
```
https://website-3-hhylc1d5b-vladis-projects-8c520e18.vercel.app/dashboard
```

Должно:
- ✅ Загрузиться без ошибок
- ✅ Показать dashboard
- ✅ Не показывать "Application error"

### 5.3 Test Clerk Webhook:
```
1. Зарегистрируйте тестового пользователя
2. Проверьте Clerk Dashboard → Webhooks → Logs
3. Должен быть запрос к /api/webhooks/clerk со status 200
4. Проверьте базу - должен появиться пользователь
```

---

## 📋 Полный список переменных для Vercel

Скопируйте это для справки:

```bash
# === КРИТИЧНЫЕ (обязательно!) ===

# Database Connection
DATABASE_URL=postgresql://neondb_owner:npg_ePTqtkSN7G3W@ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Clerk Webhook (для создания пользователей)
WEBHOOK_SECRET=whsec_Evuu+3/9O3LgKvhQQ/AyJc6hIlC2pmUj

# === CLERK AUTH (уже установлены) ===

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# === PostgreSQL (опционально, для совместимости) ===

PGHOST=ep-sweet-waterfall-adkazkpm-pooler.c-2.us-east-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_ePTqtkSN7G3W

# === NETWORX (уже установлены) ===

NETWORX_SHOP_ID=29959
NETWORX_SECRET_KEY=dbfb6f4e977f49880a6ce3c939f1e7be645a5bb2596c04d9a3a7b32d52378950
NETWORX_API_URL=https://checkout.networxpay.com
NETWORX_TEST_MODE=false

# === APP CONFIG ===

NEXT_PUBLIC_APP_URL=https://www.yum-mi.com
```

---

## 🎯 Что делать с ошибкой Neon

**Эта ошибка**: `Failed to set env vars in please make sure that all required env vars are set`

**Означает**: Neon интеграция пытается автоматически установить переменные, но не может

**Решения** (попробуйте по порядку):

### Решение 1: Игнорировать (рекомендую!)

Эта ошибка из **Neon интеграции**, но вы уже установили переменные **вручную**. 

**Проверка**: Если после deploy сайт работает - ошибку можно игнорить.

---

### Решение 2: Отключить интеграцию Neon

Если ошибка мешает:

1. Integrations → Neon → Configure
2. Remove Integration
3. Переменные останутся (они в Environment Variables)
4. Redeploy

**Результат**: Ошибки не будет, всё будет работать через DATABASE_URL

---

### Решение 3: Переподключить интеграцию

1. Удалить интеграцию Neon
2. Очистить все PG* переменные
3. Оставить только DATABASE_URL и WEBHOOK_SECRET
4. Заново добавить интеграцию Neon
5. В интеграции выбрать проект `br-muddy-shape-admsxe51`

---

## ✅ Быстрая проверка что всё работает

Выполните после deploy:

```bash
# 1. Проверьте сайт
open https://website-3-hhylc1d5b-vladis-projects-8c520e18.vercel.app/dashboard

# 2. Проверьте логи
# Vercel Dashboard → Logs → должны быть без ошибок DATABASE

# 3. Проверьте подключение локально
cd /Users/vladi/Documents/Projects/webapps/yum-mi
node scripts/investigate-neon-user.js
# Должно: ✅ Database connected successfully
```

---

## 🆘 Если всё ещё не работает

### Проверьте что переменные ТОЧНО установлены:

1. **Vercel Dashboard** → Environment Variables
2. **Найдите DATABASE_URL**
3. **Проверьте значение** - должно быть с `.c-2.`
4. **Проверьте окружения** - должны быть все 3 (Prod/Preview/Dev)

### Если переменная есть, но не работает:

```bash
# Удалите и создайте заново
1. Remove DATABASE_URL
2. Add DATABASE_URL (с правильным значением)
3. Save
4. Redeploy
```

---

## 📊 Состояние системы

**После правильной настройки**:

```
✅ DATABASE_URL установлен в Vercel
✅ WEBHOOK_SECRET установлен в Vercel
✅ Локально база подключается
✅ Neon endpoint активен
⏳ Ждём deploy в Vercel
```

**После deploy должно быть**:

```
✅ Сайт работает
✅ Dashboard загружается
✅ База подключена
✅ Можно регистрировать пользователей
✅ Webhook создаёт записи в базе
```

---

## 🔑 Ключевые моменты

1. **DATABASE_URL** - это САМАЯ важная переменная
2. **WEBHOOK_SECRET** - нужен для создания пользователей через Clerk
3. **PG*** переменные - опциональны, можно без них
4. **Neon интеграция** - опциональна, можно без неё
5. **`.c-2.`** в hostname - критично важно!

---

**Статус**: Переменные добавлены, нужен redeploy  
**Действие**: Redeploy → Проверить сайт  
**Ожидание**: Сайт заработает после deploy


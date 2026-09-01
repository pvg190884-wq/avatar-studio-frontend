# Avatar Studio — фронтенд (Фаза 1)

React + Vite. Три кейса генерации, вход/регистрация через Supabase Auth,
пополнение баланса (Crypto Pay / СБП), опрос статуса задачи и отдача видео.

## Деплой без терминала (GitHub web + Vercel)

1. **Создай новый репозиторий** на GitHub (например `avatar-studio-frontend`), пустой, без README.
2. На странице репозитория → **Add file → Upload files** → перетащи в браузер всю папку `avatar-studio-frontend`
   (современные браузеры поддерживают загрузку папки целиком) → Commit changes.
   Файл `.env.local` в архиве отсутствует специально — секреты никогда не должны попадать в git.
3. Зайди на **vercel.com** → **Add New → Project** → выбери этот репозиторий из GitHub (потребуется
   один раз разрешить Vercel доступ к твоим репозиториям).
4. Vercel сам определит фреймворк (Vite) — ничего менять в Build settings не нужно.
5. В разделе **Environment Variables** перед деплоем добавь три переменные (значения — из `.env.example`,
   реальный `VITE_SUPABASE_ANON_KEY` возьми из Supabase → Project Settings → API):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL`
6. Нажми **Deploy**. Через минуту получишь рабочий URL вида `avatar-studio-frontend.vercel.app`.
7. Дальше любой пуш/загрузка нового файла в `main` на GitHub автоматически передеплоит сайт — терминал
   не нужен вообще.

## Что нужно доделать на бэкенде (см. чат)

- Добавить в Railway переменную `RUNPOD_LIPSYNC_ENDPOINT_ID` (для Кейса 3).
- На данный момент баланс не списывается автоматически при генерации — бэкенд отдаёт видео
  независимо от баланса. Фронтенд только *предупреждает*, если оценочной стоимости не хватает
  на балансе, но не блокирует запрос. Списание/проверку баланса перед отправкой в RunPod нужно
  добавить в `routers/runpod_avatar.py` отдельным шагом, когда будешь готов.
- Формат ответа `/api/billing/balance` и `/api/billing/estimate` в OpenAPI-спеке не типизирован
  (`schema: {}`), поэтому фронтенд пробует несколько вероятных названий полей
  (`balance_usd`/`balance`, `cost_usd`/`estimated_cost_usd`). Если названия полей в реальном
  ответе другие — подстроить в `src/api.js` и местах, где это читается (`Header.jsx`,
  `CaseTwoForm.jsx`, `CaseThreeForm.jsx`, `App.jsx`).
- `create-deposit` ожидается с полем `pay_url` в ответе (ссылка на оплату Crypto Pay) —
  если у Crypto Pay другое название поля, поправить в `TopUpModal.jsx`.

# Paperclip i18n — правила изменений и деплоя

## Структура

| Что | Где |
|-----|-----|
| Рабочая ветка | `feature/i18n-russian` |
| Fork (origin) | `https://github.com/SergeK76/paperclip.git` |
| Upstream | `git@github.com:paperclipai/paperclip.git` |
| Prod-сервер | `aeza` (79.137.202.143, порт 8443, user `root`) |
| Приложение на сервере | `/opt/paperclip`, systemd user `paperclip` |
| Systemd-сервис | `paperclip` |
| Prod-URL | https://paperclip.sesias.com |
| Прокси | nginx → `127.0.0.1:3100` |

---

## Правила изменений (i18n)

### Принципы

- **Один коммит = одна группа файлов** (Group A / B / C …) или один крупный файл
- Ключи именуются иерархически: `<namespace>:<screen>.<element>` — например `common:nav.dashboard`
- Строки, встречающиеся в 3+ местах — в namespace `common`
- Технические термины, имена собственные (GitHub, Paperclip) — не переводятся
- Минимальное изменение: не рефакторить попутно

### Намespaces

| Namespace | Файлы |
|-----------|-------|
| `common` | Навигация, dashboard, inbox, компании, sidebar |
| `settings` | Все Settings-страницы |
| `onboarding` | Auth, Onboarding wizard |
| `agents` | Всё про агентов |
| `errors` | Сообщения об ошибках |
| `chat` | Чат/транскрипты |

### Процесс на один файл

1. Прочитать файл
2. Найти все hardcoded строки (JSX children, `placeholder`, `aria-label`, `title`, `alt`, tooltip)
3. Заменить на `t("ns:key")` с осмысленным ключом
4. Добавить `import { useTranslation } from "react-i18next"` и `const { t } = useTranslation(["ns"])` если ещё нет
5. Дописать ключ в `ui/src/i18n/locales/en/<ns>.json` (оригинал EN) и `ru/<ns>.json` (перевод)
6. Поставить `[x]` в `STAGE2_EXTRACTION.md`

### Плюрали

- **EN:** суффиксы `_one` / `_other`
- **RU:** суффиксы `_one` / `_few` / `_many` / `_other`
- Вызов: `t("key", { count })`
- Интерполяция: `t("key", { name })` → в JSON: `"Hello {{name}}"`

### Module-level массивы с переводами

Если массив `items = [{ label: "Foo" }]` объявлен на уровне модуля — **перенести внутрь компонента** (после `const { t } = ...`).

### Функции, принимающие строки

Функции-помощники (например `runFailureMessage`, `sourceMeta`) нужно обновить: добавить параметр `t: TFunction` и передавать его при вызове.

---

## Проверка перед коммитом

```bash
# Валидация JSON
python3 -m json.tool ui/src/i18n/locales/en/common.json > /dev/null && echo OK
python3 -m json.tool ui/src/i18n/locales/ru/common.json > /dev/null && echo OK
```

---

## Коммит и push

```bash
git add <нужные файлы>
git commit -m "feat(ui/i18n): <описание>"
git push origin feature/i18n-russian
```

---

## Деплой на paperclip.sesias.com

### Первый раз (уже сделано, для справки)

```bash
# На сервере — добавить fork как remote
sudo -u paperclip bash -c '
  cd /opt/paperclip &&
  git remote add fork https://github.com/SergeK76/paperclip.git &&
  git fetch fork feature/i18n-russian &&
  git checkout -b feature/i18n-russian --track fork/feature/i18n-russian
'
# Установить зависимости
sudo -u paperclip bash -c 'cd /opt/paperclip && echo y | pnpm install'
```

### Обычный деплой (после каждого push)

```bash
# 1. Подтянуть изменения
ssh -p 8443 root@79.137.202.143 \
  "sudo -u paperclip bash -c 'cd /opt/paperclip && git pull fork feature/i18n-russian'"

# 2. Собрать UI
ssh -p 8443 root@79.137.202.143 \
  "sudo -u paperclip bash -c 'cd /opt/paperclip && pnpm --filter @paperclipai/ui build'"

# 3. Перезапустить сервис
ssh -p 8443 root@79.137.202.143 "systemctl restart paperclip"

# 4. Проверить статус
ssh -p 8443 root@79.137.202.143 "systemctl is-active paperclip"
curl -s -o /dev/null -w "%{http_code}" https://paperclip.sesias.com/
```

### Если появились новые зависимости в package.json

```bash
ssh -p 8443 root@79.137.202.143 \
  "sudo -u paperclip bash -c 'cd /opt/paperclip && echo y | pnpm install'"
```

### Откат к upstream master

```bash
ssh -p 8443 root@79.137.202.143 "sudo -u paperclip bash -c '
  cd /opt/paperclip &&
  git checkout master &&
  pnpm --filter @paperclipai/ui build
' && systemctl restart paperclip"
```

---

## Проверка переключения языка

1. Открыть https://paperclip.sesias.com
2. Войти → перейти в **Profile Settings** (`/instance/settings/profile`)
3. Найти блок Language → переключить на **Русский**
4. Язык сохраняется в `localStorage` (`paperclip-lang`)
5. Экраны Auth, Onboarding, Settings → должны быть на русском

---

## Журнал прогресса

- `STAGE2_EXTRACTION.md` — план, чекбоксы, счётчик групп
- `LOG.md` — детальная запись что и когда изменено

*Создано: 2026-04-18*

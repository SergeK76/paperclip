# Paperclip i18n — протокол выполненных действий

---

## 2026-04-19

### Батч A — Issues компоненты

#### IssueGroupHeader.tsx
- Анализ: нет пользовательских строк, `label` приходит пропом от родителя.
- Действие: файл пропущен, изменений нет.

#### IssueRow.tsx, IssueColumns.tsx, IssueFiltersPopover.tsx
- Добавлены ключи в `ui/src/i18n/locales/ru/issues.json`:
  - `row.*` — aria-labels для кнопок "Отметить как прочитанное" и "Убрать из inbox"
  - `columns.*` — метки и описания колонок, статические строки пикера, тултипы, значения пустых состояний
  - `filters.*` — весь UI панели фильтров (заголовки, кнопки, секции, плейсхолдеры, быстрые фильтры)
- Изменения в `IssueRow.tsx`: добавлен `useTranslation("issues")`, 2 aria-label заменены на `t()`
- Изменения в `IssueColumns.tsx`: добавлен `useTranslation("issues")`, объекты `issueColumnLabels`/`issueColumnDescriptions` заменены на `t()`, все статические строки извлечены
- Изменения в `IssueFiltersPopover.tsx`: добавлен `useTranslation("issues")`, все видимые строки и aria-labels заменены на `t()`

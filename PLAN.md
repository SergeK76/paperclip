# Paperclip i18n — план русификации компонентов

Рабочая директория: `ui/src/`
Namespace-файлы: `ui/src/i18n/locales/ru/`

## Статус

Завершено (страницы + Group A–I): 63/~162 файла  
Осталось: компоненты

---

## Батч A — Issues (компоненты) [ТЕКУЩИЙ]

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/IssueRow.tsx` | ✅ | issues |
| `components/IssueGroupHeader.tsx` | ✅ нет строк | — |
| `components/IssueColumns.tsx` | ✅ | issues |
| `components/IssueFiltersPopover.tsx` | ✅ | issues |

## Батч B — Issues (тяжёлые)

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/IssueProperties.tsx` | ⬜ | issues |
| `components/NewIssueDialog.tsx` | ⬜ | issues |

## Батч C — Issues (большие)

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/IssuesList.tsx` | ⬜ | issues |
| `components/IssueChatThread.tsx` | ⬜ | issues |
| `components/IssuesQuicklook.tsx` | ⬜ | issues |
| `components/IssueLinkQuicklook.tsx` | ⬜ | issues |

## Батч D — Goals

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/NewGoalDialog.tsx` | ⬜ | goals |
| `components/GoalProperties.tsx` | ⬜ | goals |
| `components/GoalTree.tsx` | ⬜ | goals |

## Батч E — Projects

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/NewProjectDialog.tsx` | ⬜ | projects |
| `components/ProjectProperties.tsx` | ⬜ | projects |
| `components/ProjectWorkspaceSummaryCard.tsx` | ⬜ | projects |

## Батч F — Approvals / Activity

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/ApprovalCard.tsx` | ⬜ | approvals |
| `components/ApprovalPayload.tsx` | ⬜ | approvals |
| `components/ActivityRow.tsx` | ⬜ | activity |
| `components/ActivityCharts.tsx` | ⬜ | activity |

## Батч G — Workspace / Agents

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/WorkspaceRuntimeControls.tsx` | ⬜ | workspaces |
| `components/IssueWorkspaceCard.tsx` | ⬜ | workspaces |
| `components/ExecutionWorkspaceCloseDialog.tsx` | ⬜ | workspaces |
| `components/RoutineRunVariablesDialog.tsx` | ⬜ | routines |
| `components/RoutineVariablesEditor.tsx` | ⬜ | routines |

## Батч H — Фильтры / Канбан

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/FilterBar.tsx` | ⬜ | common |
| `components/KanbanBoard.tsx` | ⬜ | issues |

## Батч I — Finance / Billing

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/BillerSpendCard.tsx` | ⬜ | costs |
| `components/BudgetSidebarMarker.tsx` | ⬜ | costs |
| `components/BudgetPolicyCard.tsx` | ⬜ | costs |
| `components/BudgetIncidentCard.tsx` | ⬜ | costs |
| `components/FinanceBillerCard.tsx` | ⬜ | costs |
| `components/FinanceTimelineCard.tsx` | ⬜ | costs |
| `components/FinanceKindCard.tsx` | ⬜ | costs |
| `components/AccountingModelCard.tsx` | ⬜ | costs |
| `components/MetricCard.tsx` | ⬜ | costs |

## Батч J — Subscriptions / Quotas

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/CodexSubscriptionPanel.tsx` | ⬜ | settings |
| `components/ClaudeSubscriptionPanel.tsx` | ⬜ | settings |
| `components/QuotaBar.tsx` | ⬜ | settings |
| `components/ProviderQuotaCard.tsx` | ⬜ | settings |

## Батч K — Мелкие компоненты

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/EmptyState.tsx` | ⬜ | common |
| `components/StatusBadge.tsx` | ⬜ | common |
| `components/CopyText.tsx` | ⬜ | common |
| `components/PageTabBar.tsx` | ⬜ | common |
| `components/SidebarSection.tsx` | ⬜ | common |
| `components/WorktreeBanner.tsx` | ⬜ | common |
| `components/DevRestartBanner.tsx` | ⬜ | common |
| `components/SwipeToArchive.tsx` | ⬜ | common |
| `components/LiveRunWidget.tsx` | ⬜ | common |
| `components/OutputFeedbackButtons.tsx` | ⬜ | common |

## Батч L — Модалки / Диалоги

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/ImageGalleryModal.tsx` | ⬜ | common |
| `components/DocumentDiffModal.tsx` | ⬜ | common |
| `components/PathInstructionsModal.tsx` | ⬜ | common |
| `components/ExecutionParticipantPicker.tsx` | ⬜ | common |
| `components/InlineEntitySelector.tsx` | ⬜ | common |
| `components/IssueDocumentsSection.tsx` | ⬜ | issues |
| `components/EnvVarEditor.tsx` | ⬜ | common |
| `components/ScheduleEditor.tsx` | ⬜ | common |
| `components/JsonSchemaForm.tsx` | ⬜ | common |
| `components/InlineEditor.tsx` | ⬜ | common |
| `components/PropertiesPanel.tsx` | ⬜ | common |

## Батч M — Чат / Запуски

| Файл | Статус | Namespace |
|------|--------|-----------|
| `components/RunChatSurface.tsx` | ⬜ | agents |
| `components/transcript/RunTranscriptView.tsx` | ⬜ | agents |
| `components/EntityRow.tsx` | ⬜ | common |
| `components/PackageFileTree.tsx` | ⬜ | common |

## Без строк (проверить, пропустить)

| Файл | Причина |
|------|---------|
| `components/IssueGroupHeader.tsx` | ✅ нет строк — label приходит пропом |
| `components/HermesIcon.tsx` | иконка |
| `components/PriorityIcon.tsx` | иконка |
| `components/CompanyPatternIcon.tsx` | иконка |
| `components/OpenCodeLogoIcon.tsx` | иконка |
| `components/StatusIcon.tsx` | иконка |
| `components/Identity.tsx` | нет строк |
| `components/ToastViewport.tsx` | нет строк |
| `components/ScrollToBottom.tsx` | нет строк |
| `components/AsciiArtAnimation.tsx` | анимация |
| `components/MarkdownBody.tsx` | рендер markdown |
| `components/MarkdownEditor.tsx` | редактор |
| `components/CommentThread.tsx` | проверить |

## UX Lab / Design (низкий приоритет)

| Файл | Статус |
|------|--------|
| `pages/InviteUxLab.tsx` | ⬜ |
| `pages/RunTranscriptUxLab.tsx` | ⬜ |
| `pages/DesignGuide.tsx` | ⬜ |
| `pages/IssueChatUxLab.tsx` | ⬜ |

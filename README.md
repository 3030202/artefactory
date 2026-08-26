# Prompt Ops Control Tower (`artefactory`)

> **Мультимодульная система управления, поиска и ведения реестров артефактов ИИ: Промпты, Скиллы, Воркфлоу (DAG), MCP-серверы и Системные директивы.**

---

## 🎨 Изолированные реестры и индивидуальные цветовые гаммы

Для каждого типа артефакта реализована выделенная страница с уникальной цветовой палитрой, набором специализированных окон, редакторов и сценариев тестирования:

| Реестр | Цветовая гамма | Специализированный инструментарий |
| :--- | :--- | :--- |
| **🟣 Prompts Studio** | **Electric Violet & Indigo** (`#8b5cf6`, `#6366f1`) | • Шаблонизатор с переменными `{{var}}`<br>• Интерактивная песочница с подстановкой переменных<br>• Счётчик токенов, версионирование, visual diff и экспорт в Python/JS |
| **🟢 Skills Registry** | **Emerald & Mint** (`#10b981`, `#059669`) | • Live-редактор и валидатор YAML frontmatter в `SKILL.md`<br>• Инспектор требуемых тулов и триггеров<br>• Генератор бандла и экспорт в `.agents/skills/<name>/` |
| **🟡 Workflows (DAG)** | **Solar Amber & Gold** (`#f59e0b`, `#d97706`) | • Интерактивный DAG Canvas с кривыми Безье<br>• Инспектор входных и выходных узлов<br>• Пошаговый симулятор выполнения пайплайна с терминалом логов |
| **🌐 MCP Servers** | **Cyber Cyan & Sky** (`#06b6d4`, `#0284c7`) | • Инспектор инструментов (Tools Inspector)<br>• Интерактивный тестер вызова тулов по JSON-схеме<br>• Live Ping / Healthcheck и генератор `mcp_config.json` |
| **🔴 Rules & Protocols** | **Neon Rose & Magenta** (`#f43f5e`, `#e11d48`) | • Реестр директив `AGENTS.md` и `GEMINI.md`<br>• Контроль приоритетов (CRITICAL, HIGH, MEDIUM)<br>• Компилятор единого системного промпта |

---

## 🔍 Глобальный Omni-Search (`Ctrl+K` / `Cmd+K`)

Мгновенный полнотекстовый поиск по всем реестрам одновременно с фильтрацией по категориям, тегам, авторам и быстрым переходом к нужному артефакту.

---

## 🚀 Быстрый старт

### 1. Локальный запуск (Node.js 20+)

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Запуск в production
npm start

# Запуск тестов
npm test
```

Сервер доступен по адресу: **`http://localhost:4000`**

### 2. Запуск в Docker

```bash
# Сборка и запуск через Docker Compose
docker-compose up -d --build

# Проверка статуса контейнера
docker-compose ps
```

---

## 🛠️ Архитектура проекта

```
artefactory/
├── server/
│   ├── index.js                  # Express API сервер и статика
│   ├── db.js                     # Локальное хранилище данных с версионированием и бекапом
│   ├── seed.js                   # Предустановленные артефакты 5 категорий
│   └── routes/
│       ├── prompts.js            # REST API промптов + песочница
│       ├── skills.js             # REST API скиллов + валидатор SKILL.md
│       ├── workflows.js          # REST API воркфлоу + DAG симулятор
│       ├── mcp.js                # REST API MCP + инспектор тулов + mcp_config.json
│       ├── rules.js              # REST API правил + компилятор директив
│       ├── search.js             # Omni-Search движок
│       └── system.js             # Состояние проекта (STATE.json) и статистика
├── client/
│   ├── index.html                # Основная точка входа Control Tower UI
│   ├── css/
│   │   ├── main.css              # Базовая дизайн-система, Glassmorphism
│   │   ├── themes.css            # Индивидуальные цветовые гаммы (Violet, Mint, Amber, Cyan, Rose)
│   │   └── components.css        # Стили модалок, карточек, DAG-канваса, диффов
│   └── js/
│       ├── app.js                # SPA Роутер, Omni-search (Ctrl+K), темы
│       ├── api.js                # API клиент
│       ├── components/
│       │   ├── dagCanvas.js      # SVG интерактивный рендерер графов
│       │   ├── diffViewer.js     # Визуализатор различий между версиями
│       │   └── toast.js          # Система всплывающих уведомлений
│       └── views/
│           ├── dashboardView.js  # Сводный дашборд и телеметрия
│           ├── promptsView.js    # Промпты, шаблонизатор и песочница
│           ├── skillsView.js     # Скиллы и валидатор SKILL.md
│           ├── workflowsView.js  # Воркфлоу и симулятор исполнения
│           ├── mcpView.js        # MCP серверы и тестирование тулов
│           └── rulesView.js      # Правила и компилятор системного промпта
├── data/
│   ├── db.json                   # Персистентная база данных
│   └── backups/                  # Автоматические резервные копии
├── test/
│   ├── api.test.js               # Модульные тесты
│   └── e2e_api_verify.js         # Сквозное тестирование API
├── Dockerfile                    # Multi-stage production контейнер
├── docker-compose.yml            # Docker Compose оркестрация
├── STATE.json                    # Состояние проекта и фаз
└── EXECUTION_LOG.md              # Журнал исполнения
```

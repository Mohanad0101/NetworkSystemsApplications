# Student experience update — LX0–LX7

Дата: 2026-09-03

## Цель redesign

Практическая работа должна учить Linux, а не оформлению отчёта. Поэтому основной путь каждой лабораторной теперь строится по одному ритму:

**выполнить → проверить → сохранить главный результат → пройти короткий тест → отправить готовый отчёт**.

## Что изменено

- В начале лабораторной показан короткий маршрут и ожидаемый результат каждого этапа.
- Цвета имеют постоянное значение: синий — действие, зелёный — успешная контрольная точка, бирюзовый — текст в отчёт, жёлтый — подсказка, красный — предупреждение, фиолетовый — снимок экрана в отчёт.
- Для вывода терминала используется **текст**, а не фотография терминала. Это сохраняет читаемость и облегчает проверку.
- Снимки экрана оставлены только там, где важен именно визуальный контекст. В LX0 это состояние VirtualBox, импортированная копия и одновременный запуск VM. В LX1–LX5 обязательные доказательства в основном текстовые.
- У каждого доказательства есть стабильный номер (`LX1-01`, `LX2-03` и т. п.). Тот же номер используется на странице лабораторной и в Word-шаблоне.
- Добавлен локальный блокнот результатов. Текст сохраняется через `sessionStorage` только в текущей вкладке браузера; код не содержит отправки этих данных на сервер. Студент может скопировать все результаты или сохранить резервный TXT.
- Блокнот явно запрещает вставлять пароли, закрытые SSH-ключи, `/etc/shadow`, токены и другие секреты.
- Word-шаблоны LX0–LX7 уже оформлены как резервный путь. Основной путь проще: студент вводит данные и доказательства прямо в лаборатории, отвечает на три коротких вопроса и скачивает автоматически заполненный DOCX; PDF нужен только если преподаватель отдельно его требует.
- Для LX0, LX2, LX3, LX4 и LX5 основной комплект — один автоматически сформированный DOCX; PDF нужен только по требованию преподавателя. В LX1 дополнительно прикладывается созданный в самой лабораторной `archive/src.tar.gz`; повторно упаковывать его в ZIP не нужно.
- Необязательные задания скрыты в раскрывающемся блоке и не входят в основной отчёт без отдельного указания преподавателя.
- MCQ сокращены до вопросов, которые проверяют понимание решений и типичных ошибок: LX0 — 10, LX1 — 12, LX2 — 12, LX3 — 12, LX4 — 12, LX5 — 12. Foundation self-check — 12.

## Принцип доказательств

Каждый результат подтверждается **один раз**. Если требуется текст, снимок того же терминала не нужен. Если требуется снимок экрана, не нужно дублировать его длинным журналом команд.

Такой подход уменьшает объём отчёта, но сохраняет академическую проверяемость: преподаватель видит конечное состояние, существенный вывод команды и короткое объяснение студента.

## Финальное уточнение — 2026-09-03

- В обязательном отчёте LX0 осталось только **3 снимка экрана**: установленная Mint, импортированная копия и одновременная работа двух VM. Шаг очистки после проверки остаётся обязательным, но отдельного снимка для него больше не требуется.
- В LX1–LX3 обязательные доказательства полностью текстовые: студент копирует только существенный вывод команд, а не фотографирует терминал.
- Локальный блокнот результатов получил дополнительную защиту от случайной вставки некоторых очевидных форматов секретов (например, PEM private key, распространённые токены и shadow-подобные строки). Такой текст не сохраняется в `sessionStorage` и исключается из общего экспорта. Это дополнительная защита, а не гарантия обнаружения любого секрета.
- После завершения студент может одним действием очистить локальные данные текущей лабораторной.
- В LX2 обязательный маршрут ключевой аутентификации сокращён: `ssh-agent` оставлен как дополнительное объяснение, а команды установки ключа через NAT/port forwarding даны явно для Linux/macOS и PowerShell.
- В LX3 не создаются ненужные временные пароли для учебных аккаунтов: проверки выполняются через `sudo -u`. Роль группы `teachers` теперь проверяется отдельным непривилегированным пользователем.
- Опыт с `umask` выполняется в subshell с `umask 027`, поэтому ожидаемые права воспроизводимы и основной shell студента не изменяется.
- После завершения MCQ можно повторить тест; объяснение после каждого ответа остаётся частью обучения, а в отчёт переносится только итоговая строка.
- В шаблонах отчётов сохранены только поля, соответствующие обязательным доказательствам. Каждый шаблон LX0–LX7 занимает две страницы до вставки студентом собственных результатов.

## 2026-09-03 — Paste-ready text evidence fields

A deployment screenshot exposed a usability bug: the lab said “paste into the field below”, but the field depended entirely on JavaScript injection and could therefore be absent if the asset was stale, blocked, or not loaded.

The fix uses progressive enhancement:

- every required command-output evidence point in LX0–LX7 now contains a real `<textarea>` in the page source;
- JavaScript is no longer required for the field to be visible or usable;
- JavaScript only adds sessionStorage persistence, copy/clear actions, a character counter, combined TXT export, and obvious-secret detection;
- evidence fields have no `name` or `form` attribute and the page CSP keeps `connect-src 'none'`;
- the evidence script and stylesheet use a cache-busting query string;
- SourceCraft and GitLab CI now fail if representative evidence fields or the evidence script disappear from the built site.

There are 29 paste-ready command-output fields across LX0–LX7. MCQ results remain generated by the quiz and can be copied as a single result line.

## 2026-09-03 — MCQ всегда виден + готовый отчёт без ручного переноса

- MCQ больше не зависит от динамического доступа Liquid к `quizzes.json`: для LX0–LX7 и Foundation вопросы заранее отрендерены в статические include-файлы. Поэтому сами вопросы и варианты ответа присутствуют в HTML даже при отключённом JavaScript; JavaScript нужен только для перемешивания вариантов, мгновенной обратной связи и подсчёта результата.
- CI проверяет точное число карточек после Jekyll build: LX0 — 10, LX1/LX2/LX3/LX4/LX5 — по 12, Foundation — 12. Публикация должна завершиться ошибкой, если тест исчезнет из собранной страницы.
- После последнего ответа итог MCQ сохраняется только в `sessionStorage` текущей вкладки и автоматически отображается в разделе отчёта.
- Основной путь сдачи теперь — кнопка **«Скачать готовый отчёт (.docx)»**. Браузер формирует документ локально и автоматически включает ФИО/группу/номер, текстовые доказательства из полей лабораторной, итог MCQ, короткие ответы и выбранные студентом снимки.
- В сформированном DOCX MCQ вынесен в отдельный зелёный блок «Проверка понимания», а результаты терминала оформлены отдельными читаемыми блоками. Ручное копирование результатов в Word больше не требуется.
- Пустые DOCX-шаблоны остаются только как резервный путь. Основной путь сдачи: браузер формирует заполненный DOCX, студент открывает его для быстрой проверки и отправляет преподавателю. PDF создаётся только если преподаватель отдельно этого требует; дополнительный файл прикладывается лишь в лабораторной, где он явно указан.

## 2026-09-03 — Validated completeness (not a grade)

The submission workflow now separates **completeness** from **academic grading**.

- The empty DOCX template is always downloadable.
- The automatic DOCX can also be downloaded at any time. If the lab is incomplete, the report records the current completeness percentage and lists what still needs attention.
- Completeness is based on required evidence, not merely on non-empty fields.
- Text evidence uses lightweight lab-specific plausibility checks (expected paths, service state, filenames, permission modes, tmux PID consistency, expected denial messages, etc.) plus anti-filler checks.
- Short answers require a minimally substantive, non-duplicated response but remain subject to instructor review for meaning.
- Screenshots are checked only for basic file plausibility (real PNG/JPEG, useful size/resolution); their actual content remains a human-review item.
- MCQ contributes to completeness only when every question has been answered. The number correct remains formative feedback and is not converted into an automatic lab grade.
- LX1's required `src.tar.gz` can be selected for local completeness checking; the browser verifies a plausible gzip file but the archive content remains instructor-reviewed.
- The generated report includes a dedicated `Комплектность работы` section and a blank `Для преподавателя` assessment section.

Important limitation: client-side checks reduce random filler and incomplete evidence, but they do not prove authorship or that commands were genuinely executed. Final correctness and understanding remain instructor responsibilities.

## 2026-09-03 — Мягкий учебный прогресс вместо жёсткого контроля

Следующая итерация разделяет три разных понятия, чтобы интерфейс помогал учиться, а не создавал ощущение автоматического экзамена.

1. **Учебный прогресс** — студент сам отмечает выполненные этапы маршрута. Отметки сохраняются в `localStorage` текущего браузера, поэтому можно закрыть сайт и позже продолжить с места остановки. На главной странице курса показывается общий прогресс по доступным LX0–LX7 и отдельный прогресс каждой лабораторной.
2. **Комплектность материалов** — показывает, представлены ли обязательные элементы отчёта. Это не оценка и не блокировка. Отчёт можно скачать в любой момент.
3. **Проверка преподавателя** — определяет корректность выполнения, понимание, смысл ответов и содержание снимков.

Автопроверка текстовых доказательств стала мягкой. Пустое поле, очевидный filler (`asdf`, `test`), секрет или совсем бессодержательный фрагмент не считаются готовым материалом. Но если студент вставил правдоподобный результат, который не полностью совпал с ожидаемым шаблоном, он учитывается как представленный и получает спокойную подсказку «проверьте шаг» вместо блокировки.

Завершение MCQ автоматически отмечает последний этап маршрута как выполненный, но число правильных ответов не влияет на учебный прогресс или комплектность. Остальные этапы студент отмечает самостоятельно после строки «Готово, когда».

В автоматически сформированном DOCX теперь отдельно отображаются:

- учебный прогресс (самоотметка студента, например `3 / 5 этапов`);
- комплектность материалов;
- пустые поля для оценки преподавателем корректности выполнения и понимания.

Ни один из первых двух показателей не является академической оценкой.


## Pre-deployment learning feedback update (2026-09-03)

- MCQ is now retry-friendly per question: an unsuitable option gives a supportive explanation and leaves the remaining options available.
- A whole quiz can be repeated in-place for consolidation; no page reload is required.
- MCQ completion records questions passed and retry count, not an automatic grade.
- Wrong-attempt styling is amber and instructional rather than punitive red.
- Evidence, completeness, report, and empty-state messages were revised to be calm, positive, and action-oriented.
- Safety warnings remain clear for secrets/private keys, but ordinary mismatches are treated as learning hints rather than blockers.


## 2026-09-03 · Course home, navigation and personal naming

- The course home is now student-first: available labs and personal learning progress appear before the long syllabus.
- A four-step learning flow explains: do one stage, verify it, save only the main evidence, then reinforce with retry-friendly MCQ and the automatic DOCX.
- A clear naming note explains that placeholder personal names must be replaced by the student's own data, while fixed LX3 lab accounts/groups remain unchanged.
- Every lab now offers a direct return to the course home from the header, the bottom navigation, and the end-of-lab actions.
- LX0 uses the explicit placeholder `myname`; LX3 uses `myname`/`YOUR NAME`, with a warning not to rename `user_1`…`user_5`, `student`, `workers`, `teachers`, or `students`.
- Submission fields no longer show a fake student name as a placeholder.
- Cache version raised to `20260903-9`; CI/publication guards check the course-home naming note and lab return navigation.

## 2026-09-03 — Course-home achievement board

- Added a compact `Достижения практикума` sidebar beside the ready-lab cards.
- The board is not a ranking and shows only instructor-approved records.
- Students explicitly opt in from the report section before their pseudonymous record can be published.
- Public fields are limited to group, list number, lab, date, and approved badge.
- Full names, outputs, screenshots, MCQ results, retries, grades, and comments are never placed in the public board data.
- The normal auto-generated DOCX now carries a minimal machine-readable receipt so the instructor can update the board with one local command after reviewing accepted reports.
- Ready-lab cards were widened into a two-column dashboard layout on desktop for better readability; the achievement panel becomes a normal block below the cards on smaller screens.
- Added a small `Результат лабораторной` label to make each card's practical outcome easier to scan.


## LX6 — safe filesystem lab

LX6 follows the same five-stage experience as LX0–LX5, but adds an explicit storage-safety pattern. The student first observes the system, then creates a disposable image file, verifies the associated loop device, formats only that loop device, explores mount/umount behavior, validates a separate fstab file, and cleans up. Four text evidence items are sufficient; screenshots are not required. MCQ remains retryable and formative, and the automatic DOCX/report-completeness/progress features work unchanged.

## LX7 — Bash automation

LX7 extends the same five-stage student workflow to scripting and scheduling. The mandatory path uses four text evidence items and no screenshots: first script/PATH, logic and exit status, SHA-256 change detection, and a user-level cron task. The cron task is inserted between course-owned markers and cleanup removes only that block, preserving unrelated student jobs. MCQ remains retryable and formative; automatic DOCX, learning progress, completeness, and the achievement board work unchanged.


### LX7 privacy refinement

В LX7 личный crontab не сохраняется целиком в учебной папке и не попадает в отчёт. Лаборатория временно обрабатывает конфигурацию только для добавления/удаления собственного блока `NSA-LX7-BEGIN/END`; evidence содержит только учебную строку расписания и несколько строк `LX7_CRON`. Это уменьшает риск случайно включить в учебные материалы чужие команды, пути или секреты.

# Академическая и научно-техническая проверка курса

Дата последнего обновления проверки: 2026-09-08

## Область проверки

Локальные практикумы **LX0–LX7** проверены как полноценные учебные материалы: последовательность действий, команды, ожидаемые результаты, безопасность, формулировки, доказательства выполнения, короткие вопросы и интерактивные тесты.

Темы **LX8–DO2** в текущем пакете являются картой дальнейшего курса, а не готовыми локальными лабораторными. Для них проверены научный смысл, терминология и learning outcomes. Старые внешние примеры не считаются современными инструкциями к выполнению, пока соответствующая лабораторная не будет переработана локально и проверена.

## Что было уточнено

### LX0 — Linux и виртуализация

- ISO рассматривается как установочный образ, VM — как работающая виртуальная машина, OVA — как переносимый пакет виртуального appliance; эти понятия не смешиваются.
- Ресурсы гостевой системы подбираются с учётом ресурсов хоста и необходимости запускать две VM одновременно.
- Для Linux Mint 22.3 учтены официальные замечания по VirtualBox: VMSVGA, 128 MB video memory, отключённое 3D acceleration и включённое Nested Paging; отдельно отмечена известная проблема HWE kernel 6.14 с VirtualBox.
- Опасные действия с дисками ограничены учебным виртуальным диском.

Официальный источник: https://linuxmint.com/rel_zena.php

### LX1 — командная строка и файловая система

- Различаются абсолютные и относительные пути, stdout/stderr, перенаправление и pipeline.
- Hard link объясняется как дополнительное имя того же inode в допустимых границах файловой системы; symbolic link хранит путь и может стать битым.
- Архив считается проверенным только после просмотра содержимого и успешного восстановления, а не по факту существования файла `.tar.gz`.

GNU Coreutils: https://www.gnu.org/software/coreutils/manual/html_node/ln-invocation.html  
GNU tar: https://www.gnu.org/software/tar/manual/

### LX2 — SSH и tmux

- SSH рассматривается как защищённый протокол удалённого доступа и передачи данных.
- Для учебной аутентификации по ключу используется Ed25519; закрытый ключ не передаётся преподавателю и не вставляется в отчёт.
- NAT и port forwarding разделены корректно. Пример `127.0.0.1:2222 → guest:22` соответствует модели VirtualBox NAT port forwarding.
- tmux помогает сохранить сеанс при разрыве SSH, но обычный tmux-сеанс не является механизмом переживания перезагрузки сервера.

Ubuntu OpenSSH: https://ubuntu.com/server/docs/how-to/security/openssh-server/  
VirtualBox networking: https://docs.oracle.com/en/virtualization/virtualbox/7.2/user/networkingdetails.html

### LX3 — пользователи и права

- UID/GID, owner/group/other и `rwx` рассматриваются раздельно.
- Для каталогов `r`, `w`, `x` объясняются с их каталоговой семантикой, а не как копия прав обычного файла.
- `Permission denied` в отрицательном тесте может быть ожидаемым успешным результатом проверки политики доступа.
- Sticky bit и `umask` не смешиваются: sticky bit ограничивает удаление/переименование записей в совместно записываемом каталоге, `umask` влияет на права при создании новых объектов.
- `sudo` не используется как универсальный способ «исправить» права, поскольку это скрывает ошибки модели доступа.

Linux man-pages chmod: https://man7.org/linux/man-pages/man1/chmod.1.html  
Linux man-pages umask: https://man7.org/linux/man-pages/man2/umask.2.html

### LX4 — процессы и пакеты

- Пакет и процесс рассматриваются как разные сущности: пакет управляется пакетным менеджером, процесс — это выполняющийся экземпляр программы с PID и состоянием.
- Для APT обязательный путь использует сначала наблюдение и симуляцию, затем установку одного небольшого учебного пакета; системное массовое обновление не является частью лабораторной.
- Сигналы проверяются только на процессе `sleep`, который студент создал сам. Перед отправкой сигнала повторно сверяются PID, владелец и команда.
- `SIGSTOP`, `SIGCONT` и `SIGTERM` используются для обучения жизненному циклу процесса; `SIGKILL` не является штатным первым выбором.
- `nice` и `renice` объясняются как изменение scheduling priority hint, а не как гарантия конкретной доли CPU.

APT: https://manpages.ubuntu.com/manpages/noble/en/man8/apt.8.html  
Linux ps: https://man7.org/linux/man-pages/man1/ps.1.html  
Linux kill: https://man7.org/linux/man-pages/man1/kill.1.html

### LX5 — загрузка Linux и службы systemd

- Загрузка рассматривается через systemd targets и зависимости, без опасного изменения системного `default.target` в обязательном маршруте.
- Студент создаёт только собственную учебную службу `lx5-heartbeat.service`; лабораторная не изменяет и не останавливает системные службы.
- Unit-файл предварительно проверяется `systemd-analyze verify`, после изменения unit используется `systemctl daemon-reload`. Это отдельно отличено от service-specific `systemctl reload`.
- `systemctl enable` и `systemctl start` не смешиваются: лабораторная специально наблюдает состояние после `enable` и до `start`.
- Для долгоживущей учебной службы используется `Type=exec`, чтобы ошибки запуска вроде отсутствующего executable/user были заметнее systemd; `Restart=on-failure` показывает безопасную политику восстановления без маскировки явного `systemctl stop`.
- Служба запускается от текущего непривилегированного пользователя и получает минимальные hardening-настройки `NoNewPrivileges`, `PrivateTmp`, `ProtectSystem` и `ProtectHome`.
- Журнал читается через `journalctl -u`, а обязательный путь завершается удалением только созданной лабораторией службы и скрипта.

systemd.service: https://man7.org/linux/man-pages/man5/systemd.service.5.html  
systemctl: https://man7.org/linux/man-pages/man1/systemctl.1.html  
systemd.unit: https://man7.org/linux/man-pages/man5/systemd.unit.5.html  
systemd-analyze: https://man7.org/linux/man-pages/man1/systemd-analyze.1.html  
journalctl: https://man7.org/linux/man-pages/man1/journalctl.1.html

## Проверка дальнейших тем

В карте LX8–DO2 исправлены или уточнены несколько потенциально вводящих в заблуждение упрощений:

- TCP — поток байтов; один `recv()` не обязан соответствовать одному `send()`.
- UDP не требует TCP-подобного `listen/accept`; приложение само определяет формат датаграмм и обмен.
- `asyncio` предназначен прежде всего для конкурентного I/O; `async` не превращает CPU-bound вычисление в параллельное. Для типичной современной точки входа используется `asyncio.run()`.
- В обычной GIL-enabled сборке CPython потоки не дают произвольного параллелизма Python bytecode для CPU-bound задач; free-threaded сборки существуют, но являются отдельным режимом/сборкой.
- Шифрование, целостность и аутентификация — разные свойства. Учебные классические шифры и неаутентифицированный Diffie–Hellman не представлены как production security.
- TLS 1.3 допускает разные режимы аутентификации/обмена ключами, включая PSK; нельзя сводить TLS к утверждению «всегда используется сертификат».
- HTTP/3 отображает HTTP semantics поверх QUIC, а не TCP.
- Docker image, container writable layer и persistent storage не смешиваются; данные, которые должны переживать удаление контейнера, выносятся в подходящее хранилище, например volume или bind mount.
- Учебный файловый сервис поверх собственных socket-команд не называется FTP, если он не реализует стандарт FTP. SFTP и FTPS также не являются синонимами FTP.

Python asyncio: https://docs.python.org/3/library/asyncio.html  
Python threading: https://docs.python.org/3/library/threading.html  
TLS 1.3, RFC 8446: https://www.rfc-editor.org/rfc/rfc8446.html  
HTTP/3, RFC 9114: https://www.rfc-editor.org/rfc/rfc9114.html  
Docker storage: https://docs.docker.com/engine/storage/

## Статус старых внешних материалов

Исходный курс М. В. Коротеева остаётся академическим ориентиром по структуре и последовательности тем: https://koroteev.site/os/

Некоторые старые внешние репозитории в блоке сетевого программирования содержат исторический Python 2, устаревшие API или учебные упрощения. Поэтому в текущей версии они помечены как архивные материалы и **не выдаются как инструкция к выполнению**. Перед публикацией LX8–DO2 как практикумов соответствующий код должен быть переписан на современный Python 3 и пройти отдельную проверку.

## Тесты и оценивание

В обязательных лабораторных оставлены только вопросы, которые проверяют понимание ключевого решения, диагностику или безопасное применение:

- LX0 — 10 вопросов;
- LX1 — 12;
- LX2 — 12;
- LX3 — 12;
- LX4 — 12;
- LX5 — 12;
- LX6 — 12;
- LX7 — 12;
- Foundation self-check — 12.

Всего в текущем локальном наборе — **106 вопросов**. У каждого вопроса есть единственный лучший ответ, объяснение и ссылка/привязка к теме. Тест не отправляет результат преподавателю или на сервер автоматически. После последнего ответа итог сохраняется локально в `sessionStorage` текущей вкладки и автоматически включается в формируемый DOCX-отчёт; ручной перенос строки MCQ не требуется.

## Итог

LX0–LX7 могут использоваться как локальные практические материалы после успешной технической сборки сайта. LX8–DO2 пока следует считать проверенной академической картой будущих лабораторных, а не завершённым практическим пакетом.

## Финальная проверка учебной реализации — 2026-09-03

После научно-технической проверки выполнен дополнительный проход по воспроизводимости и безопасности практических действий.

- В LX3 опыт с `umask` изолирован в subshell: учебное значение `027` не меняет `umask` основной оболочки, а ожидаемые права новых объектов (`0640` для обычного файла и `0750` для каталога при стандартных базовых режимах создания) становятся воспроизводимыми в рамках задания.
- Проверка групповых прав в LX3 выполняется непривилегированной учётной записью, входящей в `teachers`, поэтому положительный тест действительно проверяет групповую часть модели `owner/group/other`, а не эффект `root`/`sudo`.
- Уточнено ограничение классических Unix mode bits: у объекта один owning group; если политика требует независимо задавать права нескольким группам, требуется другая организация групп или механизм вроде POSIX ACL. ACL не вводится в обязательный LX3, чтобы не смешивать базовую и расширенную модели доступа.
- В LX2 обязательный путь не требует `ssh-agent`; это полезный клиентский механизм управления ключами, но он не нужен для доказательства базовой public-key authentication. Проверка выполняется с запретом password authentication на клиентской стороне, чтобы отличить успешный вход по ключу от случайного fallback к паролю.
- Учебные аккаунты LX3 не получают одинаковые временные пароли. Это уменьшает ненужную поверхность риска и не мешает проверке, поскольку смена эффективного пользователя выполняется преподавательской/административной учётной записью через `sudo -u`.
- Evidence model минимизирован: визуальный снимок требуется только тогда, когда именно графическое состояние является частью проверяемого результата; терминальные результаты сдаются как текст. Это не меняет технические критерии выполнения, но делает их проверяемыми и доступными для поиска.

Технические проверки текущего пакета: синтаксис JavaScript, YAML и всех Bash-блоков; соответствие ID доказательств между лабораторными, схемой сдачи и Word-шаблонами; структура 106 MCQ; отсутствие дублирующихся ID; визуальный рендер всех страниц восьми Word-шаблонов. Полная локальная сборка Jekyll не выполнялась: Jekyll/Bundler отсутствуют в рабочей среде, а попытка установить Jekyll из RubyGems была остановлена недоступностью DNS/сети контейнера. CI проекта по-прежнему настроен на установку Jekyll и build при публикации.

## Проверяемость MCQ и отчёта — 2026-09-03

Вопросы LX0–LX7 и Foundation теперь присутствуют в собранной странице как статический HTML. Это устраняет зависимость видимости теста от выполнения JavaScript и делает отказ интерфейса более безопасным: при отключённом JavaScript студент всё равно видит вопросы и варианты, хотя автоматическая проверка недоступна.

Отчёт формируется на стороне браузера из уже введённых студентом данных. Итоговый DOCX отделяет доказательства выполнения, результат MCQ и короткие объяснения студента. Это улучшает проверяемость: текстовые результаты остаются текстом, а изображения используются только для визуальных состояний. Механизм не отменяет правило не помещать в отчёт пароли, закрытые ключи, токены и иные секреты.

## Assessment design refinement — validated completeness

The course deliberately does **not** treat browser automation as a grader. The new completeness indicator checks whether the required learning evidence is present and whether text outputs contain lab-specific expected signals. It rejects obvious filler and catches several internal inconsistencies (for example, a mismatched LX1 username, a hard-link inode mismatch when both values are available, a tmux pane PID that does not recur, or missing expected permission-denial evidence).

The design remains academically conservative: screenshots and short written explanations are marked for instructor review, and MCQ correctness is formative rather than an automatic laboratory grade. A 100% completeness result therefore means "all required evidence is present and passed the available readiness checks", not "the work is correct" or "the student earned 100%".

This balance follows authentic-assessment practice: automation supports feedback and workload, while the instructor retains judgment over correctness, understanding, and authorship.

## Learning-progress refinement — 2026-09-03

The previous readiness checks were deliberately softened so that automation supports learning rather than acting as a hidden grader. Lab-specific output patterns now function primarily as diagnostic hints. A plausible but imperfect result can be included in completeness and marked for review; only missing data, obvious filler, sensitive material, or extremely low-information input is excluded from completeness.

A separate **learning progress** layer is available for LX0–LX7. Students self-mark each route stage after reaching the stated checkpoint. These route marks are stored only in browser `localStorage`, contain no student identity, and are not transmitted by the static course. The course home aggregates the available laboratory route marks so that a student can see where to continue. The generated DOCX records only the final route count as a self-reported progress indicator for instructor context.

This separation is intentional:

- learning progress = navigation/self-regulation;
- completeness = presence of required submission material;
- academic assessment = instructor judgment of correctness and understanding.

The automated indicators therefore do not claim authenticity, authorship, mastery, or a grade.


## UX clarification: personal names vs. fixed lab identifiers (2026-09-03)

The labs now distinguish personal placeholders from identifiers that are part of the experiment. Students replace `myname`/`YOUR NAME` with their own data where instructed. In LX3, `user_1`…`user_5`, `student`, and the groups `workers`, `teachers`, `students` remain fixed so every student tests the same permission model. This clarification changes presentation, not the underlying Linux concepts or learning outcomes.


## LX4 — процессы и пакеты

LX4 rebuilt as a modern local practical lab from the original course topic. The mandatory path uses APT/dpkg, a small repository package (`htop`), controlled `sleep` processes, `/proc/<PID>/status`, `ps`, `SIGSTOP`/`SIGCONT`/`SIGTERM`, and `nice`/`renice`. Broad system upgrades, blind `autoremove`, killing unknown processes, and `SIGKILL` as a normal first action are deliberately excluded from the required workflow. Scientific details were cross-checked against Ubuntu APT/dpkg manpages, Linux man-pages, and GNU Bash job-control documentation.

## LX7 academic update

LX7 follows the reference topics (first Bash script, cron, checksums) but corrects and modernizes the practical path. User crontab uses five schedule fields followed by the command; the local lab does not copy the older range typos for day/month fields. MD5 is not used as the primary modern integrity example; SHA-256 is used instead, with an explicit trust-boundary explanation. The lab also separates syntax checking (`bash -n`), human-readable output, and machine-readable exit status.

---
layout: default
lab_id: lx7
title: LX7 — Основы скриптов на Bash
---

# LX7 — Основы скриптов на Bash

Превратите несколько ручных команд в **понятный и повторяемый сценарий**: задайте интерпретатор, передайте параметры, проверьте синтаксис и exit status, обнаружьте изменение файла через SHA-256 и запустите безопасную пользовательскую задачу по расписанию.

<p class="meta-line">Подготовка: 5 минут · Практика: 65–85 минут · Среда: учебная Linux Mint VM · Результат: четыре небольших проверяемых сценария/эксперимента без изменения системных пользователей, паролей и чужих cron-задач</p>

<section class="student-environment" aria-label="Среда курса">
  <div><span>Ваша учебная среда</span><strong>Windows PC → Oracle VirtualBox → Linux Mint 22.3 “Zena”</strong></div>
  <p>Администратор Windows <strong>не требуется для обычной работы курса</strong>. Команды Linux с <code>sudo</code> выполняются внутри Mint VM под вашим учебным Linux-пользователем.</p>
</section>

{% include learning-deck.html lab="lx7" %}

{% include lab-compass.html lab="lx7" %}


{% include lab-start.html lab="lx7" %}

## Зачем это нужно

Когда администратор повторяет одну последовательность команд второй или третий раз, появляется смысл оформить её как сценарий. Но хороший Bash-скрипт — это не просто «команды в файле». Он должен:

- явно понимать, каким интерпретатором запускается;
- корректно обращаться с параметрами и строками;
- сообщать человеку полезный вывод;
- сообщать другой программе **код завершения (exit status)**;
- не полагаться на случайное окружение интерактивного терминала;
- безопасно переживать повторный запуск и аккуратную очистку после эксперимента.

В исходной теме также есть упражнения с созданием пользователей, паролями, широкими правами и MD5. Они полезны как исторический контекст, но для первого практикума по автоматизации избыточны или небезопасны. Поэтому локальная LX7 сохраняет учебную цель темы, но использует **файлы самого студента, SHA-256 и пользовательский crontab**.

## Что вы изучите

После LX7 вы сможете:

- объяснить роль shebang и execute bit;
- различать `bash script.sh`, `./script.sh` и поиск команды через `PATH`;
- передавать параметры и безопасно использовать кавычки;
- проверять синтаксис через `bash -n` до выполнения;
- использовать `case` для небольшого интерфейса командной строки;
- отличать текстовый вывод от exit status;
- использовать SHA-256 для обнаружения изменения содержимого;
- объяснить, почему checksum не доказывает происхождение файла сама по себе;
- создать пользовательскую cron-задачу с явным окружением;
- сохранить существующие cron-записи пользователя и удалить только созданный LX7-блок.

<div class="callout safe-note" markdown="1">
<strong>Правило безопасности LX7.</strong> Все scripts и logs создаются только в <code>~/NSA/LX7</code>. Не передавайте пароль как аргумент сценария, не читайте <code>/etc/shadow</code>, не меняйте <code>/etc/passwd</code>, не используйте <code>chmod 777</code> как «универсальное исправление» и не выполняйте <code>crontab -r</code>, если у пользователя могут быть другие задания.
</div>

<div class="callout naming-note lab-name-guide" markdown="1">
<strong>Используйте свои данные, а не пример.</strong> Когда в команде встречается <code>ВАША_ФАМИЛИЯ</code>, замените её своей фамилией или короткой персональной меткой. Не отправляйте преподавателю буквальный текст <code>ВАША_ФАМИЛИЯ</code> или чужую примерную фамилию. Учебные имена файлов <code>hello.sh</code>, <code>system-report.sh</code> и маркер <code>NSA-LX7</code> менять не нужно.
</div>

## Модель без лишней теории

```text
ручная команда
    ↓
Bash-сценарий
    ↓  параметры + условия + exit status
повторяемая процедура
    ↓
проверка целостности / автоматический запуск
    ↓
cron или другой планировщик
```

<span id="first-script"></span>

## Часть 1. Создайте первый Bash-сценарий

<p class="stage-goal"><strong>Готово, когда:</strong> <code>hello.sh</code> проходит <code>bash -n</code>, запускается напрямую и находится по имени после добавления учебного каталога в <code>PATH</code> только текущей сессии.</p>

Создайте отдельный каталог для LX7:

```bash
mkdir -p ~/NSA/LX7/bin
cd ~/NSA/LX7
```

Создайте сценарий:

```bash
cat > ~/NSA/LX7/bin/hello.sh <<'EOF'
#!/usr/bin/env bash
set -u

name=${1:-$(id -un)}
printf 'Hello, %s!\n' "$name"
printf 'USER=%s\n' "$(id -un)"
printf 'HOST=%s\n' "$(hostname)"
printf 'SCRIPT=%s\n' "$0"
EOF

bash -n ~/NSA/LX7/bin/hello.sh && echo 'SYNTAX_CHECK=OK'
chmod u+x ~/NSA/LX7/bin/hello.sh
```

Сначала запустите файл по пути. **Замените** `ВАША_ФАМИЛИЯ` своей фамилией:

```bash
~/NSA/LX7/bin/hello.sh "ВАША_ФАМИЛИЯ"
```

Попробуйте найти его как обычную команду:

```bash
command -v hello.sh || echo 'Пока hello.sh не найден в PATH — это ожидаемо.'
```

Теперь добавьте учебный каталог в `PATH` **только текущего терминала**:

```bash
export PATH="$HOME/NSA/LX7/bin:$PATH"
hash -r
command -v hello.sh
hello.sh "ВАША_ФАМИЛИЯ"
```

<div class="callout checkpoint" markdown="1">
<strong>Что здесь важно.</strong> <code>./file</code> или полный путь обращается к конкретному файлу. Если имя команды не содержит <code>/</code>, Bash ищет её по своим правилам, включая каталоги <code>PATH</code>. Мы не записываем учебный путь в <code>~/.bashrc</code>, поэтому изменение исчезнет после закрытия этого терминала.
</div>

Соберите короткую сводку:

```bash
{
  printf 'BASH_PATH=%s\n' "$(command -v bash)"
  printf 'BASH_VERSION=%s\n' "$(bash --version | head -n 1)"
  echo 'SYNTAX_CHECK=OK'
  printf 'SCRIPT_PATH=%s\n' "$(command -v hello.sh)"
  hello.sh "ВАША_ФАМИЛИЯ"
} | tee ~/NSA/LX7/environment.txt
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX7-01"><strong>В отчёт · LX7-01.</strong> Вставьте <code>cat ~/NSA/LX7/environment.txt</code>. Убедитесь, что в приветствии стоит ваша фамилия/метка, а не пример.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX7-01">
  <label for="evidence-LX7-01">Поле для результата · LX7-01</label>
  <p class="evidence-editor-help" data-evidence-help>Главное — версия Bash, SYNTAX_CHECK=OK, путь к hello.sh и короткий фактический запуск.</p>
  <textarea id="evidence-LX7-01" rows="8" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX7-01" placeholder="Вставьте сюда environment.txt…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="logic-exit"></span>

## Часть 2. Добавьте логику и осмысленный exit status

<p class="stage-goal"><strong>Готово, когда:</strong> <code>system-report.sh</code> умеет выполнить один из нескольких режимов, корректно проходит <code>bash -n</code>, а неверный режим печатает usage и завершается с <code>INVALID_EXIT=2</code>.</p>

Создайте небольшой сценарий системной сводки:

```bash
cat > ~/NSA/LX7/system-report.sh <<'EOF'
#!/usr/bin/env bash
set -u

usage() {
  printf 'Usage: %s {summary|disk|memory|uptime}\n' "$0" >&2
}

mode=${1:-summary}

case "$mode" in
  summary)
    echo 'MODE=summary'
    printf 'USER=%s\n' "$(id -un)"
    printf 'HOST=%s\n' "$(hostname)"
    printf 'KERNEL=%s\n' "$(uname -r)"
    printf 'HOME=%s\n' "$HOME"
    ;;
  disk)
    df -hT "$HOME"
    ;;
  memory)
    free -h
    ;;
  uptime)
    uptime -p
    ;;
  *)
    usage
    exit 2
    ;;
esac
EOF

chmod u+x ~/NSA/LX7/system-report.sh
bash -n ~/NSA/LX7/system-report.sh && echo 'SYNTAX_CHECK=OK'
```

Проверьте корректный режим:

```bash
~/NSA/LX7/system-report.sh summary | tee ~/NSA/LX7/summary.txt
~/NSA/LX7/system-report.sh disk | sed -n '1,2p'
```

Теперь намеренно передайте неверный режим. Здесь ненулевой exit status — **ожидаемый результат теста**:

```bash
code=0
~/NSA/LX7/system-report.sh wrong-mode > ~/NSA/LX7/invalid-mode.txt 2>&1 || code=$?
printf 'INVALID_EXIT=%s\n' "$code" >> ~/NSA/LX7/invalid-mode.txt
cat ~/NSA/LX7/invalid-mode.txt
```

<div class="callout checkpoint" markdown="1">
<strong>Вывод и код завершения — разные каналы смысла.</strong> Текст <code>Usage: …</code> объясняет ошибку человеку. Код <code>2</code> позволяет другому сценарию или планировщику понять, что команда завершилась неуспешно, не разбирая текст сообщения.
</div>

Соберите Evidence:

```bash
{
  echo 'SYNTAX_CHECK=OK'
  cat ~/NSA/LX7/summary.txt
  cat ~/NSA/LX7/invalid-mode.txt
} | tee ~/NSA/LX7/logic-summary.txt
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX7-02"><strong>В отчёт · LX7-02.</strong> Вставьте <code>cat ~/NSA/LX7/logic-summary.txt</code>. Должны быть видны <code>MODE=summary</code> и <code>INVALID_EXIT=2</code>.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX7-02">
  <label for="evidence-LX7-02">Поле для результата · LX7-02</label>
  <p class="evidence-editor-help" data-evidence-help>Покажите успешный режим и один управляемый ошибочный режим; длинный вывод disk/memory не нужен.</p>
  <textarea id="evidence-LX7-02" rows="9" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX7-02" placeholder="Вставьте сюда logic-summary.txt…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<details class="optional-work">
<summary>Дополнительно: ShellCheck, если он уже установлен</summary>

Не устанавливайте лишний пакет только ради этой части. Если `shellcheck` уже есть:

```bash
if command -v shellcheck >/dev/null; then
  shellcheck ~/NSA/LX7/bin/hello.sh ~/NSA/LX7/system-report.sh
else
  echo 'ShellCheck не установлен — обязательные шаги LX7 от этого не страдают.'
fi
```

Static analysis помогает заметить многие типичные ошибки, но не заменяет фактический запуск и тестирование сценария.

</details>

<span id="checksum"></span>

## Часть 3. Обнаружьте изменение файла через SHA-256

<p class="stage-goal"><strong>Готово, когда:</strong> baseline успешно проверяет исходную копию, контролируемое изменение вызывает несовпадение, а восстановление возвращает статус OK.</p>

Исходная работа показывает принцип на MD5. В современной LX7 используем SHA-256. Это **не означает**, что hash сам по себе подтверждает автора файла: если кто-то может подменить и файл, и baseline, простого сравнения недостаточно.

Работайте только с копией вашего собственного сценария:

```bash
cd ~/NSA/LX7
cp system-report.sh integrity-target.sh
sha256sum integrity-target.sh > integrity-target.sha256
```

Проверьте baseline:

```bash
if sha256sum --check integrity-target.sha256; then
  echo 'BASELINE_CHECK=OK'
fi
```

Теперь внесите контролируемое изменение **только в учебную копию**:

```bash
printf '\n# controlled LX7 change\n' >> integrity-target.sh

if sha256sum --check integrity-target.sha256 >/dev/null 2>&1; then
  echo 'AFTER_CHANGE=UNEXPECTED_MATCH'
else
  echo 'AFTER_CHANGE=CHANGED'
fi
```

Восстановите копию из исходного `system-report.sh` и проверьте снова:

```bash
cp system-report.sh integrity-target.sh
if sha256sum --check integrity-target.sha256 >/dev/null 2>&1; then
  echo 'AFTER_RESTORE=OK'
else
  echo 'AFTER_RESTORE=CHECK'
fi
```

Соберите короткую сводку:

```bash
{
  printf 'SHA256='; cut -d' ' -f1 integrity-target.sha256
  sha256sum --check integrity-target.sha256 >/dev/null && echo 'BASELINE_CHECK=OK'
  printf '\n# controlled LX7 change\n' >> integrity-target.sh
  if sha256sum --check integrity-target.sha256 >/dev/null 2>&1; then
    echo 'AFTER_CHANGE=UNEXPECTED_MATCH'
  else
    echo 'AFTER_CHANGE=CHANGED'
  fi
  cp system-report.sh integrity-target.sh
  sha256sum --check integrity-target.sha256 >/dev/null && echo 'AFTER_RESTORE=OK'
} | tee checksum-summary.txt
```

<div class="callout checkpoint" markdown="1">
<strong>Что именно доказано?</strong> SHA-256 помогает проверить, совпадают ли текущие байты с сохранённой baseline. Для защиты от намеренной подмены сама эталонная контрольная сумма должна приходить из доверенного и аутентифицированного источника — например, вместе с цифровой подписью.
</div>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX7-03"><strong>В отчёт · LX7-03.</strong> Вставьте <code>cat ~/NSA/LX7/checksum-summary.txt</code>. Нужны только digest и три понятных статуса.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX7-03">
  <label for="evidence-LX7-03">Поле для результата · LX7-03</label>
  <p class="evidence-editor-help" data-evidence-help>Ищите SHA256=…, BASELINE_CHECK=OK, AFTER_CHANGE=CHANGED и AFTER_RESTORE=OK.</p>
  <textarea id="evidence-LX7-03" rows="7" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX7-03" placeholder="Вставьте сюда checksum-summary.txt…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="cron-safe"></span>

## Часть 4. Запустите сценарий по расписанию — не ломая чужой crontab

<p class="stage-goal"><strong>Готово, когда:</strong> пользовательский cron содержит только один маркированный LX7-блок, задача хотя бы один раз записала строку <code>LX7_CRON</code>, а после очистки LX7-блок исчез и остальные записи пользователя сохранились.</p>

Проверьте, что `crontab` доступен и служба cron активна:

```bash
command -v crontab
systemctl is-active cron
```

Если `crontab` отсутствует или служба неактивна, **не меняйте систему вслепую**. Покажите результат преподавателю. На стандартной учебной Linux Mint VM cron обычно уже доступен; установка пакета или изменение системной службы выполняется только по указанию преподавателя.

Создайте маленькую задачу. Она пишет только в вашу папку LX7 и явно задаёт минимальный `PATH`:

```bash
cat > ~/NSA/LX7/cron-task.sh <<'EOF'
#!/usr/bin/env bash
set -u
PATH=/usr/bin:/bin
export PATH

log="$HOME/NSA/LX7/cron.log"
printf 'LX7_CRON time=%s user=%s home=%s path=%s\n' \
  "$(date -Is)" "$(id -un)" "$HOME" "$PATH" >> "$log"
EOF

chmod u+x ~/NSA/LX7/cron-task.sh
bash -n ~/NSA/LX7/cron-task.sh && echo 'CRON_SCRIPT_SYNTAX=OK'
```

### Добавьте только свой маркированный блок

Не копируйте весь личный crontab в учебную папку: в нём могут быть команды, которые не относятся к отчёту. Создайте новый вариант во временном файле, удалив **только старый LX7-блок**, если вы запускаете лабораторную повторно:

```bash
TMP=$(mktemp)
(crontab -l 2>/dev/null || true) | awk '
  $0 == "# NSA-LX7-BEGIN" {skip=1; next}
  $0 == "# NSA-LX7-END"   {skip=0; next}
  !skip {print}
' > "$TMP"

{
  cat "$TMP"
  echo '# NSA-LX7-BEGIN'
  printf '* * * * * %s\n' "$HOME/NSA/LX7/cron-task.sh"
  echo '# NSA-LX7-END'
} > "$TMP.new"

crontab "$TMP.new"
rm -f "$TMP" "$TMP.new"
crontab -l | sed -n '/NSA-LX7-BEGIN/,/NSA-LX7-END/p'
```

<div class="callout safe-note" markdown="1">
<strong>Почему не <code>crontab -r</code>?</strong> Эта команда удаляет весь пользовательский crontab. В лабораторной мы владеем только блоком <code>NSA-LX7-BEGIN/END</code>, поэтому не должны затрагивать другие задания пользователя.
</div>

### Дождитесь одного запуска

Не нужно ждать 10 минут. Проверяем один реальный цикл, максимум около 90 секунд:

```bash
LOG="$HOME/NSA/LX7/cron.log"
if [ -f "$LOG" ]; then
  before=$(wc -l < "$LOG")
else
  before=0
fi

observed=NO
for _ in $(seq 1 45); do
  sleep 2
  if [ -f "$LOG" ]; then
    now=$(wc -l < "$LOG")
    if [ "$now" -gt "$before" ]; then
      observed=YES
      break
    fi
  fi
done

printf 'CRON_RUN_OBSERVED=%s\n' "$observed"
tail -n 3 "$LOG" 2>/dev/null || true
```

Если через 90 секунд стоит `NO`, это не повод «ломать» конфигурацию. Проверьте `systemctl is-active cron`, путь к script и execute bit. Затем повторите только этот блок проверки.

### Удалите только LX7-запись

```bash
TMP=$(mktemp)
(crontab -l 2>/dev/null || true) | awk '
  $0 == "# NSA-LX7-BEGIN" {skip=1; next}
  $0 == "# NSA-LX7-END"   {skip=0; next}
  !skip {print}
' > "$TMP"

crontab "$TMP"
rm -f "$TMP"

if (crontab -l 2>/dev/null || true) | grep -q 'NSA-LX7'; then
  echo 'CRON_CLEANUP=CHECK'
else
  echo 'CRON_CLEANUP=OK'
fi
```

Теперь соберите **только LX7-часть**, не копируя личные cron jobs:

```bash
{
  printf 'CRON_SERVICE='; systemctl is-active cron
  echo '# NSA-LX7-BEGIN'
  printf '* * * * * %s\n' "$HOME/NSA/LX7/cron-task.sh"
  echo '# NSA-LX7-END'
  if grep -q '^LX7_CRON ' ~/NSA/LX7/cron.log 2>/dev/null; then
    echo 'CRON_RUN_OBSERVED=YES'
    tail -n 3 ~/NSA/LX7/cron.log
  else
    echo 'CRON_RUN_OBSERVED=NO'
  fi
  if (crontab -l 2>/dev/null || true) | grep -q 'NSA-LX7'; then
    echo 'CRON_CLEANUP=CHECK'
  else
    echo 'CRON_CLEANUP=OK'
  fi
} | tee ~/NSA/LX7/cron-summary.txt
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX7-04"><strong>В отчёт · LX7-04.</strong> Вставьте <code>cat ~/NSA/LX7/cron-summary.txt</code>. Не вставляйте весь личный crontab: нужен только учебный маркированный блок и 1–3 строки вашего LX7 log.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX7-04">
  <label for="evidence-LX7-04">Поле для результата · LX7-04</label>
  <p class="evidence-editor-help" data-evidence-help>Главное — active cron, понятная строка расписания, реальный LX7_CRON и CRON_CLEANUP=OK.</p>
  <textarea id="evidence-LX7-04" rows="9" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX7-04" placeholder="Вставьте сюда cron-summary.txt…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

## Часть 5. Закрепите модель автоматизации

<p class="stage-goal"><strong>Готово, когда:</strong> Вы можете объяснить путь «сценарий → синтаксис → код завершения → целостность → планировщик», LX7 cron-блок удалён, а MCQ пройдена.</p>

Проверьте остатки:

```bash
printf 'LX7_DIR=%s\n' "$HOME/NSA/LX7"
find ~/NSA/LX7 -maxdepth 2 -type f -printf '%P\n' | sort
(crontab -l 2>/dev/null || true) | grep 'NSA-LX7' || echo 'CRON_CLEANUP=OK'
```

Не удаляйте `environment.txt`, `logic-summary.txt`, `checksum-summary.txt` и `cron-summary.txt` до формирования отчёта.

<div class="callout checkpoint" markdown="1">
<strong>Что вы сделали как инженер.</strong> Вы начали с одного запуска вручную, добавили проверяемый интерфейс и exit status, научились замечать изменение файла и только после этого передали маленькую задачу планировщику. Автоматизация стала последним шагом после проверки, а не первым.
</div>

## Частые ошибки

- Пишут `#!/bin/bash`, но запускают файл через `sh script.sh`. Тогда Bash-specific syntax может вести себя иначе. Запускайте тем интерпретатором, для которого написан сценарий.
- Забывают кавычки вокруг переменных. Значение с пробелами может превратиться в несколько аргументов.
- Думают, что `bash -n` доказывает правильность логики. Он проверяет syntax, но не фактическое поведение.
- Печатают сообщение об ошибке, но всегда возвращают exit 0. Для automation вызывающей стороне нужен ненулевой status.
- Считают checksum цифровой подписью. Hash сравнивает байты с baseline; он не сообщает, кто создал файл.
- Используют MD5 как защиту от намеренной подделки. В LX7 для современного примера используется SHA-256.
- Полагаются в cron на интерактивный `PATH`, alias или текущий каталог. Scheduler может иметь другое окружение.
- Удаляют весь crontab вместо собственного блока. Очистка должна затрагивать только ресурсы, созданные этой лабораторной.

## Что важно понять перед тестом

1. Shebang важен при прямом запуске исполняемого script; `bash script.sh` уже явно выбирает Bash.
2. `PATH` — список каталогов поиска команд, а не список всех файлов системы.
3. Кавычки вокруг expanded variables помогают сохранить границы аргумента.
4. `bash -n` — syntax check, не runtime test.
5. Exit status 0 обычно означает успех; ненулевые значения сообщают об ошибке/особом результате.
6. SHA-256 обнаруживает изменение относительно baseline, но эталонная контрольная сумма должна быть доверенной для security-вывода.
7. Пользовательский crontab содержит пять schedule fields и команду; username field относится к системному формату.
8. Cron работает в другом контексте выполнения, поэтому явные пути и окружение делают автоматизацию надёжнее.

<h2 id="quiz">Интерактивный тест</h2>

12 коротких вопросов проверяют решения именно этой лабораторной. Если вариант не подошёл, прочитайте объяснение и попробуйте другой. Повторные попытки помогают учиться и не уменьшают комплектность.

{% include quiz.html quiz_id="lx7" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx7" %}

## Проверенные источники

- Исходная структура LX7: <https://koroteev.site/os/2/3-bash/>
- Первый Bash-сценарий: <https://koroteev.site/text/os23-1/>
- Работа с cron: <https://koroteev.site/text/os23-2/>
- Историческая checksum-практика MD5: <https://koroteev.site/text/os23-3/>
- GNU Bash — Shell Scripts: <https://www.gnu.org/software/bash/manual/html_node/Shell-Scripts.html>
- GNU Bash — Command Search and Execution: <https://www.gnu.org/software/bash/manual/html_node/Command-Search-and-Execution.html>
- GNU Bash — exit builtin: <https://www.gnu.org/software/bash/manual/html_node/Bourne-Shell-Builtins.html>
- GNU Coreutils — SHA-2 utilities: <https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html>
- `crontab(5)`: <https://man7.org/linux/man-pages/man5/crontab.5.html>
- ShellCheck documentation: <https://www.shellcheck.net/>

<p class="next-lab-link"><a href="{{ '/' | relative_url }}#program">Следующая тема: LX8 · Средства обработки текста →</a> <small>LX8 станет активной после отдельной разработки и академической проверки.</small></p>


<aside class="retrieval-thread"><strong>Связь со всей системой</strong><p>Скрипт должен проверить состояние службы и вернуть код результата. Какие две предыдущие лаборатории здесь соединяются?</p><details><summary>Если мысль не приходит</summary><p>Процессы/systemd дают наблюдаемый объект, Bash превращает проверку в повторяемую процедуру.</p></details></aside>

<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если сценарий даёт странный результат</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Проверьте синтаксис отдельно от выполнения: bash -n.</p></details><details><summary>Проверьте</summary><p>Посмотрите реальные аргументы, кавычки и exit status. Не добавляйте sudo как универсальное исправление.</p></details><details><summary>Если всё ещё неясно</summary><p>Упростите вход до одного известного значения и проследите сценарий по шагам.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: Сценарий работает с `file.txt`, но ломается с `my file.txt`. Где искать причину?</summary>
    <p>В обработке аргументов и кавычках вокруг переменных.</p>
  </details>
</section>


{% include peer-moment.html lab="lx7" %}

<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Что делает ваш сценарий пригодным для повторного использования другим человеком, а не только для одного успешного запуска?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Автоматизация готова, когда сценарий повторяем, проверяем и сообщает результат и человеку, и вызывающей программе.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


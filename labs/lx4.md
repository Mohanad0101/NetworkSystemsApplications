---
layout: default
lab_id: lx4
title: LX4 — Процессы и пакеты в Linux
---

# LX4 — Процессы и пакеты в Linux

Установите небольшой пакет из репозитория, разберите его зависимости и состояние, а затем создайте **свои безопасные тестовые процессы** и научитесь наблюдать за ними, менять их состояние и корректно завершать работу.

<p class="meta-line">Подготовка: 5 минут · Практика: 70–90 минут · Среда: учебная Linux Mint VM с Интернетом · Результат: проверенное управление пакетами и контролируемыми процессами</p>

<section class="student-environment" aria-label="Среда курса">
  <div><span>Ваша учебная среда</span><strong>Windows PC → Oracle VirtualBox → Linux Mint 22.3 “Zena”</strong></div>
  <p>Администратор Windows <strong>не требуется для обычной работы курса</strong>. Команды Linux с <code>sudo</code> выполняются внутри Mint VM под вашим учебным Linux-пользователем.</p>
</section>

{% include learning-deck.html lab="lx4" %}

{% include lab-compass.html lab="lx4" %}


{% include lab-start.html lab="lx4" %}

## Зачем это нужно

На Linux-сервере программа обычно проходит два разных этапа: сначала её файлы устанавливаются как пакет, а затем один или несколько процессов запускают этот код. Администратору важно не путать эти уровни: удаление процесса не удаляет программу, а установленный пакет сам по себе не означает, что программа сейчас работает.

В этой лабораторной вы потренируетесь безопасно отвечать на практические вопросы: **что установлено, откуда пакет берётся, какие зависимости нужны, какой процесс сейчас работает, кто его родитель, в каком он состоянии и как корректно на него воздействовать**.

## Что вы изучите

После LX4 вы сможете:

- различать `apt`, `apt-get` и `dpkg` и понимать их роли;
- обновлять индекс пакетов, смотреть candidate-версию и зависимости;
- сначала **симулировать** изменение, а затем устанавливать пакет осознанно;
- различать `remove` и `purge` и не выполнять опасную очистку «на всякий случай»;
- читать PID, PPID, STAT, NI и TTY через `ps`;
- сопоставлять `ps` с информацией из `/proc/<PID>/status`;
- безопасно использовать `SIGSTOP`, `SIGCONT` и `SIGTERM` на собственном тестовом процессе;
- понимать, что большее значение nice означает менее благоприятный CPU scheduling priority для обычного процесса;
- отличать процесс, shell job и системную службу/daemon.

<div class="callout safe-note" markdown="1">
<strong>Безопасность этой лабораторной.</strong> Для экспериментов с сигналами используем только процессы <code>sleep</code>, которые вы запускаете сами. Не применяйте <code>kill</code>, <code>pkill</code> или <code>killall</code> к незнакомым системным процессам. Не запускайте <code>apt upgrade</code>, <code>full-upgrade</code>, <code>autoremove</code> или массовое удаление пакетов ради этой работы.
</div>

## Модель в двух строках

| Объект | Что это означает |
|---|---|
| **Пакет** | Установленные файлы, метаданные, версия и зависимости, которыми управляет пакетная система. |
| **Процесс** | Конкретный работающий экземпляр программы с PID, состоянием и ресурсами. |

Один пакет может запускать много процессов. Один исполняемый файл можно запускать снова после завершения процесса, пока сам файл остаётся установленным.

<span id="packages-environment"></span>

## Часть 1. Познакомьтесь с пакетной системой

<p class="stage-goal"><strong>Готово, когда:</strong> Вы видите версию ОС, архитектуру, версии APT/dpkg, количество установленных пакетов и candidate-версию <code>htop</code>.</p>

Создайте отдельную папку лабораторной и сохраните короткий «паспорт» пакетной среды:

```bash
mkdir -p ~/NSA/LX4
{
  . /etc/os-release
  printf 'OS=%s\n' "$PRETTY_NAME"
  printf 'ARCH=%s\n' "$(dpkg --print-architecture)"
  printf 'APT=%s\n' "$(apt --version | head -n 1)"
  printf 'DPKG=%s\n' "$(dpkg --version | head -n 1)"
  printf 'INSTALLED_PACKAGES=%s\n' "$(dpkg-query -W -f='${db:Status-Abbrev} ${binary:Package}\n' | awk '$1=="ii"{n++} END{print n+0}')"
} | tee ~/NSA/LX4/environment.txt
```

Теперь зафиксируйте, был ли `htop` установлен **до** лабораторной. Это позволит в конце вернуть VM к исходному состоянию:

```bash
if dpkg-query -W -f='${Status}' htop 2>/dev/null | grep -qx 'install ok installed'; then
  echo 'HTOP_BEFORE=installed'
else
  echo 'HTOP_BEFORE=not-installed'
fi | tee ~/NSA/LX4/htop-before.txt
```

Обновите только **список доступных пакетов**, затем изучите `htop`:

```bash
sudo apt update
apt-cache policy htop
apt-cache depends htop | sed -n '1,24p'
```

`apt update` не обновляет сами установленные программы: команда получает актуальную информацию из настроенных источников. `apt-cache policy` показывает установленную и candidate-версию, а `apt-cache depends` помогает увидеть объявленные зависимости.

<p class="lab-tip"><strong>Если <code>apt update</code> не проходит.</strong> Это хороший диагностический момент, а не повод менять repositories наугад. Сначала проверьте сеть VM: <code>ip -br a</code>, затем <code>ping -c 2 1.1.1.1</code> и <code>getent hosts archive.ubuntu.com</code>. Если IP доступен, а имя нет — проблема похожа на name resolution. Если сеть учебной аудитории ограничена, покажите результат преподавателю.</p>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX4-01"><strong>В отчёт · LX4-01.</strong> Вставьте <code>cat ~/NSA/LX4/environment.txt</code>, <code>cat ~/NSA/LX4/htop-before.txt</code> и первые строки <code>apt-cache policy htop</code>. Полный список всех пакетов не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX4-01">
  <label for="evidence-LX4-01">Поле для результата · LX4-01</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте только короткий фактический вывод команд. Поле работает локально и само ничего не отправляет.</p>
  <textarea id="evidence-LX4-01" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX4-01" placeholder="Вставьте сюда результат из терминала…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="packages-install"></span>

## Часть 2. Сначала симуляция, затем установка

<p class="stage-goal"><strong>Готово, когда:</strong> Вы прочитали план установки, установили <code>htop</code>, увидели его статус/версию/путь и проверили целостность зависимостей.</p>

Для интерактивной работы `apt` удобен человеку, а `apt-get` имеет более стабильный интерфейс для сценариев. В этой лабораторной используем `apt-get -s` как безопасную предварительную симуляцию, а реальную установку выполняем через понятный интерактивный `apt`.

Сначала **ничего не меняйте** и посмотрите план:

```bash
apt-get -s install htop
```

Найдите в выводе, какие пакеты будут установлены или изменены. Затем установите пакет. Не используйте `-y`: сначала прочитайте предложение APT и только после этого подтвердите его.

```bash
sudo apt install htop
```

Проверьте результат несколькими независимыми способами:

```bash
{
  dpkg-query -W -f='STATUS=${Status}\nVERSION=${Version}\n' htop
  printf 'PATH=%s\n' "$(command -v htop)"
  htop --version | head -n 1
} | tee ~/NSA/LX4/htop-installed.txt

dpkg-query -L htop | sed -n '1,15p'
sudo apt-get check && echo 'APT_CHECK=OK'
```

Теперь **только смоделируйте** удаление и purge. Ничего пока не удаляйте:

```bash
apt-get -s remove htop
apt-get -s purge htop
```

Сравните два плана. `remove` удаляет пакет, но обычно оставляет его системные configuration files; `purge` предназначен также для удаления этих конфигурационных файлов. Пользовательские данные в домашнем каталоге — отдельная категория и не должны считаться «автоматически удаляемыми purge».

<div class="callout checkpoint" markdown="1">
<strong>Главная идея.</strong> <code>dpkg</code> — базовый менеджер Debian-пакетов, а APT работает уровнем выше и помогает с repositories и зависимостями. Поэтому для обычной установки из настроенного репозитория предпочтительнее APT, а не ручное управление зависимостями через <code>dpkg</code>.
</div>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX4-02"><strong>В отчёт · LX4-02.</strong> Вставьте <code>cat ~/NSA/LX4/htop-installed.txt</code>, несколько первых строк <code>dpkg-query -L htop</code> и строку <code>APT_CHECK=OK</code>. Симуляции remove/purge достаточно проанализировать; весь их длинный вывод в отчёт не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX4-02">
  <label for="evidence-LX4-02">Поле для результата · LX4-02</label>
  <p class="evidence-editor-help" data-evidence-help>Сохраните только доказательство установки и проверки, а не весь журнал APT.</p>
  <textarea id="evidence-LX4-02" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX4-02" placeholder="Вставьте сюда основной результат…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<details class="optional-work" markdown="1">
<summary>Дополнительно · GUI и другие способы доставки ПО</summary>

Откройте Linux Mint **Software Manager** и найдите `htop` или другое знакомое приложение. Сопоставьте графическую карточку с тем, что вы увидели через APT. Отдельный снимок экрана не нужен.

Linux также использует другие способы доставки приложений, например Flatpak, а в некоторых дистрибутивах — Snap. Это отдельные системы со своей моделью пакетов и sandboxing; не смешивайте их команды с APT/dpkg.

Компиляция из исходного кода тоже возможна, но не является универсальной последовательностью `./configure && make && make install`: современные проекты используют разные build systems. Кроме того, ручной `make install` может установить файлы вне учёта системного пакетного менеджера. В обязательной LX4 мы сначала осваиваем управляемый и воспроизводимый путь через repository package.
</details>

<span id="process-observe"></span>

## Часть 3. Наблюдайте за собственным процессом

<p class="stage-goal"><strong>Готово, когда:</strong> Для тестового <code>sleep</code> вы видите PID, PPID, STAT, NI и TTY и находите тот же PID/PPID в <code>/proc</code>.</p>

Сначала посмотрите небольшой срез процессов:

```bash
ps -eo pid,ppid,user,stat,ni,tty,comm --sort=pid | head -n 18
```

`ps` показывает снимок состояния на момент запуска команды. Для постоянно обновляющегося обзора позже можно использовать `top` или `htop`.

Теперь создайте **свой** безопасный процесс. Не закрывайте этот терминал до части 4:

```bash
sleep 7200 &
LAB_PID=$!
printf '%s\n' "$LAB_PID" | tee ~/NSA/LX4/sleep.pid
printf 'LAB_PID=%s\n' "$LAB_PID"
ps -o pid,ppid,user,stat,ni,tty,cmd -p "$LAB_PID"
grep -E '^(Name|State|Pid|PPid|Threads):' "/proc/$LAB_PID/status"
```

`$!` — PID последней команды, запущенной оболочкой в background. В `ps`:

- **PID** идентифицирует процесс;
- **PPID** показывает родительский процесс — здесь обычно вашу shell;
- **STAT** кодирует состояние процесса и дополнительные флаги;
- **NI** — niceness;
- **TTY** показывает связанный терминал, если он есть.

`/proc/<PID>/status` — удобное человекочитаемое представление информации, которую ядро публикует о процессе. Не редактируйте файлы в `/proc` как обычные конфигурационные файлы: это виртуальная файловая система интерфейсов ядра.

<p class="lab-tip"><strong>Не путайте фон с daemon.</strong> <code>sleep 7200 &</code> — shell job, запущенный асинхронно. Символ <code>&</code> сам по себе не превращает программу в системную службу и не гарантирует, что она переживёт закрытие терминала или logout. Системные службы вы будете изучать отдельно.</p>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX4-03"><strong>В отчёт · LX4-03.</strong> Вставьте строку <code>LAB_PID=…</code>, одну строку <code>ps</code> для этого PID и строки <code>Name/State/Pid/PPid/Threads</code> из <code>/proc/&lt;PID&gt;/status</code>.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX4-03">
  <label for="evidence-LX4-03">Поле для результата · LX4-03</label>
  <p class="evidence-editor-help" data-evidence-help>Короткого вывода достаточно: нам важно сопоставить один контролируемый процесс в двух источниках.</p>
  <textarea id="evidence-LX4-03" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX4-03" placeholder="Вставьте сюда PID и основные строки процесса…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="process-control"></span>

## Часть 4. Сигналы, состояние и nice

<p class="stage-goal"><strong>Готово, когда:</strong> Ваш тестовый процесс проходит через stop/continue, второй процесс получает NI=15, а оба завершаются через <code>SIGTERM</code>.</p>

Сначала восстановите PID из файла и убедитесь, что процесс ещё существует:

```bash
LAB_PID=$(cat ~/NSA/LX4/sleep.pid)
kill -0 "$LAB_PID" && echo 'LAB_PROCESS=alive'
ps -o pid,user,comm,args -p "$LAB_PID"
```

`kill -0` не посылает обычный сигнал завершения: это удобная проверка доступности PID и прав на сигнал. **Перед следующим блоком посмотрите строку `ps`: PID должен принадлежать вашему пользователю, а команда должна быть именно вашим `sleep 7200`.** Если процесса уже нет или PID показывает другую команду, не посылайте ему сигналы — спокойно повторите часть 3 и используйте новый PID.

Остановите и продолжите **только этот проверенный процесс**:

```bash
kill -STOP "$LAB_PID"
echo 'AFTER_STOP'
ps -o pid,ppid,stat,ni,tty,cmd -p "$LAB_PID"

kill -CONT "$LAB_PID"
echo 'AFTER_CONT'
ps -o pid,ppid,stat,ni,tty,cmd -p "$LAB_PID"
```

После `SIGSTOP` в `STAT` обычно появляется `T` — stopped. `SIGCONT` позволяет продолжить выполнение.

Теперь запустите второй контролируемый процесс с niceness 10 и затем **увеличьте** nice value до 15:

```bash
nice -n 10 sleep 7200 &
NICE_PID=$!
printf '%s\n' "$NICE_PID" | tee ~/NSA/LX4/nice.pid
printf 'NICE_PID=%s\n' "$NICE_PID"
ps -o pid,ni,stat,cmd -p "$NICE_PID"

renice --priority 15 -p "$NICE_PID"
printf 'NICE_AFTER=%s\n' "$(ps -o ni= -p "$NICE_PID" | tr -d ' ')"
```

На Linux nice обычно лежит в диапазоне `-20…19`: **большее** значение менее благоприятно для процесса при CPU scheduling. Обычный пользователь может безопасно сделать свой процесс «nice к другим», увеличив значение; уменьшение nice value может потребовать дополнительных полномочий.

Завершите оба тестовых процесса корректным сигналом `SIGTERM`:

```bash
kill -TERM "$LAB_PID" "$NICE_PID"
sleep 1
for pid in "$LAB_PID" "$NICE_PID"; do
  if kill -0 "$pid" 2>/dev/null; then
    printf 'PID_%s_FINISHED=NO\n' "$pid"
  else
    printf 'PID_%s_FINISHED=YES\n' "$pid"
  fi
done
jobs -l
```

`SIGTERM` — нормальный первый выбор для корректного завершения: программа может обработать его и выполнить cleanup. `SIGKILL` нельзя обработать; это аварийный инструмент, а не обычный первый шаг. В этой лабораторной `SIGKILL` не нужен.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX4-04"><strong>В отчёт · LX4-04.</strong> Вставьте строки <code>AFTER_STOP</code>/<code>AFTER_CONT</code> с соответствующим <code>ps</code>, строку <code>NICE_AFTER=15</code> и финальные <code>PID_…_FINISHED=YES</code>. Этого достаточно.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX4-04">
  <label for="evidence-LX4-04">Поле для результата · LX4-04</label>
  <p class="evidence-editor-help" data-evidence-help>Сохраните только контрольные строки. Если результат немного отличается, подсказка поможет сверить шаг, но не заблокирует работу.</p>
  <textarea id="evidence-LX4-04" rows="7" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX4-04" placeholder="Вставьте сюда stop/continue, nice и завершение процессов…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<details class="optional-work" markdown="1">
<summary>Дополнительно · htop и job control</summary>

### Наблюдение в htop

Запустите `htop`, найдите свой `sleep` по имени или PID, посмотрите PID, пользователя, CPU/MEM и состояние. Выйдите клавишей `q` или `F10`. Не завершайте случайные системные процессы из интерфейса.

### Foreground и background в Bash

В новом терминале выполните:

```bash
sleep 120
```

Нажмите `Ctrl+Z`, затем:

```bash
jobs -l
bg %1
jobs -l
fg %1
```

После `fg %1` завершите ваш `sleep` через `Ctrl+C`. Здесь **job** — объект job control вашей shell и может включать pipeline из нескольких процессов; job number `%1` — не то же самое, что PID.
</details>

<span id="packages-cleanup"></span>

## Часть 5. Уберите учебный пакет, если он был новым

<p class="stage-goal"><strong>Готово, когда:</strong> Тестовые процессы завершены, а <code>htop</code> оставлен или удалён в соответствии с его состоянием до LX4.</p>

Если `htop` **не был установлен** до лабораторной, удалите только сам пакет. Если был — оставьте его:

```bash
if grep -qx 'HTOP_BEFORE=not-installed' ~/NSA/LX4/htop-before.txt; then
  sudo apt remove htop
  echo 'HTOP_CLEANUP=removed-lab-install'
else
  echo 'HTOP_CLEANUP=kept-preexisting-install'
fi
```

Не запускайте `autoremove` автоматически: оно может предложить удалить пакеты, не относящиеся напрямую к учебному эксперименту. Если при установке были добавлены новые зависимости, мы намеренно не удаляем их вслепую — сначала всегда изучают план изменений.

Проверьте, что ваши тестовые процессы действительно не остались работать:

```bash
for f in ~/NSA/LX4/sleep.pid ~/NSA/LX4/nice.pid; do
  [ -f "$f" ] || continue
  pid=$(cat "$f")
  if kill -0 "$pid" 2>/dev/null; then
    echo "CHECK_$pid=still-running"
  else
    echo "CHECK_$pid=finished"
  fi
done
```

<p class="lab-tip"><strong>Хорошая практика администратора:</strong> перед изменением состояния сначала наблюдайте и прогнозируйте эффект, затем выполняйте минимальное действие и снова проверяйте. Эта схема работает и для пакетов, и для процессов.</p>

## Частые ошибки

- Путают `apt update` с обновлением установленных приложений. `update` обновляет индекс доступных пакетов.
- Устанавливают/удаляют пакет без предварительного чтения плана, хотя симуляция доступна.
- Используют `dpkg -i` как универсальную замену APT и ожидают полного разрешения зависимостей автоматически.
- Считают, что завершение процесса удаляет установленную программу.
- Запускают `kill -9` первым действием. Обычно сначала подходит `SIGTERM`.
- Думают, что `&` создаёт daemon. Это только асинхронный shell job.
- Считают, что nice 15 «быстрее» nice 10. Напротив, большее nice value менее благоприятно для CPU scheduling.
- Применяют команды сигналов к чужим/системным PID вместо собственного учебного `sleep`.

## Что важно понять перед тестом

1. `apt` и `dpkg` связаны, но находятся на разных уровнях управления пакетами.
2. Установленный пакет и работающий процесс — не одно и то же.
3. `ps` — снимок; `/proc/<PID>` даёт данные конкретного живого процесса; `top/htop` обновляют представление повторно.
4. Signal — запрос/событие для процесса, а не обязательно «убийство». `STOP`, `CONT` и `TERM` демонстрируют разные действия.
5. Shell job и системная service/daemon — разные понятия.

<h2 id="quiz">Интерактивный тест</h2>

12 коротких вопросов проверяют решения, которые вы только что применили. Можно выбирать другой вариант после ошибки и проходить тест повторно для закрепления. Повторные попытки не уменьшают комплектность и не являются штрафом.

{% include quiz.html quiz_id="lx4" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx4" %}

## Проверенные источники

- Исходная структура темы LX4: <https://koroteev.site/os/1/4-processes/>
- Ubuntu `apt(8)`: <https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html>
- Ubuntu `apt-get(8)`: <https://manpages.ubuntu.com/manpages/noble/man8/apt-get.8.html>
- Ubuntu `dpkg(1)`: <https://manpages.ubuntu.com/manpages/noble/man1/dpkg.1.html>
- Linux `ps(1)`: <https://man7.org/linux/man-pages/man1/ps.1.html>
- Linux `/proc/<pid>/status`: <https://man7.org/linux/man-pages/man5/proc_pid_status.5.html>
- Linux `kill(1)`: <https://man7.org/linux/man-pages/man1/kill.1.html>
- Linux `nice(1)` / `renice(1)`: <https://man7.org/linux/man-pages/man1/nice.1.html> · <https://man7.org/linux/man-pages/man1/renice.1.html>
- GNU Bash Job Control: <https://www.gnu.org/software/bash/manual/bash.html#Job-Control-Basics>

<p class="next-lab-link"><a href="{{ '/labs/lx5.html' | relative_url }}">Следующая лабораторная: LX5 · Управление загрузкой и службами →</a></p>


<aside class="retrieval-thread"><strong>Связь с терминалом</strong><p>Когда вы запускаете `sleep 300 &amp;`, что из LX1 помогает объяснить символ `&amp;` и почему shell сразу возвращает приглашение?</p><details><summary>Если мысль не приходит</summary><p>Сформулируйте разницу между командой, процессом и управлением shell.</p></details></aside>

<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если процесс ведёт себя неожиданно</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Убедитесь, что наблюдаете именно свой тестовый процесс и знаете его PID.</p></details><details><summary>Проверьте</summary><p>Состояние, PPID и команду процесса перед отправкой сигнала.</p></details><details><summary>Если всё ещё неясно</summary><p>Создайте новый безопасный тестовый процесс и повторите наблюдение с известным начальным состоянием.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: Процесс завершён. Нужно ли заново устанавливать пакет?</summary>
    <p>Нет. Установка пакета и существование конкретного процесса — разные состояния.</p>
  </details>
</section>


{% include peer-moment.html lab="lx4" %}

<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Какой факт нужно знать перед отправкой сигнала процессу, чтобы не воздействовать на неправильный объект?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Вы завершаете работу, когда можете отличить установленную программу от конкретного процесса и управлять безопасным тестовым экземпляром.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


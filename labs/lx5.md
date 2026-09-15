---
layout: default
lab_id: lx5
title: LX5 — Управление загрузкой Linux и службами systemd
---

# LX5 — Управление загрузкой Linux и службами systemd

Разберите, как Linux с `systemd` переходит от загрузки к рабочему состоянию, затем создайте **собственную безопасную службу**, проверьте unit-файл, включите автозапуск, изучите журнал и выполните контролируемый restart.

<p class="meta-line">Подготовка: 5 минут · Практика: 70–90 минут · Среда: учебная Linux Mint VM · Результат: собственная systemd-служба, которую вы умеете проверить, запустить, включить в автозапуск и диагностировать</p>

{% include learning-deck.html lab="lx5" %}

<div class="lab-journey" aria-label="Маршрут лабораторной">
  <span><strong>Разобраться</strong></span><span>Попробовать</span><span>Выполнить</span><span>Проверить</span><span>Собрать отчёт</span>
</div>

{% include output-inspector.html lab="lx5" %}

{% include lab-start.html lab="lx5" %}

## Зачем это нужно

На сервере мало просто запустить программу в терминале. Служба должна запускаться предсказуемо, работать от нужного пользователя, оставлять диагностические сообщения и корректно останавливаться. В современных Linux-системах семейства Ubuntu/Linux Mint эту задачу обычно решает `systemd`.

Важно различать три вещи:

- **процесс** — конкретный работающий экземпляр программы;
- **service unit** — описание того, как systemd должен управлять программой;
- **enable/start** — разные действия: включить запуск при достижении нужного target и запустить службу прямо сейчас.

В этой работе вы не будете менять bootloader, kernel, `default.target` или существующие системные службы. Мы создадим только одну изолированную учебную службу `lx5-heartbeat.service`, а в конце аккуратно удалим её.

## Что вы изучите

После LX5 вы сможете:

- объяснить путь `firmware → bootloader → kernel → userspace → systemd → targets/services` на концептуальном уровне;
- проверить PID 1, default target и основные показатели загрузки;
- понимать назначение секций `[Unit]`, `[Service]` и `[Install]`;
- создать собственный `.service` unit и проверить его через `systemd-analyze verify`;
- различать `daemon-reload`, `start`, `stop`, `restart`, `enable` и `disable`;
- проверить `ActiveState`, `SubState`, `MainPID` и `UnitFileState`;
- читать журнал конкретной службы через `journalctl -u`;
- понимать, зачем нужны `Restart=on-failure`, `User=`, `NoNewPrivileges=` и базовые sandbox-параметры;
- отличать **автозапуск** от **немедленного запуска** и service reload от reload конфигурации самого systemd manager.

<div class="callout safe-note" markdown="1">
<strong>Безопасность LX5.</strong> Не используйте <code>systemctl isolate</code>, <code>set-default</code>, <code>mask</code>, не отключайте NetworkManager/SSH/display manager и не редактируйте GRUB. Все команды изменения состояния относятся только к <code>lx5-heartbeat.service</code>, которую вы создаёте сами.
</div>

## Модель загрузки без лишней теории

```text
Firmware (UEFI/BIOS)
        ↓
Bootloader
        ↓
Linux kernel (+ initramfs, если используется)
        ↓
userspace / PID 1
        ↓
systemd targets + units
        ↓
службы, вход пользователя, графическая или консольная среда
```

На systemd-системе `default.target` обычно указывает на цель, к которой система должна прийти по умолчанию. `graphical.target` обычно включает графическую среду, а `multi-user.target` соответствует многопользовательскому неграфическому уровню. Targets собирают зависимости; systemd может запускать независимые части параллельно, поэтому загрузка — не просто один последовательный список команд.

<span id="boot-observe"></span>

## Часть 1. Исследуйте загрузку своей VM

<p class="stage-goal"><strong>Готово, когда:</strong> Вы подтвердили, кто является PID 1, увидели default target, состояние systemd и основные времена текущей загрузки.</p>

Создайте рабочую папку и снимите короткий «паспорт» загрузки:

```bash
mkdir -p ~/NSA/LX5
{
  printf 'PID1='; ps -p 1 -o comm=
  printf 'DEFAULT_TARGET='; systemctl get-default
  state=$(systemctl is-system-running 2>/dev/null || true)
  printf 'SYSTEM_STATE=%s\n' "${state:-unknown}"
  systemd-analyze time | head -n 2
} | tee ~/NSA/LX5/boot-summary.txt
```

Посмотрите несколько активных targets и работающих служб:

```bash
systemctl list-units --type=target --state=active --no-pager | sed -n '1,18p'
systemctl list-units --type=service --state=running --no-pager | sed -n '1,18p'
```

`systemd-analyze time` помогает изучить загрузку, но его итог нельзя трактовать как «точное время до полной готовности абсолютно всего»: документация systemd прямо предупреждает, что измерение заканчивается, когда необходимые system services были запущены, а не обязательно когда каждое приложение завершило всю внутреннюю инициализацию.

<p class="lab-tip"><strong>Если SYSTEM_STATE=degraded.</strong> Это не означает автоматически, что VM непригодна. Сначала выполните <code>systemctl --failed --no-pager</code> и посмотрите, какая unit отмечена как failed. В учебной desktop-VM отдельная несущественная unit иногда может быть failed. Не «лечите» это случайными командами — если причина непонятна, покажите преподавателю.</p>

<details class="optional-work" markdown="1">
<summary>Дополнительно · посмотреть critical chain загрузки</summary>

```bash
systemd-analyze critical-chain | sed -n '1,25p'
```

Critical chain помогает увидеть временную цепочку зависимостей, но это тоже диагностическое представление, а не универсальный рейтинг «самых плохих» служб. Параллельный запуск и socket activation могут влиять на интерпретацию.

</details>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX5-01"><strong>В отчёт · LX5-01.</strong> Вставьте <code>cat ~/NSA/LX5/boot-summary.txt</code> и 3–5 строк активных targets/services. Полные списки не нужны.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX5-01">
  <label for="evidence-LX5-01">Поле для результата · LX5-01</label>
  <p class="evidence-editor-help" data-evidence-help>Сохраните короткий фактический вывод: PID 1, default target, system state и основные данные загрузки.</p>
  <textarea id="evidence-LX5-01" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX5-01" placeholder="Вставьте сюда основной результат…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="service-program"></span>

## Часть 2. Создайте программу службы и сначала проверьте её вручную

<p class="stage-goal"><strong>Готово, когда:</strong> Python-программа запускается обычным пользователем, печатает heartbeat и корректно завершает цикл после SIGTERM.</p>

Сначала создадим простую программу без сети и без файловых привилегий. Она только пишет сообщения в stdout; после запуска через systemd эти сообщения попадут в journal.

```bash
cat > ~/NSA/LX5/heartbeat.py <<'PY'
#!/usr/bin/env python3
import os
import signal
import time

running = True


def request_stop(signum, _frame):
    global running
    print(f"LX5_STOP signal={signum} pid={os.getpid()}", flush=True)
    running = False


signal.signal(signal.SIGTERM, request_stop)
signal.signal(signal.SIGINT, request_stop)

print(f"LX5_START pid={os.getpid()} uid={os.getuid()}", flush=True)
count = 0
while running:
    count += 1
    print(f"LX5_HEARTBEAT count={count}", flush=True)
    time.sleep(2)

print("LX5_EXIT clean", flush=True)
PY

chmod 0755 ~/NSA/LX5/heartbeat.py
python3 -m py_compile ~/NSA/LX5/heartbeat.py && echo 'PYTHON_CHECK=OK'
timeout --signal=TERM 7s python3 ~/NSA/LX5/heartbeat.py | tee ~/NSA/LX5/manual-test.txt
```

Команда `timeout` здесь играет роль безопасного таймера: примерно через 7 секунд она посылает SIGTERM. В выводе должны появиться `LX5_START`, несколько `LX5_HEARTBEAT`, затем `LX5_STOP` и `LX5_EXIT clean`.

<div class="callout checkpoint" markdown="1">
<strong>Почему сначала ручной запуск?</strong> Если программа сама по себе не работает, бессмысленно сразу искать проблему в systemd. Хорошая диагностика разделяет уровни: сначала программа, потом unit, потом lifecycle службы.
</div>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX5-02"><strong>В отчёт · LX5-02.</strong> Вставьте строку <code>PYTHON_CHECK=OK</code> и содержимое <code>~/NSA/LX5/manual-test.txt</code>. Достаточно начала, 2–3 heartbeat и корректного завершения.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX5-02">
  <label for="evidence-LX5-02">Поле для результата · LX5-02</label>
  <p class="evidence-editor-help" data-evidence-help>Покажите, что программа работает до регистрации как служба.</p>
  <textarea id="evidence-LX5-02" rows="7" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX5-02" placeholder="Вставьте сюда проверку Python и heartbeat…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="unit-create"></span>

## Часть 3. Создайте и проверьте systemd unit

<p class="stage-goal"><strong>Готово, когда:</strong> Скрипт установлен в системный каталог, unit-файл создан, <code>systemd-analyze verify</code> не находит ошибок, а <code>systemctl cat</code> показывает именно вашу конфигурацию.</p>

Установите **копию** программы в отдельный системный каталог. Исходник в `~/NSA/LX5` оставляем для сравнения:

```bash
sudo install -d -o root -g root -m 0755 /usr/local/lib/lx5-heartbeat
sudo install -o root -g root -m 0755 \
  ~/NSA/LX5/heartbeat.py \
  /usr/local/lib/lx5-heartbeat/heartbeat.py
```

Теперь сформируйте unit автоматически с **вашим реальным Linux username**, без примерного чужого имени:

```bash
SERVICE_USER=$(id -un)
cat > ~/NSA/LX5/lx5-heartbeat.service <<EOF_UNIT
[Unit]
Description=LX5 training heartbeat service

[Service]
Type=exec
User=$SERVICE_USER
ExecStart=/usr/bin/python3 /usr/local/lib/lx5-heartbeat/heartbeat.py
Restart=on-failure
RestartSec=2s
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes

[Install]
WantedBy=multi-user.target
EOF_UNIT

sudo install -o root -g root -m 0644 \
  ~/NSA/LX5/lx5-heartbeat.service \
  /etc/systemd/system/lx5-heartbeat.service

sudo systemd-analyze verify /etc/systemd/system/lx5-heartbeat.service \
  && echo 'UNIT_VERIFY=OK'
sudo systemctl daemon-reload
systemctl cat lx5-heartbeat.service
```

В исходном материале используется `Type=simple`. Это допустимо, но современная документация systemd отмечает, что для длительно работающих служб `Type=exec` часто удобнее: `systemctl start` сможет сообщить об ошибке, если сам executable или указанный пользователь не могут быть запущены. Мы используем `Type=exec` именно по этой причине.

### Что означает наш unit

| Директива | Смысл в этой лабораторной |
|---|---|
| `User=` | Heartbeat работает не от root, а от вашего обычного пользователя. |
| `ExecStart=` | Точная программа, которой systemd управляет как main process. |
| `Restart=on-failure` | Попытаться восстановить длительную службу после реального сбоя. Обычный `systemctl stop` не запускает её снова. |
| `NoNewPrivileges=yes` | Процесс и его потомки не смогут получить новые привилегии через `execve()`. |
| `ProtectSystem=strict` | Системное дерево файлов доступно службе только для чтения. |
| `ProtectHome=yes` | Домашние каталоги скрыты от этой учебной службы: они ей не нужны. |
| `WantedBy=multi-user.target` | При `enable` systemctl создаёт связь с target, чтобы unit могла быть подтянута при обычной многопользовательской загрузке. |

<p class="lab-tip"><strong><code>daemon-reload</code> ≠ <code>reload service</code>.</strong> После изменения unit-файла используйте <code>systemctl daemon-reload</code>, чтобы systemd перечитал unit configuration. Команда <code>systemctl reload name.service</code> просит уже работающую программу перечитать <em>её собственную</em> конфигурацию и работает только если конкретная служба это поддерживает. Наша heartbeat-служба reload не реализует.</p>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX5-03"><strong>В отчёт · LX5-03.</strong> Вставьте <code>UNIT_VERIFY=OK</code>, строку <code>SERVICE_USER=$(id -un)</code> с фактическим значением и содержимое unit из <code>systemctl cat lx5-heartbeat.service</code>.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX5-03">
  <label for="evidence-LX5-03">Поле для результата · LX5-03</label>
  <p class="evidence-editor-help" data-evidence-help>Покажите только unit и успешную проверку — длинный systemd dump не нужен.</p>
  <textarea id="evidence-LX5-03" rows="8" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX5-03" placeholder="Вставьте сюда UNIT_VERIFY=OK и основной unit…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="service-lifecycle"></span>

## Часть 4. Разделите enable, start, restart и journal

<p class="stage-goal"><strong>Готово, когда:</strong> Вы увидели, что <code>enable</code> сам по себе не запускает службу, затем запустили её, нашли MainPID, прочитали journal и подтвердили новый PID после restart.</p>

Сначала приведите **только вашу учебную unit** к известному состоянию. Это также делает повторное выполнение LX5 предсказуемым:

```bash
sudo systemctl disable --now lx5-heartbeat.service 2>/dev/null || true
sudo systemctl daemon-reload

enabled=$(systemctl is-enabled lx5-heartbeat.service 2>/dev/null || true)
active=$(systemctl is-active lx5-heartbeat.service 2>/dev/null || true)
printf 'BEFORE_ENABLED=%s\nBEFORE_ACTIVE=%s\n' "$enabled" "$active" \
  | tee ~/NSA/LX5/lifecycle.txt
```

Теперь **только включите автозапуск**, не запускайте службу:

```bash
sudo systemctl enable lx5-heartbeat.service
enabled=$(systemctl is-enabled lx5-heartbeat.service 2>/dev/null || true)
active=$(systemctl is-active lx5-heartbeat.service 2>/dev/null || true)
printf 'AFTER_ENABLE_ENABLED=%s\nACTIVE_AFTER_ENABLE=%s\n' "$enabled" "$active" \
  | tee -a ~/NSA/LX5/lifecycle.txt
```

Ожидаемая идея: `AFTER_ENABLE_ENABLED=enabled`, но `ACTIVE_AFTER_ENABLE=inactive`. Это и есть практическое различие **enable ≠ start**. Если нужно выполнить оба действия одним административным решением, существует `enable --now`, но здесь мы намеренно разделяем их, чтобы увидеть смысл каждого.

Запустите службу и получите её runtime-состояние:

```bash
sudo systemctl start lx5-heartbeat.service
{
  printf 'AFTER_START_ACTIVE='; systemctl is-active lx5-heartbeat.service
  systemctl show lx5-heartbeat.service \
    -p ActiveState -p SubState -p UnitFileState -p MainPID -p User \
    --no-pager
} | tee -a ~/NSA/LX5/lifecycle.txt

systemctl status lx5-heartbeat.service --no-pager
sudo journalctl -u lx5-heartbeat.service -n 10 --no-pager
```

В журнале должны появиться сообщения `LX5_START` и `LX5_HEARTBEAT`. `journalctl -u` фильтрует записи, связанные с указанной unit.

Теперь проверьте restart как **stop + новый start** и сравните MainPID:

```bash
OLD_PID=$(systemctl show lx5-heartbeat.service -p MainPID --value)
sudo systemctl restart lx5-heartbeat.service
NEW_PID=$(systemctl show lx5-heartbeat.service -p MainPID --value)

printf 'MAINPID_BEFORE_RESTART=%s\nMAINPID_AFTER_RESTART=%s\n' "$OLD_PID" "$NEW_PID" \
  | tee -a ~/NSA/LX5/lifecycle.txt

if [ -n "$OLD_PID" ] && [ -n "$NEW_PID" ] && [ "$OLD_PID" != "$NEW_PID" ]; then
  echo 'RESTART_PID_CHANGED=YES' | tee -a ~/NSA/LX5/lifecycle.txt
else
  echo 'RESTART_PID_CHANGED=CHECK' | tee -a ~/NSA/LX5/lifecycle.txt
fi

sudo journalctl -u lx5-heartbeat.service -n 14 --no-pager
```

<p class="lab-tip"><strong>Если служба не active.</strong> Не повторяйте <code>start</code> много раз. Используйте короткий цикл диагностики: <code>systemctl status lx5-heartbeat.service --no-pager</code> → <code>journalctl -u lx5-heartbeat.service -n 30 --no-pager</code> → <code>systemctl cat lx5-heartbeat.service</code> → после изменения unit выполните <code>sudo systemd-analyze verify …</code> и <code>sudo systemctl daemon-reload</code>.</p>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX5-04"><strong>В отчёт · LX5-04.</strong> Вставьте <code>cat ~/NSA/LX5/lifecycle.txt</code> и 4–6 последних строк <code>journalctl -u lx5-heartbeat.service</code> с heartbeat/restart. Полный journal не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX5-04">
  <label for="evidence-LX5-04">Поле для результата · LX5-04</label>
  <p class="evidence-editor-help" data-evidence-help>Главное — показать enable/start как разные состояния, active service, MainPID и результат restart.</p>
  <textarea id="evidence-LX5-04" rows="8" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX5-04" placeholder="Вставьте сюда lifecycle и несколько строк journal…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<details class="optional-work" markdown="1">
<summary>Дополнительно · проверить настоящий автозапуск после reboot</summary>

Если преподаватель разрешил перезагрузку VM и времени достаточно, **до очистки** выполните:

```bash
sudo reboot
```

После нового входа:

```bash
systemctl is-enabled lx5-heartbeat.service
systemctl is-active lx5-heartbeat.service
systemctl show lx5-heartbeat.service -p MainPID -p ActiveState -p UnitFileState --no-pager
sudo journalctl -u lx5-heartbeat.service -b -n 10 --no-pager
```

Это сильнее, чем просто `is-enabled`: вы видите, что unit действительно была запущена в новом boot. Отдельное доказательство в отчёт по умолчанию не требуется.

</details>

<span id="service-cleanup"></span>

## Часть 5. Очистите учебную службу и закрепите понимание

<p class="stage-goal"><strong>Готово, когда:</strong> Учебная служба остановлена и отключена, созданные системные файлы удалены, systemd перечитал конфигурацию, а MCQ пройдена.</p>

Сначала остановите и отключите **только** созданную вами службу:

```bash
sudo systemctl disable --now lx5-heartbeat.service
sudo rm -f /etc/systemd/system/lx5-heartbeat.service
sudo rm -rf /usr/local/lib/lx5-heartbeat
sudo systemctl daemon-reload
sudo systemctl reset-failed lx5-heartbeat.service 2>/dev/null || true

if systemctl cat lx5-heartbeat.service >/dev/null 2>&1; then
  echo 'LX5_CLEANUP=CHECK'
else
  echo 'LX5_CLEANUP=OK'
fi
```

Оставьте `~/NSA/LX5/` до окончания отчёта: там находятся ваши собственные учебные результаты. Удалять их необязательно.

<div class="callout checkpoint" markdown="1">
<strong>Что вы сделали как администратор.</strong> Вы не «запустили скрипт в фоне», а описали управляемую службу: указали процесс, пользователя и политику restart, проверили unit до запуска, разделили enable/start, прочитали runtime state и journal, а затем вернули систему к чистому состоянию.
</div>

## Частые ошибки

- Считают `enable` синонимом `start`. `enable` создаёт связи автозапуска; без `--now` не обязан запускать unit немедленно.
- После изменения `.service` выполняют `systemctl reload service`, хотя нужен `systemctl daemon-reload` для перечитывания unit-файлов.
- Пишут в `ExecStart=` shell pipeline с `|` или `>` и ожидают поведение Bash. `ExecStart=` не является обычной shell-командой; если shell действительно нужен, его указывают явно.
- Запускают учебную службу от root без необходимости. В нашем примере `User=` специально ограничивает контекст процесса.
- Смотрят только `status`, но не журнал. Для причины сбоя `journalctl -u` обычно даёт необходимые сообщения программы и systemd.
- Думают, что `Restart=on-failure` отменяет `systemctl stop`. Нет: остановка, инициированная systemd, не считается причиной автоматического restart.
- Добавляют `After=network.target` «на всякий случай». Ordering dependency нужна только при реальной зависимости; наша heartbeat-служба сеть не использует.
- Экспериментируют с `mask`, `isolate`, `set-default` или системными службами вместо собственной unit.

## Что важно понять перед тестом

1. `default.target` задаёт основную цель загрузки systemd через зависимости, а не последовательный «runlevel script».
2. `[Unit]` описывает общие свойства/зависимости, `[Service]` — процесс, `[Install]` — правила enable/disable.
3. `Type=exec` позволяет systemd дождаться успешного `execve()` основного процесса и лучше замечать ошибки запуска executable/user.
4. `enable`, `start` и `daemon-reload` решают разные задачи.
5. `journalctl -u` и `systemctl status/show` дополняют друг друга при диагностике.
6. Автоматическое восстановление (`Restart=`) — политика надёжности, а не замена пониманию причины сбоя.

<h2 id="quiz">Интерактивный тест</h2>

12 коротких вопросов проверяют именно решения LX5. Если вариант не подошёл, прочитайте доброжелательное объяснение и попробуйте другой. После прохождения тест можно повторить для закрепления; повторные попытки не являются штрафом или оценкой.

{% include quiz.html quiz_id="lx5" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx5" %}

## Проверенные источники

- Исходная структура LX5: <https://koroteev.site/os/2/1-init/>
- Исходная практика по службе: <https://koroteev.site/text/os21-1/>
- systemd bootup model: <https://man7.org/linux/man-pages/man7/bootup.7.html>
- `systemd.service(5)`: <https://man7.org/linux/man-pages/man5/systemd.service.5.html>
- `systemctl(1)`: <https://man7.org/linux/man-pages/man1/systemctl.1.html>
- `systemd.unit(5)`: <https://man7.org/linux/man-pages/man5/systemd.unit.5.html>
- `systemd-analyze(1)`: <https://man7.org/linux/man-pages/man1/systemd-analyze.1.html>
- `journalctl(1)`: <https://man7.org/linux/man-pages/man1/journalctl.1.html>
- `systemd.exec(5)` security settings: <https://man7.org/linux/man-pages/man5/systemd.exec.5.html>

<p class="next-lab-link"><a href="{{ '/labs/lx6.html' | relative_url }}">Следующая лабораторная: LX6 · Файловые системы →</a></p>


<aside class="retrieval-thread"><strong>Связь с процессами</strong><p>systemd сообщает Main PID. Почему одного имени программы недостаточно для управления конкретной службой?</p><details><summary>Если мысль не приходит</summary><p>Используйте идею PID из предыдущей лабораторной.</p></details></aside>

<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если служба не запускается</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Не повторяйте start вслепую: посмотрите status и журнал.</p></details><details><summary>Проверьте</summary><p>ExecStart, путь к файлу, права, пользователя службы и последние сообщения journalctl.</p></details><details><summary>Если всё ещё неясно</summary><p>Исправьте одну причину, выполните daemon-reload при изменении unit и снова проверьте status.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: Unit изменён, но systemd будто использует старую версию. Что забыли?</summary>
    <p>После изменения unit-файла обычно нужен systemctl daemon-reload.</p>
  </details>
</section>


<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Как журнал помогает отличить «служба не запущена» от «служба попыталась запуститься и завершилась с ошибкой»?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Служба готова, когда её состояние воспроизводимо, а журнал позволяет объяснить, что с ней происходит.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


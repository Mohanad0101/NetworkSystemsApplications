---
layout: default
lab_id: lx2
title: "LX2 — Удалённый доступ: SSH и tmux"
---

# LX2 — Удалённый доступ: SSH и tmux

Подключитесь к своей Linux Mint VM с хостовой системы, убедитесь, что команды действительно выполняются **на удалённой машине**, передайте файл в обоих направлениях, настройте вход по ключу и восстановите рабочую сессию после разрыва SSH.

<section class="student-environment" aria-label="Среда курса">
  <div><span>Ваша учебная среда</span><strong>Windows PC → Oracle VirtualBox → Linux Mint 22.3 “Zena”</strong></div>
  <p>Администратор Windows <strong>не требуется для обычной работы курса</strong>. Команды Linux с <code>sudo</code> выполняются внутри Mint VM под вашим учебным Linux-пользователем.</p>
</section>

{% include learning-deck.html lab="lx2" %}

{% include lab-compass.html lab="lx2" %}


{% include lab-start.html lab="lx2" %}

## Зачем это нужно

Сервер может находиться в соседней виртуальной машине, в лаборатории, в дата-центре или в облаке. Обычно у него нет привычного рабочего стола перед вами. SSH даёт защищённый канал для удалённой командной строки и передачи данных, а `tmux` позволяет оставить терминальную работу запущенной на сервере, даже если клиентское SSH-соединение оборвалось.

<p class="meta-line">Подготовка: 10–15 минут · Практика: 70–90 минут · Среда: Linux Mint VM + SSH-клиент на хосте · Результат: проверенный SSH-вход, передача файлов, public-key authentication и восстановленный tmux-сеанс</p>

## После лабораторной вы сможете

- различать роли **SSH-клиента** и **SSH-сервера**;
- понимать, какие `user`, `host` и `port` использует SSH;
- безопасно проверять ключ хоста при первом подключении;
- отличать **ключ хоста сервера** от **пары ключей пользователя**;
- выполнять команды на удалённой Linux-машине и осознанно проверять контекст;
- передавать файл клиент → сервер и сервер → клиент через `scp`;
- настроить вход по ключу, не передавая закрытый ключ на сервер;
- сохранить параметры подключения в `~/.ssh/config`;
- создать, отсоединить и восстановить `tmux`-сеанс.

<div class="callout safe-note" markdown="1">
<strong>Как работать с командами в LX2.</strong> Не копируйте большие блоки вслепую. В основной части команды даны по одной: сначала прочитайте, <em>что команда проверяет или изменяет</em>, затем выполните её и посмотрите результат. Несколько проверок объединяются только в коротких блоках <strong>«Сводная проверка»</strong> — они нужны для компактного доказательства выполнения, а не для изучения синтаксиса.
</div>

<span id="ssh-concept"></span>

## Модель SSH перед практикой

Когда вы работаете с Mint VM из Windows или другой хостовой ОС, роли распределяются так:

| Роль | Где работает | Что делает |
|---|---|---|
| **SSH-клиент** | Windows/Linux на хостовой машине | Инициирует соединение. Команда обычно начинается с `ssh`. |
| **SSH-сервер** | Linux Mint VM | Слушает сетевой порт, проверяет клиента и предоставляет удалённую оболочку. |
| **Удалённая оболочка** | Linux Mint VM после входа | Выполняет ваши команды на VM, а не на хосте. |

Обычная форма подключения:

```bash
ssh your_user@VM_IP
```

Здесь:

- `your_user` — Linux-пользователь **на удалённой VM**;
- `vm_ip` — адрес SSH-сервера;
- если порт не указан, клиент обычно использует TCP-порт `22`.

Для нестандартного порта:

```bash
ssh -p 2222 your_user@127.0.0.1
```

<div class="callout checkpoint" markdown="1">
<strong>Два разных вида ключей.</strong> При первом подключении SSH показывает <strong>ключ хоста</strong>: клиент проверяет, к тому ли серверу он подключается. Позже вы создадите <strong>пару пользовательских ключей</strong>: сервер будет проверять, имеете ли вы право войти под выбранной учётной записью. Это две разные задачи аутентификации.
</div>

<span id="practice-ssh"></span>


## Перед SSH: выберите способ подключения

В этой лабораторной роли всегда одинаковы:

```text
Windows PowerShell  ──SSH──>  Linux Mint VM
      клиент                    сервер
```

Сначала в **обычном PowerShell** на Windows выполните:

```powershell
ssh -V
```

Если видите версию OpenSSH, клиент готов. Запускать PowerShell «от имени администратора» не нужно.

### Вариант A — NAT + Port Forwarding (рекомендуется для курса)

Используйте его, если преподаватель/ИТ уже настроил правило VirtualBox:

```text
Windows 127.0.0.1:2222  →  VirtualBox NAT  →  Mint VM :22
```

Тогда команда из PowerShell будет:

```powershell
ssh -p 2222 your_user@127.0.0.1
```

`2222` — порт на стороне Windows, а `22` — SSH-порт внутри Mint. NAT сам по себе не делает SSH-сервис гостевой VM доступным через `127.0.0.1`; для этой команды необходимо правило port forwarding.

<div class="callout safe-note" markdown="1">
<strong>Если настройки VirtualBox недоступны.</strong> Не пытайтесь обходить ограничения Windows или менять установку VirtualBox. Используйте сетевой вариант, который подготовил преподаватель, или покажите преподавателю экран Network Settings.
</div>

### Вариант B — Bridged Adapter

Если VM уже настроена как **Bridged Adapter** и локальная сеть разрешает такой режим, в Mint узнайте адрес:

```bash
hostname -I
```

Например, если VM получила `192.168.1.84`, из PowerShell:

```powershell
ssh your_user@192.168.1.84
```

Bridge удобен тем, что не требует port forwarding, но зависит от локальной сети. Поэтому лабораторная не считает его гарантированно «проще».

### Быстрая проверка перед продолжением

Вы должны знать только три значения:

| Что | Пример | Где узнать |
|---|---|---|
| Linux user | `student` | `whoami` в Mint |
| SSH host | `127.0.0.1` или IP VM | зависит от NAT/Bridge |
| SSH port | `2222` или `22` | зависит от NAT/Bridge |

Не продолжайте с догадками: сначала определите эти три значения.


## Часть 1. Подготовьте Mint VM как SSH-сервер

<p class="where-type"><strong>Сейчас:</strong> команды выполняются в <strong>терминале Linux Mint VM</strong>. PowerShell понадобится после того, как SSH-сервер будет готов.</p>

<p class="stage-goal"><strong>Готово, когда:</strong> пакет OpenSSH Server установлен, служба <code>ssh</code> активна, а вы знаете пользователя, адрес и порт подключения.</p>

Все команды этой части выполняются **в терминале Linux Mint VM**.

### 1.1 Обновите информацию о доступных пакетах

```bash
sudo apt update
```

`apt update` получает свежий индекс пакетов из настроенных репозиториев. Он **не обновляет все установленные программы**. `sudo` здесь нужен потому, что системный индекс пакетов изменяется с административными правами.

### 1.2 Установите SSH-сервер

```bash
sudo apt install openssh-server
```

Пакет `openssh-server` добавляет серверную часть SSH (`sshd`). SSH-клиент и SSH-сервер — не одно и то же: наличие команды `ssh` ещё не означает, что машина принимает входящие SSH-подключения.

### 1.3 Проверьте состояние службы

```bash
systemctl is-active ssh
```

Ожидаемый краткий ответ:

```text
active
```

Если служба не активна, включите её сейчас и при будущих загрузках:

```bash
sudo systemctl enable --now ssh
```

После этого снова выполните `systemctl is-active ssh`.

### 1.4 Узнайте удалённое имя пользователя

```bash
whoami
```

Запомните результат: это значение заменяет `your_user` в примерах ниже.

### 1.5 Узнайте имя VM

```bash
hostname
```

`hostname` полезен как визуальный признак того, на какой машине выполняется команда. Позже вы сравните его внутри SSH-сеанса.

### 1.6 Посмотрите сетевые адреса VM

```bash
ip -br a
```

`ip -br a` показывает интерфейсы и адреса в компактной форме. Не используйте адрес `127.0.0.1` из вывода VM как «адрес VM снаружи»: loopback относится к самой машине, где он используется.

### 1.7 Выберите путь от клиента к VM

Используйте **один** вариант во всей лабораторной.

**Вариант A — VirtualBox NAT + Port Forwarding.** Это удобный и предсказуемый вариант, когда клиентом является тот же Windows-хост. В настройках VirtualBox добавьте TCP-правило:

- Host IP: `127.0.0.1`
- Host Port: `2222`
- Guest Port: `22`

Тогда клиент подключается к `127.0.0.1:2222`, а VirtualBox перенаправляет соединение на порт `22` VM.

**Вариант B — Bridged Adapter / доступная локальная сеть.** Используйте фактический IP VM из `ip -br a` и порт `22`. Такой режим применяйте только там, где bridged networking разрешён правилами аудитории или сети.

<div class="callout checkpoint" markdown="1">
<strong>Что уже доказано, а что ещё нет?</strong> Ответ <code>active</code> доказывает, что служба работает внутри VM. Он <strong>не доказывает</strong>, что клиент может достичь VM по выбранному адресу и порту. Это проверит реальное SSH-подключение в следующей части.
</div>

### Сводная проверка · LX2-01

Только теперь соберите короткий результат одной командой. Она не вводит новых понятий — лишь объединяет уже выполненные проверки для отчёта:

```bash
printf 'SSH_SERVICE=%s\nUSER=%s\nHOST=%s\n' "$(systemctl is-active ssh)" "$(whoami)" "$(hostname)"; ip -br a
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX2-01"><strong>В отчёт · LX2-01.</strong> Вставьте только вывод сводной проверки выше и одной строкой добавьте выбранный режим сети и порт, например <code>NETWORK=NAT forwarding, PORT=2222</code>. Полный журнал установки APT не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX2-01">
  <label for="evidence-LX2-01">Поле для результата · LX2-01</label>
  <p class="evidence-editor-help" data-evidence-help>Короткого сводного результата достаточно. Не вставляйте весь терминальный журнал.</p>
  <textarea id="evidence-LX2-01" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX2-01" placeholder="SSH_SERVICE=active&#10;USER=...&#10;HOST=...&#10;...&#10;NETWORK=..., PORT=..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="ssh-connect"></span>

## Часть 2. Выполните первый SSH-вход и проверьте контекст

<p class="where-type"><strong>Сейчас:</strong> переключитесь на <strong>обычный Windows PowerShell</strong>. Команды <code>ssh</code> и <code>scp</code> ниже запускаются на Windows.</p>

<p class="stage-goal"><strong>Готово, когда:</strong> вы вошли с хоста в Mint VM и можете объяснить по выводу <code>whoami</code>, <code>hostname</code> и <code>pwd</code>, где выполняются команды.</p>

Откройте **терминал на хостовой системе**. Для Windows подойдёт PowerShell с установленным OpenSSH Client.

### 2.1 Подключитесь

Для прямого IP VM:

```bash
ssh your_user@VM_IP
```

Для NAT + Port Forwarding:

```bash
ssh -p 2222 your_user@127.0.0.1
```

### 2.2 Не подтверждайте новый ключ хоста автоматически

При первом подключении SSH показывает fingerprint ключа сервера. Смысл этой проверки: клиент должен убедиться, что доверяет **именно этой VM**, а не другой машине, которая отвечает по тому же адресу.

Если клиент показывает ED25519 fingerprint, вернитесь к консоли VM и получите fingerprint её ED25519 host key:

```bash
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Сравните алгоритм и fingerprint. Если SSH-клиент показывает другой алгоритм, проверяйте соответствующий файл `ssh_host_*_key.pub`. Сохраняйте новый ключ хоста только после совпадения.

### 2.3 Кто выполняет команды?

После успешного входа выполните:

```bash
whoami
```

Результат — удалённая учётная запись, под которой сервер разрешил сеанс.

Теперь:

```bash
hostname
```

Результат должен соответствовать Mint VM. Это простой признак удалённого контекста.

Затем:

```bash
pwd
```

Обычно после входа вы окажетесь в домашнем каталоге удалённого пользователя, например `/home/student`.

Наконец:

```bash
ip -br a
```

Теперь команда показывает интерфейсы **серверной VM**, потому что оболочка работает на удалённой машине.

<div class="callout checkpoint" markdown="1">
<strong>Ключевая идея.</strong> SSH-клиент остаётся на вашем компьютере, но после входа интерактивная shell работает на сервере. Поэтому одна и та же команда, например <code>hostname</code>, может показать разные результаты до и после SSH-входа.
</div>

### 2.4 Создайте лабораторный каталог на сервере

```bash
mkdir -p ~/NSA/LX2/ssh
```

`~` означает домашний каталог **текущего удалённого пользователя**. Опция `-p` позволяет безопасно повторить команду, если каталог уже существует.

### 2.5 Создайте небольшой удалённый файл

```bash
printf 'SSH session: %s@%s\n' "$(whoami)" "$(hostname)" > ~/NSA/LX2/ssh/remote.txt
```

Команда создаёт `remote.txt` на VM. Подстановки `$(...)` получают имя пользователя и машины, а `>` направляет строку в файл.

Проверьте содержимое отдельно:

```bash
cat ~/NSA/LX2/ssh/remote.txt
```

### 2.6 Посмотрите на процесс текущей удалённой shell

```bash
ps -o pid,ppid,user,stat,comm -p $$
```

`$$` — PID текущей shell. Вместо длинного списка всех системных процессов вы наблюдаете конкретный процесс, с которым сейчас работаете: его PID, родителя, пользователя и состояние.

<details class="optional-work" markdown="1">
<summary>Если SSH не подключается · короткая диагностика</summary>

Сначала различайте тип проблемы.

Проверить адреса VM:

```bash
ip -br a
```

Проверить службу на VM:

```bash
systemctl is-active ssh
```

Если используете NAT, ещё раз проверьте, что VirtualBox перенаправляет именно host port `2222` → guest port `22`.

`Connection refused` обычно означает, что соединение дошло до узла/порта, но там нет принимающего сервиса либо соединение активно отклоняется. `Permission denied` появляется позже — на этапе аутентификации. Не лечите эти две ситуации одинаково.
</details>

<span id="ssh-transfer"></span>

## Часть 3. Передайте файл через `scp`

<p class="stage-goal"><strong>Готово, когда:</strong> локальный файл появился на VM, а файл, созданный на VM, появился на клиенте.</p>

Перед выполнением команды сначала прочитайте её направление:

```text
local-file              user@host:remote-path
   └──── источник  →  назначение ────┘
```

Если `user@host:` стоит слева, направление меняется: файл читается с удалённой машины и сохраняется локально.

### 3.1 Создайте файл на клиенте

**Windows PowerShell:**

```powershell
Set-Content -Path lx2-local.txt -Value "file from local host" -Encoding utf8
```

**Linux-клиент:**

```bash
printf 'file from local host\n' > lx2-local.txt
```

Файл должен находиться в текущем локальном каталоге — не внутри SSH-сеанса.

### 3.2 Скопируйте файл клиент → сервер

Для прямого подключения:

```bash
scp lx2-local.txt your_user@vm_ip:~/NSA/LX2/ssh/
```

Для NAT:

```bash
scp -P 2222 lx2-local.txt your_user@127.0.0.1:~/NSA/LX2/ssh/
```

Обратите внимание: у `ssh` порт задаётся `-p`, а у `scp` — заглавной `-P`.

Вернитесь в SSH-сеанс и прочитайте полученный файл:

```bash
cat ~/NSA/LX2/ssh/lx2-local.txt
```

Вы должны увидеть `file from local host`.

### 3.3 Скопируйте файл сервер → клиент

На **локальном клиенте** выполните для прямого подключения:

```bash
scp your_user@vm_ip:~/NSA/LX2/ssh/remote.txt ./remote-copy.txt
```

Для NAT:

```bash
scp -P 2222 your_user@127.0.0.1:~/NSA/LX2/ssh/remote.txt ./remote-copy.txt
```

Теперь проверьте уже **локальную** копию.

Windows PowerShell:

```powershell
Get-Content .\remote-copy.txt
```

Linux-клиент:

```bash
cat ./remote-copy.txt
```

<div class="callout checkpoint" markdown="1">
<strong>Что делает <code>scp</code> сегодня?</strong> Современный OpenSSH сохраняет привычный синтаксис <code>scp</code>, но начиная с OpenSSH 9.0 по умолчанию использует протокол SFTP для передачи данных через SSH-соединение. Для этой лабораторной важны направление копирования, удалённый путь и безопасная аутентификация.
</div>

### Сводная проверка · LX2-02

Не вставляйте в отчёт весь диалог `ssh` и прогресс `scp`. С клиента запустите **одну** компактную проверку удалённого результата.

Прямое подключение:

```bash
ssh your_user@VM_IP 'printf "REMOTE_USER=%s\nREMOTE_HOST=%s\nREMOTE_HOME=%s\nUPLOAD=%s\n" "$(whoami)" "$(hostname)" "$HOME" "$(cat ~/NSA/LX2/ssh/lx2-local.txt)"'
```

NAT:

```bash
ssh -p 2222 your_user@127.0.0.1 'printf "REMOTE_USER=%s\nREMOTE_HOST=%s\nREMOTE_HOME=%s\nUPLOAD=%s\n" "$(whoami)" "$(hostname)" "$HOME" "$(cat ~/NSA/LX2/ssh/lx2-local.txt)"'
```

Затем подтвердите локально скачанный файл одной короткой командой.

Windows PowerShell:

```powershell
Write-Output "DOWNLOAD=$(Get-Content .\remote-copy.txt)"
```

Linux-клиент:

```bash
printf 'DOWNLOAD=%s\n' "$(cat ./remote-copy.txt)"
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX2-02"><strong>В отчёт · LX2-02.</strong> Вставьте только 4 строки <code>REMOTE_...</code>/<code>UPLOAD=...</code> из сводной проверки и одну строку <code>DOWNLOAD=...</code>. Этого достаточно, чтобы показать удалённый контекст и передачу в обоих направлениях; весь терминальный журнал не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX2-02">
  <label for="evidence-LX2-02">Поле для результата · LX2-02</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте только компактные подписанные строки из двух проверок.</p>
  <textarea id="evidence-LX2-02" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX2-02" placeholder="REMOTE_USER=...&#10;REMOTE_HOST=...&#10;REMOTE_HOME=...&#10;UPLOAD=file from local host&#10;DOWNLOAD=SSH session: ..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="ssh-keys"></span>

## Часть 4. Настройте вход по пользовательскому ключу

<p class="stage-goal"><strong>Готово, когда:</strong> сервер принимает ваш public key, а проверка с отключённой парольной аутентификацией успешно выполняет удалённую команду.</p>

### 4.1 Сначала различите два механизма доверия

| Что проверяется | Где хранится доверенная информация | Смысл |
|---|---|---|
| **Сервер → клиент** | `~/.ssh/known_hosts` на клиенте | «Это тот сервер, которому я раньше доверял». |
| **Пользователь → сервер** | `~/.ssh/authorized_keys` на сервере | «Владелец соответствующего private key может войти в эту учётную запись». |

Закрытый ключ остаётся на клиенте. На сервер передают **только открытый ключ** (`.pub`).

### 4.2 Создайте Ed25519 key pair на клиенте

```bash
ssh-keygen -t ed25519 -C "lx2-your-name"
```

`ssh-keygen` создаёт пару ключей. Если стандартный `id_ed25519` уже существует, **не соглашайтесь перезаписать его**. Либо используйте существующую пару, либо задайте другое имя файла, например `~/.ssh/id_ed25519_lx2`.

Для личного ключа рекомендуется passphrase. Она шифрует private key на диске клиента и **не является паролем удалённой учётной записи**.

### 4.3 Добавьте открытый ключ на сервер

#### Если клиент — Linux

Для прямого подключения:

```bash
ssh-copy-id your_user@vm_ip
```

Для NAT:

```bash
ssh-copy-id -p 2222 your_user@127.0.0.1
```

`ssh-copy-id` читает локальный public key и добавляет его в серверный `~/.ssh/authorized_keys`. Private key не копируется.

#### Если клиент — Windows PowerShell

В Windows `ssh-copy-id` обычно отсутствует. Поэтому сделаем те же действия прозрачно, по шагам.

Сначала скопируйте **только `.pub`** во временный файл на VM.

Прямое подключение:

```powershell
scp "$env:USERPROFILE\.ssh\id_ed25519.pub" your_user@vm_ip:~/NSA/LX2/id_ed25519.pub
```

NAT:

```powershell
scp -P 2222 "$env:USERPROFILE\.ssh\id_ed25519.pub" your_user@127.0.0.1:~/NSA/LX2/id_ed25519.pub
```

Теперь войдите по SSH обычным способом. Следующие команды выполняются **на VM** по одной.

Создайте каталог SSH, если его ещё нет:

```bash
mkdir -p ~/.ssh
```

Ограничьте доступ к каталогу:

```bash
chmod 700 ~/.ssh
```

Добавьте public key в список разрешённых:

```bash
cat ~/NSA/LX2/id_ed25519.pub >> ~/.ssh/authorized_keys
```

Ограничьте доступ к `authorized_keys`:

```bash
chmod 600 ~/.ssh/authorized_keys
```

Удалите временную копию public key из домашнего каталога:

```bash
rm ~/NSA/LX2/id_ed25519.pub
```

<div class="callout safe-note" markdown="1">
<strong>Никогда не делайте так:</strong> не копируйте на сервер файл <code>id_ed25519</code> без расширения <code>.pub</code>, не вставляйте его содержимое в отчёт и не отправляйте преподавателю. Это ваш private key.
</div>

### 4.4 Проверьте именно public-key authentication

Для прямого подключения:

```bash
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no your_user@vm_ip
```

Для NAT:

```bash
ssh -p 2222 -o PreferredAuthentications=publickey -o PasswordAuthentication=no your_user@127.0.0.1
```

Если клиент просит **passphrase private key**, это нормально. Важный признак — сервер не должен переходить к запросу пароля учётной записи.

<span id="ssh-config"></span>

## Часть 5. Сохраните подключение как `mint-lab`

<p class="stage-goal"><strong>Готово, когда:</strong> команда <code>ssh mint-lab</code> подключается к правильной VM, а тот же псевдоним работает с <code>scp</code>.</p>

На клиенте откройте файл:

- Linux: `~/.ssh/config`
- Windows: `%USERPROFILE%\.ssh\config`

Для прямого подключения добавьте:

```sshconfig
Host mint-lab
  HostName vm_ip
  User your_user
  Port 22
  IdentityFile ~/.ssh/id_ed25519
```

Для NAT измените только адрес и порт:

```sshconfig
Host mint-lab
  HostName 127.0.0.1
  User your_user
  Port 2222
  IdentityFile ~/.ssh/id_ed25519
```

Если вы создали ключ под другим именем, укажите его реальный путь в `IdentityFile`.

Теперь длинные параметры больше не нужны:

```bash
ssh mint-lab
```

Проверьте, что `scp` читает тот же config:

```bash
scp lx2-local.txt mint-lab:~/NSA/LX2/ssh/
```

### Сводная проверка · LX2-03

Эта команда специально объединяет две простые удалённые проверки, чтобы доказательство получилось коротким:

```bash
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no mint-lab 'printf "AUTH=publickey\nUSER=%s\nHOST=%s\n" "$(whoami)" "$(hostname)"'
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX2-03"><strong>В отчёт · LX2-03.</strong> Вставьте только строки <code>AUTH=publickey</code>, <code>USER=...</code> и <code>HOST=...</code> из сводной проверки. Не вставляйте public key, private key, fingerprint private key или passphrase.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX2-03">
  <label for="evidence-LX2-03">Поле для результата · LX2-03</label>
  <p class="evidence-editor-help" data-evidence-help>Три подписанные строки подтверждают требуемый способ входа; ключевой материал здесь не нужен.</p>
  <textarea id="evidence-LX2-03" rows="5" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX2-03" placeholder="AUTH=publickey&#10;USER=...&#10;HOST=..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<details class="optional-work" markdown="1">
<summary>По желанию · зачем нужен ssh-agent</summary>

Private key может быть защищён passphrase. `ssh-agent` хранит разблокированный ключ в памяти пользовательского сеанса, поэтому passphrase не приходится вводить для каждого нового соединения.

Посмотреть ключи, доступные текущему агенту:

```bash
ssh-add -l
```

Пустой список означает только то, что агент сейчас не использует ключи; это не доказывает отсутствие файлов ключей на диске. Для обязательной части LX2 `ssh-agent` не требуется.
</details>

<span id="practice-tmux"></span>

## Часть 6. `tmux`: отделите рабочую сессию от SSH-соединения

<p class="stage-goal"><strong>Готово, когда:</strong> после закрытия SSH вы снова подключились к VM, нашли тот же tmux-сеанс и вернулись к программе, которая продолжала работать внутри него.</p>

### 6.1 Модель `tmux`

`tmux` работает **на удалённой VM**. Он создаёт собственный server process и хранит терминальные сессии независимо от конкретного SSH-клиента.

| Объект tmux | Простая модель |
|---|---|
| **session** | Рабочее пространство, к которому можно отсоединиться и подключиться снова. |
| **window** | Виртуальная вкладка внутри session. |
| **pane** | Область терминала внутри window. |
| **client** | Терминал, который сейчас смотрит на session. |

Разрыв SSH удаляет клиентское соединение, но не обязан уничтожать `tmux` session на VM. Перезагрузка VM — другое событие: обычный `tmux` и процессы внутри него завершаются вместе с ОС.

### 6.2 Установите инструменты

Войдите на VM командой `ssh mint-lab`, затем:

```bash
sudo apt install tmux htop
```

Здесь устанавливаются два пакета одной операцией APT: `tmux` для терминальной сессии и `htop` как наглядная долго работающая программа.

### 6.3 Создайте именованную сессию

```bash
tmux new -s lx2
```

Имя `lx2` позволит явно выбрать нужную session после повторного входа.

### 6.4 Освойте интерфейс до теста устойчивости

Большинство клавиатурных команд `tmux` начинаются с префикса: нажмите `Ctrl+b`, отпустите, затем нажмите следующую клавишу.

| Действие | Комбинация |
|---|---|
| Новое окно | `Ctrl+b`, затем `c` |
| Переименовать окно | `Ctrl+b`, затем `,` |
| Вертикальное разделение | `Ctrl+b`, затем `%` |
| Горизонтальное разделение | `Ctrl+b`, затем `"` |
| Перейти между панелями | `Ctrl+b`, затем стрелка |
| Закрыть shell в текущей панели | `exit` |
| Отсоединиться, не завершая session | `Ctrl+b`, затем `d` |

Сделайте короткое упражнение: создайте новое окно, назовите его `window1`, разделите его вертикально и затем одну панель горизонтально. Закройте лишние панели командой `exit`, чтобы перед следующей частью снова осталась простая рабочая область.

### 6.5 Зафиксируйте идентификатор текущей панели

Находясь внутри `tmux`, выполните:

```bash
tmux display-message -p 'SESSION=#S PANE=#{pane_id} SHELL_PID=#{pane_pid}' > ~/NSA/LX2/tmux-before.txt
```

Команда сохраняет имя session, идентификатор pane и PID shell. Файл нужен только для последующего сравнения.

Посмотрите, что сохранилось:

```bash
cat ~/NSA/LX2/tmux-before.txt
```

### 6.6 Запустите программу внутри `tmux`

```bash
htop
```

Теперь **не выходите из `htop`**.

### 6.7 Отсоединитесь и разорвите SSH

Нажмите:

```text
Ctrl+b, затем d
```

Вы вернётесь в обычную SSH-shell, а `tmux` session останется на VM. Теперь завершите SSH-сеанс:

```bash
exit
```

Вы должны снова увидеть терминал локального клиента.

### 6.8 Подключитесь к VM заново

```bash
ssh mint-lab
```

Вы создали **новое SSH-соединение**, но оно ведёт на ту же VM.

Посмотрите список tmux sessions:

```bash
tmux ls
```

В списке должна присутствовать session `lx2`.

Теперь, ещё **до повторного attach**, посмотрите состояние её панелей:

```bash
tmux list-panes -t lx2 -F 'SESSION=#S PANE=#{pane_id} SHELL_PID=#{pane_pid} CMD=#{pane_current_command}'
```

Если `CMD=htop`, программа продолжала работать без вашего SSH-клиента.

### Сводная проверка · LX2-04

Эта команда намеренно объединяет «до» и «после» только для компактного сравнения:

```bash
printf '%s\n' 'BEFORE'; cat ~/NSA/LX2/tmux-before.txt; printf '%s\n' 'AFTER_RECONNECT'; tmux list-panes -t lx2 -F 'SESSION=#S PANE=#{pane_id} SHELL_PID=#{pane_pid} CMD=#{pane_current_command}'
```

Сравните `SESSION`, `PANE` и `SHELL_PID`. Для той же панели они должны совпасть; после повторного входа `CMD=htop` показывает, что приложение всё ещё работает в ней.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX2-04"><strong>В отчёт · LX2-04.</strong> Вставьте только короткий вывод сводной проверки <code>BEFORE</code>/<code>AFTER_RECONNECT</code>. Скриншот <code>htop</code> не требуется: идентификаторы и текущая команда дают более точное текстовое доказательство.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX2-04">
  <label for="evidence-LX2-04">Поле для результата · LX2-04</label>
  <p class="evidence-editor-help" data-evidence-help>Сравните session, pane и shell PID до и после нового SSH-входа.</p>
  <textarea id="evidence-LX2-04" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX2-04" placeholder="BEFORE&#10;SESSION=lx2 PANE=%... SHELL_PID=...&#10;AFTER_RECONNECT&#10;SESSION=lx2 PANE=%... SHELL_PID=... CMD=htop"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

### 6.9 Вернитесь к работающей программе

```bash
tmux attach -t lx2
```

Вы должны снова увидеть `htop`. Нажмите `q`, чтобы завершить `htop`.

Когда лаборатория полностью закончена и session больше не нужна, выйдите из её последней shell командой:

```bash
exit
```

Если закрыта последняя shell последней панели, session завершается. `tmux ls` после этого может сообщить, что server не запущен или sessions отсутствуют — это нормальный результат очистки.

## Что именно вы сейчас доказали

| Наблюдение | Вывод |
|---|---|
| `ssh` открыл удалённую shell | Клиент достиг SSH-сервера и прошёл аутентификацию. |
| `whoami`/`hostname` изменили контекст | Команды после входа выполнялись на VM. |
| `scp` передал файлы в обе стороны | SSH-инфраструктура используется не только для интерактивной shell. |
| Вход прошёл с `PasswordAuthentication=no` | Сервер принял public-key authentication; запрос passphrase private key при этом допустим. |
| После нового SSH-входа сохранились session/pane/PID и `CMD=htop` | `tmux` session продолжала жить на VM после отсоединения клиента. |

<span id="ssh-errors"></span>

## Частые ошибки и что они означают

- **`Connection refused`** — сначала проверяйте адрес, порт, port forwarding и запущенную службу. Смена пароля здесь обычно не относится к проблеме.
- **`Permission denied`** — сеть и SSH-сервер уже достигнуты; теперь проверяйте пользователя и метод аутентификации.
- **`Permission denied (publickey)`** — проверьте правильный логин, выбранный identity file, наличие public key в `authorized_keys` и права `~/.ssh`/`authorized_keys`.
- **`REMOTE HOST IDENTIFICATION HAS CHANGED`** — не отключайте проверку. Сначала подтвердите причину смены и новый fingerprint через доверенный канал. Только после подтверждения обновляйте запись `known_hosts`.
- **`scp` подключается не к тому порту** — помните: `ssh -p 2222`, но `scp -P 2222`.
- **`tmux attach -t lx2` не находит session** — выполните `tmux ls`. Возможно, session была завершена командой `exit`, VM перезагрузилась или `tmux` запускался не на той машине.
- **После SSH-разрыва программа пропала** — проверьте, была ли она действительно запущена *внутри* `tmux`, а не в обычной удалённой shell.

<details class="optional-work" markdown="1">
<summary>Дополнительно · диагностический режим SSH</summary>

Если обычного сообщения об ошибке недостаточно, SSH-клиент может показать подробный процесс подключения:

```bash
ssh -v mint-lab
```

Режим `-v` полезен для диагностики выбора адреса, host key, identity file и метода аутентификации. Не вставляйте весь verbose log в обычный отчёт: он длинный и может содержать технические сведения, которые не нужны для доказательства результата.
</details>

## Контрольная точка лабораторной

<div class="callout checkpoint" markdown="1">
Перед тестом вы должны уметь своими словами объяснить четыре вещи: <strong>где находится SSH-клиент</strong>, <strong>где выполняется удалённая shell</strong>, <strong>почему private key не отправляется на сервер</strong> и <strong>почему tmux переживает разрыв SSH, но не обычную перезагрузку VM</strong>.
</div>

<h2 id="quiz">Интерактивный тест</h2>

Ответьте на 12 вопросов по клиенту/серверу SSH, host keys, public-key authentication, `scp`, диагностике и `tmux`. После каждого ответа прочитайте объяснение. Ошибка — это сигнал вернуться к соответствующему этапу и попробовать снова, а не автоматическая оценка лабораторной.

{% include quiz.html quiz_id="lx2" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx2" %}


<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если SSH не подключается</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Разделите симптомы: timeout, connection refused и authentication failure означают разные классы проблем.</p></details><details><summary>Проверьте</summary><p>Адрес → доступность → порт/sshd → пользователя → способ аутентификации.</p></details><details><summary>Если всё ещё неясно</summary><p>Запустите ssh с подробным выводом и сохраните только безопасный диагностический фрагмент — без закрытых ключей.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: Получен timeout. Что это говорит точнее всего?</summary>
    <p>Соединение не получило ответа вовремя; сначала исследуйте адрес/маршрут/доступность, а не пароль.</p>
  </details>
</section>


{% include peer-moment.html lab="lx2" %}

<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Как по сообщению SSH отличить проблему сети от проблемы аутентификации?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Удалённый доступ должен быть не только настроен, но и объясним: соединение, аутентификация, передача и устойчивый сеанс.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


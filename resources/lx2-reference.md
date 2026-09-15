---
layout: default
title: "LX2 · Локальная справка по SSH и tmux"
permalink: /resources/lx2-reference.html
---

# LX2 · Локальная справка по SSH и tmux

Эта страница хранится **внутри курса** и доступна без перехода на внешний учебный сайт. Используйте её после вопроса MCQ или во время диагностики.

## 1. Модель SSH

```text
Windows PowerShell  ── TCP ──>  Linux Mint VM
SSH client                       sshd server
```

Клиент инициирует соединение. `sshd` на Mint принимает его. После успешной аутентификации интерактивная shell выполняется **на VM**.

Для курса используются два маршрута:

```text
NAT + forwarding:  127.0.0.1:2222 → VM:22
Bridge:             VM_IP:22       → VM:22
```

Поэтому:

```powershell
ssh -p 2222 student@127.0.0.1
```

и

```powershell
ssh student@VM_IP
```

решают одну задачу через разные сетевые маршруты.

## 2. Диагностика: не начинайте с пароля

| Симптом | Сначала исследуйте |
|---|---|
| timeout | адрес, маршрут, доступность VM |
| connection refused | порт, port forwarding, состояние `sshd` |
| permission denied | пользователь и метод аутентификации |
| host identification changed | причину смены host key и fingerprint |

На Mint полезны:

```bash
ip -br a
systemctl is-active ssh
ss -ltn
```

На Windows проверяйте именно тот host/port, который соответствует выбранному режиму VirtualBox.

## 3. Host key и user key — разные вещи

**Host key** доказывает клиенту личность сервера. Его fingerprint проверяют при первом подключении.

**User key pair** используется для входа пользователя:

```text
private key — остаётся на клиенте
public key  — добавляется серверу в ~/.ssh/authorized_keys
```

Закрытый ключ, его содержимое и passphrase никогда не включаются в отчёт.

## 4. `scp`

Направление читается по положению `user@host:`:

```text
local.txt  → user@host:remote/path
user@host:remote.txt → local/path
```

Для нестандартного порта:

```powershell
ssh -p 2222 ...
scp -P 2222 ...
```

У `ssh` используется строчная `-p`, у `scp` — заглавная `-P`.

## 5. `~/.ssh/config`

Повторяющиеся параметры можно сохранить на **клиенте**:

```text
Host mint-lab
    HostName 127.0.0.1
    User student
    Port 2222
    IdentityFile ~/.ssh/id_ed25519
```

После этого клиент может использовать `ssh mint-lab` и `scp file.txt mint-lab:...`.

## 6. Почему tmux переживает разрыв SSH

`tmux` запускается **на Mint VM**. SSH-клиент может отключиться, а tmux server/session и процессы внутри неё продолжают работать на VM.

```text
SSH connection ✕
        │
        └──── VM: tmux session → process ✓
```

Но обычная перезагрузка VM завершает процессы ОС, включая `tmux`.

## Быстрый порядок диагностики

**Адрес → маршрут/порт → sshd → пользователь → аутентификация → права файла.**

Не меняйте сразу несколько вещей. Сделайте одну проверку, прочитайте результат и только затем выбирайте следующий шаг.

[← Вернуться к LX2]({{ '/labs/lx2.html' | relative_url }})

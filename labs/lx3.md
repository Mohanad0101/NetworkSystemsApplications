---
layout: default
lab_id: lx3
title: LX3 — Права и пользователи
---

# LX3 — Права и пользователи

Настройте общий каталог учебной лаборатории: одним пользователям разрешите чтение, другим — запуск скрипта, а в файлообменнике защитите чужие файлы от удаления. Результат проверите от имени разных пользователей.

<p class="meta-line">Подготовка: 5–10 минут · Практика: 70–90 минут · Среда: отдельная учебная VM · Результат: проверенная модель пользователей, групп и прав доступа</p>

{% include learning-deck.html lab="lx3" %}

<div class="lab-journey" aria-label="Маршрут лабораторной">
  <span><strong>Разобраться</strong></span><span>Попробовать</span><span>Выполнить</span><span>Проверить</span><span>Собрать отчёт</span>
</div>

{% include output-inspector.html lab="lx3" %}

{% include lab-start.html lab="lx3" %}

## Зачем это нужно

Linux — многопользовательская система. Сервер может одновременно обслуживать разработчиков, преподавателей, CI-процессы и системные службы. Ошибка в правах может открыть чужие данные, сломать деплой или дать лишние административные возможности.

## Что вы изучите

Вы научитесь читать учётные файлы, создавать группы и пользователей, понимать управление паролями, использовать `sudo`, проверять членство в группах, менять владельца и группу файлов, назначать права в символьной и числовой форме, понимать права каталогов и sticky bit.

Практический навык: безопасно организовать доступ к общим файлам на Linux-машине.

Где используется: серверы разработки, учебные Linux-классы, Git-серверы, файловые хранилища, DevOps, безопасность, разграничение доступа к логам и конфигурациям.

<span id="safe-start"></span>

## Важная граница безопасности

Все административные команды выполняйте только в учебной VM. Не создавайте учебных пользователей и групп на рабочем компьютере, если это не специально выделенная лабораторная машина.

**Перед началом LX3 выключите VM и создайте snapshot в VirtualBox.** Если при работе с пользователями или правами будет допущена системная ошибка, вы сможете вернуться к чистому состоянию, не переустанавливая Linux. Snapshot не заменяет резервную копию важных файлов.

В командах ниже <strong>только метку <code>myname</code></strong> заменяйте своей фамилией латиницей. Имена <code>user_1</code>…<code>user_5</code>, <code>student</code> и групп <code>workers</code>/<code>teachers</code>/<code>students</code> оставляйте как в задании: они нужны для одинакового эксперимента у всех студентов.

<span id="practice-users"></span>

## Часть 1. Исследуйте учетные данные

<p class="stage-goal"><strong>Готово, когда:</strong> Вы различаете текущего пользователя, UID/GID и его группы.</p>

Обычный пользователь:

```bash
whoami
id
groups
getent passwd "$(whoami)"
getent group sudo
ls -l /etc/passwd /etc/shadow /etc/group
```

`UID` — числовой идентификатор пользователя; `GID` — группы. `id` показывает основную и дополнительные группы. `getent` обращается к настроенной системной базе, а не только к одному локальному файлу.

Для проверки состояния пароля без вывода его хеша:

```bash
sudo passwd -S "$(whoami)"
```

Эта команда показывает статус, а не сам пароль; для выполнения задания достаточно сравнить назначение и права учётных файлов.

`/etc/passwd` доступен для чтения, потому что системе и программам нужны сведения о пользователях. Хеши паролей хранятся в `/etc/shadow`, который обычный пользователь читать не должен.

<span id="users-groups"></span>

## Часть 2. Создайте учебные группы

<p class="stage-goal"><strong>Готово, когда:</strong> Группы созданы и видны через `getent group`.</p>

```bash
sudo groupadd workers
sudo groupadd teachers
sudo groupadd students
getent group workers
getent group teachers
getent group students
```

Создание группы через `sudo` не выдаёт её участникам права администратора: полномочия получает выполняемая команда. Если группа уже существует, команда сообщит об этом. В отчёте укажите, что группа была создана ранее.

<span id="users-create"></span>

## Часть 3. Создайте пользователей

<p class="stage-goal"><strong>Готово, когда:</strong> Учебные пользователи имеют ожидаемые UID и членство в группах.</p>

Перед созданием проверьте имена и UID. В строке с <code>-c "YOUR NAME"</code> замените <code>YOUR NAME</code> своими реальными именем и фамилией (латиницей или как разрешает ваша учебная система): например, `getent passwd user_3` и `getent passwd 2003`. **Фиксированные UID 2001–2005 и 3000 используются здесь потому, что это требование исходной учебной работы; в обычном администрировании UID часто назначает система автоматически.** Если запись уже есть, не удаляйте её: уточните назначение и согласуйте свободный UID. Ключ `-m` создаёт домашний каталог, `-u` задаёт UID, `-s` — оболочку. `usermod -aG` добавляет дополнительные группы; без `-a` список заменяется. Для уже открытого сеанса новое членство обычно требует повторного входа.

```bash
sudo useradd -m -u 2001 -s /bin/bash user_1
sudo useradd -m -u 2002 -s /bin/bash user_2
sudo useradd -m -u 2003 -s /bin/bash user_3
sudo useradd -m -u 2004 -s /bin/bash user_4
sudo useradd -m -u 2005 -s /bin/bash user_5
sudo useradd -m -u 3000 -c "YOUR NAME" -G students -s /bin/bash student
```

Добавьте пользователей в группы:

```bash
sudo usermod -aG workers user_1
sudo usermod -aG workers user_2
sudo usermod -aG students user_3
sudo usermod -aG students user_4
sudo usermod -aG students user_5
sudo usermod -aG teachers user_5
id user_1
id user_3
id user_5
id student
```

`user_5` специально входит сразу в `students` и `teachers`: это показывает, что у пользователя может быть несколько дополнительных групп, и даёт нам непривилегированную учётную запись для проверки роли `teachers`. Для обычного изменения групп используйте `usermod` или `gpasswd`, а результат проверяйте через `getent` и `id`. Не перезаписывайте `/etc/group` вручную.

<div class="callout safe-note" markdown="1">
<strong>Пароли для учебных аккаунтов здесь не нужны.</strong> Проверки выполняются из вашей административной учётной записи через <code>sudo -u</code>, поэтому не создавайте одинаковые или слабые временные пароли. Команду <code>passwd</code> вы уже умеете использовать для реальной учётной записи; если преподаватель отдельно потребует интерактивный вход под учебным пользователем, задайте пароль только этому пользователю.
</div>


<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX3-01"><strong>В отчёт · LX3-01.</strong> Вставьте <code>whoami</code>, выбранные команды <code>id</code> и <code>getent group workers teachers students</code>. Никогда не вставляйте содержимое <code>/etc/shadow</code>.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX3-01">
  <label for="evidence-LX3-01">Поле для результата · LX3-01</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте сюда только запрошенный вывод команд как обычный текст. Поле не является формой и само ничего не отправляет.</p>
  <textarea id="evidence-LX3-01" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX3-01" placeholder="Вставьте сюда результат из терминала…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<span id="lab-structure"></span>

## Часть 4. Общая структура лаборатории

<p class="stage-goal"><strong>Готово, когда:</strong> Созданы `/labs/library`, `/labs/tests` и `/labs/list`.</p>

Создайте каталог:

```bash
sudo mkdir -p /labs/library /labs/tests
sudo touch /labs/library/book_myname_1 /labs/library/book_myname_2
sudo tee /labs/tests/test_myname >/dev/null <<'EOF'
#!/bin/bash
echo "Учебный скрипт запущен: $(whoami)"
EOF
ls /etc | sudo tee /labs/list >/dev/null
ls -l /labs /labs/library /labs/tests
```

`tee` записывает список в `/labs/list` с правами администратора. Перенаправление `>` выполняет оболочка, поэтому для проверки записи от другого пользователя используем `sudo -u user_1 bash -c 'команда >> файл'`: перенаправление тогда выполняется внутри его оболочки.

Учебный скрипт только выводит имя пользователя. Этого достаточно, чтобы проверить запуск с нужными правами; пароли в скрипт не записывайте.

<span id="practice-permissions"></span>

## Часть 5. Владельцы и группы

<p class="stage-goal"><strong>Готово, когда:</strong> `ls -l` показывает запланированных владельцев, группы и режимы доступа.</p>

```bash
sudo chown root:teachers /labs/library
sudo chown root:teachers /labs/tests
sudo chown root:teachers /labs/library/book_myname_1 /labs/library/book_myname_2
sudo chown root:workers /labs/list
sudo chmod 775 /labs/library
sudo chmod 664 /labs/library/book_myname_1 /labs/library/book_myname_2
sudo chmod 750 /labs/tests
sudo chmod 640 /labs/list
sudo chmod g+x /labs/tests/test_myname
ls -ld /labs /labs/library /labs/tests
ls -l /labs/library /labs/list /labs/tests/test_myname
```

**Как читать права:** `r=4`, `w=2`, `x=1`; три цифры относятся к владельцу, группе и остальным. `640` означает `rw-r-----`, `775` — `rwxrwxr-x`. `chown` меняет владельца/группу, `chgrp` — группу, `chmod` — биты прав. Первым символом в `ls -l` указан тип: `d` — каталог, `-` — обычный файл.

В этой работе рассматриваем обычные права локальной файловой системы без дополнительных ACL, immutable-атрибутов и иных ограничений. Путь к объекту должен быть доступен; `sudo` без `-u` обычно даёт контекст root, а `sudo -u user_3` запускает команду от user_3.

Смысл:

- `teachers` могут создавать файлы в `library` и изменять подготовленные книги;
- `students` получают доступ там, где это нужно для чтения или запуска;
- `workers` могут читать `/labs/list`, но не изменять его;
- запись в важные файлы не открывается всем подряд.

<p class="lab-tip"><strong>Важное ограничение классических rwx.</strong> У файла есть одна owning group. Если в реальной системе нужны одновременно разные права для нескольких независимых групп (например, <code>teachers=rw</code>, <code>students=r</code>, а всем остальным — ничего), одних owner/group/other битов может быть недостаточно; тогда применяют ACL или меняют структуру групп. ACL в обязательную LX3 не входит.</p>

Чтобы `students` могли запускать конкретный скрипт, не просматривая весь каталог `tests`, дайте право прохода по каталогу и настройте права файла:

```bash
sudo chmod 771 /labs/tests
sudo chgrp students /labs/tests/test_myname
sudo chmod 750 /labs/tests/test_myname
```

У каталога `771` владелец и `teachers` имеют `rwx`, остальные — только `x`, то есть проход к известному имени. У файла `750` группа `students` получает чтение и выполнение. Одной смены группы файла недостаточно, если родительский каталог не пропускает пользователя.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX3-02"><strong>В отчёт · LX3-02.</strong> Повторите <code>ls -ld /labs /labs/library /labs/tests</code> и <code>ls -l /labs/list /labs/tests/test_myname</code>; вставьте вывод как текст.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX3-02">
  <label for="evidence-LX3-02">Поле для результата · LX3-02</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте сюда только запрошенный вывод команд как обычный текст. Поле не является формой и само ничего не отправляет.</p>
  <textarea id="evidence-LX3-02" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX3-02" placeholder="Вставьте сюда результат из терминала…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<span id="access-check"></span>

## Часть 6. Проверка от другого пользователя

<p class="stage-goal"><strong>Готово, когда:</strong> Разрешённые действия проходят, запрещённые дают ожидаемый `Permission denied`.</p>

```bash
sudo -u user_5 bash -c 'echo "teacher-check" >> /labs/library/book_myname_1'
sudo -u user_3 cat /labs/library/book_myname_1
sudo -u user_3 cat /labs/list
sudo -u user_1 cat /labs/list
sudo -u user_1 bash -c 'echo try >> /labs/list'
sudo -u user_3 /labs/tests/test_myname
```

Ожидаемо: `user_5` через группу `teachers` изменяет книгу, а `user_3` может её прочитать; `user_1` из `workers` читает `/labs/list`, но не изменяет его; `user_3` не читает `/labs/list`, зато запускает учебный скрипт. Для запрещённых действий ошибка — ожидаемый результат; для разрешённых она требует исправления.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX3-03"><strong>В отчёт · LX3-03.</strong> Вставьте только ключевые проверки: успешную запись <code>user_5</code> в книгу, чтение книги <code>user_3</code>, чтение и ожидаемый отказ записи <code>user_1</code> для <code>/labs/list</code>, ожидаемый отказ чтения <code>user_3</code> для <code>/labs/list</code> и успешный запуск скрипта. Ошибка <code>Permission denied</code> здесь может быть правильным результатом.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX3-03">
  <label for="evidence-LX3-03">Поле для результата · LX3-03</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте сюда только запрошенный вывод команд как обычный текст. Поле не является формой и само ничего не отправляет.</p>
  <textarea id="evidence-LX3-03" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX3-03" placeholder="Вставьте сюда результат из терминала…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<span id="file-modes"></span>

## Часть 7. Права файлов и каталогов

<p class="stage-goal"><strong>Готово, когда:</strong> Вы проверили на практике, как режимы файла влияют на чтение/запись.</p>

В домашнем каталоге:

```bash
mkdir -p ~/NSA/LX3/perms
cd ~/NSA/LX3/perms
echo one > u1
echo two > u2
echo three > u3
ls -l > listing1
sudo touch r1 r2 r3
ls -l >> listing1
cat listing1
chmod u-w,g-w u1
sudo chmod a+w r1
ls -l u1 r1
```

Попробуйте изменить файлы:

```bash
echo "change" >> u1
echo "change" >> r1
```

Разберите результат. В обычной проверке выбирается один класс прав: владелец, подходящая группа или остальные. Владелец не получает более широкие биты «остальных», если собственная тройка их запрещает.

У каталога `r` разрешает читать список имён, `x` — проходить к известному имени, `w` вместе с `x` — изменять записи. Поэтому при отсутствии sticky bit и дополнительных ограничений имя чужого файла можно удалить из доступного для записи каталога даже без права записи в сам файл.

Изменять режим обычно может владелец или привилегированный процесс. Членство в группе не даёт такого права. Например, `chmod g+x` превращает режим `640` в `650`, не меняя владельца и остальные биты.


<p class="lab-tip"><strong>Проверка без отдельного доказательства.</strong> Убедитесь, что запись в <code>u1</code> запрещена, а в <code>r1</code> разрешена. Это упражнение помогает понять выбор класса прав, но отдельный пункт отчёта не нужен.</p>

<span id="shared-directory"></span>

## Часть 8. Каталог-файлообменник

<p class="stage-goal"><strong>Готово, когда:</strong> Каталог имеет `1777`, а пользователь не может удалить чужой файл.</p>

Sticky bit ограничивает удаление и переименование чужих файлов в общем каталоге. При обычных условиях это разрешено владельцу файла, владельцу каталога или привилегированному процессу. Классический пример — `/tmp`.

Он **не запрещает запись в содержимое**: если файл доступен всем на запись (`666`), sticky bit каталога не исправит его права. `1777` сочетает этот специальный бит с базовыми `rwx` для всех.

```bash
sudo mkdir -p /labs/shared
sudo chmod 1777 /labs/shared
ls -ld /labs/shared
sudo -u user_3 bash -c 'echo user3 > /labs/shared/user3.txt'
sudo -u user_4 bash -c 'echo user4 > /labs/shared/user4.txt'
sudo -u user_3 rm /labs/shared/user4.txt
```

Последняя команда должна завершиться ошибкой доступа. Это правильное поведение.


<p class="lab-tip"><strong>Сохраните результат для финальной проверки.</strong> Sticky bit будет объединён с umask в одном текстовом доказательстве LX3-04.</p>

<span id="creation-mask"></span>

## Часть 9. umask

<p class="stage-goal"><strong>Готово, когда:</strong> Вы связали значение `umask` с правами нового файла и каталога.</p>

Сначала посмотрите маску вашей оболочки, затем проведите предсказуемый опыт **в подоболочке**, чтобы не менять настройку текущего терминала:

```bash
umask
rm -f umask-file
rm -rf umask-dir
(
  umask 027
  echo "LAB_UMASK=$(umask)"
  touch umask-file
  mkdir umask-dir
  ls -ld umask-file umask-dir
)
```

`umask` убирает выбранные биты из режима, запрошенного при создании объекта; это побитовая маска, а не арифметическое вычитание. Без default ACL новый обычный файл обычно запрашивает `0666`, каталог — `0777`, поэтому при `umask 027` ожидаем `0640` и `0750`. Даже `umask 000` не добавит файлу отсутствующие в исходном режиме биты `x`. Круглые скобки запускают подоболочку: после выхода из неё исходная `umask` вашего терминала остаётся прежней. Уже существующие объекты от смены `umask` не меняются.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX3-04"><strong>В отчёт · LX3-04.</strong> Вставьте <code>ls -ld /labs/shared</code>, повторную ожидаемо неуспешную попытку <code>sudo -u user_3 rm /labs/shared/user4.txt</code>, затем строку <code>LAB_UMASK=0027</code> и права созданных <code>umask-file</code>/<code>umask-dir</code>. Этого достаточно, полный листинг каталога не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX3-04">
  <label for="evidence-LX3-04">Поле для результата · LX3-04</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте сюда только запрошенный вывод команд как обычный текст. Поле не является формой и само ничего не отправляет.</p>
  <textarea id="evidence-LX3-04" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX3-04" placeholder="Вставьте сюда результат из терминала…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

## Частые ошибки

- Использовали `sudo` там, где нужно проверить права обычного пользователя. `sudo` может скрыть ошибку настройки.
- Забыли `-a` в `usermod -aG`: без `-a` можно заменить список дополнительных групп.
- Ожидаете, что `x` у каталога означает запуск. Для каталога `x` означает право войти в него и обращаться к известным именам внутри.
- Дали `777` там, где достаточно группы и `775`.
- Отправили закрытый ключ или пароль в отчет. Этого делать нельзя.

## Контрольные точки

<div class="callout checkpoint">
Команды `getent group students`, `id student`, `ls -ld /labs/library /labs/tests /labs/shared` и проверка `sudo -u user_3` должны показывать осмысленное разграничение доступа.
</div>

<details class="optional-work" markdown="1">
<summary>Дополнительно · задачи на права доступа</summary>

Эти задания **не входят в обязательный отчёт**. Выполняйте их для дополнительной практики или по просьбе преподавателя. По умолчанию отдельные снимки экрана не нужны: важнее объяснить, почему выбранные права дают именно такой доступ.


1. Настройте каталог `~/tmp`, где члены группы `students` могут создавать файлы, но остальные пользователи не видят список содержимого.
2. Подберите `chmod` для файла, который владелец может читать и писать, группа только читать, остальные не имеют доступа.
3. Для уже созданного учебного каталога `upload` разберите режим `130`: что смогут владелец, члены группы и остальные? Команда `chmod` меняет права, а не создаёт каталог.


</details>

<h2 id="quiz">Интерактивный тест</h2>

Оставлены 12 вопросов, которые проверяют реальные решения по пользователям, группам, правам каталогов, sticky bit и umask. Объяснение после ответа — часть лабораторной.

В задачах о доступе предполагаются обычные локальные права без ACL и специальных ограничений, доступный путь к указанному каталогу и непривилегированный пользователь, если не оговорено иное.

{% include quiz.html quiz_id="lx3" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx3" %}


<aside class="retrieval-thread"><strong>Вспомните SSH</strong><p>Почему права файла `authorized_keys` имеют значение для удалённого входа?</p><details><summary>Если мысль не приходит</summary><p>Свяжите ответ с тем, кто может изменять список разрешённых ключей.</p></details></aside>

<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если доступ неожиданно запрещён</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Определите, от имени какого пользователя выполняется действие: id.</p></details><details><summary>Проверьте</summary><p>Сопоставьте владельца, группу и rwx у файла и всех каталогов пути.</p></details><details><summary>Если всё ещё неясно</summary><p>Переключитесь на тестового пользователя и проверьте ровно одно действие, чтобы не смешивать причины.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: Пользователь состоит в нужной группе, но каталог всё равно недоступен. Что ещё важно?</summary>
    <p>Права прохода x на каталогах пути и фактическая группа/сессия пользователя.</p>
  </details>
</section>


<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Как бы вы объяснили правило доступа к общему каталогу новому участнику группы одной фразой?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Хороший результат здесь — когда разрешённые и запрещённые действия совпадают с вашей моделью прав.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


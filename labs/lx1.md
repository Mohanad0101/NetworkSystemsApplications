---
layout: default
lab_id: lx1
title: LX1 — Основы командной строки
---

# LX1 — Основы командной строки

LX1 знакомит не просто с набором команд, а с **культурой аккуратной работы в Bash**: сначала понять задачу, затем определить контекст, выбрать команду и путь, предсказать результат, выполнить действие и проверить эффект.

Лабораторная построена как один связный маршрут: **ориентация → безопасные операции с файлами → пользователь и терминал → потоки и конвейеры → ссылки → архив и восстановление**. Все учебные файлы остаются внутри <code>~/NSA/LX1</code>.

<p class="meta-line">Подготовка: 5–10 минут · Основная практика: 65–80 минут · Закрепление: 20–30 минут · Среда: Linux Mint VM · Итог: аккуратно организованная папка <code>~/NSA/LX1</code>, заполненные поля результатов, пройденный MCQ и готовый к отправке DOCX-отчёт</p>

<section class="student-environment" aria-label="Среда курса">
  <div><span>Ваша учебная среда</span><strong>Windows PC → Oracle VirtualBox → Linux Mint 22.3 “Zena”</strong></div>
  <p>Администратор Windows <strong>не требуется для обычной работы курса</strong>. Команды Linux с <code>sudo</code> выполняются внутри Mint VM под вашим учебным Linux-пользователем.</p>
</section>

{% include learning-deck.html lab="lx1" %}

{% include lab-compass.html lab="lx1" %}


{% include lab-start.html lab="lx1" %}

<section class="lab-workflow-board" aria-label="Как работать с LX1">
  <div class="lab-workflow-head">
    <p class="eyebrow">Как пройти лабораторную без спешки</p>
    <h2>Сначала понять, затем выполнить, затем зафиксировать результат</h2>
    <p>Не пропускайте пояснения между командами. В LX1 важно не только выполнить шаг, но и объяснить, почему он работает именно так.</p>
  </div>
  <div class="lab-workflow-grid">
    <article><span>1</span><strong>Прочитайте и поймите этап</strong><small>Перед каждой командой есть цель, ментальная модель или короткий вопрос для размышления.</small></article>
    <article><span>2</span><strong>Выполните команды и заполните результаты</strong><small>После контрольной точки вставьте в поле только главный вывод проверки, а не длинный журнал терминала.</small></article>
    <article><span>3</span><strong>Ответьте на короткие вопросы</strong><small>Объясняйте своими словами: путь, команда и результат должны быть понятны вам, а не только терминалу.</small></article>
    <article><span>4</span><strong>Пройдите MCQ</strong><small>Тест проверяет понимание, а не память. После ошибки прочитайте объяснение и попробуйте снова.</small></article>
    <article><span>5</span><strong>Скачайте DOCX и отправьте преподавателю</strong><small>Когда результаты, ответы и MCQ готовы, скачайте оформленный отчёт и отправьте его как итог работы.</small></article>
  </div>
</section>

<div class="callout checkpoint">
<strong>После LX1 вы сможете:</strong> читать простую команду как инструкцию; выбирать абсолютный или относительный путь; находить справку; безопасно создавать, копировать, перемещать и удалять учебные объекты; различать пользователя и терминальный сеанс; управлять <code>stdout</code>; объяснять различие между копией, hard link и symlink; создавать архив и доказывать его восстановление.
</div>

<p class="lab-tip"><strong>Что не нужно запоминать:</strong> длинные списки опций. Профессиональный навык — понять задачу, найти нужную опцию в справке и проверить эффект команды.</p>

<section class="lab-learning-map" aria-label="Карта понимания LX1">
  <div class="lab-learning-map-head">
    <p class="eyebrow">Карта понимания</p>
    <h2>От «я вижу приглашение» к «я управляю файлами осознанно»</h2>
    <p>Каждый следующий этап опирается на предыдущий. Если команда непонятна, не копируйте её вслепую — вернитесь к вопросу и ментальной модели над ней.</p>
  </div>
  <div class="lab-learning-map-grid">
    <article><span>01</span><strong>Ориентироваться</strong><small><code>pwd</code>, <code>ls</code>, <code>cd</code> · где я и как задать путь</small></article>
    <article><span>02</span><strong>Изменять безопасно</strong><small><code>mkdir</code>, <code>touch</code>, <code>cp</code>, <code>mv</code>, <code>rm</code></small></article>
    <article><span>03</span><strong>Связывать команды</strong><small><code>&gt;</code>, <code>&gt;&gt;</code>, <code>|</code> · куда идёт результат</small></article>
    <article><span>04</span><strong>Понимать файлы глубже</strong><small>hard link, symlink, <code>tar.gz</code> и проверка восстановления</small></article>
  </div>
</section>

<div class="callout checkpoint">
<strong>Ритм работы:</strong> сначала сформулируйте, что хотите узнать или изменить → предскажите результат → выполните одну команду → прочитайте вывод → объясните его одним предложением. Такой цикл важнее запоминания синтаксиса.
</div>

## Зачем нужна командная строка

Графический интерфейс удобен, когда действие выполняется вручную. Командная строка особенно полезна, когда нужно точно повторить действие, работать на удалённом сервере, автоматизировать последовательность операций или быстро обработать много файлов.

В Linux терминал и командная оболочка — не одно и то же:

- **терминал** — окно или текстовый сеанс, через который вы вводите команды;
- **оболочка (shell)** — программа, которая читает командную строку и запускает команды; в этой лабораторной используется Bash;
- **приглашение (prompt)** — строка, показывающая, что оболочка готова принять следующую команду.

Обычно приглашение выглядит примерно так:

```text
student@mint:~$
```

Здесь `student` — пользователь, `mint` — имя компьютера, `~` — домашний каталог. Символ `$` обычно означает обычного пользователя. Сам `$` вводить не нужно.

<section class="lab-case-grid" aria-label="Мини-кейсы пользы командной строки">
  <div class="lab-case-head">
    <p class="eyebrow">Зачем это нужно на практике</p>
    <h2>Три коротких кейса, где Bash полезнее простого клика мышью</h2>
  </div>
  <div class="lab-case-cards">
    <article><span>Кейс 1</span><strong>Нужно быстро понять, где вы находитесь</strong><small>Перед изменением файлов важно подтвердить текущий каталог и его содержимое. Здесь помогают <code>pwd</code> и <code>ls</code>.</small></article>
    <article><span>Кейс 2</span><strong>Нужно повторить одно и то же действие без путаницы</strong><small>Создать структуру, скопировать файл, переименовать его и проверить результат гораздо надёжнее последовательностью явных команд, чем случайными действиями в GUI.</small></article>
    <article><span>Кейс 3</span><strong>Нужно сохранить результат как доказательство</strong><small>Перенаправление и конвейеры позволяют сохранить важный вывод в файл и затем включить его в отчёт без ручного переписывания.</small></article>
  </div>
</section>

<div class="shell-mental-model" aria-label="Ментальная модель работы команды">
  <div><span>1</span><strong>Вы вводите строку</strong><small><code>ls -l /etc</code></small></div>
  <b aria-hidden="true">→</b>
  <div><span>2</span><strong>Bash разбирает её</strong><small>слова · подстановки · операторы · перенаправления</small></div>
  <b aria-hidden="true">→</b>
  <div><span>3</span><strong>Выполняется действие</strong><small>встроенная команда Bash или отдельная программа</small></div>
  <b aria-hidden="true">→</b>
  <div><span>4</span><strong>Вы читаете результат</strong><small>вывод, изменение файла или сообщение об ошибке</small></div>
</div>

<div class="callout checkpoint">
<strong>Главная идея LX1:</strong> прежде чем нажать Enter, ответьте на три вопроса: <strong>что</strong> я запускаю, <strong>с каким объектом или контекстом</strong> работаю и <strong>где он находится</strong>. После Enter добавьте четвёртый вопрос: <strong>что именно изменилось?</strong>
</div>

## Как устроена команда

Для первых лабораторных удобно использовать простую прикладную модель:

```text
имя команды   опция программы   операнд / путь
     ls             -l              /etc
```

- `ls` — имя команды, которую нужно выполнить;
- `-l` — аргумент, который сама программа `ls` распознаёт как опцию длинного формата;
- `/etc` — операнд: путь к объекту, который нужно показать.

Не каждая команда требует опций или операндов. Например, `pwd` обычно запускается без них.

<details class="concept-details" markdown="1">
<summary>Чуть точнее · что видит Bash?</summary>

После необходимых подстановок Bash выбирает имя команды и передаёт остальные слова команде как аргументы. Разделение на «опции» и «операнды» обычно задаётся соглашениями самой программы. Поэтому `-l` и `/etc` с точки зрения запуска — оба аргументы `ls`, но `ls` интерпретирует их по-разному.

</details>

### Сначала научитесь находить справку

Для внешних утилит удобен полный локальный справочник `man`. Посмотрите руководство для `ls`:

```bash
man ls
```

Внутри `man`:

- `Space` / `Page Down` — следующая страница;
- `/слово` — поиск;
- `n` — следующий результат поиска;
- `q` — выход.

Когда нужен короткий список опций, часто быстрее использовать:

```bash
ls --help
```

Некоторые важные команды, например `cd`, встроены непосредственно в Bash. Для них полезна встроенная справка оболочки:

```bash
help cd
```

<p class="lab-tip"><strong>Полезная привычка.</strong> Не пытайтесь запомнить все ключи. Важно уметь быстро найти правильный ключ в <code>man</code>, <code>--help</code> или <code>help</code>.</p>

<section class="lab-workspace-tree" aria-label="Структура рабочих папок курса">
  <div>
    <p class="eyebrow">Порядок файлов с первого занятия</p>
    <h2>Один курс → одна папка NSA → отдельная папка для каждой лабораторной</h2>
    <p>В LX0 вы создали <code>~/NSA/LX0</code>. Сейчас создадим <code>~/NSA/LX1</code>. В следующих работах схема продолжится без смешивания файлов разных лабораторных.</p>
  </div>

```text
/home/your_user/
└── NSA/
    ├── LX0/
    ├── LX1/   ← работаем здесь
    ├── LX2/
    └── ...
```

  <p><strong>Почему это важно:</strong> домашний каталог принадлежит вам, <code>NSA</code> отделяет материалы курса от личных файлов, а <code>LXn</code> делает результаты каждой лабораторной легко найти, проверить и сохранить.</p>
</section>

<span id="practice-basic"></span>

## Часть 1. Где я? Пути, навигация и 10 основных команд

<p class="stage-goal"><strong>Готово, когда:</strong> Вы можете объяснить абсолютный и относительный путь, создать рабочую структуру <code>~/NSA/LX1</code> и безопасно скопировать, переместить и удалить учебные файлы.</p>

<section class="guided-mini-task" aria-label="Мини-сценарий первой части">
  <div>
    <p class="eyebrow">Мини-сценарий</p>
    <h3>Представьте задачу системного лаборанта</h3>
    <p>Преподаватель просит подготовить аккуратную папку лабораторной, создать в ней учебный файл, переместить его в рабочую область и убедиться, что лишняя копия удалена. Именно это вы сейчас и будете делать — шаг за шагом.</p>
  </div>
  <ol>
    <li>Сначала определить текущий контекст.</li>
    <li>Потом создать безопасное пространство внутри <code>~/NSA/LX1</code>.</li>
    <li>Затем выполнить файловые операции и проверить состояние после каждой из них.</li>
  </ol>
</section>

### 1.1 Сначала ответьте на два вопроса: «где я?» и «что здесь есть?»

<p class="command-purpose"><span>ВОПРОС 1</span> Какой каталог сейчас является рабочим?</p>

```bash
pwd
```

<p class="command-read"><strong>Смотрите в вывод:</strong> вы получите один абсолютный путь, например <code>/home/student</code>. Именно от текущего каталога Bash и программы будут интерпретировать относительные пути.</p>

`pwd` означает **print working directory**. Команда ничего не меняет — она только сообщает ваше текущее положение.

<p class="command-purpose"><span>ВОПРОС 2</span> Какие имена находятся в этом каталоге?</p>

```bash
ls
```

<p class="command-read"><strong>Смотрите в вывод:</strong> <code>ls</code> показывает имена объектов. Если каталог пуст, команда может не вывести ни одной строки — это не ошибка.</p>

Теперь попросите более подробное представление:

```bash
ls -l
```

В длинном формате важен не каждый столбец сразу. На этом этапе найдите только **тип/права в начале строки**, **размер** и **имя**. Владельца и права подробно разберёте в LX3.

У `ls` в этой лабораторной нужны четыре ключа:

| Ключ | Что меняется | Когда полезен |
|---|---|---|
| `-l` | подробный список | когда нужны свойства объекта, а не только имя |
| `-A` | показывает скрытые имена, кроме `.` и `..` | когда нужно увидеть конфигурационные dotfiles |
| `-t` | сортирует по времени изменения | когда ищете недавно изменённые файлы |
| `-r` | разворачивает выбранный порядок | например, вместе с `-t` для обратной сортировки |

Посмотрите скрытые имена в домашнем каталоге:

```bash
ls -A ~
```

<details class="micro-check" markdown="1">
<summary>Проверьте понимание · почему <code>ls -A ~</code> не зависит от текущего каталога?</summary>

Потому что `~` разворачивается Bash в домашний каталог текущего пользователя. Команда получает путь к дому независимо от того, где вы сейчас находитесь.

</details>

### 1.2 Ментальная модель файловой системы

В Linux нет отдельного дерева для каждого диска в стиле `C:` и `D:`. Файловая система представляется одним иерархическим деревом, начинающимся с корня `/`. Дополнительные файловые системы подключаются в точки этого дерева.

```text
/
├── home/    домашние каталоги обычных пользователей
├── etc/     системная конфигурация
├── var/     изменяемые данные: журналы, очереди, кэш
├── tmp/     временные файлы
├── usr/     программы, библиотеки и общие данные
├── dev/     представления устройств
└── proc/    виртуальная информация о процессах и ядре
```

Не путайте `/` и `/root`: `/` — корень всего дерева, а `/root` — домашний каталог пользователя `root`.

### 1.3 Абсолютный и относительный путь

Путь — это не просто строка: это **маршрут к объекту**. Самая важная привычка LX1 — сначала определить точку старта маршрута.

<div class="path-compare">
  <article><strong>Абсолютный путь</strong><code>/etc/passwd</code><small>Старт всегда в корне <code>/</code>. Текущий каталог не важен.</small></article>
  <article><strong>Относительный путь</strong><code>log</code><small>Старт в текущем каталоге. Если <code>pwd</code> = <code>/var</code>, получится <code>/var/log</code>.</small></article>
</div>

Три обозначения позволяют задавать путь короче:

- `.` — текущий каталог;
- `..` — родительский каталог;
- `~` — тильда, которую Bash **до запуска команды** разворачивает в домашний каталог текущего пользователя.

<p class="lab-tip"><strong>Не путайте механизм.</strong> <code>.</code> и <code>..</code> являются компонентами пути, а <code>~</code> — синтаксис оболочки Bash. Каталога с буквальным именем <code>~</code> в этом примере нет.</p>

<div class="predict-box">
<strong>Сначала предскажите.</strong> После перехода в <code>/var</code> команда <code>cd log</code> приведёт в <code>/log</code> или <code>/var/log</code>? Не запускайте следующую проверку, пока не выбрали ответ.
</div>

Перейдите в `/var` абсолютным путём:

```bash
cd /var
```

Проверьте точку старта:

```bash
pwd
```

Теперь используйте только имя дочернего каталога:

```bash
cd log
```

Проверьте результат:

```bash
pwd
```

<p class="command-read"><strong>Объясните результат:</strong> путь <code>log</code> относительный, поэтому он был добавлен к текущему <code>/var</code>.</p>

Поднимитесь на один уровень:

```bash
cd ..
```

Вернитесь домой:

```bash
cd ~
```

`cd` без аргумента тоже переходит в домашний каталог:

```bash
cd
```

<details class="micro-check" markdown="1">
<summary>Мини-проверка · почему <code>/etc/passwd</code> и <code>etc/passwd</code> могут указывать на разные места?</summary>

`/etc/passwd` начинается с `/`, значит поиск всегда начинается от корня файловой системы. `etc/passwd` не начинается с `/`, поэтому сначала используется текущий каталог.

</details>

<p class="callout warning"><strong>Частая ошибка.</strong> Если команда сообщает <code>No such file or directory</code>, не спешите менять имя файла. Сначала выполните <code>pwd</code> и спросите себя: «мой путь абсолютный или относительный?»</p>

### 1.4 Создайте безопасное рабочее пространство

В учебной лабораторной хороший путь должен быть не только правильным, но и **безопасным**: все изменения будем делать внутри `~/NSA/LX1`.

```bash
mkdir -p ~/NSA/LX1/basic
```

`mkdir` создаёт каталог. Ключ `-p` здесь полезен для повторного запуска лабораторной: он создаёт недостающие родительские каталоги и не считает ошибкой уже существующий путь.

Перейдите в него:

```bash
cd ~/NSA/LX1/basic
```

Проверьте, что вы действительно внутри лабораторного каталога:

```bash
pwd
```

<p class="command-read"><strong>Ожидаемый смысл вывода:</strong> путь должен оканчиваться на <code>/NSA/LX1/basic</code>. Не важно, какое имя пользователя находится перед ним.</p>

### 1.5 Файл: создать имя → записать данные → прочитать

Создайте пустой файл:

```bash
touch user.txt
```

`touch` не «пишет текст». Для нового имени он создаёт пустой файл; для существующего файла по умолчанию обновляет временные метки, не стирая содержимое.

<div class="predict-box">
<strong>Предскажите.</strong> Что покажет <code>cat user.txt</code> сразу после <code>touch user.txt</code>: ошибку, пустой вывод или слово <code>user.txt</code>?
</div>

Проверьте:

```bash
cat user.txt
```

Пустой вывод здесь нормален: файл существует, но пока не содержит данных.

Теперь запишите одну строку. Оператор `>` принадлежит Bash и перенаправляет обычный вывод в файл; в части 3 вы изучите его подробно.

```bash
echo "created by $USER" > user.txt
```

Прочитайте содержимое:

```bash
cat user.txt
```

<p class="command-read"><strong>Различайте две идеи:</strong> <code>touch</code> создаёт/обновляет файловый объект, а <code>echo ... &gt; user.txt</code> записывает данные. Это разные операции.</p>

<span id="file-operations"></span>

### 1.6 `cp`, `mv`, `rm`: наблюдайте изменение состояния

Перед каждой файловой операцией думайте не «какую команду ввести?», а **какое состояние должно быть после неё?**

<div class="file-state-flow" aria-label="Состояние файлов в упражнении">
  <div><span>СТАРТ</span><code>basic/user.txt</code><small>один исходный файл</small></div>
  <b>→ cp →</b>
  <div><span>КОПИЯ</span><code>work/profile.txt</code><small>исходник остаётся</small></div>
  <b>→ mv →</b>
  <div><span>НОВОЕ ИМЯ</span><code>work/about-me.txt</code><small><code>profile.txt</code> исчезает как имя</small></div>
</div>

Перейдите на уровень LX1:

```bash
cd ~/NSA/LX1
```

Создайте каталог для рабочей копии:

```bash
mkdir -p work
```

Создайте каталог для архива, который понадобится позже:

```bash
mkdir -p archive
```

Скопируйте файл:

```bash
cp basic/user.txt work/profile.txt
```

<p class="command-read"><strong>После <code>cp</code>:</strong> должны существовать и <code>basic/user.txt</code>, и <code>work/profile.txt</code>. Копирование не удаляет источник.</p>

<p class="callout warning"><strong>Ещё одна важная привычка.</strong> Если файл назначения уже существует, обычный <code>cp</code> может заменить его содержимое. Перед копированием в важное место сначала проверьте имя назначения.</p>

Переименуйте копию:

```bash
mv work/profile.txt work/about-me.txt
```

`mv` может менять каталог объекта или его имя. Здесь источник и назначение находятся в одном каталоге, поэтому операция выглядит как переименование.

Создайте рекурсивную копию всего каталога `work`:

```bash
cp -r work work-copy
```

Посмотрите итоговую структуру:

```bash
ls -R ~/NSA/LX1
```

<div class="predict-box danger-lite">
<strong>Перед удалением.</strong> Команда <code>rm -r</code> работает рекурсивно. Сначала докажите себе, что путь указывает именно на учебную копию, а не на <code>~/NSA</code>, домашний каталог или <code>/</code>.
</div>

Проверьте точную цель:

```bash
ls -ld ~/NSA/LX1/work-copy
```

Только после проверки удалите эту копию:

```bash
rm -r ~/NSA/LX1/work-copy
```

<p class="callout warning"><strong>Безопасность важнее скорости.</strong> Обычный <code>rm</code> не перемещает объект в графическую «Корзину». В этой лабораторной удаляем только внутри заранее созданного учебного дерева.</p>

<details class="micro-check" markdown="1">
<summary>Проверьте понимание · чем <code>cp</code> и <code>mv</code> отличаются в этом упражнении?</summary>

После `cp` источник остаётся и появляется копия. После `mv` исходное имя/положение заменяется новым: объект перемещён или переименован.

</details>

### 1.7 Команды могут вести себя по-разному

Команда вроде `pwd` завершается почти сразу. Некоторые команды выполняются дольше, а некоторые запускают интерактивные программы.

Безопасный эксперимент: запустите `ping` на локальный компьютер и после нескольких строк нажмите `Ctrl+C`:

```bash
ping 127.0.0.1
```

`Ctrl+C` обычно прерывает процесс, работающий на переднем плане. Технически терминальный драйвер распознаёт управляющий символ и обычно приводит к отправке `SIGINT` foreground process group. Поэтому в графическом терминале копирование текста обычно выполняется `Ctrl+Shift+C`, а вставка — `Ctrl+Shift+V`.

### Быстрые клавиши, которые действительно экономят время

| Клавиша | Действие |
|---|---|
| `Tab` | дополнить имя команды или путь, если возможно |
| `↑` | вернуть предыдущую команду |
| `Ctrl+R` | искать ранее введённую команду |
| `Ctrl+A` | перейти в начало текущей строки |
| `Ctrl+E` | перейти в конец текущей строки |
| `Ctrl+L` | очистить видимую область терминала |
| `Ctrl+C` | прервать текущую команду |
| `Ctrl+D` | обозначить конец ввода; на пустой строке интерактивной оболочки часто завершает сеанс (это не сигнал вроде `Ctrl+C`) |

Посмотрите последние команды Bash:

```bash
history 10
```

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX1-01"><strong>В отчёт · LX1-01.</strong> Здесь проверяется результат, а не умение копировать длинный терминальный журнал. Выполните одну сводную строку ниже и вставьте её короткий вывод.</p>

```bash
printf 'WORKSPACE=%s\n' "$(realpath ~/NSA/LX1)"; test -f ~/NSA/LX1/basic/user.txt && echo 'BASIC_FILE=OK'; test -f ~/NSA/LX1/work/about-me.txt && echo 'COPY_MOVE=OK'; test ! -e ~/NSA/LX1/work-copy && echo 'CLEANUP=OK'; printf 'ABOUT='; cat ~/NSA/LX1/work/about-me.txt
```

<p class="lab-tip"><strong>Только для проверки.</strong> Эта строка намеренно объединяет несколько проверок и использует конструкции, которые вы ещё не обязаны знать. Не переписывайте её как образец обычной работы: её задача — компактно измерить результат уже выполненных шагов.</p>

<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX1-01">
  <label for="evidence-LX1-01">Поле для результата · LX1-01</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте только вывод сводной проверки. Полный журнал терминала не нужен.</p>
  <textarea id="evidence-LX1-01" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX1-01" placeholder="WORKSPACE=...\nBASIC_FILE=OK\nCOPY_MOVE=OK\nCLEANUP=OK\nABOUT=..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<p class="lab-tip"><strong>Дальше.</strong> Теперь вы умеете адресовать файлы и выполнять основные операции. Следующий шаг — понять, <em>кто</em> выполняет команды и <em>в каком терминальном сеансе</em>.</p>

<span id="practice-service"></span>
<span id="service-commands"></span>

## Часть 2. Пользователь, терминал и просмотр системного файла

<p class="stage-goal"><strong>Готово, когда:</strong> Вы можете различить <code>whoami</code>, <code>tty</code> и <code>who</code>, открыть длинный файл через <code>less</code> и найти точную строку пользователя в <code>/etc/passwd</code>.</p>

Linux изначально рассчитан на многопользовательскую работу. Один и тот же пользователь может иметь несколько сеансов, а один компьютер может обслуживать локальные и удалённые терминалы одновременно.

<div class="concept-compare three">
  <article><code>whoami</code><strong>Кто выполняет команду?</strong><small>эффективное имя текущего пользователя</small></article>
  <article><code>tty</code><strong>Через какой терминал?</strong><small>имя терминального устройства текущего ввода</small></article>
  <article><code>who</code><strong>Какие входы учтены?</strong><small>записи активных пользовательских сеансов, если они зарегистрированы</small></article>
</div>

<div class="callout safe-note"><strong>Почему здесь нет обязательных <code>su</code>, <code>sudo</code> и <code>shutdown</code>.</strong> Они присутствуют в историческом практикуме как служебные команды, но меняют уровень привилегий или состояние системы. В LX1 мы сначала формируем безопасную модель наблюдения; права и пользователи подробно изучаются в LX3, загрузка и службы — позже в курсе.</div>

### 2.1 Какой терминал обслуживает этот сеанс?

```bash
tty
```

`tty` выводит имя терминального устройства, связанного со стандартным вводом текущего сеанса. В графическом эмуляторе терминала вы часто увидите имя вида `/dev/pts/0`; в текстовой консоли — `/dev/ttyN`.

### 2.2 Кто я?

```bash
whoami
```

`whoami` отвечает только на вопрос: **какое эффективное имя пользователя у текущего процесса?**

### 2.3 Кто вошёл в систему?

```bash
who
```

`who` показывает учтённые пользовательские сеансы. Не каждое окно терминала обязательно создаёт отдельную запись в базе учёта входов, поэтому результат зависит от способа запуска сеанса.

### 2.4 Как читать длинный файл

Откройте системный файл учётных записей через пейджер:

```bash
less /etc/passwd
```

В `less` используйте `/` для поиска и `q` для выхода. `less` не является текстовым редактором: он предназначен прежде всего для просмотра.

Строка `/etc/passwd` имеет поля, разделённые двоеточиями:

```text
login:x:UID:GID:comment:home:shell
```

В системе с shadow passwords символ `x` во втором поле обычно означает, что хеш пароля хранится отдельно, обычно в защищённом `/etc/shadow`. Сам `/etc/passwd` содержит общедоступные сведения об учётной записи и не должен содержать пароль открытым текстом.

Найдите **точно** свою запись:

```bash
grep "^${USER}:" /etc/passwd
```

Здесь `^` означает начало строки, а `:` фиксирует конец поля логина. Поэтому пользователь `ann` не будет случайно совпадать со строкой `joann`.

### 2.5 Виртуальные терминалы

На Linux-системах существуют виртуальные текстовые консоли. Их количество и клавиши переключения зависят от дистрибутива и графической среды. На многих настольных системах используется комбинация `Ctrl+Alt+Fn`, но не следует предполагать, что графический сеанс всегда находится именно на `tty7`.

Для этой лабораторной переключаться между виртуальными консолями необязательно: главное — понять различие между **пользователем**, **сеансом** и **терминальным устройством**.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX1-02"><strong>В отчёт · LX1-02.</strong> Выполните компактную проверку. Если <code>who</code> ничего не выводит, это допустимо — оставьте фактический результат.</p>

```bash
printf 'TTY='; tty; printf 'USER='; whoami; grep -q "^${USER}:" /etc/passwd && echo 'PASSWD_RECORD=FOUND'; printf 'SESSION_COUNT='; who | wc -l
```

<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX1-02">
  <label for="evidence-LX1-02">Поле для результата · LX1-02</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте только четыре короткие метки проверки. Историю команд и полный `/etc/passwd` в отчёт не копируйте.</p>
  <textarea id="evidence-LX1-02" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX1-02" placeholder="TTY=...\nUSER=...\nPASSWD_RECORD=FOUND\nSESSION_COUNT=..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<p class="lab-tip"><strong>Дальше.</strong> До сих пор каждая команда в основном выводила результат на экран. Теперь вы научитесь управлять этим выводом: сохранять его в файл, дописывать данные и передавать результат одной команды другой.</p>

<span id="redirection"></span>

## Часть 3. Потоки, перенаправление и канал `|`

<p class="stage-goal"><strong>Готово, когда:</strong> Вы можете объяснить разницу между <code>&gt;</code>, <code>&gt;&gt;</code> и <code>|</code> и создаёте три результирующих файла без ручного копирования текста.</p>

<div class="shell-operator-model">
  <article><code>&gt;</code><strong>Заменить содержимое файла</strong><small>stdout → файл</small></article>
  <article><code>&gt;&gt;</code><strong>Дополнить файл</strong><small>stdout → конец файла</small></article>
  <article><code>|</code><strong>Передать следующей команде</strong><small>stdout слева → stdin справа</small></article>
</div>

<p class="lab-tip"><strong>Научно важная деталь.</strong> Символы <code>&gt;</code>, <code>&gt;&gt;</code> и <code>|</code> — не опции команды <code>ls</code>, <code>echo</code> или <code>grep</code>. Их интерпретирует оболочка Bash, которая заранее настраивает потоки между программами и файлами.</p>

У обычной командной программы есть три стандартных потока:

```text
stdin  (0)  →  команда  →  stdout (1)
                     ↘  stderr (2)
```

- **stdin** — стандартный ввод;
- **stdout** — обычный результат;
- **stderr** — диагностические сообщения и ошибки.

На первом этапе достаточно уверенно работать со `stdout`.

Перейдите в рабочий каталог:

```bash
cd ~/NSA/LX1
```

### 3.1 `>` — записать вывод заново

<div class="predict-box">
<strong>Сначала предскажите.</strong> Если <code>home-list.txt</code> уже содержит старый текст, что с ним произойдёт после использования <code>&gt;</code>?
</div>

Сохраните подробный список домашнего каталога в файл:

```bash
ls -la ~ > home-list.txt
```

Если `home-list.txt` уже существовал, `>` открывает его для новой записи и старое содержимое теряется. В Bash перенаправление настраивается до запуска команды, поэтому относитесь к `>` как к потенциально изменяющей файл операции.

### 3.2 `>>` — дописать в конец

Добавьте маркер в конец, не удаляя предыдущие данные. Если файла ещё нет, `>>` создаст его:

```bash
echo "second snapshot" >> home-list.txt
```

Проверьте файл через уже знакомый пейджер:

```bash
less home-list.txt
```

### 3.3 `|` — передать stdout следующей программе

Не обязательно сначала сохранять вывод в файл. Канал `|` связывает стандартный вывод команды слева со стандартным вводом команды справа.

Посмотрите длинный список домашнего каталога через `less`:

```bash
ls -la ~ | less
```

Здесь `ls` не создаёт файл: его вывод напрямую читает `less`.

### 3.4 Сохраните точную запись пользователя

```bash
grep "^${USER}:" /etc/passwd > my-passwd-line.txt
```

Проверьте:

```bash
cat my-passwd-line.txt
```

### 3.5 Найдите текстовые файлы внутри лабораторного каталога

`find` обходит дерево каталогов, а `-name` отбирает имена по шаблону:

```bash
find ~/NSA/LX1 -name "*.txt"
```

Кавычки вокруг `*.txt` нужны, чтобы Bash не раскрыл шаблон раньше времени: сопоставление имён должен выполнить `find`.

Теперь отсортируйте найденные пути и сохраните их:

```bash
find ~/NSA/LX1 -name "*.txt" | sort > txt-files.txt
```

Это один осмысленный конвейер: `find` создаёт список → `sort` сортирует → `>` сохраняет итог.

Проверьте результат:

```bash
cat txt-files.txt
```

<details class="concept-details" markdown="1">
<summary>Чуть глубже · что происходит с ошибками?</summary>

Обычный `|` передаёт `stdout`, но не `stderr`. Аналогично, `> file` перенаправляет обычный вывод, а диагностические сообщения по умолчанию остаются в терминале. В следующих лабораторных вы научитесь управлять потоками раздельно; сейчас важно не скрывать ошибки автоматически, а читать их.

</details>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX1-03"><strong>В отчёт · LX1-03.</strong> Сводная проверка выводит только небольшие фрагменты созданных файлов.</p>

```bash
test -s home-list.txt && echo 'HOME_LIST=OK'; grep -q '^second snapshot$' home-list.txt && echo 'APPEND=OK'; test -s my-passwd-line.txt && echo 'PASSWD_COPY=OK'; test -s txt-files.txt && echo 'PIPELINE=OK'; head -n 3 txt-files.txt
```

<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX1-03">
  <label for="evidence-LX1-03">Поле для результата · LX1-03</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте только короткий вывод проверки, а не весь home-list.txt.</p>
  <textarea id="evidence-LX1-03" rows="6" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX1-03" placeholder="HOME_LIST=OK\nAPPEND=OK\nPASSWD_COPY=OK\nPIPELINE=OK\n/path/to/file.txt ..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

<p class="lab-tip"><strong>Дальше.</strong> Теперь вы умеете адресовать файлы и соединять небольшие команды. Последняя практическая часть показывает, что в Linux имя файла, сам файловый объект и ссылка на него — не одно и то же.</p>

<span id="practice-files"></span>

## Часть 4. Файлы, ссылки и архив `tar.gz`

<p class="stage-goal"><strong>Готово, когда:</strong> Вы наблюдаете различие между копией, жёсткой ссылкой и символической ссылкой, затем создаёте и реально восстанавливаете архив.</p>

<div class="concept-compare three">
  <article><code>cp</code><strong>Копия</strong><small>логически независимый файловый объект назначения</small></article>
  <article><code>ln</code><strong>Hard link</strong><small>ещё одно имя того же inode в той же файловой системе</small></article>
  <article><code>ln -s</code><strong>Symlink</strong><small>отдельный объект, который хранит путь к цели</small></article>
</div>

### 4.1 Имя файла и файловый объект

Упрощённая модель обычного файла:

```text
имя в каталоге  ──→  inode  ──→  данные файла
```

При обычном копировании появляется логически независимый файл назначения. Жёсткая ссылка на обычный файл создаёт ещё одно имя того же inode и не может пересекать границу файловой системы. Символическая ссылка — отдельный объект, содержащий путь к цели; такой путь может указывать и в другую файловую систему.

```text
hard link name ───────┐
                      ├──→ same inode ──→ same data
original name ────────┘

symbolic link ──→ "../src/user.txt" ──→ target path
```

### 4.2 Подготовьте безопасную структуру

```bash
mkdir -p ~/NSA/LX1/files/src
```

```bash
mkdir -p ~/NSA/LX1/files/dst
```

```bash
mkdir -p ~/NSA/LX1/files/temp
```

```bash
mkdir -p ~/NSA/LX1/backup
```

```bash
mkdir -p ~/NSA/LX1/archive
```

Создайте три учебных файла:

```bash
echo "user file" > ~/NSA/LX1/files/temp/user.txt
```

```bash
echo "root name, not root owner" > ~/NSA/LX1/files/temp/root.txt
```

<p class="lab-tip"><strong>Наблюдение на будущее.</strong> Имя <code>root.txt</code> не делает владельцем файла пользователя <code>root</code>. Имя файла и его владелец — разные свойства; владельцев и права вы исследуете в LX3.</p>

```bash
echo "student file" > ~/NSA/LX1/files/temp/stud.txt
```

Скопируйте их в `src` с помощью шаблона `*.txt`:

```bash
cp ~/NSA/LX1/files/temp/*.txt ~/NSA/LX1/files/src/
```

Bash разворачивает `*.txt` в подходящие имена файлов до запуска `cp`.

### 4.3 Создайте жёсткую ссылку

```bash
ln ~/NSA/LX1/files/src/user.txt ~/NSA/LX1/files/dst/user-hard.txt
```

### 4.4 Создайте символическую ссылку

```bash
ln -s ../src/user.txt ~/NSA/LX1/files/dst/user-soft.txt
```

Относительная цель `../src/user.txt` разрешается **от каталога, в котором находится сама символическая ссылка**, то есть от `files/dst`.

Сравните inode и типы объектов:

```bash
ls -li ~/NSA/LX1/files/src ~/NSA/LX1/files/dst
```

У исходного имени и hard link должен совпадать inode. У symlink — свой inode и стрелка к пути-цели.

Сохраните это состояние для отчёта:

```bash
ls -li ~/NSA/LX1/files/src ~/NSA/LX1/files/dst > ~/NSA/LX1/links-before.txt
```

### 4.5 Проверьте чтение трёх путей

```bash
cat ~/NSA/LX1/files/src/user.txt
```

```bash
cat ~/NSA/LX1/files/dst/user-hard.txt
```

```bash
cat ~/NSA/LX1/files/dst/user-soft.txt
```

Пока цель существует, все три пути приводят к одному и тому же тексту.

### 4.6 Создайте архив

<p class="command-purpose"><span>ЦЕЛЬ</span> Упаковать дерево <code>src/</code> в один файл и затем доказать, что его можно восстановить.</p>

```bash
tar -czf ~/NSA/LX1/archive/src.tar.gz -C ~/NSA/LX1/files src
```

Разбор ключей:

- `c` — create: создать архив;
- `z` — использовать gzip;
- `f` — следующее значение является именем файла архива;
- `-C DIR` — перед обработкой перейти в указанный каталог.

Поэтому внутри архива будет путь `src/...`, а не длинный абсолютный путь.

Не распаковывая архив, посмотрите его содержание:

```bash
tar -tzf ~/NSA/LX1/archive/src.tar.gz
```

### 4.7 Восстановите архив

```bash
tar -xzf ~/NSA/LX1/archive/src.tar.gz -C ~/NSA/LX1/backup
```

Проверьте восстановленный файл:

```bash
cat ~/NSA/LX1/backup/src/user.txt
```

Создать архив недостаточно: успешное чтение восстановленного файла доказывает, что вы проверили процесс восстановления. Сам файл архива ещё не является гарантией резервного копирования — для настоящего backup важны отдельное место хранения, политика версий и регулярная проверка восстановления; здесь мы тренируем именно базовый цикл **создать → проверить содержимое → восстановить → прочитать**.

### 4.8 Удалите только исходное имя и наблюдайте ссылки

Удалите исходное имя `files/src/user.txt`:

```bash
rm ~/NSA/LX1/files/src/user.txt
```

Жёсткая ссылка всё ещё должна читать данные:

```bash
cat ~/NSA/LX1/files/dst/user-hard.txt
```

Попробуйте символическую ссылку:

```bash
cat ~/NSA/LX1/files/dst/user-soft.txt
```

Ошибка здесь **ожидаема**: symlink всё ещё хранит путь `../src/user.txt`, но этого имени больше нет. Данные не исчезли полностью, потому что hard link всё ещё ссылается на исходный inode.

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX1-04"><strong>В отчёт · LX1-04.</strong> Выполните одну сводную проверку. Сообщение об ошибке для битой символической ссылки является частью ожидаемого результата.</p>

```bash
test -f ~/NSA/LX1/archive/src.tar.gz && echo 'ARCHIVE=OK'; test -f ~/NSA/LX1/backup/src/user.txt && echo 'RESTORE=OK'; test -f ~/NSA/LX1/files/dst/user-hard.txt && echo 'HARD_LINK=OK'; test -L ~/NSA/LX1/files/dst/user-soft.txt && echo 'SYMLINK_OBJECT=EXISTS'; test ! -e ~/NSA/LX1/files/dst/user-soft.txt && echo 'SYMLINK_TARGET=MISSING'; printf 'RESTORED_TEXT='; cat ~/NSA/LX1/backup/src/user.txt
```

<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX1-04">
  <label for="evidence-LX1-04">Поле для результата · LX1-04</label>
  <p class="evidence-editor-help" data-evidence-help>Вставьте короткий вывод проверки ссылок, состава архива и восстановленного файла.</p>
  <textarea id="evidence-LX1-04" rows="7" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX1-04" placeholder="ARCHIVE=OK\nRESTORE=OK\nHARD_LINK=OK\nSYMLINK_OBJECT=EXISTS\nSYMLINK_TARGET=MISSING\nRESTORED_TEXT=..."></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions">
    <button type="button" data-evidence-copy>Копировать</button>
    <button type="button" class="secondary-action" data-evidence-clear>Очистить</button>
    <span class="evidence-editor-status" data-evidence-status aria-live="polite"></span>
  </div>
</div>

## Пять ошибок, которые LX1 должен устранить

| Ошибочная интуиция | Правильная модель |
|---|---|
| «Если путь выглядит знакомо, команда найдёт файл» | Относительный путь зависит от текущего каталога; при сомнении сначала `pwd`. |
| «`touch` записывает текст» | `touch` создаёт отсутствующий файл или обновляет временные метки; данные записываются другой операцией. |
| «`cp` всегда безопасно добавляет копию» | Если назначение уже существует, его содержимое может быть заменено. |
| «`>` — часть команды слева» | Это оператор Bash, который перенаправляет `stdout` и может очистить существующий файл перед новой записью. |
| «Имя файла определяет его владельца» | Имя, inode, содержимое, владелец и права — разные свойства объекта. |

## Что теперь должно быть понятно

К концу практики вы должны уметь объяснить своими словами:

1. чем терминал отличается от Bash;
2. как в `ls -l /etc` различить имя команды, опцию программы и операнд-путь;
3. когда использовать `man`, `--help` и `help`;
4. чем абсолютный путь отличается от относительного;
5. что означают `/`, `~`, `.`, `..`;
6. чем `cp` отличается от `mv`;
7. почему `rm -r` требует особенно внимательно проверять путь;
8. чем `whoami`, `tty` и `who` отвечают на разные вопросы;
9. чем отличаются `>`, `>>` и `|`;
10. чем копия, hard link и symlink принципиально отличаются;
11. почему архив нужно не только создать, но и проверить восстановлением.

## Если команда не сработала

Вместо случайного повторения используйте короткий алгоритм диагностики:

1. Прочитайте **точный текст ошибки**.
2. Проверьте текущий каталог командой `pwd`.
3. Проверьте существование цели через `ls` или `ls -ld путь`.
4. Убедитесь в регистре букв: в обычной Linux-файловой системе `File.txt` и `file.txt` — разные имена.
5. Проверьте синтаксис в `man`, `--help` или `help`.
6. Только после этого изменяйте команду.

<details class="optional-work" markdown="1">
<summary>Дополнительно · короткие самостоятельные задачи</summary>

Эти задания не входят в обязательный отчёт.

1. Находясь в `/var`, перейдите в `/var/log` без слова `var` в команде, затем вернитесь обратно также без слова `var`.
2. Используя `man ls`, выясните, как работают `-t` и `-r`, и покажите список домашнего каталога от самого старого изменения к самому новому.
3. Создайте `~/NSA/LX1/sandbox/lesson`, перейдите туда, а затем вернитесь домой с помощью `~`.
4. Используйте `Ctrl+R`, чтобы найти одну из ранее выполненных команд без повторного набора.
5. Объясните, почему символическая ссылка перестала работать после удаления имени `files/src/user.txt`, а hard link продолжила работать.

</details>

## Материалы для повторения

- Исходная тема курса: [LX1 Основы командной строки](https://koroteev.site/os/1/1-cli/)
- Современное введение Ubuntu: [The Linux command line for beginners](https://ubuntu.com/desktop/docs/en/26.04/tutorial/the-linux-command-line-for-beginners/)
- Справочник GNU Bash: [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html)
- Справочник базовых файловых утилит: [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/)

<h2 id="quiz">Интерактивный тест</h2>

12 вопросов проверяют не запоминание команд, а понимание: **как прочитать команду, выбрать путь, найти справку, безопасно выполнить файловую операцию и интерпретировать результат**. После ошибки прочитайте объяснение и попробуйте снова.

{% include quiz.html quiz_id="lx1" %}

<h2 id="submit">Что сдавать преподавателю</h2>

<section class="teacher-send-roadmap" aria-label="Финальный маршрут сдачи LX1">
  <div class="teacher-send-head">
    <p class="eyebrow">Финальный маршрут сдачи</p>
    <h3>Пять действий перед отправкой преподавателю</h3>
  </div>
  <div class="teacher-send-grid">
    <article><span>01</span><strong>Проверьте, что материалы прочитаны</strong><small>Если какой-то шаг остался непонятным, вернитесь к нему до формирования отчёта.</small></article>
    <article><span>02</span><strong>Убедитесь, что заполнены поля LX1-01…LX1-04</strong><small>В полях должны быть короткие результаты сводных проверок.</small></article>
    <article><span>03</span><strong>Ответьте на короткие вопросы</strong><small>Используйте 2–4 предложения своими словами, без копирования учебного текста.</small></article>
    <article><span>04</span><strong>Завершите MCQ</strong><small>Итог теста автоматически войдёт в отчёт.</small></article>
    <article><span>05</span><strong>Скачайте DOCX и отправьте преподавателю</strong><small>Откройте готовый файл, быстро проверьте читаемость и отправьте его по правилам курса.</small></article>
  </div>
</section>

{% include submission.html lab="lx1" %}


<section class="field-guide" data-field-guide>
  <div class="field-guide-head"><span>Когда что-то идёт не по плану</span><h3>Если команда работает «не там»</h3></div>
  <div class="hint-ladder">
    <details><summary>Сначала</summary><p>Выполните pwd и сформулируйте полный путь к объекту, с которым хотите работать.</p></details><details><summary>Проверьте</summary><p>Сравните ls текущего каталога и родительского. Не исправляйте путь наугад.</p></details><details><summary>Если всё ещё неясно</summary><p>Используйте абсолютный путь один раз, затем объясните, почему относительный путь был неверным.</p></details>
  </div>
  <details class="diagnostic-moment">
    <summary>Быстрая диагностика: touch notes.txt создал файл, но вы его «не находите». Что проверить первым?</summary>
    <p>Текущий каталог через pwd и список файлов через ls.</p>
  </details>
</section>


{% include peer-moment.html lab="lx1" %}

<details class="lab-reflection"><summary>Одна мысль перед отчётом</summary><p>Как изменилась бы ваша диагностика ошибки файла, если бы вы не могли использовать `pwd`?</p><p class="lab-reflection-note">Ответьте себе или добавьте короткое наблюдение в отчёт, если это помогает показать ход вашей работы.</p></details>

<section class="completion-summary" data-completion-summary aria-live="polite"></section>

<section class="finish-line"><span>Финишная проверка</span><p>Вы не просто выполнили команды: вы показали, где работаете, как движутся данные и чем отличаются ссылки.</p></section>

<div class="report-review-strip" data-report-review aria-live="polite"><strong>Перед отчётом</strong><span>По мере выполнения здесь появится быстрая проверка ваших записей.</span></div>


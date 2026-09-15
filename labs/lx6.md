---
layout: default
lab_id: lx6
title: LX6 — Управление файловыми системами в Linux
---

# LX6 — Управление файловыми системами в Linux

Разберите путь **файл-образ → loop-устройство → ext4 → точка монтирования**, научитесь читать карту хранилища через `lsblk`/`findmnt`, безопасно проверять `fstab` и понимать, чем локальная файловая система отличается от сетевой.

<p class="meta-line">Подготовка: 5 минут · Практика: 70–90 минут · Среда: учебная Linux Mint VM · Результат: безопасно созданная и проверенная ext4-файловая система внутри image-файла, без изменения реального диска VM</p>

{% include lab-start.html lab="lx6" %}

## Зачем это нужно

Программа почти всегда работает с файлами, а сервер — с несколькими типами хранилищ. Администратору важно различать:

- **блочное устройство** — интерфейс к хранилищу, например `/dev/sda` или `/dev/loop3`;
- **раздел** — область физического/виртуального диска, например `/dev/sda2`;
- **файловую систему** — структуру данных, которая организует файлы и каталоги, например ext4;
- **точку монтирования** — каталог, через который файловая система становится частью общего дерева Linux;
- **сетевую файловую систему** — тот же принцип монтирования, но данные предоставляет удалённый сервер.

В исходной теме есть примеры `dd` с реальными дисками. Они полезны для понимания мощности инструмента, но **не подходят как обязательный учебный эксперимент**: перепутанный `of=/dev/sdX` может уничтожить данные. Поэтому в LX6 все опасные операции выполняются только над **файлом-образом** и созданным из него loop-устройством.

## Что вы изучите

После LX6 вы сможете:

- прочитать карту block devices и mounted filesystems через `lsblk`, `findmnt` и `df`;
- объяснить разницу между `df` и `du`;
- безопасно использовать `dd` только для обычного файла в учебной папке;
- создать sparse image через `truncate` и связать его с loop-устройством;
- проверить backing file loop-устройства **до** `mkfs`;
- создать ext4, прочитать `UUID`/`LABEL` и объяснить их назначение;
- смонтировать и размонтировать файловую систему и увидеть, что mount скрывает содержимое каталога-точки монтирования, но не удаляет его;
- проверить сохранность файла после `umount` и повторного `mount`;
- проверить отдельный учебный `fstab` без редактирования `/etc/fstab`;
- объяснить назначение NFS и формат источника `server:/export`.

<div class="callout safe-note" markdown="1">
<strong>Главное правило безопасности LX6.</strong> В обязательных шагах <strong>никогда</strong> не выполняйте <code>mkfs</code>, <code>dd of=</code>, <code>wipefs</code>, <code>fdisk</code>, <code>parted</code> или <code>mount</code> для <code>/dev/sda</code>, <code>/dev/sdb</code>, NVMe-дисков или других реальных устройств. Форматируем только <code>/dev/loopN</code>, который перед этим проверили и связали с <code>~/NSA/LX6/lx6-ext4.img</code>.
</div>

## Модель без лишней теории

```text
обычный файл lx6-ext4.img
        ↓ losetup
/dev/loopN  (виртуальное блочное устройство)
        ↓ mkfs.ext4
ext4 + UUID + LABEL
        ↓ mount
~/NSA/LX6/mnt
        ↓
файлы доступны в общем дереве каталогов Linux
```

Сетевой вариант выглядит похоже с точки зрения пользователя:

```text
NFS server:/export
        ↓ mount
/mnt/share
        ↓
удалённые файлы видны как часть дерева Linux
```

<span id="storage-map"></span>

## Часть 1. Прочитайте карту хранилища своей VM

<p class="stage-goal"><strong>Готово, когда:</strong> Вы нашли источник и тип корневой файловой системы, увидели block devices, сравнили <code>df</code> и <code>du</code> и просмотрели рабочие строки <code>/etc/fstab</code> только для чтения.</p>

Создайте папку и соберите короткую сводку:

```bash
mkdir -p ~/NSA/LX6
{
  printf 'ROOT_SOURCE='; findmnt -n -o SOURCE --target /
  printf 'ROOT_FSTYPE='; findmnt -n -o FSTYPE --target /
  printf 'ROOT_OPTIONS='; findmnt -n -o OPTIONS --target /
  printf 'LABS_DU='; du -sh ~/NSA 2>/dev/null | awk '{print $1}'
  printf 'LABS_DF='; df -hT ~/NSA | tail -n 1
  free -h | sed -n '1,3p'
} | tee ~/NSA/LX6/storage-summary.txt

lsblk --output NAME,TYPE,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINTS
findmnt --target / --output SOURCE,FSTYPE,OPTIONS,TARGET
```

Посмотрите активные строки `fstab`, **ничего не редактируя**:

```bash
grep -Ev '^[[:space:]]*(#|$)' /etc/fstab || true
```

`df` отвечает на вопрос «сколько места доступно в файловой системе, где находится путь», а `du` оценивает место, занятое конкретным деревом файлов. Поэтому их числа не обязаны совпадать.

<details class="optional-work">
<summary>Короткое знакомство с dd — безопасно, только в обычный файл</summary>

Следующая команда пишет 8 MiB нулей **только** в файл внутри `~/NSA/LX6`:

```bash
dd if=/dev/zero of=~/NSA/LX6/dd-sample.bin bs=1M count=8 status=progress
ls -lh ~/NSA/LX6/dd-sample.bin
du -h ~/NSA/LX6/dd-sample.bin
```

`if=` — источник, `of=` — назначение. Именно поэтому ошибка в `of=` особенно опасна. В этой лабораторной `of=/dev/sdX` запрещён.

</details>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX6-01"><strong>В отчёт · LX6-01.</strong> Вставьте <code>cat ~/NSA/LX6/storage-summary.txt</code>, одну строку <code>findmnt</code> для <code>/</code> и 5–10 строк <code>lsblk</code>. Полный список mount points не нужен.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX6-01">
  <label for="evidence-LX6-01">Поле для результата · LX6-01</label>
  <p class="evidence-editor-help" data-evidence-help>Главное — ROOT_SOURCE, ROOT_FSTYPE, сравнение df/du и понятная часть карты block devices.</p>
  <textarea id="evidence-LX6-01" rows="8" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX6-01" placeholder="Вставьте сюда короткую карту хранилища…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="loop-image"></span>

## Часть 2. Создайте безопасный image и loop-устройство

<p class="stage-goal"><strong>Готово, когда:</strong> Создан файл <code>lx6-ext4.img</code>, он связан с <code>/dev/loopN</code>, а проверка показывает, что backing file — именно ваш image. После этого на loop-устройстве создан ext4 с UUID и LABEL.</p>

Сначала задайте пути и очистите **только следы предыдущей попытки LX6**, если они остались:

```bash
IMG="$HOME/NSA/LX6/lx6-ext4.img"
MNT="$HOME/NSA/LX6/mnt"
mkdir -p "$MNT"

sudo umount "$MNT" 2>/dev/null || true
for dev in $(sudo losetup -j "$IMG" --noheadings --output NAME 2>/dev/null); do
  case "$dev" in
    /dev/loop[0-9]*) sudo losetup --detach "$dev" ;;
  esac
done
rm -f "$IMG" "$HOME/NSA/LX6/loopdev.txt"
printf 'UNDERLAY: этот файл лежит в обычном каталоге\n' > "$MNT/underlay.txt"
```

Создайте **sparse** image размером 96 MiB. `truncate` задаёт логический размер без необходимости сразу записывать 96 MiB нулей:

```bash
truncate -s 96M "$IMG"
printf 'IMAGE_LOGICAL_BYTES=%s\n' "$(stat -c %s "$IMG")"
printf 'IMAGE_ALLOCATED=%s\n' "$(du -h "$IMG" | awk '{print $1}')"
```

Свяжите файл с первым свободным loop-устройством:

```bash
LOOPDEV=$(sudo losetup --find --show --nooverlap "$IMG")
printf '%s\n' "$LOOPDEV" > "$HOME/NSA/LX6/loopdev.txt"
BACK=$(sudo losetup --list --noheadings --raw --output BACK-FILE "$LOOPDEV")

case "$LOOPDEV" in
  /dev/loop[0-9]*) ;;
  *) echo "Остановитесь: получено неожиданное устройство $LOOPDEV"; exit 1 ;;
esac

if [ "$(readlink -f "$BACK")" != "$(readlink -f "$IMG")" ]; then
  echo 'Остановитесь: loop-устройство связано не с image LX6.'
  exit 1
fi

printf 'LOOPDEV=%s\nBACK_FILE=%s\nLOOP_BACKING_CHECK=OK\n' "$LOOPDEV" "$BACK" \
  | tee ~/NSA/LX6/loop-summary.txt
sudo losetup --list --output NAME,SIZELIMIT,BACK-FILE "$LOOPDEV"
```

<div class="callout safe-note" markdown="1">
<strong>Проверка перед mkfs.</strong> Продолжайте только если вы видите <code>/dev/loopN</code>, <code>LOOP_BACKING_CHECK=OK</code> и путь к <code>~/NSA/LX6/lx6-ext4.img</code>. Если видите <code>/dev/sda</code>, <code>/dev/nvme...</code> или другой диск — <strong>не выполняйте mkfs</strong> и позовите преподавателя.
</div>

Теперь создайте ext4 **только на проверенном loop-устройстве**:

```bash
sudo mkfs.ext4 -L LX6LAB "$LOOPDEV"
UUID=$(sudo blkid -s UUID -o value "$LOOPDEV")
FSTYPE=$(sudo blkid -s TYPE -o value "$LOOPDEV")
printf 'FSTYPE=%s\nLABEL=LX6LAB\nUUID=%s\n' "$FSTYPE" "$UUID" \
  | tee -a ~/NSA/LX6/loop-summary.txt
sudo blkid "$LOOPDEV"
```

<p class="lab-tip"><strong>Почему UUID важен?</strong> Имя вроде <code>/dev/sdb1</code> зависит от порядка обнаружения устройств и может измениться. Для постоянных записей в <code>fstab</code> обычно надёжнее использовать UUID или LABEL.</p>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX6-02"><strong>В отчёт · LX6-02.</strong> Вставьте <code>cat ~/NSA/LX6/loop-summary.txt</code> и одну строку <code>blkid</code>. Должны быть видны loop device, backing file, ext4, LABEL и UUID.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX6-02">
  <label for="evidence-LX6-02">Поле для результата · LX6-02</label>
  <p class="evidence-editor-help" data-evidence-help>Покажите, что mkfs выполнялся только на loop-устройстве, связанном с image LX6.</p>
  <textarea id="evidence-LX6-02" rows="8" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX6-02" placeholder="Вставьте сюда loop mapping и метаданные ext4…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="mount-persist"></span>

## Часть 3. Смонтируйте, размонтируйте и проверьте сохранность данных

<p class="stage-goal"><strong>Готово, когда:</strong> Вы увидели ext4 через <code>findmnt</code>, поняли, почему <code>underlay.txt</code> временно скрывается, и подтвердили, что файл внутри ext4 сохранился после <code>umount</code> и повторного <code>mount</code>.</p>

Восстановите переменные, если открыли новый терминал:

```bash
IMG="$HOME/NSA/LX6/lx6-ext4.img"
MNT="$HOME/NSA/LX6/mnt"
LOOPDEV=$(cat "$HOME/NSA/LX6/loopdev.txt")
```

Смонтируйте ext4 и проверьте точку монтирования:

```bash
sudo mount "$LOOPDEV" "$MNT"
sudo chown "$(id -u):$(id -g)" "$MNT"

{
  findmnt --mountpoint "$MNT" --output SOURCE,FSTYPE,OPTIONS,TARGET
  if [ ! -e "$MNT/underlay.txt" ]; then
    echo 'UNDERLAY_HIDDEN_WHILE_MOUNTED=YES'
  fi
  printf 'created by %s on LX6\n' "$(id -un)" > "$MNT/persistent.txt"
  printf 'PERSISTENT_FILE='; cat "$MNT/persistent.txt"
  df -hT "$MNT" | tail -n 1
  du -sh "$MNT"
} | tee ~/NSA/LX6/mount-check.txt
```

`underlay.txt` не удалён. Пока ext4 смонтирована на `MNT`, pathname этого каталога показывает **корень новой файловой системы**, поэтому прежнее содержимое каталога временно невидимо.

Теперь размонтируйте и проверьте обе стороны эксперимента:

```bash
sudo umount "$MNT"
if [ -f "$MNT/underlay.txt" ]; then
  echo 'UNDERLAY_VISIBLE_AFTER_UMOUNT=YES' | tee -a ~/NSA/LX6/mount-check.txt
fi

sudo mount "$LOOPDEV" "$MNT"
if [ -f "$MNT/persistent.txt" ]; then
  echo 'PERSIST_AFTER_REMOUNT=YES' | tee -a ~/NSA/LX6/mount-check.txt
  cat "$MNT/persistent.txt" | tee -a ~/NSA/LX6/mount-check.txt
fi
```

<div class="callout checkpoint" markdown="1">
<strong>Ключевая идея.</strong> <code>umount</code> не форматирует файловую систему и не удаляет её данные. Он отсоединяет её от выбранной точки в дереве каталогов. После повторного mount файл <code>persistent.txt</code> снова виден.
</div>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX6-03"><strong>В отчёт · LX6-03.</strong> Вставьте <code>cat ~/NSA/LX6/mount-check.txt</code>. Особенно важны FSTYPE=ext4 в findmnt, <code>UNDERLAY_HIDDEN...</code>, <code>UNDERLAY_VISIBLE...</code> и <code>PERSIST_AFTER_REMOUNT=YES</code>.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX6-03">
  <label for="evidence-LX6-03">Поле для результата · LX6-03</label>
  <p class="evidence-editor-help" data-evidence-help>Это доказательство показывает смысл mount/umount и сохранность данных, а не просто факт выполнения команды.</p>
  <textarea id="evidence-LX6-03" rows="9" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX6-03" placeholder="Вставьте сюда mount-check.txt…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="fstab-safe"></span>

## Часть 4. Проверьте fstab без изменения системного `/etc/fstab`

<p class="stage-goal"><strong>Готово, когда:</strong> Вы создали отдельный учебный fstab с UUID, проверили его через <code>findmnt --verify</code>, смонтировали по этой таблице и увидели ожидаемый отказ записи при read-only remount.</p>

В реальной системе `/etc/fstab` управляет известными файловыми системами и mount options. Ошибка там может мешать загрузке. Поэтому сначала тренируемся на **отдельном файле**:

```bash
IMG="$HOME/NSA/LX6/lx6-ext4.img"
MNT="$HOME/NSA/LX6/mnt"
LOOPDEV=$(cat "$HOME/NSA/LX6/loopdev.txt")
UUID=$(sudo blkid -s UUID -o value "$LOOPDEV")
LAB_FSTAB="$HOME/NSA/LX6/fstab.lab"

printf 'UUID=%s %s ext4 defaults,nofail 0 2\n' "$UUID" "$MNT" > "$LAB_FSTAB"
cat "$LAB_FSTAB"
findmnt --verify --tab-file "$LAB_FSTAB" && echo 'FSTAB_VERIFY=OK'
```

Теперь примените **только этот альтернативный fstab**, не изменяя `/etc/fstab`:

```bash
sudo umount "$MNT" 2>/dev/null || true
sudo mount --all --fstab "$LAB_FSTAB"
{
  echo 'MOUNT_FROM_ALT_FSTAB=OK'
  findmnt --mountpoint "$MNT" --output SOURCE,FSTYPE,OPTIONS,TARGET
} | tee ~/NSA/LX6/fstab-check.txt
```

Проверьте read-only mount как управляемый эксперимент:

```bash
sudo mount -o remount,ro "$MNT"
if touch "$MNT/should-not-write" 2>~/NSA/LX6/ro-error.txt; then
  echo 'READONLY_WRITE_BLOCKED=NO' | tee -a ~/NSA/LX6/fstab-check.txt
  rm -f "$MNT/should-not-write"
else
  echo 'READONLY_WRITE_BLOCKED=YES' | tee -a ~/NSA/LX6/fstab-check.txt
  sed -n '1,2p' ~/NSA/LX6/ro-error.txt | tee -a ~/NSA/LX6/fstab-check.txt
fi
sudo mount -o remount,rw "$MNT"
```

<div class="callout checkpoint" markdown="1">
<strong>Почему ожидаемая ошибка полезна?</strong> Здесь ошибка записи — доказательство того, что опция <code>ro</code> действительно действует. В системном администрировании корректно ожидаемый отказ часто является успешным тестом политики.
</div>

<p class="evidence-note" data-evidence-kind="text" data-evidence-id="LX6-04"><strong>В отчёт · LX6-04.</strong> Вставьте одну строку вашего <code>fstab.lab</code>, <code>FSTAB_VERIFY=OK</code> и <code>cat ~/NSA/LX6/fstab-check.txt</code>. Пароли или network credentials в fstab не используйте.</p>
<div class="evidence-editor evidence-editor-static" data-evidence-editor="LX6-04">
  <label for="evidence-LX6-04">Поле для результата · LX6-04</label>
  <p class="evidence-editor-help" data-evidence-help>Покажите UUID-based запись, успешный verify, mount через альтернативную таблицу и read-only проверку.</p>
  <textarea id="evidence-LX6-04" rows="9" maxlength="6000" spellcheck="false" autocomplete="off" autocapitalize="off" data-evidence-id="LX6-04" placeholder="Вставьте сюда безопасную проверку fstab…"></textarea>
  <div class="evidence-editor-meta"><span data-evidence-count>0 / 6000</span><span class="evidence-local-badge">Только в этой вкладке</span></div>
  <div class="evidence-editor-actions"><button type="button" data-evidence-copy>Копировать</button><button type="button" class="secondary-action" data-evidence-clear>Очистить</button><span class="evidence-editor-status" data-evidence-status aria-live="polite"></span></div>
</div>

<span id="network-cleanup"></span>

## Часть 5. Свяжите локальные и сетевые файловые системы, затем очистите стенд

<p class="stage-goal"><strong>Готово, когда:</strong> Вы можете объяснить формат NFS-источника, убедились, что локальный loop-стенд аккуратно размонтирован и отсоединён, а MCQ пройдена.</p>

### Сетевая файловая система — тот же mount point, другой источник

NFS позволяет клиенту подключить каталог, экспортированный сервером. Типичная форма источника:

```text
server:/export/path   /mnt/share   nfs   defaults,_netdev   0 0
```

- `server:/export/path` — удалённый источник;
- `/mnt/share` — локальная точка монтирования;
- `nfs` — тип файловой системы;
- `_netdev` сообщает инструментам монтирования, что ресурс зависит от сети.

Посмотрите, есть ли уже network filesystems в вашей VM:

```bash
findmnt -t nfs,nfs4,cifs,fuse.sshfs --output SOURCE,FSTYPE,TARGET 2>/dev/null || true
```

Если вывод пуст, это нормально. В этой лабораторной мы **не разворачиваем NFS-сервер**: это потребовало бы дополнительных пакетов, сетевой политики и экспорта каталогов, а главный навык LX6 — безопасно понять filesystem/mount model. Позже сетевую часть можно объединить с LX9, где сеть уже диагностируется осознанно.

### Очистите только учебный loop-стенд

```bash
IMG="$HOME/NSA/LX6/lx6-ext4.img"
MNT="$HOME/NSA/LX6/mnt"
LOOPDEV=$(cat "$HOME/NSA/LX6/loopdev.txt" 2>/dev/null || true)

sudo umount "$MNT" 2>/dev/null || true
case "$LOOPDEV" in
  /dev/loop[0-9]*) sudo losetup --detach "$LOOPDEV" 2>/dev/null || true ;;
  '') ;;
  *) echo "Неожиданное значение LOOPDEV=$LOOPDEV — ничего не отсоединяем" ;;
esac

if sudo losetup -j "$IMG" 2>/dev/null | grep -q .; then
  echo 'LX6_CLEANUP=CHECK'
else
  echo 'LX6_CLEANUP=OK'
fi

rm -f "$IMG" "$HOME/NSA/LX6/loopdev.txt" "$HOME/NSA/LX6/fstab.lab"
rm -f "$MNT/underlay.txt" 2>/dev/null || true
rmdir "$MNT" 2>/dev/null || true
```

Оставьте текстовые файлы `storage-summary.txt`, `loop-summary.txt`, `mount-check.txt` и `fstab-check.txt` до формирования отчёта.

<div class="callout checkpoint" markdown="1">
<strong>Что вы сделали как администратор.</strong> Вы не трогали настоящий диск VM. Вы сначала наблюдали систему, затем создали контролируемое виртуальное block device, проверили его идентичность, сформировали ext4, исследовали mount semantics, проверили UUID-based fstab и вернули систему в чистое состояние.
</div>

## Частые ошибки

- Путают `df` и `du`. `df` описывает filesystem-level capacity, `du` — использование конкретного дерева файлов.
- Думают, что mount «переносит файлы в каталог». На самом деле он прикрепляет файловую систему к namespace в выбранной точке.
- После `umount` считают данные удалёнными. Они остаются в файловой системе и снова видны после mount.
- Используют `/dev/sdb1` в постоянной конфигурации, хотя порядок имён устройств может измениться. Обычно лучше UUID/LABEL.
- Выполняют `mkfs` до проверки устройства. В LX6 перед форматированием обязательны `/dev/loopN` + совпадающий backing file.
- Копируют опасные примеры `dd of=/dev/sdX`. В учебной работе `dd` пишет только в обычный файл.
- Редактируют `/etc/fstab` без проверки. Сначала используйте отдельный файл и `findmnt --verify --tab-file`.
- Думают, что NFS — «копирование каталога». NFS предоставляет удалённую файловую систему, которая монтируется в локальное дерево.

## Что важно понять перед тестом

1. Block device, partition, filesystem и mount point — разные уровни.
2. Loop device позволяет безопасно обращаться с обычным image-файлом как с блочным устройством.
3. `mkfs` создаёт файловую систему; поэтому неверно выбранное устройство может привести к потере данных.
4. `mount` делает файловую систему доступной в точке дерева и временно скрывает прежнее содержимое mount point.
5. `umount` отсоединяет файловую систему, но не стирает её данные.
6. UUID/LABEL обычно устойчивее device names для `fstab`.
7. `findmnt` удобнее для точного поиска mounted filesystems; в scripts лучше явно задавать ожидаемые columns.
8. Сетевая файловая система использует ту же модель mount point, но источник находится на другом узле.

<h2 id="quiz">Интерактивный тест</h2>

12 коротких вопросов проверяют решения именно этой лабораторной. Если вариант не подошёл, прочитайте объяснение и попробуйте другой. Повторные попытки помогают закрепить тему и не уменьшают комплектность.

{% include quiz.html quiz_id="lx6" %}

<h2 id="submit">Что сдавать преподавателю</h2>

{% include submission.html lab="lx6" %}

## Проверенные источники

- Исходная структура LX6: <https://koroteev.site/os/2/2-filesystems/>
- `lsblk(8)`: <https://man7.org/linux/man-pages/man8/lsblk.8.html>
- `findmnt(8)`: <https://man7.org/linux/man-pages/man8/findmnt.8.html>
- `mount(8)`: <https://man7.org/linux/man-pages/man8/mount.8.html>
- `umount(8)`: <https://man7.org/linux/man-pages/man8/umount.8.html>
- `losetup(8)`: <https://man7.org/linux/man-pages/man8/losetup.8.html>
- loop devices: <https://man7.org/linux/man-pages/man4/loop.4.html>
- `fstab(5)`: <https://man7.org/linux/man-pages/man5/fstab.5.html>
- `mke2fs(8)` / ext4 creation: <https://man7.org/linux/man-pages/man8/mke2fs.8.html>
- NFS client model: <https://man7.org/linux/man-pages/man5/nfs.5.html>

<p class="next-lab-link"><a href="{{ '/labs/lx7.html' | relative_url }}">Следующая лабораторная: LX7 · Основы скриптов на Bash →</a></p>

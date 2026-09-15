(function () {
  'use strict';

  const NS = 'nsa-report:';
  const COMPLETENESS_NS = 'nsa-submission-completeness:v1:';
  const MAX_TEXT = 6000;

  function qs(root, sel) { return root.querySelector(sel); }
  function qsa(root, sel) { return Array.from(root.querySelectorAll(sel)); }
  function safeGet(key) { try { return sessionStorage.getItem(key) || ''; } catch (e) { return ''; } }
  function safeSet(key, val) { try { sessionStorage.setItem(key, val); } catch (e) {} }
  function safeLocalGet(key) { try { return localStorage.getItem(key) || ''; } catch (e) { return ''; } }
  function safeLocalSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { return false; } }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function cleanFilename(s) {
    return String(s || '').trim().replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'student';
  }
  function looksSensitive(value) {
    const text = String(value || '');
    return /BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY/i.test(text) ||
      /(?:api[_-]?key|token|secret|password)\s*[:=]\s*[^\s]{8,}/i.test(text) ||
      /^\S+:\$[156y]\$[^:]+:/m.test(text);
  }


  const EVIDENCE_RULES = {
    'LX0-02': {minChars: 80, minLines: 5, minUnique: 10, groups: [
      {re: /Linux Mint|PRETTY_NAME=.*Mint/i, hint: 'Linux Mint / PRETTY_NAME'},
      {re: /\b\d+\.\d+(?:\.\d+)?[-\w.]*\b/, hint: 'версия ядра'},
      {re: /\b(?:lo|enp\w*|ens\w*|eth\w*|wlp\w*)\b/i, hint: 'сетевой интерфейс'}
    ]},
    'LX1-01': {minChars: 60, minLines: 5, minUnique: 6, groups: [
      {re: /(?:\/home\/|~\/|labs\/lx1)/i, hint: 'путь к labs/lx1'},
      {re: /about-me\.txt/i, hint: 'about-me.txt'},
      {re: /created by/i, hint: 'содержимое created by …'}
    ]},
    'LX1-02': {minChars: 55, minLines: 3, minUnique: 6, groups: [
      {re: /\/dev\/(?:pts\/\d+|tty\d+)/i, hint: 'tty вида /dev/pts/N'},
      {re: /^[^:\n]+:x:\d+:\d+:[^:]*:[^:]+:[^:\n]+$/m, hint: 'строка пользователя из /etc/passwd'}
    ]},
    'LX1-03': {minChars: 70, minLines: 4, minUnique: 7, groups: [
      {re: /^[^:\n]+:x:\d+:\d+:/m, hint: 'строка из /etc/passwd'},
      {re: /second snapshot/i, hint: 'строка second snapshot'},
      {re: /\.txt\b/i, hint: 'пути к .txt-файлам'}
    ]},
    'LX1-04': {minChars: 110, minLines: 6, minUnique: 12, groups: [
      {re: /user-hard\.txt/i, hint: 'user-hard.txt'},
      {re: /user-soft\.txt/i, hint: 'user-soft.txt'},
      {re: /(No such file|Нет такого файла|не существует|cannot.*user-soft|failed.*user-soft)/i, hint: 'ожидаемая ошибка для битой symbolic link'},
      {re: /src\/user\.txt/i, hint: 'src/user.txt внутри архива'},
      {re: /user file/i, hint: 'содержимое восстановленного user.txt'}
    ], custom: 'hardlink'},
    'LX2-01': {minChars: 45, minLines: 3, minUnique: 8, groups: [
      {re: /\bactive\b/i, hint: 'active для службы ssh'},
      {re: /\blo\b/i, hint: 'интерфейс lo из ip -br a'},
      {re: /(NAT|Bridged|bridge|мост)/i, hint: 'выбранный режим сети'},
      {re: /\b(?:22|2222)\b/, hint: 'используемый порт'}
    ]},
    'LX2-02': {minChars: 100, minLines: 5, minUnique: 12, groups: [
      {re: /\bssh\b/i, hint: 'команда ssh'},
      {re: /\bscp\b/i, hint: 'команды scp'},
      {re: /SSH session:/i, hint: 'строка SSH session: user@host'},
      {re: /file from local host/i, hint: 'прочитанный файл с локального клиента'}
    ]},
    'LX2-03': {minChars: 65, minLines: 2, minUnique: 9, groups: [
      {re: /PreferredAuthentications=publickey/i, hint: 'PreferredAuthentications=publickey'},
      {re: /PasswordAuthentication=no/i, hint: 'PasswordAuthentication=no'},
      {re: /\bssh\b.*\bmint-lab\b/i, hint: 'проверочная команда ssh mint-lab'}
    ]},
    'LX2-04': {minChars: 35, minLines: 3, minUnique: 6, groups: [
      {re: /\blx2\b/i, hint: 'имя tmux-сеанса lx2'},
      {re: /\d+/, hint: 'PID панели'}
    ], custom: 'tmux'},
    'LX3-01': {minChars: 120, minLines: 6, minUnique: 12, groups: [
      {re: /\buser_1\b/i, hint: 'id user_1'},
      {re: /\buser_3\b/i, hint: 'id user_3'},
      {re: /\buser_5\b/i, hint: 'id user_5'},
      {re: /\bworkers:/i, hint: 'группа workers'},
      {re: /\bteachers:/i, hint: 'группа teachers'},
      {re: /\bstudents:/i, hint: 'группа students'}
    ]},
    'LX3-02': {minChars: 105, minLines: 5, minUnique: 12, groups: [
      {re: /\/labs\/library/i, hint: '/labs/library'},
      {re: /\/labs\/tests/i, hint: '/labs/tests'},
      {re: /\/labs\/list/i, hint: '/labs/list'},
      {re: /test_[a-z0-9._-]+/i, hint: 'имя вашего скрипта test_…'},
      {re: /[d-][rwx-]{9}/, hint: 'режимы rwx из ls -l'}
    ]},
    'LX3-03': {minChars: 80, minLines: 4, minUnique: 9, groups: [
      {re: /teacher-check/i, hint: 'teacher-check'},
      {re: /(Permission denied|Отказано в доступе)/i, hint: 'ожидаемый Permission denied'},
      {re: /Учебный скрипт запущен/i, hint: 'успешный запуск вашего test_…'}
    ], custom: 'permissions'},
    'LX3-04': {minChars: 80, minLines: 4, minUnique: 9, groups: [
      {re: /drwxrwxrwt/i, hint: 'режим 1777 со sticky bit'},
      {re: /(Permission denied|Отказано в доступе)/i, hint: 'отказ удаления чужого файла'},
      {re: /LAB_UMASK=0?027/i, hint: 'LAB_UMASK=0027'},
      {re: /-rw-r-----/, hint: '0640 для umask-file'},
      {re: /drwxr-x---/, hint: '0750 для umask-dir'}
    ]},
    'LX4-01': {minChars: 80, minLines: 5, minUnique: 10, groups: [
      {re: /OS=.*(?:Linux Mint|Mint)/i, hint: 'OS=Linux Mint …'},
      {re: /ARCH=/i, hint: 'ARCH=…'},
      {re: /INSTALLED_PACKAGES=\d+/i, hint: 'INSTALLED_PACKAGES=…'},
      {re: /HTOP_BEFORE=(?:installed|not-installed)/i, hint: 'HTOP_BEFORE=…'},
      {re: /Candidate:/i, hint: 'Candidate из apt-cache policy'}
    ]},
    'LX4-02': {minChars: 70, minLines: 4, minUnique: 8, groups: [
      {re: /STATUS=install ok installed/i, hint: 'STATUS=install ok installed'},
      {re: /VERSION=/i, hint: 'VERSION=…'},
      {re: /PATH=\/.*htop/i, hint: 'PATH к htop'},
      {re: /APT_CHECK=OK/i, hint: 'APT_CHECK=OK'}
    ]},
    'LX4-03': {minChars: 70, minLines: 5, minUnique: 9, groups: [
      {re: /LAB_PID=\d+/i, hint: 'LAB_PID=…'},
      {re: /^Name:\s*sleep/m, hint: 'Name: sleep'},
      {re: /^State:/m, hint: 'State: …'},
      {re: /^Pid:\s*\d+/m, hint: 'Pid: …'},
      {re: /^PPid:\s*\d+/m, hint: 'PPid: …'}
    ]},
    'LX4-04': {minChars: 90, minLines: 6, minUnique: 10, groups: [
      {re: /AFTER_STOP/i, hint: 'AFTER_STOP'},
      {re: /AFTER_CONT/i, hint: 'AFTER_CONT'},
      {re: /NICE_AFTER=15/i, hint: 'NICE_AFTER=15'},
      {re: /PID_\d+_FINISHED=YES/i, hint: 'PID_…_FINISHED=YES'}
    ]},
    'LX5-01': {minChars: 70, minLines: 5, minUnique: 9, groups: [
      {re: /PID1=systemd/i, hint: 'PID1=systemd'},
      {re: /DEFAULT_TARGET=.*target/i, hint: 'DEFAULT_TARGET=…target'},
      {re: /SYSTEM_STATE=/i, hint: 'SYSTEM_STATE=…'},
      {re: /Startup finished|target reached/i, hint: 'данные systemd-analyze'}
    ]},
    'LX5-02': {minChars: 80, minLines: 5, minUnique: 9, groups: [
      {re: /PYTHON_CHECK=OK/i, hint: 'PYTHON_CHECK=OK'},
      {re: /LX5_START\s+pid=\d+/i, hint: 'LX5_START pid=…'},
      {re: /LX5_HEARTBEAT\s+count=/i, hint: 'LX5_HEARTBEAT'},
      {re: /LX5_STOP\s+signal=/i, hint: 'LX5_STOP'},
      {re: /LX5_EXIT\s+clean/i, hint: 'LX5_EXIT clean'}
    ]},
    'LX5-03': {minChars: 150, minLines: 10, minUnique: 15, groups: [
      {re: /UNIT_VERIFY=OK/i, hint: 'UNIT_VERIFY=OK'},
      {re: /\[Service\]/i, hint: '[Service]'},
      {re: /Type=exec/i, hint: 'Type=exec'},
      {re: /User=\S+/i, hint: 'User=ваш_пользователь'},
      {re: /ExecStart=\/usr\/bin\/python3/i, hint: 'ExecStart=/usr/bin/python3 …'},
      {re: /WantedBy=multi-user\.target/i, hint: 'WantedBy=multi-user.target'}
    ]},
    'LX5-04': {minChars: 120, minLines: 8, minUnique: 12, groups: [
      {re: /BEFORE_ENABLED=disabled/i, hint: 'BEFORE_ENABLED=disabled'},
      {re: /AFTER_ENABLE_ENABLED=enabled/i, hint: 'AFTER_ENABLE_ENABLED=enabled'},
      {re: /ACTIVE_AFTER_ENABLE=inactive/i, hint: 'ACTIVE_AFTER_ENABLE=inactive'},
      {re: /AFTER_START_ACTIVE=active/i, hint: 'AFTER_START_ACTIVE=active'},
      {re: /MAINPID_BEFORE_RESTART=\d+/i, hint: 'MAINPID_BEFORE_RESTART=…'},
      {re: /MAINPID_AFTER_RESTART=\d+/i, hint: 'MAINPID_AFTER_RESTART=…'},
      {re: /RESTART_PID_CHANGED=(?:YES|CHECK)/i, hint: 'RESTART_PID_CHANGED=…'},
      {re: /LX5_HEARTBEAT/i, hint: 'строки LX5_HEARTBEAT из journal'}
    ]},
    'LX6-01': {minChars: 90, minLines: 6, minUnique: 10, groups: [
      {re: /ROOT_SOURCE=/i, hint: 'ROOT_SOURCE=…'},
      {re: /ROOT_FSTYPE=\S+/i, hint: 'ROOT_FSTYPE=…'},
      {re: /LABS_DU=/i, hint: 'LABS_DU=…'},
      {re: /LABS_DF=/i, hint: 'LABS_DF=…'},
      {re: /(?:disk|part|lvm|crypt|loop)/i, hint: 'несколько строк карты lsblk'}
    ]},
    'LX6-02': {minChars: 100, minLines: 6, minUnique: 11, groups: [
      {re: /LOOPDEV=\/dev\/loop\d+/i, hint: 'LOOPDEV=/dev/loopN'},
      {re: /BACK_FILE=.*lx6-ext4\.img/i, hint: 'BACK_FILE=…lx6-ext4.img'},
      {re: /LOOP_BACKING_CHECK=OK/i, hint: 'LOOP_BACKING_CHECK=OK'},
      {re: /FSTYPE=ext4/i, hint: 'FSTYPE=ext4'},
      {re: /LABEL=LX6LAB/i, hint: 'LABEL=LX6LAB'},
      {re: /UUID=[0-9a-f-]{16,}/i, hint: 'UUID=…'}
    ]},
    'LX6-03': {minChars: 110, minLines: 7, minUnique: 11, groups: [
      {re: /ext4/i, hint: 'ext4 в findmnt'},
      {re: /UNDERLAY_HIDDEN_WHILE_MOUNTED=YES/i, hint: 'UNDERLAY_HIDDEN_WHILE_MOUNTED=YES'},
      {re: /UNDERLAY_VISIBLE_AFTER_UMOUNT=YES/i, hint: 'UNDERLAY_VISIBLE_AFTER_UMOUNT=YES'},
      {re: /PERSIST_AFTER_REMOUNT=YES/i, hint: 'PERSIST_AFTER_REMOUNT=YES'},
      {re: /created by/i, hint: 'содержимое persistent.txt'}
    ]},
    'LX6-04': {minChars: 100, minLines: 6, minUnique: 10, groups: [
      {re: /UUID=[0-9a-f-]{16,}\s+\S+\s+ext4/i, hint: 'UUID-based строка fstab.lab'},
      {re: /FSTAB_VERIFY=OK/i, hint: 'FSTAB_VERIFY=OK'},
      {re: /MOUNT_FROM_ALT_FSTAB=OK/i, hint: 'MOUNT_FROM_ALT_FSTAB=OK'},
      {re: /READONLY_WRITE_BLOCKED=YES/i, hint: 'READONLY_WRITE_BLOCKED=YES'}
    ]},
    'LX7-01': {minChars: 90, minLines: 5, minUnique: 10, groups: [
      {re: /BASH_VERSION=/i, hint: 'BASH_VERSION=…'},
      {re: /SYNTAX_CHECK=OK/i, hint: 'SYNTAX_CHECK=OK'},
      {re: /SCRIPT_PATH=.*hello\.sh/i, hint: 'SCRIPT_PATH=…hello.sh'},
      {re: /Hello,/i, hint: 'приветствие с вашим именем'},
      {re: /USER=/i, hint: 'USER=…'},
      {re: /HOST=/i, hint: 'HOST=…'}
    ]},
    'LX7-02': {minChars: 100, minLines: 7, minUnique: 12, groups: [
      {re: /SYNTAX_CHECK=OK/i, hint: 'SYNTAX_CHECK=OK'},
      {re: /MODE=summary/i, hint: 'MODE=summary'},
      {re: /USER=/i, hint: 'USER=…'},
      {re: /HOST=/i, hint: 'HOST=…'},
      {re: /KERNEL=/i, hint: 'KERNEL=…'},
      {re: /INVALID_EXIT=2/i, hint: 'INVALID_EXIT=2'}
    ]},
    'LX7-03': {minChars: 100, minLines: 5, minUnique: 9, groups: [
      {re: /SHA256=[0-9a-f]{64}/i, hint: 'SHA256=64-hex'},
      {re: /BASELINE_CHECK=OK/i, hint: 'BASELINE_CHECK=OK'},
      {re: /AFTER_CHANGE=CHANGED/i, hint: 'AFTER_CHANGE=CHANGED'},
      {re: /AFTER_RESTORE=OK/i, hint: 'AFTER_RESTORE=OK'}
    ]},
    'LX7-04': {minChars: 110, minLines: 6, minUnique: 11, groups: [
      {re: /CRON_SERVICE=active/i, hint: 'CRON_SERVICE=active'},
      {re: /NSA-LX7-BEGIN/i, hint: 'NSA-LX7-BEGIN'},
      {re: /LX7_CRON\s+time=/i, hint: 'строка LX7_CRON time=…'},
      {re: /CRON_RUN_OBSERVED=YES/i, hint: 'CRON_RUN_OBSERVED=YES'},
      {re: /CRON_CLEANUP=OK/i, hint: 'CRON_CLEANUP=OK'}
    ]}
  };

  function textTokens(value) {
    return String(value || '').toLowerCase().match(/[\p{L}\p{N}_./@:-]{2,}/gu) || [];
  }

  function qualityCheck(value, rule) {
    const text = String(value || '').trim();
    if (!text) return {state: 'missing', label: 'Можно добавить', reason: 'Когда шаг будет готов, вставьте сюда основной результат.'};
    if (looksSensitive(text)) return {state: 'fix', label: 'Небольшая проверка безопасности', reason: 'Похоже, в поле есть пароль, токен, закрытый ключ или защищённый хеш. Удалите чувствительные данные и оставьте только учебный результат.'};
    if (/^(?:asdf|qwerty|test|testing|random|тест|текст|ответ|готово|123|abc|[\s.,;:_-])+$/i.test(text)) {
      return {state: 'fix', label: 'Добавьте результат шага', reason: 'Похоже на заполнитель, а не результат лабораторной. Такие записи преподаватель может не принять. Вернитесь к шагу и вставьте фактический вывод или наблюдаемый результат — это не штраф, а возможность завершить работу содержательно.'};
    }
    const lines = text.split(/\n/).filter(function (x) { return x.trim(); });
    const tokens = textTokens(text);
    const unique = new Set(tokens);
    if (text.length < 12 || tokens.length < 2) return {state: 'fix', label: 'Добавьте ещё одну строку', reason: 'Сохраните хотя бы основную строку результата этого шага; длинный вывод не нужен.'};

    const hints = [];
    if (text.length < (rule.minChars || 40)) hints.push('можно добавить ещё 1–2 строки вывода');
    if (lines.length < (rule.minLines || 2)) hints.push('можно добавить несколько строк результата');
    if (unique.size < (rule.minUnique || 6)) hints.push('сверьте, что вставлен именно вывод команды');
    const missed = (rule.groups || []).filter(function (g) { return !g.re.test(text); });
    if (missed.length) hints.push('можно сверить наличие: ' + missed.slice(0, 3).map(function (g) { return g.hint; }).join(', ') + (missed.length > 3 ? '…' : ''));

    if (hints.length) {
      return {state: 'review', label: 'Результат сохранён', reason: 'Хорошо — результат уже учитывается. Для самопроверки можно ещё посмотреть: ' + hints.slice(0, 2).join('; ') + '.'};
    }
    return {state: 'verified', label: 'Похоже, всё на месте', reason: 'Найдены основные признаки ожидаемого вывода. Это мягкая самопроверка; окончательно корректность и понимание проверит преподаватель.'};
  }

  function customEvidenceCheck(id, text, allValues) {
    if (id === 'LX1-02') {
      const previous = String(allValues['LX1-01'] || '');
      const created = previous.match(/created by\s+([\w.-]+)/i);
      const passwd = text.match(/^([^:\n]+):x:\d+:\d+:/m);
      if (created && passwd && created[1] !== passwd[1]) return {state: 'review', label: 'Стоит сравнить пользователя', reason: 'Имена пользователя в LX1-01 и /etc/passwd в LX1-02 отличаются. Результат сохранён; сравните шаги и исправьте только если это не было задумано.'};
    }
    if (id === 'LX1-04') {
      const rows = String(text).split(/\n/);
      let src = null, hard = null;
      rows.forEach(function (line) {
        const m = line.match(/^\s*(\d+)\s+[-dl][rwx-]{9}.*\b(user\.txt|user-hard\.txt)\b/);
        if (m && m[2] === 'user.txt') src = m[1];
        if (m && m[2] === 'user-hard.txt') hard = m[1];
      });
      if (src && hard && src !== hard) return {state: 'review', label: 'Стоит сравнить inode', reason: 'Для hard link inode исходного имени и ссылки обычно совпадает. Результат сохранён; вернитесь к ls -li и сравните номера.'};
    }
    if (id === 'LX2-04') {
      const pids = [];
      const re = /\blx2\s+(\d+)\b/g;
      let m;
      while ((m = re.exec(text)) !== null) pids.push(m[1]);
      if (pids.length < 2 || !pids.some(function (x, i) { return pids.indexOf(x) !== i; })) {
        return {state: 'review', label: 'Стоит сравнить PID', reason: 'В том же tmux-сеансе pane PID должен сохраняться. Результат сохранён; сравните значения до отсоединения и после возврата.'};
      }
    }
    if (id === 'LX3-03') {
      const denied = (text.match(/Permission denied|Отказано в доступе/gi) || []).length;
      if (denied < 2) return {state: 'review', label: 'Проверьте ожидаемые запреты', reason: 'В этом шаге должны быть и успешные действия, и ожидаемые Permission denied. Результат сохранён; сравните его с описанием шага.'};
    }
    return null;
  }

  function validateEvidence(id, value, allValues) {
    const rule = EVIDENCE_RULES[id] || {minChars: 40, minLines: 2, minUnique: 6, groups: []};
    const base = qualityCheck(value, rule);
    if (base.state !== 'verified') return base;
    const custom = customEvidenceCheck(id, String(value || ''), allValues || {});
    if (custom) return {state: 'review', label: 'Результат сохранён · можно сверить', reason: custom.reason + ' Результат уже учтён в комплектности; при желании вернитесь к шагу и спокойно сравните вывод.'};
    return base;
  }

  function validateIdentity(kind, value) {
    const text = String(value || '').trim();
    if (!text) return {state: 'missing', label: 'Можно заполнить'};
    if (kind === 'name') {
      const parts = text.split(/\s+/).filter(Boolean);
      if (parts.length < 2 || !/[\p{L}]/u.test(text) || text.length < 5) return {state: 'fix', label: 'Уточните ФИО'};
    } else if (kind === 'group') {
      if (text.length < 2 || !/[\p{L}\p{N}]/u.test(text)) return {state: 'fix', label: 'Уточните группу'};
    } else if (kind === 'number') {
      if (!/^\d{1,3}$/.test(text)) return {state: 'fix', label: 'Укажите номер 1–999'};
    }
    return {state: 'verified', label: 'Заполнено'};
  }

  function validateShortAnswer(value, others) {
    const text = String(value || '').trim();
    if (!text) return {state: 'missing', label: 'Можно ответить', reason: 'Когда будете готовы, сформулируйте короткий ответ своими словами.'};
    if (looksSensitive(text)) return {state: 'fix', label: 'Небольшая проверка безопасности', reason: 'В ответе не нужны секретные данные. Удалите их и оставьте только объяснение.'};
    if (/^(?:не знаю|нет|да|ок|готово|тест|asdf|qwerty)[.!\s]*$/i.test(text)) return {state: 'fix', label: 'Добавьте одну мысль', reason: 'Похоже, это пока черновая заглушка. Добавьте одну короткую причину, наблюдение или вывод — этого достаточно.'};
    const tokens = textTokens(text);
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const sameCount = (others || []).filter(function (x) { return x && x.toLowerCase().replace(/\s+/g, ' ').trim() === normalized; }).length;
    if (sameCount > 1) return {state: 'review', label: 'Ответ сохранён · можно уточнить', reason: 'Несколько ответов совпадают. Если это случайно, добавьте к каждому одну собственную мысль.'};
    if (text.length < 25 || tokens.length < 4) return {state: 'review', label: 'Ответ сохранён · можно уточнить', reason: 'Ответ уже учитывается. Если можете, добавьте одну короткую причину или результат — это поможет вам лучше закрепить тему.'};
    return {state: 'review', label: 'Готово к проверке', reason: 'Ответ сохранён. Хорошо; преподаватель позже проверит смысл и понимание.'};
  }

  function makeTextRuns(text, mono) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const rPr = mono ? '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/></w:rPr>' : '';
    let out = '';
    lines.forEach(function (line, i) {
      if (i) out += '<w:r><w:br/></w:r>';
      out += '<w:r>' + rPr + '<w:t xml:space="preserve">' + esc(line || ' ') + '</w:t></w:r>';
    });
    return out;
  }
  function p(text, style, mono) {
    const pPr = style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : '';
    return '<w:p>' + pPr + makeTextRuns(text, mono) + '</w:p>';
  }
  function codeBox(text) {
    return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B8D8D3"/><w:left w:val="single" w:sz="14" w:color="08766E"/><w:bottom w:val="single" w:sz="4" w:color="B8D8D3"/><w:right w:val="single" w:sz="4" w:color="B8D8D3"/></w:tblBorders><w:shd w:fill="F5FBFA"/></w:tblPr><w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar></w:tcPr>' + p(text || '—', '', true) + '</w:tc></w:tr></w:tbl>';
  }
  function resultBox(text) {
    return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="A9D3B6"/><w:left w:val="single" w:sz="14" w:color="167044"/><w:bottom w:val="single" w:sz="4" w:color="A9D3B6"/><w:right w:val="single" w:sz="4" w:color="A9D3B6"/></w:tblBorders><w:shd w:fill="F2FAF5"/></w:tblPr><w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>' + p(text || '—', '', false) + '</w:tc></w:tr></w:tbl>';
  }

  function infoTable(rows) {
    let trs = '';
    rows.forEach(function (row) {
      trs += '<w:tr><w:tc><w:tcPr><w:tcW w:w="2500" w:type="dxa"/><w:shd w:fill="EDF4FA"/></w:tcPr>' + p(row[0], 'MetaLabel', false) + '</w:tc>' +
        '<w:tc><w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>' + p(row[1] || '—', 'MetaValue', false) + '</w:tc></w:tr>';
    });
    return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="3" w:color="D6E1EA"/><w:left w:val="single" w:sz="3" w:color="D6E1EA"/><w:bottom w:val="single" w:sz="3" w:color="D6E1EA"/><w:right w:val="single" w:sz="3" w:color="D6E1EA"/><w:insideH w:val="single" w:sz="3" w:color="E3EAF0"/><w:insideV w:val="single" w:sz="3" w:color="E3EAF0"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="2500"/><w:gridCol w:w="6500"/></w:tblGrid>' + trs + '</w:tbl>';
  }

  function imageDrawing(relId, name, descr, cx, cy, docPrId) {
    return '<w:p><w:pPr><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="' + docPrId + '" name="' + esc(name) + '" descr="' + esc(descr) + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="' + esc(name) + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + relId + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }

  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
  function concat(parts) {
    let len = 0; parts.forEach(function (p) { len += p.length; });
    const out = new Uint8Array(len); let pos = 0;
    parts.forEach(function (part) { out.set(part, pos); pos += part.length; });
    return out;
  }
  function zipStored(files) {
    const enc = new TextEncoder();
    const locals = [], centrals = [];
    let offset = 0;
    const now = new Date();
    const dostime = ((now.getHours() & 31) << 11) | ((now.getMinutes() & 63) << 5) | ((Math.floor(now.getSeconds() / 2)) & 31);
    const dosdate = (((now.getFullYear() - 1980) & 127) << 9) | (((now.getMonth() + 1) & 15) << 5) | (now.getDate() & 31);
    files.forEach(function (f) {
      const name = enc.encode(f.name);
      const data = f.data instanceof Uint8Array ? f.data : enc.encode(f.data);
      const crc = crc32(data);
      const localHeader = new Uint8Array([80,75,3,4,20,0,0,8,0,0].concat(u16(dostime),u16(dosdate),u32(crc),u32(data.length),u32(data.length),u16(name.length),[0,0]));
      const local = concat([localHeader, name, data]);
      locals.push(local);
      const centralHeader = new Uint8Array([80,75,1,2,20,0,20,0,0,8,0,0].concat(u16(dostime),u16(dosdate),u32(crc),u32(data.length),u32(data.length),u16(name.length),[0,0,0,0,0,0,0,0,0,0,0,0],u32(offset)));
      centrals.push(concat([centralHeader, name]));
      offset += local.length;
    });
    const central = concat(centrals);
    const end = new Uint8Array([80,75,5,6,0,0,0,0].concat(u16(files.length),u16(files.length),u32(central.length),u32(offset),[0,0]));
    return concat(locals.concat([central, end]));
  }

  async function imageMeta(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pngMagic = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
    const jpegMagic = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!pngMagic && !jpegMagic) return {bytes: bytes, width: 0, height: 0, ext: '', mime: '', readable: false};

    let width = 0, height = 0, readable = false;
    try {
      if ('createImageBitmap' in window) {
        const bmp = await createImageBitmap(file);
        width = bmp.width; height = bmp.height; readable = width > 0 && height > 0;
        bmp.close();
      } else {
        const url = URL.createObjectURL(file);
        const dims = await new Promise(function (resolve) {
          const img = new Image();
          img.onload = function () { resolve([img.naturalWidth || 0, img.naturalHeight || 0, true]); URL.revokeObjectURL(url); };
          img.onerror = function () { resolve([0, 0, false]); URL.revokeObjectURL(url); };
          img.src = url;
        });
        width = dims[0]; height = dims[1]; readable = !!dims[2] && width > 0 && height > 0;
      }
    } catch (e) { readable = false; }
    const ext = pngMagic ? 'png' : 'jpg';
    const mime = pngMagic ? 'image/png' : 'image/jpeg';
    return {bytes: bytes, width: width, height: height, ext: ext, mime: mime, readable: readable};
  }

  function customPropsXml(data) {
    const props = [
      ['NSA.CourseId', data.courseId || ''],
      ['NSA.Lab', data.labCode || ''],
      ['NSA.Group', data.group || ''],
      ['NSA.ListNumber', data.listNumber || ''],
      ['NSA.ReportDate', data.dateIso || ''],
      ['NSA.PublicBoardConsent', data.publicBoardConsent ? 'yes' : 'no']
    ];
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">';
    props.forEach(function (item, index) {
      xml += '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="' + (index + 2) + '" name="' + esc(item[0]) + '"><vt:lpwstr>' + esc(item[1]) + '</vt:lpwstr></property>';
    });
    return xml + '</Properties>';
  }

  function stylesXml() {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/><w:color w:val="243443"/></w:rPr><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="173E61"/></w:rPr><w:pPr><w:spacing w:after="180"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="27"/><w:color w:val="173E61"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="120"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="08766E"/></w:rPr><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/></w:pPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="MetaLabel"><w:name w:val="Meta label"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="53606D"/><w:sz w:val="20"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="MetaValue"><w:name w:val="Meta value"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="20"/></w:rPr></w:style>' +
      '</w:styles>';
  }

  async function buildDocx(data) {
    const files = [];
    const imageRels = [];
    const imageDefaults = new Set();
    let body = '';
    const completion = data.completion || {percent: 0, complete: 0, total: 0, verified: 0, review: 0, issues: []};
    const learning = data.learningProgress || {done: 0, total: 0, percent: 0};
    const ready = completion.percent === 100 && (!completion.issues || completion.issues.length === 0) && learning.total > 0 && learning.done >= learning.total;
    body += p('Сетевые системы и приложения', 'Title');
    body += p(data.labCode + ' — ' + data.labTitle, 'Heading1');
    body += resultBox(ready ? 'ГОТОВО К ПРОВЕРКЕ ПРЕПОДАВАТЕЛЕМ' : 'РАБОЧИЙ ОТЧЁТ · ЕСТЬ ЧТО ДОПОЛНИТЬ');
    body += infoTable([
      ['Студент', data.studentName || '—'], ['Группа', data.group || '—'], ['№ по списку', data.listNumber || '—'], ['Дата', data.date],
      ['Маршрут практики', learning.done + ' / ' + learning.total + ' этапов'],
      ['Результаты', completion.complete + ' / ' + completion.total + ' обязательных материалов'],
      ['Маршрут', 'Подготовка → практика → проверка → отчёт'],
      ['Рабочая папка', '~/NSA/' + data.labCode],
      ['Идентификатор отчёта', data.reportId || '—']
    ]);
    body += p(ready
      ? 'Маршрут лабораторной пройден, обязательные материалы представлены. Этот статус показывает комплектность учебной работы, а не академическую оценку.'
      : 'Документ можно использовать как рабочую версию. Перед отправкой завершите отмеченные ниже части маршрута.', '', false);
    body += p('Лабораторная работа · карточка выполнения', 'Heading1');
    body += resultBox('Практика ' + learning.done + '/' + learning.total + '  ·  Результаты ' + completion.complete + '/' + completion.total + '  ·  Проверяемые признаки ' + completion.verified + '  ·  Требует внимания ' + completion.review);
    if (completion.issues && completion.issues.length) {
      body += p('Нужно проверить или дополнить', 'Heading2');
      completion.issues.forEach(function (issue) { body += p('• ' + issue); });
    } else {
      body += p('Все обязательные элементы представлены. Корректность выполнения и понимание подтверждает преподаватель после проверки отчёта.');
    }
    body += p('Основные результаты', 'Heading1');

    let relIndex = 2; // rId1 = styles
    let docPrId = 1;
    const mainEvidence = data.evidence.filter(function (item) { return !/-Q$/i.test(item.id); });
    const quizEvidence = data.evidence.find(function (item) { return /-Q$/i.test(item.id); });
    for (const item of mainEvidence) {
      body += p(item.id + ' · ' + item.stage, 'Heading2');
      if (item.kind === 'text') {
        body += codeBox(item.value || '—');
      } else if (item.kind === 'screenshot') {
        const selectedFiles = item.files || (item.file ? [item.file] : []);
        if (selectedFiles.length) {
          for (const selectedFile of selectedFiles) {
            const im = await imageMeta(selectedFile);
            if (!im.readable || !im.ext) { body += p('Снимок не добавлен: файл не распознан как читаемый PNG/JPEG.', '', false); continue; }
            const relId = 'rId' + relIndex++;
            const mediaName = 'image' + docPrId + '.' + im.ext;
            imageRels.push({id: relId, target: 'media/' + mediaName});
            imageDefaults.add(im.ext);
            files.push({name: 'word/media/' + mediaName, data: im.bytes});
            const maxCx = 5486400; // 6 in
            const maxCy = 6858000; // 7.5 in
            let cx = maxCx;
            let cy = Math.round(maxCx * im.height / Math.max(im.width, 1));
            if (cy > maxCy) { cy = maxCy; cx = Math.round(maxCy * im.width / Math.max(im.height, 1)); }
            body += imageDrawing(relId, item.id, item.stage, cx, cy, docPrId++);
          }
        } else {
          body += p('Снимок не добавлен.', '', false);
        }
      }
    }

    body += p('Проверка понимания', 'Heading1');
    body += resultBox(quizEvidence && quizEvidence.value ? quizEvidence.value : 'MCQ ещё не завершён.');

    body += p('Короткие ответы', 'Heading1');
    data.answers.forEach(function (a, i) {
      body += p((i + 1) + '. ' + a.question, 'Heading2');
      body += p(a.answer || '—');
    });
    body += p('Для преподавателя', 'Heading1');
    body += infoTable([
      ['Учебный прогресс (самоотметка)', learning.done + ' / ' + learning.total + ' этапов'],
      ['Комплектность материалов', completion.percent + '%'],
      ['Доска достижений', data.publicBoardConsent ? 'Студент разрешил показать группу, №, лабораторную, дату и одобренный бейдж после проверки' : 'Не публиковать'],
      ['Корректность выполнения', '____________________________'],
      ['Понимание и объяснение', '____________________________'],
      ['Комментарий / итог', '____________________________']
    ]);

    const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';

    let defaults = '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>';
    if (imageDefaults.has('png')) defaults += '<Default Extension="png" ContentType="image/png"/>';
    if (imageDefaults.has('jpg')) defaults += '<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/>';
    const customProps = customPropsXml(data);
    const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' + defaults + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>';
    const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>';
    let docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
    imageRels.forEach(function (r) { docRels += '<Relationship Id="' + r.id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + r.target + '"/>'; });
    docRels += '</Relationships>';

    files.unshift(
      {name: '[Content_Types].xml', data: contentTypes},
      {name: '_rels/.rels', data: rootRels},
      {name: 'word/document.xml', data: documentXml},
      {name: 'word/styles.xml', data: stylesXml()},
      {name: 'docProps/custom.xml', data: customProps},
      {name: 'word/_rels/document.xml.rels', data: docRels}
    );
    return zipStored(files);
  }

  function init(builder) {
    const labId = builder.dataset.lab;
    const labCode = (builder.dataset.labCode || labId).toUpperCase();
    const labTitle = builder.dataset.labTitle || labCode;
    const courseId = builder.dataset.courseId || 'network-systems-applications';
    const studentName = qs(builder, '[data-student-name]');
    const group = qs(builder, '[data-student-group]');
    const number = qs(builder, '[data-student-number]');
    const publicBoardConsent = qs(builder, '[data-public-board-consent]');
    const progress = qs(builder, '[data-report-progress]');
    const status = qs(builder, '[data-report-status]');
    const completionPercent = qs(builder, '[data-completeness-percent]');
    const completionBar = qs(builder, '[data-completeness-bar]');
    const buttons = qsa(builder, '[data-build-report]');
    const imageInputs = qsa(builder, '[data-report-image]');
    const shortAnswers = qsa(builder, '[data-short-answer]');
    const quizPreview = qs(builder, '[data-report-quiz-preview]');
    const preflight = qs(builder, '[data-report-preflight]');
    const preflightMark = qs(builder, '[data-preflight-mark]');
    const preflightTitle = qs(builder, '[data-preflight-title]');
    const preflightNote = qs(builder, '[data-preflight-note]');
    const preflightIdentity = qs(builder, '[data-preflight-identity]');
    const preflightPractice = qs(builder, '[data-preflight-practice]');
    const preflightEvidence = qs(builder, '[data-preflight-evidence]');
    const preflightCheck = qs(builder, '[data-preflight-check]');
    const extraFileInput = qs(builder, '[data-extra-file-check]');
    const extraFileBadge = qs(builder, '[data-extra-file-validation]');
    const imageStates = {};
    let extraFileState = extraFileInput ? {state: 'missing', label: 'Можно добавить файл', reason: 'Когда дополнительный файл будет готов, выберите его для локальной проверки.'} : null;
    let building = false;

    function badgeClass(state) {
      return 'validation-badge is-' + (state || 'pending');
    }
    function setBadge(node, result) {
      if (!node || !result) return;
      node.className = badgeClass(result.state);
      node.textContent = result.label || 'Не проверено';
      node.title = result.reason || '';
    }
    function setDetail(node, result) {
      if (!node || !result) return;
      node.className = 'validation-detail is-' + (result.state || 'pending');
      node.textContent = result.reason || '';
    }

    [studentName, group, number].forEach(function (input) {
      if (!input) return;
      const key = NS + labId + ':' + input.dataset.reportField;
      input.value = safeGet(key);
      input.addEventListener('input', function () { safeSet(key, input.value.slice(0, 200)); updateProgress(true); });
    });
    if (publicBoardConsent) {
      const consentKey = NS + labId + ':public-board-consent';
      publicBoardConsent.checked = safeGet(consentKey) === 'yes';
      publicBoardConsent.addEventListener('change', function () {
        safeSet(consentKey, publicBoardConsent.checked ? 'yes' : 'no');
      });
    }
    shortAnswers.forEach(function (ta, index) {
      const key = NS + labId + ':answer:' + index;
      ta.value = safeGet(key);
      ta.addEventListener('input', function () { safeSet(key, ta.value.slice(0, 2500)); updateProgress(true); });
    });

    async function validateSelectedImages(input) {
      const id = input.dataset.reportImage;
      const selected = Array.from(input.files || []);
      if (!selected.length) {
        imageStates[id] = {state: 'missing', label: 'Можно добавить снимок', reason: 'Когда нужный экран будет готов, добавьте основной снимок.'};
        return imageStates[id];
      }
      const badType = selected.find(function (file) { return !/image\/(png|jpeg)/i.test(file.type) || file.size > 8 * 1024 * 1024 || file.size < 20 * 1024; });
      if (badType) {
        imageStates[id] = {state: 'fix', label: 'Выберите читаемый снимок', reason: 'Подойдёт обычный PNG/JPEG размером от 20 КБ до 8 МБ.'};
        return imageStates[id];
      }
      for (const file of selected) {
        const meta = await imageMeta(file);
        if (!meta.readable) {
          imageStates[id] = {state: 'fix', label: 'Выберите обычный PNG/JPEG', reason: 'Браузер не смог распознать содержимое файла как читаемое изображение PNG/JPEG. Выберите снимок экрана ещё раз.'};
          return imageStates[id];
        }
        if (meta.width < 640 || meta.height < 360) {
          imageStates[id] = {state: 'fix', label: 'Нужен более читаемый снимок', reason: 'Выберите изображение не меньше 640×360, чтобы преподавателю было удобно его проверить.'};
          return imageStates[id];
        }
      }
      imageStates[id] = {state: 'review', label: 'Снимок добавлен', reason: 'Формат и размер подходят. Содержание спокойно проверит преподаватель при оценивании.'};
      return imageStates[id];
    }

    imageInputs.forEach(function (input) {
      input.addEventListener('change', async function () {
        const card = input.closest('.evidence-list-item');
        const label = card && card.querySelector('[data-image-state]');
        const selected = Array.from(input.files || []);
        const state = await validateSelectedImages(input);
        if (label) {
          if (state.state === 'review') label.textContent = 'Добавлено: ' + selected.map(function (f) { return f.name; }).join(', ') + '. Содержание проверит преподаватель.';
          else label.textContent = state.reason || 'Проверьте выбранный файл.';
        }
        updateProgress(true);
      });
      imageStates[input.dataset.reportImage] = {state: 'missing', label: 'Можно добавить снимок', reason: 'Когда нужный экран будет готов, добавьте основной снимок.'};
    });

    if (extraFileInput) {
      extraFileInput.addEventListener('change', async function () {
        const file = extraFileInput.files && extraFileInput.files[0];
        if (!file) {
          extraFileState = {state: 'missing', label: 'Можно добавить файл', reason: 'Когда дополнительный файл будет готов, выберите его для локальной проверки.'};
        } else if (!/\.(?:tar\.gz|tgz)$/i.test(file.name) || file.size < 40) {
          extraFileState = {state: 'fix', label: 'Выберите архив .tar.gz/.tgz', reason: 'Нужен непустой архив .tar.gz или .tgz.'};
        } else {
          try {
            const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
            if (head.length === 2 && head[0] === 0x1f && head[1] === 0x8b) {
              extraFileState = {state: 'review', label: 'Архив выбран', reason: 'Gzip-заголовок распознан; содержимое архива проверит преподаватель.'};
            } else {
              extraFileState = {state: 'fix', label: 'Стоит пересоздать архив', reason: 'Расширение есть, но gzip-заголовок не распознан. Пересоздайте архив командой из лабораторной и попробуйте снова.'};
            }
          } catch (e) {
            extraFileState = {state: 'review', label: 'Файл выбран', reason: 'Формат не удалось проверить в браузере; содержимое проверит преподаватель.'};
          }
        }
        setBadge(extraFileBadge, extraFileState);
        updateProgress(true);
      });
      setBadge(extraFileBadge, extraFileState);
    }

    function evidenceText(id) {
      const ta = document.querySelector('textarea[data-evidence-id="' + id + '"]');
      const value = ta && ta.value.trim() ? ta.value.trim() : safeGet('nsa:' + labId + ':' + id).trim();
      if (!value || looksSensitive(value)) return '';
      return value.slice(0, MAX_TEXT);
    }
    function quizResult() {
      return safeGet('nsa:' + labId + ':quiz').trim();
    }
    function quizMeta() {
      const raw = safeGet('nsa:' + labId + ':quiz-meta').trim();
      if (raw) {
        try {
          const meta = JSON.parse(raw);
          if (meta && Number(meta.total) > 0) return meta;
        } catch (e) {}
      }
      const text = quizResult();
      const m = text.match(/(?:Отвечено|пройдено)[:\s]+(\d+)\s*\/\s*(\d+)/i);
      if (m) return {answered: Number(m[1]), total: Number(m[2]), completed: Number(m[1]) === Number(m[2])};
      return {answered: 0, total: 0, completed: false};
    }
    function validateQuiz() {
      const meta = quizMeta();
      if (meta.completed && Number(meta.total) > 0 && Number(meta.answered) === Number(meta.total)) {
        return {state: 'verified', label: 'MCQ пройден', reason: 'Все вопросы доведены до решения. Повторные попытки — часть обучения и не уменьшают комплектность.'};
      }
      return {state: 'missing', label: 'MCQ можно продолжить', reason: 'Пройдите оставшиеся вопросы в удобном темпе. Каждый вопрос можно пробовать снова до правильного решения.'};
    }
    function updateQuizPreview() {
      if (!quizPreview) return;
      const value = quizResult();
      const qState = validateQuiz();
      quizPreview.textContent = value ? value + ' · Для комплектности учитывается прохождение всех вопросов; повторные попытки не штрафуются.' : 'MCQ ещё можно продолжить. Для комплектности достаточно пройти все вопросы; повторные попытки помогают учиться и не превращаются в автоматическую оценку.';
      quizPreview.classList.toggle('is-ready', qState.state === 'verified');
    }

    function validationSnapshot() {
      const items = [];
      const values = {};
      qsa(builder, '[data-required-text]').forEach(function (node) {
        const id = node.dataset.requiredText;
        values[id] = evidenceText(id);
      });

      items.push({key: 'name', label: 'ФИО', result: validateIdentity('name', studentName ? studentName.value : '')});
      items.push({key: 'group', label: 'Группа', result: validateIdentity('group', group ? group.value : '')});
      items.push({key: 'number', label: '№ по списку', result: validateIdentity('number', number ? number.value : '')});

      qsa(builder, '[data-required-text]').forEach(function (node) {
        const id = node.dataset.requiredText;
        const result = validateEvidence(id, values[id], values);
        items.push({key: id, label: id, result: result});
        setBadge(qs(builder, '[data-evidence-validation="' + id + '"]'), result);
        setDetail(qs(builder, '[data-evidence-validation-detail="' + id + '"]'), result);
      });

      qsa(builder, '[data-required-image]').forEach(function (node) {
        const id = node.dataset.requiredImage;
        const result = imageStates[id] || {state: 'missing', label: 'Можно добавить снимок', reason: 'Когда нужный экран будет готов, добавьте основной снимок.'};
        items.push({key: id, label: id + ' (снимок)', result: result});
        setBadge(qs(builder, '[data-evidence-validation="' + id + '"]'), result);
        setDetail(qs(builder, '[data-evidence-validation-detail="' + id + '"]'), result);
      });

      const quizState = validateQuiz();
      items.push({key: 'MCQ', label: 'MCQ', result: quizState});
      const quizBadge = qsa(builder, '[data-evidence-validation]').find(function (node) { return /-Q$/i.test(node.dataset.evidenceValidation || ''); });
      setBadge(quizBadge, quizState);
      if (quizBadge) {
        const qid = quizBadge.dataset.evidenceValidation || '';
        setDetail(qs(builder, '[data-evidence-validation-detail="' + qid + '"]'), quizState);
      }

      const answerTexts = shortAnswers.map(function (ta) { return ta.value.trim(); });
      shortAnswers.forEach(function (ta, i) {
        const result = validateShortAnswer(ta.value, answerTexts);
        items.push({key: 'answer-' + (i + 1), label: 'Короткий ответ ' + (i + 1), result: result});
        const card = ta.closest('.short-answer-card');
        setBadge(card && card.querySelector('[data-answer-validation]'), result);
        const answerDetail = card && card.querySelector('[data-answer-validation-detail]');
        if (answerDetail) answerDetail.textContent = result.reason || 'Смысл ответа проверит преподаватель.';
      });

      if (extraFileInput) items.push({key: 'extra-file', label: 'Дополнительный файл', result: extraFileState || {state: 'missing', label: 'Можно добавить'}});

      const completeStates = new Set(['verified', 'review']);
      const complete = items.filter(function (item) { return completeStates.has(item.result.state); }).length;
      const verified = items.filter(function (item) { return item.result.state === 'verified'; }).length;
      const review = items.filter(function (item) { return item.result.state === 'review'; }).length;
      const total = items.length || 1;
      const percent = Math.round(complete / total * 100);
      const issues = items.filter(function (item) { return !completeStates.has(item.result.state); }).map(function (item) {
        return item.label + ': ' + (item.result.reason || item.result.label || 'нужно проверить');
      });
      return {items: items, complete: complete, verified: verified, review: review, total: total, percent: percent, issues: issues};
    }

    function publishCompleteness(snapshot, force) {
      const key = COMPLETENESS_NS + labId;
      let previous = null;
      const raw = safeLocalGet(key);
      if (raw) {
        try { previous = JSON.parse(raw); } catch (e) {}
      }
      // Opening a lab in a fresh tab must not erase a useful summary created
      // earlier. Persist an empty snapshot only after a real user interaction.
      if (!force && snapshot.complete === 0 && previous && Number(previous.complete) > 0) return previous;
      const summary = {
        labId: labId,
        percent: Math.max(0, Math.min(100, Number(snapshot.percent) || 0)),
        complete: Math.max(0, Number(snapshot.complete) || 0),
        total: Math.max(0, Number(snapshot.total) || 0),
        verified: Math.max(0, Number(snapshot.verified) || 0),
        review: Math.max(0, Number(snapshot.review) || 0),
        updatedAt: new Date().toISOString()
      };
      safeLocalSet(key, JSON.stringify(summary));
      window.dispatchEvent(new CustomEvent('nsa:submission-completeness-change', {detail: summary}));
      return summary;
    }

    function updatePreflight(snapshot) {
      if (!preflight) return;
      const identityOk = !!(studentName && studentName.value.trim().length >= 3 && group && group.value.trim() && number && number.value.trim());
      const learning = (window.NSALearningProgress && typeof window.NSALearningProgress.get === 'function')
        ? window.NSALearningProgress.get(labId, document.querySelectorAll('.lab-route-item[data-progress-step]').length)
        : {done:0,total:0,percent:0};
      let conceptReady = false;
      try { conceptReady = localStorage.getItem('nsa:deck-complete:' + labId) === 'yes'; } catch (e) {}
      const practiceOk = learning.total > 0 && learning.done >= learning.total;
      const evidenceOk = snapshot.total > 0 && snapshot.complete >= snapshot.total && (!snapshot.issues || snapshot.issues.length === 0);
      const quiz = quizResult();
      const checkOk = !!(quiz && !/ещ[её] не|не заверш/i.test(quiz));
      if (preflightIdentity) preflightIdentity.textContent = (conceptReady ? 'Подготовка · готово' : 'Подготовка · вернитесь к введению') + ' · Данные · ' + (identityOk ? 'готово' : 'добавьте');
      if (preflightPractice) preflightPractice.textContent = 'Практика · ' + (practiceOk ? learning.done + '/' + learning.total : learning.done + '/' + learning.total);
      if (preflightEvidence) preflightEvidence.textContent = 'Результаты · ' + (evidenceOk ? 'готово' : snapshot.complete + '/' + snapshot.total);
      if (preflightCheck) preflightCheck.textContent = 'Проверка понимания · ' + (checkOk ? 'готово' : 'ещё впереди');
      const ready = conceptReady && identityOk && practiceOk && evidenceOk && checkOk;
      const readyLabel = ready ? 'Готово к отправке' : (practiceOk ? 'Нужно завершить проверку отчёта' : 'Продолжайте лабораторную');
      const nearly = !ready && (snapshot.percent >= 75 || (learning.percent || 0) >= 75);
      preflight.classList.toggle('is-ready', ready);
      preflight.classList.toggle('is-nearly', nearly);
      if (preflightMark) preflightMark.textContent = ready ? '✓' : (nearly ? '↗' : '○');
      if (preflightTitle) preflightTitle.textContent = ready ? 'Лабораторная собрана' : (nearly ? 'Почти готово к отправке' : 'Собираем картину работы');
      if (preflightNote) preflightNote.textContent = ready
        ? 'Все обязательные части маршрута представлены. Просмотрите DOCX перед отправкой преподавателю.'
        : (snapshot.issues && snapshot.issues.length
          ? 'Осталось уточнить: ' + snapshot.issues.slice(0,2).join(' · ') + (snapshot.issues.length > 2 ? '…' : '')
          : 'Продолжайте практику: сводка обновляется автоматически.');
    }

    function updateProgress(forcePersist) {
      updateQuizPreview();
      const snapshot = validationSnapshot();
      if (completionPercent) completionPercent.textContent = snapshot.percent + '%';
      if (completionBar) { completionBar.value = snapshot.percent; completionBar.textContent = snapshot.percent + '%'; }
      if (progress) progress.textContent = 'Комплектность материалов: ' + snapshot.complete + ' / ' + snapshot.total + ' · распознано ' + snapshot.verified + ' · представлено для проверки ' + snapshot.review;
      buttons.forEach(function (b) {
        if (!building) b.disabled = false;
        b.textContent = snapshot.percent === 100 ? 'Скачать готовый отчёт (.docx)' : 'Скачать текущий отчёт · ' + snapshot.percent + '% (.docx)';
      });
      if (status) {
        status.textContent = snapshot.percent === 100
          ? 'Маршрут лабораторной собран: обязательные шаги и результаты представлены. Перед отправкой просмотрите отчёт: преподавателю должно быть понятно, что именно вы сделали и что наблюдали. Это карточка выполнения, а не автоматическая оценка.'
          : 'Комплектность материалов ' + snapshot.percent + '%. Хороший прогресс — можно продолжать в своём темпе. Ещё можно добавить: ' + snapshot.issues.slice(0, 3).join(' · ') + (snapshot.issues.length > 3 ? '…' : '') + '. Текущий отчёт уже можно скачать и использовать как рабочую версию.';
      }
      updatePreflight(snapshot);
      publishCompleteness(snapshot, !!forcePersist);
      return snapshot;
    }

    document.addEventListener('input', function (e) {
      if (e.target && e.target.matches('textarea[data-evidence-id]')) updateProgress(true);
    });
    window.addEventListener('nsa:quiz-complete', function () { updateProgress(true); });
    window.addEventListener('nsa:quiz-reset', function () { updateProgress(true); });
    window.addEventListener('nsa:evidence-change', function () { updateProgress(true); });
    window.addEventListener('nsa:deck-complete', function () { updateProgress(true); });

    async function downloadReport() {
      const snapshot = updateProgress(true);
      if (status) status.textContent = 'Готовим Word-отчёт на этом устройстве · комплектность ' + snapshot.percent + '%…';
      building = true;
      buttons.forEach(function (b) { b.disabled = true; });
      try {
        const evidence = [];
        const evidenceCards = qsa(builder, '[data-report-evidence]');
        evidenceCards.forEach(function (card) {
          const id = card.dataset.reportEvidence;
          const kind = card.dataset.evidenceKind;
          evidence.push({
            id: id,
            kind: kind,
            stage: card.dataset.evidenceStage || '',
            proof: card.dataset.evidenceProof || '',
            value: kind === 'text' ? (id.endsWith('-Q') ? quizResult() : evidenceText(id)) : '',
            files: kind === 'screenshot' ? Array.from(((qs(card, '[data-report-image]') || {}).files || [])) : []
          });
        });
        const answers = shortAnswers.map(function (ta) { return {question: ta.dataset.question || '', answer: ta.value.trim()}; });
        const now = new Date();
        const date = new Intl.DateTimeFormat('ru-RU', {year:'numeric', month:'2-digit', day:'2-digit'}).format(now);
        const dateIso = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        const bytes = await buildDocx({
          courseId: courseId, labCode: labCode, labTitle: labTitle,
          studentName: studentName ? studentName.value.trim() : '', group: group ? group.value.trim() : '', listNumber: number ? number.value.trim() : '', date: date, dateIso: dateIso,
          publicBoardConsent: !!(publicBoardConsent && publicBoardConsent.checked),
          reportId: labCode + '-' + dateIso.replace(/-/g,'') + '-' + String(number && number.value ? number.value : 'NA').replace(/\D/g,'').slice(0,4) + '-' + Math.random().toString(36).slice(2,6).toUpperCase(),
          evidence: evidence, answers: answers, completion: snapshot,
          learningProgress: (window.NSALearningProgress && typeof window.NSALearningProgress.get === 'function') ? window.NSALearningProgress.get(labId, document.querySelectorAll('.lab-route-item[data-progress-step]').length) : {done: 0, total: 0, percent: 0}
        });
        const blob = new Blob([bytes], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'NSA_' + labCode + '_' + cleanFilename(group && group.value) + '_' + cleanFilename(number && number.value) + '_' + cleanFilename(studentName && studentName.value) + '.docx';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        if (status) status.textContent = snapshot.percent === 100
          ? 'Готово. Комплектность 100%. Отлично — откройте DOCX, быстро проверьте его и отправьте преподавателю; итоговую академическую оценку выставляет преподаватель.'
          : 'DOCX готов. Комплектность материалов: ' + snapshot.percent + '%. В документе мягко отмечено, что ещё можно дополнить. Используйте его как рабочий отчёт и продолжайте, когда удобно.';
      } catch (e) {
        console.error(e);
        if (status) status.textContent = 'DOCX пока не сформирован. Ничего страшного: пустой шаблон всегда доступен, а результаты остаются в текущей вкладке. Попробуйте ещё раз или используйте шаблон.';
      } finally {
        building = false;
        buttons.forEach(function (b) { b.disabled = false; });
        updateProgress();
      }
    }
    buttons.forEach(function (b) { b.addEventListener('click', downloadReport); });

    updateProgress();
  }

  window.NSAReportDocx = { build: buildDocx };
  document.querySelectorAll('[data-report-builder]').forEach(init);
})();

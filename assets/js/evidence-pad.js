(function () {
  'use strict';

  const page = document.body;
  if (!page || !page.classList.contains('lab-page')) return;

  const submission = document.querySelector('[data-submission-lab]');
  const labId = submission && submission.dataset.submissionLab ? submission.dataset.submissionLab : 'lab';
  const safeKey = function (id) { return 'nsa:' + labId + ':' + id; };
  const textareas = [];
  function announceChange(id) {
    window.dispatchEvent(new CustomEvent('nsa:evidence-change', {detail: {labId: labId, evidenceId: id || ''}}));
  }

  function looksSensitive(text) {
    if (!text) return false;
    return /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i.test(text) ||
      /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/.test(text) ||
      /^[^:\n]+:\$[A-Za-z0-9]+\$[^:\n]+:[0-9]+:[0-9]*:[0-9]*:[0-9]*:[0-9]*:[0-9]*:?$/m.test(text);
  }

  function setStatus(el, message) {
    if (!el) return;
    el.textContent = message;
    window.setTimeout(function () {
      if (el.textContent === message) el.textContent = '';
    }, 2600);
  }

  function updateCounter(textarea, counter) {
    if (!counter) return;
    counter.textContent = textarea.value.length + ' / ' + textarea.maxLength;
  }

  function createFallbackEditor(note, id) {
    const editor = document.createElement('div');
    editor.className = 'evidence-editor evidence-editor-static';
    editor.dataset.evidenceEditor = id;

    const label = document.createElement('label');
    label.htmlFor = 'evidence-' + id;
    label.textContent = 'Поле для результата · ' + id;

    const help = document.createElement('p');
    help.className = 'evidence-editor-help';
    help.dataset.evidenceHelp = '';
    help.textContent = 'Вставьте сюда только запрошенный вывод команд как обычный текст. Поле не является формой и само ничего не отправляет.';

    const textarea = document.createElement('textarea');
    textarea.id = 'evidence-' + id;
    textarea.rows = 6;
    textarea.maxLength = 6000;
    textarea.spellcheck = false;
    textarea.autocomplete = 'off';
    textarea.setAttribute('autocapitalize', 'off');
    textarea.placeholder = 'Вставьте сюда результат из терминала…';
    textarea.dataset.evidenceId = id;

    const meta = document.createElement('div');
    meta.className = 'evidence-editor-meta';
    const counter = document.createElement('span');
    counter.dataset.evidenceCount = '';
    counter.textContent = '0 / 6000';
    const badge = document.createElement('span');
    badge.className = 'evidence-local-badge';
    badge.textContent = 'Только в этой вкладке';
    meta.append(counter, badge);

    const actions = document.createElement('div');
    actions.className = 'evidence-editor-actions';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.dataset.evidenceCopy = '';
    copy.textContent = 'Копировать';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'secondary-action';
    clear.dataset.evidenceClear = '';
    clear.textContent = 'Очистить';
    const status = document.createElement('span');
    status.className = 'evidence-editor-status';
    status.dataset.evidenceStatus = '';
    status.setAttribute('aria-live', 'polite');
    actions.append(copy, clear, status);

    editor.append(label, help, textarea, meta, actions);
    note.insertAdjacentElement('afterend', editor);
    return editor;
  }

  function bindEditor(editor) {
    if (!editor || editor.dataset.evidenceBound === 'true') return;
    const textarea = editor.querySelector('textarea[data-evidence-id]');
    if (!textarea) return;

    const id = textarea.dataset.evidenceId;
    const help = editor.querySelector('[data-evidence-help]');
    const counter = editor.querySelector('[data-evidence-count]');
    const copy = editor.querySelector('[data-evidence-copy]');
    const clear = editor.querySelector('[data-evidence-clear]');
    const status = editor.querySelector('[data-evidence-status]');

    try { textarea.value = sessionStorage.getItem(safeKey(id)) || ''; } catch (e) {}
    updateCounter(textarea, counter);

    function validateAndStore() {
      const risky = looksSensitive(textarea.value);
      textarea.classList.toggle('sensitive-warning', risky);
      editor.classList.toggle('has-sensitive-warning', risky);
      updateCounter(textarea, counter);

      if (risky) {
        if (help) help.textContent = 'Похоже, сюда случайно попали чувствительные данные: закрытый ключ, токен или строка shadow. Удалите их перед продолжением — такой текст не сохраняется локально и не включается в экспорт.';
        try { sessionStorage.removeItem(safeKey(id)); } catch (e) {}
        announceChange(id);
        return;
      }

      if (help) help.textContent = 'Вставьте сюда только запрошенный вывод команд как обычный текст. Текст временно хранится только в sessionStorage этой вкладки и не отправляется этим блокнотом.';
      try { sessionStorage.setItem(safeKey(id), textarea.value); } catch (e) {}
      announceChange(id);
    }

    textarea.addEventListener('input', validateAndStore);
    textarea.addEventListener('paste', function () {
      window.setTimeout(validateAndStore, 0);
    });

    if (copy) copy.addEventListener('click', async function () {
      if (!textarea.value.trim()) { setStatus(status, 'Когда результат будет готов, вставьте его сюда'); return; }
      if (looksSensitive(textarea.value)) { setStatus(status, 'Сначала удалите чувствительные данные'); return; }
      try {
        await navigator.clipboard.writeText(textarea.value);
        setStatus(status, 'Скопировано');
      } catch (e) {
        textarea.focus();
        textarea.select();
        try { document.execCommand('copy'); setStatus(status, 'Скопировано'); }
        catch (ignored) { setStatus(status, 'Буфер обмена недоступен — текст уже выделен, скопируйте его вручную'); }
      }
    });

    if (clear) clear.addEventListener('click', function () {
      if (textarea.value && !window.confirm('Очистить результат ' + id + '?')) return;
      textarea.value = '';
      textarea.classList.remove('sensitive-warning');
      editor.classList.remove('has-sensitive-warning');
      try { sessionStorage.removeItem(safeKey(id)); } catch (e) {}
      updateCounter(textarea, counter);
      if (help) help.textContent = 'Вставьте сюда только запрошенный вывод команд как обычный текст. Текст временно хранится только в sessionStorage этой вкладки и не отправляется этим блокнотом.';
      setStatus(status, 'Поле очищено');
      announceChange(id);
    });

    editor.dataset.evidenceBound = 'true';
    textareas.push(textarea);
  }

  // Progressive enhancement: editors are rendered in the page source so the
  // student always sees a paste field. JavaScript only adds convenience.
  document.querySelectorAll('.evidence-note[data-evidence-kind="text"][data-evidence-id]').forEach(function (note) {
    const id = note.dataset.evidenceId;
    let editor = document.querySelector('.evidence-editor[data-evidence-editor="' + id + '"]');
    if (!editor) editor = createFallbackEditor(note, id);
    bindEditor(editor);
  });

  function quizText() {
    try { return sessionStorage.getItem(safeKey('quiz')) || ''; } catch (e) { return ''; }
  }

  function compiledText() {
    const blocks = [];
    textareas.forEach(function (t) {
      if (t.value.trim() && !looksSensitive(t.value)) {
        blocks.push(t.dataset.evidenceId + '\n' + t.value.trim());
      }
    });
    const q = quizText();
    if (q) blocks.push(labId.toUpperCase() + '-Q\n' + q);
    return blocks.join('\n\n----------------------------------------\n\n');
  }

  document.querySelectorAll('[data-results-kit]').forEach(function (kit) {
    const status = kit.querySelector('[data-results-status]');
    const copyAll = kit.querySelector('[data-copy-results]');
    const download = kit.querySelector('[data-download-results]');
    const clearAll = kit.querySelector('[data-clear-results]');

    if (copyAll) copyAll.addEventListener('click', async function () {
      const text = compiledText();
      if (!text) { setStatus(status, 'Добавьте хотя бы один результат — после этого можно собрать их вместе'); return; }
      try {
        await navigator.clipboard.writeText(text);
        setStatus(status, 'Все заполненные результаты скопированы');
      } catch (e) {
        setStatus(status, 'Буфер обмена сейчас недоступен — можно скопировать поля по одному');
      }
    });

    if (download) download.addEventListener('click', function () {
      const text = compiledText();
      if (!text) { setStatus(status, 'Добавьте хотя бы один результат — после этого можно собрать их вместе'); return; }
      const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NSA_' + labId.toUpperCase() + '_results.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus(status, 'TXT сохранён локально');
    });

    if (clearAll) clearAll.addEventListener('click', function () {
      if (!window.confirm('Очистить все локально сохранённые текстовые результаты этой лабораторной?')) return;
      textareas.forEach(function (t) {
        t.value = '';
        t.classList.remove('sensitive-warning');
        const editor = t.closest('.evidence-editor');
        if (editor) {
          editor.classList.remove('has-sensitive-warning');
          updateCounter(t, editor.querySelector('[data-evidence-count]'));
        }
      });
      try {
        Object.keys(sessionStorage).forEach(function (key) {
          if (key.startsWith('nsa:' + labId + ':')) sessionStorage.removeItem(key);
        });
      } catch (e) {}
      setStatus(status, 'Локальные результаты очищены; можно начать заново');
      announceChange('all');
    });
  });

  window.NSAEvidencePad = {
    saveQuiz: function (text) {
      if (looksSensitive(text)) return;
      try { sessionStorage.setItem(safeKey('quiz'), text); } catch (e) {}
    },
    getQuiz: quizText
  };
})();

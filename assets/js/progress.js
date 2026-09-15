(function () {
  'use strict';

  const PREFIX = 'nsa-learning-progress:v1:';
  const COMPLETENESS_PREFIX = 'nsa-submission-completeness:v1:';
  const memoryStore = new Map();

  function nowIso() { return new Date().toISOString(); }
  function safeRead(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return memoryStore.get(key) || null;
  }
  function safeWrite(key, value) {
    memoryStore.set(key, JSON.parse(JSON.stringify(value)));
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function safeRemove(key) {
    memoryStore.delete(key);
    try { localStorage.removeItem(key); } catch (e) {}
  }
  function key(labId) { return PREFIX + labId; }
  function completionKey(labId) { return COMPLETENESS_PREFIX + labId; }

  function getCompleteness(labId) {
    const saved = safeRead(completionKey(labId));
    if (!saved || typeof saved !== 'object') return {labId: labId, percent: 0, complete: 0, total: 0, verified: 0, review: 0, updatedAt: ''};
    const percent = Math.max(0, Math.min(100, Number(saved.percent) || 0));
    return {
      labId: labId,
      percent: percent,
      complete: Math.max(0, Number(saved.complete) || 0),
      total: Math.max(0, Number(saved.total) || 0),
      verified: Math.max(0, Number(saved.verified) || 0),
      review: Math.max(0, Number(saved.review) || 0),
      updatedAt: typeof saved.updatedAt === 'string' ? saved.updatedAt : ''
    };
  }

  function formatUpdated(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    try { return new Intl.DateTimeFormat('ru-RU', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}).format(d); }
    catch (e) { return ''; }
  }

  function emptyState(labId, total) {
    return {labId: labId, total: Number(total) || 0, steps: {}, startedAt: '', updatedAt: ''};
  }

  function get(labId, total) {
    const saved = safeRead(key(labId)) || emptyState(labId, total);
    saved.labId = labId;
    saved.total = Number(total || saved.total || 0);
    saved.steps = saved.steps && typeof saved.steps === 'object' ? saved.steps : {};
    return saved;
  }

  function stats(state) {
    const total = Number(state.total) || 0;
    let done = 0;
    Object.keys(state.steps || {}).forEach(function (n) { if (state.steps[n]) done += 1; });
    done = Math.min(done, total || done);
    return {done: done, total: total, percent: total ? Math.round(done / total * 100) : 0};
  }

  function save(state) {
    if (!state.startedAt) state.startedAt = nowIso();
    state.updatedAt = nowIso();
    safeWrite(key(state.labId), state);
    window.dispatchEvent(new CustomEvent('nsa:learning-progress-change', {detail: {labId: state.labId, state: state, stats: stats(state)}}));
  }

  function nextIncomplete(state, routeCards) {
    for (const card of routeCards) {
      const step = String(card.dataset.progressStep || '');
      if (!state.steps[step]) return card;
    }
    return routeCards[routeCards.length - 1] || null;
  }

  function updateLabWidget(root) {
    const labId = root.dataset.lab;
    const total = Number(root.dataset.total) || 0;
    const routeCards = Array.from(document.querySelectorAll('.lab-route-item[data-progress-step]'));
    const state = get(labId, total || routeCards.length);
    state.total = total || routeCards.length;
    const s = stats(state);

    const summary = root.querySelector('[data-progress-summary]');
    const bar = root.querySelector('[data-progress-bar]');
    if (summary) summary.textContent = s.done + ' из ' + s.total + ' этапов · ' + s.percent + '%';
    if (bar) { bar.max = s.total || 1; bar.value = s.done; bar.textContent = s.percent + '%'; }

    routeCards.forEach(function (card) {
      const step = String(card.dataset.progressStep || '');
      const done = !!state.steps[step];
      card.classList.toggle('is-progress-done', done);
      const toggle = card.querySelector('[data-progress-toggle]');
      const label = card.querySelector('[data-progress-toggle-label]');
      const icon = card.querySelector('.progress-step-icon');
      if (toggle) toggle.setAttribute('aria-pressed', done ? 'true' : 'false');
      if (label) label.textContent = done ? 'Этап выполнен' : 'Отметить этап';
      if (icon) icon.textContent = done ? '✓' : '○';
    });

    const next = nextIncomplete(state, routeCards);
    const continueLinks = Array.from(document.querySelectorAll('[data-progress-continue], [data-progress-continue-link]'));
    continueLinks.forEach(function (link) {
      if (s.done >= s.total && s.total) {
        link.href = '#submit';
        link.textContent = link.hasAttribute('data-progress-continue-link') ? 'Все этапы отмечены · перейти к отчёту →' : 'Перейти к отчёту';
        return;
      }
      if (!next) return;
      const anchor = next.dataset.progressAnchor || '';
      link.href = anchor ? '#' + anchor : '#main';
      if (link.hasAttribute('data-progress-continue-link')) link.textContent = 'Продолжить: этап ' + next.dataset.progressStep + ' →';
      else link.textContent = s.done ? 'Продолжить практику' : 'Начать практику';
    });

    return state;
  }

  function bindLab(root) {
    const labId = root.dataset.lab;
    const total = Number(root.dataset.total) || document.querySelectorAll('.lab-route-item[data-progress-step]').length;
    root.dataset.total = String(total);
    updateLabWidget(root);

    document.querySelectorAll('[data-progress-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        const step = String(button.dataset.progressToggle || '');
        const state = get(labId, total);
        state.steps[step] = !state.steps[step];
        save(state);
        updateLabWidget(root);
      });
    });

    const reset = root.querySelector('[data-progress-reset]');
    if (reset) reset.addEventListener('click', function () {
      if (!window.confirm('Сбросить только ваши отметки прохождения ' + labId.toUpperCase() + '? Результаты отчёта и MCQ не удаляются.')) return;
      safeRemove(key(labId));
      updateLabWidget(root);
      window.dispatchEvent(new CustomEvent('nsa:learning-progress-change', {detail: {labId: labId, state: get(labId, total), stats: {done:0,total:total,percent:0}}}));
    });

    // The MCQ stage is a real learning activity, so completing every question
    // can gently mark the final route stage. This never affects a grade.
    window.addEventListener('nsa:quiz-complete', function (event) {
      if (!event.detail || event.detail.labId !== labId || !event.detail.completed) return;
      const cards = Array.from(document.querySelectorAll('.lab-route-item[data-progress-step]'));
      const last = cards[cards.length - 1];
      if (!last) return;
      const step = String(last.dataset.progressStep || '');
      const state = get(labId, total);
      if (!state.steps[step]) {
        state.steps[step] = true;
        save(state);
        updateLabWidget(root);
      }
    });
  }

  function updateHomeCard(card) {
    const labId = card.dataset.homeProgressLab;
    const total = Number(card.dataset.homeProgressTotal) || 5;
    const state = get(labId, total);
    const s = stats(state);
    const completion = getCompleteness(labId);
    const text = card.querySelector('[data-home-progress-text]');
    const bar = card.querySelector('[data-home-progress-bar]');
    const completionText = card.querySelector('[data-home-completeness-text]');
    const completionBar = card.querySelector('[data-home-completeness-bar]');
    const updated = card.querySelector('[data-home-completeness-updated]');
    const stateBadge = card.querySelector('[data-home-card-state]');
    const link = card.querySelector('[data-home-progress-link]');

    if (text) text.textContent = s.done ? s.done + ' / ' + s.total + ' этапов · ' + s.percent + '%' : '0 / ' + s.total + ' · можно начать';
    if (bar) { bar.max = s.total || 1; bar.value = s.done; bar.textContent = s.percent + '%'; }
    if (completionText) completionText.textContent = completion.total ? completion.percent + '% · ' + completion.complete + ' / ' + completion.total : '0% · ещё нет материалов';
    if (completionBar) { completionBar.max = 100; completionBar.value = completion.percent; completionBar.textContent = completion.percent + '%'; }
    if (updated) {
      const stamp = formatUpdated(completion.updatedAt);
      updated.textContent = stamp ? 'Последняя сводка: ' + stamp + ' · на главной хранятся только числа' : 'Появится после заполнения отчёта в лабораторной';
    }

    const started = s.done > 0 || completion.percent > 0;
    const routeDone = s.total > 0 && s.done >= s.total;
    const ready = routeDone && completion.percent >= 100;
    if (stateBadge) {
      stateBadge.textContent = ready ? 'Готово к проверке' : (started ? 'В работе' : 'Можно начать');
      stateBadge.classList.toggle('ready', ready);
      stateBadge.classList.toggle('working', started && !ready);
    }
    if (link) link.textContent = ready ? 'Открыть и проверить →' : (started ? 'Продолжить ' + labId.toUpperCase() + ' →' : 'Начать ' + labId.toUpperCase() + ' →');
    card.classList.toggle('is-started', started && !ready);
    card.classList.toggle('is-complete', ready);
  }

  function updateOverallProgress() {
    const root = document.querySelector('[data-course-progress-overall]');
    if (!root) return;
    const cards = Array.from(document.querySelectorAll('[data-home-progress-lab]'));
    let done = 0, total = 0;
    let materialDone = 0, materialTotal = 0;
    let nextCard = null;
    cards.forEach(function (card) {
      const labId = card.dataset.homeProgressLab;
      const labTotal = Number(card.dataset.homeProgressTotal) || 5;
      const s = stats(get(labId, labTotal));
      const c = getCompleteness(labId);
      done += s.done; total += s.total;
      if (c.total > 0) { materialDone += c.complete; materialTotal += c.total; }
      if (!nextCard && s.done < s.total) nextCard = card;
    });
    const percent = total ? Math.round(done / total * 100) : 0;
    const text = root.querySelector('[data-overall-progress-text]');
    const bar = root.querySelector('[data-overall-progress-bar]');
    const link = root.querySelector('[data-overall-progress-link]');
    const materialsText = root.querySelector('[data-overall-completeness-text]');
    if (text) text.textContent = done ? done + ' / ' + total + ' этапов · ' + percent + '%' : 'Ещё не начато · ' + total + ' этапов впереди';
    if (materialsText) {
      const materialPercent = materialTotal ? Math.round(materialDone / materialTotal * 100) : 0;
      materialsText.textContent = materialTotal
        ? 'Материалы начатых работ: ' + materialDone + ' / ' + materialTotal + ' · ' + materialPercent + '% · не оценка'
        : 'Материалы к отчёту: сводка появится после работы в лабораторной.';
    }
    if (bar) { bar.max = total || 1; bar.value = done; bar.textContent = percent + '%'; }
    if (link) {
      if (nextCard) {
        const labId = nextCard.dataset.homeProgressLab || 'lx0';
        const href = nextCard.querySelector('[data-home-progress-link]');
        if (href) link.href = href.getAttribute('href') || link.href;
        link.textContent = (done ? 'Продолжить → ' : 'Начать → ') + labId.toUpperCase();
      } else if (total) {
        link.textContent = 'Все доступные этапы отмечены ✓';
        link.href = '#assessment';
      }
    }

    document.querySelectorAll('[data-course-resume-link]').forEach(function (resume) {
      if (nextCard) {
        const labId = nextCard.dataset.homeProgressLab || 'lx0';
        const href = nextCard.querySelector('[data-home-progress-link]');
        if (href) resume.href = href.getAttribute('href') || resume.href;
        resume.textContent = (done ? 'Продолжить с ' : 'Начать с ') + labId.toUpperCase() + ' ↗';
      } else if (total) {
        resume.href = '#assessment';
        resume.textContent = 'Повторить и закрепить знания ↓';
      }
    });
  }

  function updateHome() {
    document.querySelectorAll('[data-home-progress-lab]').forEach(updateHomeCard);
    updateOverallProgress();
  }

  document.querySelectorAll('[data-learning-progress]').forEach(bindLab);
  updateHome();
  window.addEventListener('storage', updateHome);
  window.addEventListener('nsa:learning-progress-change', updateHome);
  window.addEventListener('nsa:submission-completeness-change', updateHome);

  window.NSALearningProgress = {
    get: function (labId, total) { const state = get(labId, total); return Object.assign({}, state, stats(state)); },
    getCompleteness: getCompleteness,
    reset: function (labId) { safeRemove(key(labId)); }
  };
})();

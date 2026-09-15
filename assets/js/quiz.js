(function () {
  'use strict';

  // Persist across tab closes — matches the course's "progress saved in browser" promise.
  const NS = 'nsa:quiz:v1:';

  function safeStore(key, value) {
    try { localStorage.setItem(NS + key, value); } catch (e) {}
  }

  function safeRead(key) {
    try { return localStorage.getItem(NS + key) || ''; } catch (e) { return ''; }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(NS + key); } catch (e) {}
  }

  function enhanceQuiz(root) {
    if (!root || root.dataset.quizBound === 'true') return;
    const id = root.dataset.quiz || 'quiz';
    const cards = Array.from(root.querySelectorAll('[data-quiz-card]'));
    const scoreBox = root.querySelector('[data-quiz-score]');
    if (!cards.length) return;

    let completed = 0;
    let retryCount = 0;
    const reviewTopics = new Map();

    function updateScore() {
      if (!scoreBox) return;
      scoreBox.textContent = 'Пройдено: ' + completed + ' / ' + cards.length + ' · Можно пробовать снова — без штрафа';
    }

    function shuffleOptions(card) {
      const wrap = card.querySelector('.quiz-options');
      if (!wrap) return;
      const options = Array.from(wrap.children);
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = options[i];
        options[i] = options[j];
        options[j] = tmp;
      }
      options.forEach(function (option) { wrap.appendChild(option); });
    }

    function clearSavedQuiz() {
      if (id === 'foundation') return;
      safeRemove(id + ':quiz');
      safeRemove(id + ':quiz-meta');
      const saved = root.parentElement && root.parentElement.querySelector('.quiz-saved-result');
      if (saved) saved.remove();
    }

    function resetQuiz() {
      completed = 0;
      retryCount = 0;
      reviewTopics.clear();
      clearSavedQuiz();
      cards.forEach(function (card) {
        card.dataset.done = 'false';
        card.dataset.attempts = '0';
        card.classList.remove('is-mastered');
        const feedback = card.querySelector('[data-feedback]');
        const prefix = card.querySelector('[data-feedback-prefix]');
        const explanation = card.querySelector('[data-feedback-explain]');
        const options = Array.from(card.querySelectorAll('[data-quiz-option]'));
        options.forEach(function (button) {
          button.disabled = false;
          button.classList.remove('correct', 'incorrect', 'try-again');
          button.removeAttribute('aria-disabled');
        });
        if (prefix) prefix.textContent = '';
        if (explanation) explanation.hidden = true;
        if (feedback) feedback.classList.remove('is-visible');
        shuffleOptions(card);
      });
      const existing = root.querySelector('.quiz-result');
      if (existing) existing.remove();
      const jump = scoreBox && scoreBox.querySelector('.quiz-result-link');
      if (jump) {
        const previousText = jump.previousSibling;
        if (previousText && previousText.nodeType === Node.TEXT_NODE) previousText.remove();
        jump.remove();
      }
      updateScore();
      if (id !== 'foundation') window.dispatchEvent(new CustomEvent('nsa:quiz-reset', { detail: { labId: id } }));
      const first = cards[0];
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function finish() {
      if (root.querySelector('.quiz-result')) return;
      const resultLine = (id === 'foundation' ? 'FOUNDATION' : id.toUpperCase()) + ' · MCQ: пройдено ' + completed + ' / ' + cards.length + ' · повторные попытки разрешены';

      if (id !== 'foundation') {
        if (window.NSAEvidencePad && typeof window.NSAEvidencePad.saveQuiz === 'function') window.NSAEvidencePad.saveQuiz(resultLine);
        else safeStore(id + ':quiz', resultLine);
        safeStore(id + ':quiz-meta', JSON.stringify({
          total: cards.length,
          answered: completed,
          mastered: completed,
          retries: retryCount,
          completed: completed === cards.length
        }));
        window.dispatchEvent(new CustomEvent('nsa:quiz-complete', { detail: {
          labId: id,
          result: resultLine,
          total: cards.length,
          answered: completed,
          mastered: completed,
          retries: retryCount,
          completed: completed === cards.length
        }}));
      }

      const result = document.createElement('section');
      result.className = 'quiz-result';
      result.id = 'quiz-result-' + id;
      result.setAttribute('aria-live', 'polite');

      const receipt = document.createElement('div');
      receipt.className = 'quiz-receipt';
      const title = document.createElement('h3');
      title.textContent = (id === 'foundation' ? 'Самопроверка LX0–LX3' : id.toUpperCase()) + ' · Все вопросы пройдены';
      receipt.appendChild(title);
      const course = document.createElement('p');
      course.textContent = root.dataset.course || 'Сетевые системы и приложения';
      receipt.appendChild(course);
      const completion = document.createElement('p');
      completion.className = 'quiz-receipt-status';
      completion.textContent = 'Пройдено: ' + completed + ' / ' + cards.length + ' · Повторные попытки: ' + retryCount;
      receipt.appendChild(completion);
      result.appendChild(receipt);

      const note = document.createElement('p');
      note.textContent = id === 'foundation'
        ? 'Готово. Повторите тест ещё раз, если хотите закрепить темы, которые потребовали дополнительной попытки.'
        : 'Готово. Это учебная самопроверка, а не оценка. Повторные попытки — нормальная часть обучения; для комплектности важно пройти все вопросы.';
      result.appendChild(note);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'quiz-copy-result';
      copy.textContent = 'Скопировать итог (резервно)';
      copy.addEventListener('click', async function () {
        try { await navigator.clipboard.writeText(resultLine); copy.textContent = 'Итог скопирован'; }
        catch (e) { copy.textContent = resultLine; }
      });
      result.appendChild(copy);

      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'quiz-retry secondary-action';
      retry.textContent = 'Пройти ещё раз для закрепления';
      retry.addEventListener('click', resetQuiz);
      result.appendChild(retry);

      const advice = document.createElement('p');
      advice.className = 'quiz-encouragement';
      advice.textContent = retryCount
        ? 'Отлично, вы довели все вопросы до правильного решения. Если какая-то тема потребовала нескольких попыток, это хороший ориентир, что стоит быстро повторить перед следующей лабораторной.'
        : 'Отлично. Все вопросы решены с первой попытки. Можно переходить к отчёту или пройти тест ещё раз для закрепления.';
      result.appendChild(advice);

      if (reviewTopics.size) {
        const label = document.createElement('p');
        label.textContent = 'Темы, к которым было полезно вернуться во время теста:';
        result.appendChild(label);
        const list = document.createElement('ul');
        reviewTopics.forEach(function (section, topic) {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.textContent = topic;
          link.href = section || '#main';
          li.appendChild(link);
          list.appendChild(li);
        });
        result.appendChild(list);
      }

      root.appendChild(result);
      if (scoreBox && !scoreBox.querySelector('.quiz-result-link')) {
        const jump = document.createElement('a');
        jump.className = 'quiz-result-link';
        jump.href = '#' + result.id;
        jump.textContent = 'К итогу MCQ ↓';
        scoreBox.appendChild(document.createTextNode(' · '));
        scoreBox.appendChild(jump);
      }
    }

    cards.forEach(function (card) {
      shuffleOptions(card);
      card.dataset.done = 'false';
      card.dataset.attempts = '0';
      const options = Array.from(card.querySelectorAll('[data-quiz-option]'));
      const feedback = card.querySelector('[data-feedback]');
      const prefix = card.querySelector('[data-feedback-prefix]');
      const explanation = card.querySelector('[data-feedback-explain]');
      if (explanation) explanation.hidden = true;

      options.forEach(function (button) {
        button.addEventListener('click', function () {
          if (card.dataset.done === 'true' || button.disabled) return;
          const answerIndex = Number(card.dataset.answer);
          const correct = Number(button.dataset.optionIndex) === answerIndex;
          const attempts = Number(card.dataset.attempts || 0) + 1;
          card.dataset.attempts = String(attempts);

          if (correct) {
            card.dataset.done = 'true';
            card.classList.add('is-mastered');
            completed += 1;
            button.classList.add('correct');
            options.forEach(function (b) { b.disabled = true; });
            if (prefix) prefix.textContent = attempts === 1
              ? 'Верно — хороший выбор. '
              : 'Получилось. Вы нашли правильный вариант. ';
            if (explanation) explanation.hidden = false;
            if (feedback) feedback.classList.add('is-visible');
            updateScore();
            if (completed === cards.length) finish();
            return;
          }

          retryCount += 1;
          reviewTopics.set(card.dataset.topic || 'Тема', card.dataset.review || '#main');
          button.classList.add('try-again');
          button.disabled = true;
          button.setAttribute('aria-disabled', 'true');
          if (prefix) prefix.textContent = attempts === 1
            ? 'Хорошая попытка. Этот вариант не подходит — посмотрите объяснение и попробуйте другой. '
            : 'Продолжайте: сравните оставшиеся варианты и попробуйте ещё раз. ';
          if (explanation) explanation.hidden = false;
          if (feedback) feedback.classList.add('is-visible');
          updateScore();
        });
      });
    });

    root.dataset.quizBound = 'true';
    updateScore();

    if (id !== 'foundation') {
      const previous = safeRead(id + ':quiz').trim();
      if (previous && scoreBox) {
        const saved = document.createElement('div');
        saved.className = 'quiz-saved-result';
        saved.textContent = 'В этом браузере уже есть завершённая самопроверка: ' + previous + '. Можно пройти тест ещё раз для закрепления.';
        scoreBox.insertAdjacentElement('afterend', saved);
      }
    }
  }

  document.querySelectorAll('[data-quiz]').forEach(enhanceQuiz);
})();
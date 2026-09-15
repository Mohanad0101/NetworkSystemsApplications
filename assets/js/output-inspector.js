(function(){
'use strict';
document.querySelectorAll('[data-output-inspector]').forEach(function(box){
  var correct = Number(box.dataset.correct);
  var note = box.querySelector('[data-output-explain]');
  var explanation = (box.querySelector('[data-correct-explanation]') || {}).textContent || '';
  var defaultText = note ? note.textContent : '';

  box.querySelectorAll('[data-line-index]').forEach(function(btn){
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function(){
      var ok = Number(btn.dataset.lineIndex) === correct;
      box.querySelectorAll('[data-line-index]').forEach(function(b){
        b.classList.remove('is-right', 'is-look');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add(ok ? 'is-right' : 'is-look');
      btn.setAttribute('aria-pressed', 'true');
      if (note) {
        note.textContent = ok
          ? explanation
          : 'Эта строка сообщает полезный факт, но не тот, который лучше всего отвечает на вопрос. Сравните её с остальными.';
      }
      if (ok) {
        try { localStorage.setItem('nsa:inspect:' + location.pathname, 'yes'); } catch (e) {}
      }
    });
  });

  var reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'output-inspector-reset';
  reset.textContent = 'Сбросить выбор';
  reset.addEventListener('click', function(){
    box.querySelectorAll('[data-line-index]').forEach(function(b){
      b.classList.remove('is-right', 'is-look');
      b.setAttribute('aria-pressed', 'false');
    });
    if (note) note.textContent = defaultText;
  });

  var controls = box.querySelector('.output-inspector-controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'output-inspector-controls';
    box.appendChild(controls);
  }
  controls.appendChild(reset);
});
})();
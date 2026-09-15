(function(){
'use strict';

function norm(s){ return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

document.querySelectorAll('[data-learning-deck]').forEach(function(deck){
  var slides = Array.from(deck.querySelectorAll('[data-deck-slide]'));
  if (!slides.length) return;
  var i = 0;
  var prev = deck.querySelector('[data-deck-prev]');
  var next = deck.querySelector('[data-deck-next]');
  var current = deck.querySelector('[data-deck-current]');
  var dots = Array.from(deck.querySelectorAll('.deck-dots span'));
  var labId = deck.dataset.learningDeck;

  function show(n){
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function(s, k){
      var active = k === i;
      s.hidden = !active;
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    dots.forEach(function(d, k){ d.classList.toggle('is-active', k === i); });
    if (current) current.textContent = i + 1;
    if (prev) prev.disabled = i === 0;
    if (next) next.textContent = i === slides.length - 1 ? 'К практике ↓' : 'Далее →';
    try {
      localStorage.setItem('nsa:deck:' + labId, String(i));
      if (i === slides.length - 1) {
        localStorage.setItem('nsa:deck-complete:' + labId, 'yes');
        deck.classList.add('is-complete');
      }
    } catch (e) {}
  }

  if (prev) prev.addEventListener('click', function(){ show(i - 1); });
  if (next) next.addEventListener('click', function(){
    if (i === slides.length - 1) {
      try { localStorage.setItem('nsa:deck-complete:' + labId, 'yes'); } catch (e) {}
      window.dispatchEvent(new CustomEvent('nsa:deck-complete', { detail: { labId: labId } }));
      var target = deck.nextElementSibling;
      while (target && !target.matches('section, h2')) target = target.nextElementSibling;
      if (target) {
        target.scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start'
        });
      }
      return;
    }
    show(i + 1);
  });

  deck.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' && i < slides.length - 1) { e.preventDefault(); show(i + 1); }
    if (e.key === 'ArrowLeft'  && i > 0)                 { e.preventDefault(); show(i - 1); }
  });

  deck.querySelectorAll('[data-deck-choice]').forEach(function(box){
    var answer = norm(box.dataset.answer);
    var slide = box.closest('[data-deck-slide]');
    var feedbackEl = box.querySelector('[data-deck-feedback]');
    box.querySelectorAll('button').forEach(function(btn){
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function(){
        var ok = norm(btn.dataset.choice) === answer;
        box.querySelectorAll('button').forEach(function(b){
          b.classList.remove('is-correct', 'is-try');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add(ok ? 'is-correct' : 'is-try');
        btn.setAttribute('aria-pressed', ok ? 'true' : 'false');
        if (feedbackEl) {
          var explicit = slide ? slide.dataset.feedback : '';
          if (ok && explicit) {
            feedbackEl.textContent = explicit;
          } else if (ok) {
            feedbackEl.textContent = 'Верно. Свяжите этот вывод с практикой ниже.';
          } else {
            feedbackEl.textContent = 'Посмотрите на схему ещё раз и попробуйте другой вариант.';
          }
        }
      });
    });
  });

  deck.querySelectorAll('.deck-hotspot').forEach(function(btn){
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function(){
      var group = btn.closest('.deck-hotspots');
      var note = group && group.querySelector('[data-hotspot-note]');
      group.querySelectorAll('.deck-hotspot').forEach(function(b){
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      if (note) note.textContent = btn.dataset.hotspotText || '';
    });
  });

  var saved = 0;
  try { saved = parseInt(localStorage.getItem('nsa:deck:' + labId) || '0', 10) || 0; } catch (e) {}
  show(Math.max(0, Math.min(saved, slides.length - 1)));
});
})();
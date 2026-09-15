(function(){
'use strict';
document.querySelectorAll('[data-learning-deck]').forEach(function(deck){
  var slides=Array.from(deck.querySelectorAll('[data-deck-slide]')), i=0;
  var prev=deck.querySelector('[data-deck-prev]'), next=deck.querySelector('[data-deck-next]');
  var current=deck.querySelector('[data-deck-current]'), dots=Array.from(deck.querySelectorAll('.deck-dots span'));
  function show(n){
    i=Math.max(0,Math.min(slides.length-1,n));
    slides.forEach(function(s,k){s.hidden=k!==i;s.classList.toggle('is-active',k===i);});
    dots.forEach(function(d,k){d.classList.toggle('is-active',k===i);});
    current.textContent=i+1; prev.disabled=i===0;
    next.textContent=i===slides.length-1?'К практике ↓':'Далее →';
    try{
      localStorage.setItem('nsa:deck:'+deck.dataset.learningDeck,String(i));
      if(i===slides.length-1){
        localStorage.setItem('nsa:deck-complete:'+deck.dataset.learningDeck,'yes');
        deck.classList.add('is-complete');
        window.dispatchEvent(new CustomEvent('nsa:deck-complete',{detail:{labId:deck.dataset.learningDeck}}));
      }
    }catch(e){}
  }
  prev.addEventListener('click',function(){show(i-1);});
  next.addEventListener('click',function(){
    if(i===slides.length-1){
      try{localStorage.setItem('nsa:deck-complete:'+deck.dataset.learningDeck,'yes');}catch(e){}
      window.dispatchEvent(new CustomEvent('nsa:deck-complete',{detail:{lab:deck.dataset.learningDeck}}));
      var target=deck.nextElementSibling;
      while(target && !target.matches('section, h2')) target=target.nextElementSibling;
      if(target) target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
      return;
    }
    show(i+1);
  });
  deck.querySelectorAll('[data-deck-choice]').forEach(function(box){
    box.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click',function(){
        var ok=btn.dataset.choice===box.dataset.answer;
        box.querySelectorAll('button').forEach(function(b){b.classList.remove('is-correct','is-try');});
        btn.classList.add(ok?'is-correct':'is-try');
        var f=box.querySelector('[data-deck-feedback]');
        var slide=btn.closest('[data-deck-slide]');
        var dataFeedback='';
        // Correct explanation is deliberately concise; wrong choices invite another look.
        f.textContent=ok?'Да. '+(slide.querySelector('.deck-copy p').textContent?'Теперь свяжите этот вывод с практикой ниже.':''):'Посмотрите на схему ещё раз и попробуйте другой вариант.';
      });
    });
  });
  
  deck.querySelectorAll('.deck-hotspot').forEach(function(btn){
    btn.addEventListener('click',function(){
      var group=btn.closest('.deck-hotspots'), note=group && group.querySelector('[data-hotspot-note]');
      group.querySelectorAll('.deck-hotspot').forEach(function(b){b.classList.remove('is-active');});
      btn.classList.add('is-active');
      if(note) note.textContent=btn.dataset.hotspotText||'';
    });
  });

  var saved=0;
  try{ saved=parseInt(localStorage.getItem('nsa:deck:'+deck.dataset.learningDeck)||'0',10)||0; }catch(e){}
  show(Math.max(0,Math.min(saved,slides.length-1)));
});
})();
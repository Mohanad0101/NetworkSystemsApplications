(function(){
'use strict';
document.querySelectorAll('[data-output-inspector]').forEach(function(box){
 var correct=Number(box.dataset.correct), note=box.querySelector('[data-output-explain]');
 var explanation=(box.querySelector('[data-correct-explanation]')||{}).textContent||'';
 box.querySelectorAll('[data-line-index]').forEach(function(btn){
   btn.addEventListener('click',function(){
     var ok=Number(btn.dataset.lineIndex)===correct;
     box.querySelectorAll('[data-line-index]').forEach(function(b){b.classList.remove('is-right','is-look');});
     btn.classList.add(ok?'is-right':'is-look');
     note.textContent=ok?explanation:'Эта строка сообщает полезный факт, но не тот, который лучше всего отвечает на вопрос. Сравните её с остальными.';
     if(ok){try{localStorage.setItem('nsa:inspect:'+location.pathname,'yes');}catch(e){}}
   });
 });
});
})();
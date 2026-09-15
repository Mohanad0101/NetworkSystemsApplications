'use strict';
const fs = require('fs');
const vm = require('vm');

class ClassList {
  constructor(){ this.values = new Set(); }
  toggle(name, on){ if(on) this.values.add(name); else this.values.delete(name); }
  contains(name){ return this.values.has(name); }
}
function el(){ return {textContent:'', value:0, max:0, href:'/labs/lx0.html', classList:new ClassList(), hasAttribute(){return false;}, setAttribute(){}, getAttribute(name){ return name==='href' ? this.href : null; }}; }
const nodes = {
  progressText: el(), progressBar: el(), completenessText: el(), completenessBar: el(), updated: el(), state: el(), link: el(),
  overallText: el(), overallBar: el(), overallLink: el(), overallMaterials: el()
};
const overallRoot = {
  querySelector(sel){
    const map = {
      '[data-overall-progress-text]': nodes.overallText,
      '[data-overall-progress-bar]': nodes.overallBar,
      '[data-overall-progress-link]': nodes.overallLink,
      '[data-overall-completeness-text]': nodes.overallMaterials
    };
    return map[sel] || null;
  }
};
const card = {
  dataset: {homeProgressLab:'lx0', homeProgressTotal:'5'},
  classList: new ClassList(),
  querySelector(sel){
    const map = {
      '[data-home-progress-text]': nodes.progressText,
      '[data-home-progress-bar]': nodes.progressBar,
      '[data-home-completeness-text]': nodes.completenessText,
      '[data-home-completeness-bar]': nodes.completenessBar,
      '[data-home-completeness-updated]': nodes.updated,
      '[data-home-card-state]': nodes.state,
      '[data-home-progress-link]': nodes.link
    };
    return map[sel] || null;
  }
};
const store = new Map();
store.set('nsa-learning-progress:v1:lx0', JSON.stringify({labId:'lx0', total:5, steps:{'1':true,'2':true,'3':true}, updatedAt:'2026-09-03T15:00:00Z'}));
store.set('nsa-submission-completeness:v1:lx0', JSON.stringify({labId:'lx0', percent:55, complete:6, total:11, verified:4, review:2, updatedAt:'2026-09-03T15:01:00Z'}));
const localStorage = {getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const listeners = {};
const windowObj = {addEventListener:(n,fn)=>{listeners[n]=fn;}, dispatchEvent:()=>{}, NSALearningProgress:null};
const documentObj = {
  querySelectorAll(sel){ if(sel==='[data-learning-progress]') return []; if(sel==='[data-home-progress-lab]') return [card]; if(sel==='[data-course-resume-link]') return []; return []; },
  querySelector(sel){ if(sel==='[data-course-progress-overall]') return overallRoot; return null; }
};
const sandbox = {window:windowObj, document:documentObj, localStorage, CustomEvent:function(name,init){this.type=name;this.detail=init&&init.detail;}, Map, Set, Object, Number, Math, Date, Intl, JSON, console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/../assets/js/progress.js','utf8'), sandbox);
function assert(cond,msg){ if(!cond){ console.error('FAIL',msg); process.exit(1);} console.log('PASS',msg); }
assert(nodes.progressText.textContent.includes('3 / 5') && nodes.progressText.textContent.includes('60%'), 'learning route appears on main card');
assert(nodes.completenessText.textContent === '55% · 6 / 11', '55% lab completeness appears on main card');
assert(nodes.state.textContent === 'В работе', 'card status reflects ongoing work');
assert(nodes.link.textContent === 'Продолжить LX0 →', 'card CTA changes to continue');
assert(nodes.completenessBar.value === 55, 'completeness progress bar is synchronized');
assert(nodes.overallMaterials.textContent.includes('55%'), '55% completeness also appears in the main course summary');
console.log('Progress sync QA complete.');

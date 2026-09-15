(function () {
  const controls = document.querySelector('.course-catalog-controls');
  if (!controls) return;
  const search = document.getElementById('course-search');
  const status = document.getElementById('course-search-status');
  const cards = Array.from(document.querySelectorAll('[data-course-topic]'));
  const groups = Array.from(document.querySelectorAll('.course-module'));
  const filters = Array.from(document.querySelectorAll('[data-course-filter]'));
  const empty = document.querySelector('.course-no-results');
  let filter = 'all';
  const normalize = (value) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  function update() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const text = normalize(card.dataset.search + ' ' + card.textContent);
      const matches = (filter === 'all' || card.dataset.ready === 'true') && terms.every(term => text.includes(term));
      card.hidden = !matches;
      if (matches) count++;
    });
    groups.forEach(group => { group.hidden = !cards.some(card => group.contains(card) && !card.hidden); });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.courseFilter === filter)));
    status.textContent = 'Показано тем: ' + count + ' из ' + cards.length;
    empty.hidden = count !== 0;
  }
  search.addEventListener('input', update);
  filters.forEach(button => button.addEventListener('click', () => { filter = button.dataset.courseFilter; update(); }));
  function revealAnchor() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id.startsWith('module-') && !id.startsWith('topic-')) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.hidden || target.closest('.course-module[hidden]')) {
      filter = 'all'; search.value = ''; update(); target.scrollIntoView({block:'start'});
    }
  }
  // A repeated click on the same hash does not necessarily emit hashchange.
  document.querySelectorAll('a[href^="#module-"],a[href^="#topic-"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (target && (target.hidden || target.closest('.course-module[hidden]'))) { filter = 'all'; search.value = ''; update(); }
  }));
  window.addEventListener('hashchange', revealAnchor);
  controls.hidden = false; update(); revealAnchor();
})();

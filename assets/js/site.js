(function () {
  document.querySelectorAll('main table').forEach(function (table) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Таблица: на узком экране прокручивается по горизонтали');
    table.before(wrapper);
    wrapper.appendChild(table);
  });
})();

(function () {
  const contents = document.querySelector('.lab-contents');
  const list = document.querySelector('[data-lab-toc]');
  if (!contents || !list) return;
  document.querySelectorAll('main h2[id]').forEach(function (heading) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + encodeURIComponent(heading.id);
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
  });
  contents.hidden = list.children.length === 0;
})();

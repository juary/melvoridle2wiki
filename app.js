const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});
const search = document.querySelector('#search');
const topics = [...document.querySelectorAll('.topic')];
search.addEventListener('input', () => {
  const query = search.value.trim().toLowerCase();
  let matches = 0;
  topics.forEach((topic) => {
    const visible = `${topic.dataset.search} ${topic.textContent}`.toLowerCase().includes(query);
    topic.hidden = !visible;
    if (visible) matches++;
  });
  document.querySelector('#no-results').hidden = matches > 0;
});

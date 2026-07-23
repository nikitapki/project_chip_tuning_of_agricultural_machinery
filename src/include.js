// Общий загрузчик HTML-компонентов. Ничего не знает про header/footer конкретно —
// просто вставляет фрагмент в указанный элемент.
async function loadInclude(placeholderId, url) {
  const el = document.getElementById(placeholderId);
  if (!el) return;
  const res = await fetch(url);
  el.innerHTML = await res.text();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadInclude('header-placeholder', 'header/header.html');
  await loadInclude('footer-placeholder', 'footer/footer.html');

  // header.js уже загружен как <script> к этому моменту,
  // initHeader() просто ждала, пока header появится в DOM
  if (typeof initHeader === 'function') initHeader();
});

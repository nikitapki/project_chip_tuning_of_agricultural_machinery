// Вся интерактивность header (табы, бургер-меню) живёт только здесь.
// Функция вызывается из include.js после того, как header.html реально вставлен в DOM.
function initHeader() {
  // Подсвечиваем ссылку, соответствующую текущей странице.
  // Работает и при обычной навигации (полная перезагрузка), потому что
  // проверка идёт заново при каждой загрузке страницы.
  const currentPath = location.pathname;
  const links = document.querySelectorAll('.menu-links a, .mobile-menu a');

  links.forEach(link => {
    const linkPath = link.getAttribute('href');
    const isActive = linkPath === currentPath ||
      (linkPath !== '/' && currentPath.startsWith(linkPath));
    link.classList.toggle('active', isActive);
    if (link.hasAttribute('aria-selected')) {
      link.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  });

  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!burger || !mobileMenu) return;

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
  });
}

document.addEventListener('DOMContentLoaded', initHeader);
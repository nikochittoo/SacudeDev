// ── Navbar: añadir clase "scrolled" al hacer scroll ──
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });


// ── Menú hamburguesa (mobile) ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  // Bloquear scroll del body cuando el menú está abierto
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  document.body.style.overflow = '';
}

// Cerrar menú al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileMenu();
});


// ── FAQ Accordion ──
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const btn = item.querySelector('.faq-question');

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Cerrar todos
    faqItems.forEach((el) => {
      el.classList.remove('open');
      el.querySelector('.faq-question').setAttribute('aria-expanded', false);
    });

    // Abrir el clickeado (si no estaba abierto)
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', true);
    }
  });
});


// ── Scroll Reveal (IntersectionObserver) ──

// Secciones enteras (.reveal)
const revealSections = document.querySelectorAll('.reveal');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      sectionObserver.unobserve(entry.target); // una sola vez
    }
  });
}, { threshold: 0.08 });

revealSections.forEach((el) => sectionObserver.observe(el));


// Cards con delay escalonado (.reveal-card)
const revealCards = document.querySelectorAll('.reveal-card');

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealCards.forEach((el) => cardObserver.observe(el));


// ── Smooth active link highlight en navbar ──
// const navLinkEls = document.querySelectorAll('.nav-links .nav-link, .mobile-menu .nav-link');
// const sections   = document.querySelectorAll('section[id]');

// const linkObserver = new IntersectionObserver((entries) => {
//   entries.forEach((entry) => {
//     if (entry.isIntersecting) {
//       const id = entry.target.getAttribute('id');
//       navLinkEls.forEach((link) => {
//         link.classList.toggle(
//           'active-link',
//           link.getAttribute('href') === `#${id}`
//         );
//       });
//     }
//   });
// }, { threshold: 0.35 });

sections.forEach((sec) => linkObserver.observe(sec));


// ── Pequeño efecto parallax en los blobs del hero ──
const blob1 = document.querySelector('.blob-1');
const blob2 = document.querySelector('.blob-2');

window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 30;
  const y = (e.clientY / window.innerHeight - 0.5) * 30;

  if (blob1) blob1.style.transform = `translate(${x}px, ${y}px)`;
  if (blob2) blob2.style.transform = `translate(${-x * 0.6}px, ${-y * 0.6}px)`;
}, { passive: true });

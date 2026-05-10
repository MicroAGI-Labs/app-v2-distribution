/* ── NAV scroll state ─────────────────────────────────────── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }, { passive: true });

  const toggle = nav.querySelector('.nav__toggle');
  const navLinks = nav.querySelector('.nav__links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav__links--open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav__links--open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ── Reveal on scroll ─────────────────────────────────────── */
const revealEls = document.querySelectorAll(
  '.how__headline, .how__step, .how__pillar, ' +
  '.contact__headline, .contact__content, ' +
  '.support__card, .support__topics li'
);
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

document.querySelectorAll('.how__steps, .how__pillars, .support__topics').forEach(parent => {
  parent.querySelectorAll('.how__step, .how__pillar, li').forEach((child, i) => {
    child.style.transitionDelay = `${i * 0.08}s`;
  });
});

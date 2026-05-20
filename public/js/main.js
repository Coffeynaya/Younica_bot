(function () {
  'use strict';

  // === HEADER SCROLL ===
  const header = document.getElementById('header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // === BURGER MENU ===
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.classList.toggle('burger--open', isOpen);
  });

  // Close nav on link click (mobile)
  nav.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      burger.classList.remove('burger--open');
    });
  });

  // === CONTACT FORM ===
  const form = document.getElementById('contactForm');
  const successEl = document.getElementById('formSuccess');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      shakeForm();
      return;
    }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправка...';

    // Simulate form submission delay
    await new Promise((res) => setTimeout(res, 1200));

    btn.disabled = false;
    btn.textContent = 'Отправить заявку';
    successEl.classList.add('visible');
    form.reset();

    setTimeout(() => successEl.classList.remove('visible'), 5000);
  });

  function shakeForm() {
    form.style.animation = 'shake 0.4s ease';
    form.addEventListener('animationend', () => {
      form.style.animation = '';
    }, { once: true });
  }

  // === INTERSECTION OBSERVER — fade-in on scroll ===
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.service-card, .portfolio-item, .about__card, .contact__form').forEach((el) => {
    el.classList.add('fade-in-up');
    observer.observe(el);
  });

  // === ACTIVE NAV LINK ON SCROLL ===
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach((s) => sectionObserver.observe(s));

})();

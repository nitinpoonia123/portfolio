// Enable enhanced styles only when JavaScript is available.
document.documentElement.classList.add('js');

const root = document.documentElement;
const header = document.querySelector('.site-header');
const nav = document.querySelector('.main-nav');
const navLinks = [...nav.querySelectorAll('a')];
const menuButton = document.querySelector('.menu-toggle');
const themeButton = document.querySelector('.theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getSavedTheme() {
  try { return localStorage.getItem('nitin-portfolio-theme'); }
  catch { return null; }
}

function saveTheme(theme) {
  try { localStorage.setItem('nitin-portfolio-theme', theme); }
  catch { /* Theme still works if browser storage is unavailable. */ }
}

function setTheme(theme) {
  root.dataset.theme = theme;
  const next = theme === 'light' ? 'dark' : 'light';
  themeButton.setAttribute('aria-label', `Switch to ${next} theme`);
  themeMeta.setAttribute('content', theme === 'light' ? '#f3efe5' : '#171813');
}

const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
setTheme(getSavedTheme() || systemTheme);

themeButton.addEventListener('click', () => {
  const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
  setTheme(nextTheme);
  saveTheme(nextTheme);
});

function closeMenu(restoreFocus = false) {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
  nav.classList.toggle('open', opening);
});

navLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));
document.addEventListener('click', (event) => {
  if (nav.classList.contains('open') && !nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target || reducedMotion.matches) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try { history.pushState(null, '', link.getAttribute('href')); }
    catch { /* Smooth scrolling remains functional in restricted file contexts. */ }
  });
});

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 24);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55%', threshold: 0 });
  sections.forEach((section) => activeObserver.observe(section));
}

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const photo = document.querySelector('#profile-photo');
photo.addEventListener('error', () => {
  if (!photo.src.endsWith('profile-placeholder.svg')) photo.src = 'assets/profile-placeholder.svg';
}, { once: true });

document.querySelector('#year').textContent = new Date().getFullYear();

const form = document.querySelector('#contact-form');
const status = document.querySelector('#form-status');
const formFields = {
  name: { element: document.querySelector('#name'), message: 'Please enter at least 2 characters.' },
  email: { element: document.querySelector('#email'), message: 'Please enter a valid email address.' },
  message: { element: document.querySelector('#message'), message: 'Please write at least 10 characters.' }
};

function validate(field) {
  const valid = field.element.checkValidity();
  const error = document.querySelector(`#${field.element.id}-error`);
  field.element.setAttribute('aria-invalid', String(!valid));
  field.element.setAttribute('aria-describedby', error.id);
  error.textContent = valid ? '' : field.message;
  return valid;
}

Object.values(formFields).forEach((field) => {
  field.element.addEventListener('blur', () => validate(field));
  field.element.addEventListener('input', () => {
    if (field.element.getAttribute('aria-invalid') === 'true') validate(field);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const valid = Object.values(formFields).map(validate).every(Boolean);
  if (!valid) {
    status.textContent = 'Please correct the highlighted fields.';
    Object.values(formFields).find((field) => !field.element.checkValidity())?.element.focus();
    return;
  }

  const sender = formFields.name.element.value.trim();
  const replyTo = formFields.email.element.value.trim();
  const message = formFields.message.element.value.trim();
  const subject = encodeURIComponent(`Portfolio message from ${sender}`);
  const body = encodeURIComponent(`Name: ${sender}\nEmail: ${replyTo}\n\n${message}`);
  status.textContent = 'Opening your email application…';
  window.location.href = `mailto:nitin.25708@stu.upes.ac.in?subject=${subject}&body=${body}`;
});

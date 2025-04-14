const htmlElement = document.documentElement;
const switchTheme = document.getElementById('switchTheme');
const themeIcon = document.getElementById('themeIcon');

// Check for saved theme preference
if (localStorage.getItem('theme') === 'light') {
  htmlElement.setAttribute('data-bs-theme', 'light');
  themeIcon.classList.add('fi-ss-brightness');
  switchTheme.checked = false;
} else {
  htmlElement.setAttribute('data-bs-theme', 'dark');
  themeIcon.classList.add('fi-ss-moon-stars');
  switchTheme.checked = true;
}

// Toggle theme
switchTheme.addEventListener('change', () => {
  if (switchTheme.checked) {
    htmlElement.setAttribute('data-bs-theme', 'dark');
    themeIcon.classList.remove('fi-ss-brightness');
    themeIcon.classList.add('fi-ss-moon-stars');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.setAttribute('data-bs-theme', 'light');
    themeIcon.classList.remove('fi-ss-moon-stars');
    themeIcon.classList.add('fi-ss-brightness');
    localStorage.setItem('theme', 'light');
  }
});

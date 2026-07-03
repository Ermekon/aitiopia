try {
  var t = localStorage.getItem('theme');
  var resolved =
    t === 'light' ? 'light' :
    t === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') :
    'dark';
  document.documentElement.setAttribute('data-theme', resolved);
} catch (e) {}

/* Load last known-good app, then apply login/button fixes */
(function () {
  var core = document.createElement('script');
  core.src = 'https://cdn.jsdelivr.net/gh/Deviant08/NASME-fitness-gym-frontend@1ed7c64b0c58627d44f3c75e0e2b765f22c5f1f5/app.js';
  core.onload = function () {
    var fix = document.createElement('script');
    fix.src = 'ui-fix.js';
    document.body.appendChild(fix);
  };
  core.onerror = function () {
    console.error('Could not load core app.js from CDN');
  };
  document.head.appendChild(core);
})();

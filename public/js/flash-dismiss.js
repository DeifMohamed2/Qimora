/* Auto-dismiss and manual close for .flash-dismissible alert bars (admin + client) */
(function () {
  var DEFAULT_MS = 6000;

  function hide(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('flash-bar--hiding');
    window.setTimeout(function () {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 280);
  }

  function bind(el) {
    var raw = el.getAttribute('data-autoclose-ms');
    var ms = raw == null || raw === '' ? DEFAULT_MS : parseInt(raw, 10);
    if (Number.isNaN(ms)) ms = DEFAULT_MS;

    var tid = null;
    if (ms > 0) {
      tid = window.setTimeout(function () {
        hide(el);
      }, ms);
    }

    var btn = el.querySelector('[data-flash-close]');
    if (btn) {
      btn.addEventListener('click', function () {
        if (tid) window.clearTimeout(tid);
        hide(el);
      });
    }
  }

  function init() {
    document.querySelectorAll('.flash-dismissible').forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

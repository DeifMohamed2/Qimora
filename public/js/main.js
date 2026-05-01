/* ================================================================
   Qimora — Main JavaScript
   Replicates all React/Framer Motion animations:
   - Theme toggle (dark/light) with localStorage
   - Navbar scroll behavior
   - Intersection Observer scroll animations
   - Canvas particle system (Hero)
   - Contact section particle canvas (same as hero)
   - Dashboard bar chart animation
   - Team carousel (rails + whole-block scroll-in via anim-fade-up)
   - Hover effects
   - Mobile menu
   ================================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     1. LUCIDE ICONS — Initialize
     ────────────────────────────────────────────────────────────── */
  function initIcons() {
    if (window.lucide) {
      lucide.createIcons();
    } else {
      setTimeout(initIcons, 100);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     2. THEME TOGGLE
     ────────────────────────────────────────────────────────────── */
  const body = document.body;
  const saved = localStorage.getItem('qimora-theme');
  if (saved === 'light') {
    body.classList.remove('dark');
    body.classList.add('light');
    body.dataset.theme = 'light';
  }

  function isDark() {
    return body.classList.contains('dark');
  }

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const goLight = isDark();
      body.classList.toggle('dark', !goLight);
      body.classList.toggle('light', goLight);
      body.dataset.theme = goLight ? 'light' : 'dark';
      localStorage.setItem('qimora-theme', goLight ? 'light' : 'dark');

      // Re-init icons so sun/moon visibility updates
      initIcons();

      // Restart canvases for theme color change
      initHeroCanvas();
      initContactCanvas();

      // Repaint team cards for light/dark backgrounds
      repaintTeamCards();
    });
  }

  function repaintTeamCards() {
    var TEAM = window.__TEAM_CAROUSEL__;
    if (!TEAM || !TEAM.length) return;
    var isLight = body.classList.contains('light');
    document.querySelectorAll('.team-mem').forEach(function(card) {
      var g = parseInt(card.dataset.global, 10);
      var member = TEAM[g];
      if (!member) return;
      var useBg      = isLight && member.bgGradientLight ? member.bgGradientLight : member.bgGradient;
      var useBgSolid = isLight && member.bgLight         ? member.bgLight         : member.bg;
      var useDim     = isLight && member.accentDimLight  ? member.accentDimLight  : member.accentDim;
      var useShape1  = isLight && member.shape1Light     ? member.shape1Light     : member.shape1;
      var useShape2  = isLight && member.shape2Light     ? member.shape2Light     : member.shape2;
      card.style.background = useBg;
      card.style.setProperty('--tm-bg-solid', useBgSolid);
      card.style.setProperty('--tm-dim',      useDim);
      card.style.setProperty('--tm-shape1',   useShape1);
      card.style.setProperty('--tm-shape2',   useShape2);
    });
  }

  // Apply correct theme on page load if light (defer to after DOM is ready)
  if (body.classList.contains('light')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', repaintTeamCards);
    } else {
      repaintTeamCards();
    }
  }

  /* ──────────────────────────────────────────────────────────────
     3. NAVBAR — Scroll + Mobile + Active Indicator
     ────────────────────────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu
  const mobileToggle = document.getElementById('mobile-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      body.classList.toggle('mobile-open');
    });
  }

  // Smooth scroll for nav links
  document.querySelectorAll('[data-scroll]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = document.getElementById(this.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      body.classList.remove('mobile-open');
    });
  });

  // Logo: on home, smooth-scroll to top; elsewhere follow the real href (e.g. case study → /)
  const logo = document.getElementById('navbar-logo');
  if (logo) {
    logo.addEventListener('click', function (e) {
      var path = window.location.pathname || '';
      if (path === '/' || path === '') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Active nav link indicator (sliding underline + highlight)
  (function initNavIndicator() {
    var pill = document.querySelector('.navbar__center-pill');
    var indicator = document.getElementById('nav-indicator');
    var navLinks = pill ? pill.querySelectorAll('.navbar__link') : [];
    if (!pill || !indicator || navLinks.length === 0) return;

    // Map link → section id
    var sectionIds = [];
    navLinks.forEach(function(l) { sectionIds.push(l.dataset.scroll); });

    function moveIndicator(link) {
      var rect = link.getBoundingClientRect();
      var pillRect = pill.getBoundingClientRect();
      indicator.style.left = (rect.left - pillRect.left) + 'px';
      indicator.style.width = rect.width + 'px';
      indicator.classList.add('visible');
    }

    function setActive(id) {
      navLinks.forEach(function(l) {
        if (l.dataset.scroll === id) {
          l.classList.add('active');
          moveIndicator(l);
        } else {
          l.classList.remove('active');
        }
      });
    }

    // Scroll spy — highlight whichever section is in view
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          var scrollY = window.scrollY + 120;
          var current = null;
          sectionIds.forEach(function(id) {
            var sec = document.getElementById(id);
            if (sec && sec.offsetTop <= scrollY) current = id;
          });
          if (current) setActive(current);
          ticking = false;
        });
        ticking = true;
      }
    });

    // Hover preview
    navLinks.forEach(function(link) {
      link.addEventListener('mouseenter', function() { moveIndicator(link); });
      link.addEventListener('mouseleave', function() {
        var activeLink = pill.querySelector('.navbar__link.active');
        if (activeLink) moveIndicator(activeLink);
        else { indicator.classList.remove('visible'); }
      });
    });
  })();

  /* ──────────────────────────────────────────────────────────────
     4. INTERSECTION OBSERVER — Scroll Animations
     ────────────────────────────────────────────────────────────── */
  const animEls = document.querySelectorAll(
    '.anim-fade-up, .anim-fade-in, .anim-slide-right, .anim-slide-left, .anim-scale-in, .anim-benefit-card'
  );

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          setTimeout(function () {
            el.classList.add('visible');
          }, delay);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  animEls.forEach(function (el) {
    observer.observe(el);
  });

  /* ──────────────────────────────────────────────────────────────
     4b. TIMELINE SLIDE ANIMATIONS
     ────────────────────────────────────────────────────────────── */
  const tlItems = document.querySelectorAll('.tl-slide-left, .tl-slide-right');
  const tlObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || '0', 10);
          setTimeout(function () {
            el.classList.add('tl-visible');
          }, delay);
          tlObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );
  tlItems.forEach(function (el) { tlObserver.observe(el); });

  /* ──────────────────────────────────────────────────────────────
     5. HERO CANVAS — Particle System
     ────────────────────────────────────────────────────────────── */
  let heroAnimId;

  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cancel previous
    if (heroAnimId) cancelAnimationFrame(heroAnimId);

    const resize = function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    for (var i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    var dark = isDark();

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? 'rgba(255,255,255,' + p.alpha * 0.6 + ')'
          : 'rgba(255,255,255,' + p.alpha + ')';
        ctx.fill();
      });

      // Connect lines
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            var lineAlpha = dark
              ? 0.08 * (1 - dist / 120)
              : 0.2 * (1 - dist / 120);
            ctx.strokeStyle = 'rgba(255,255,255,' + lineAlpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      heroAnimId = requestAnimationFrame(animate);
    }
    animate();
  }

  /* ──────────────────────────────────────────────────────────────
     6. CONTACT CANVAS — same particle network as hero, sized to section
     ────────────────────────────────────────────────────────────── */
  let contactAnimId;

  function initContactCanvas() {
    var canvas = document.getElementById('contact-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var section = canvas.closest('.contact-section');
    if (!section) return;

    if (contactAnimId) cancelAnimationFrame(contactAnimId);

    var particles = [];
    var COUNT = 52;

    function sizeCanvas() {
      var w = section.offsetWidth;
      var h = section.offsetHeight;
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
    }

    function seedParticles() {
      particles = [];
      var w = canvas.width;
      var h = canvas.height;
      for (var i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    }

    sizeCanvas();
    seedParticles();

    if (typeof ResizeObserver !== 'undefined') {
      if (section._contactRO) {
        section._contactRO.disconnect();
      }
      var ro = new ResizeObserver(function () {
        sizeCanvas();
        seedParticles();
      });
      section._contactRO = ro;
      ro.observe(section);
    } else {
      window.addEventListener('resize', function () {
        sizeCanvas();
        seedParticles();
      });
    }

    function animate() {
      var w = canvas.width;
      var h = canvas.height;
      if (w < 2 || h < 2) {
        contactAnimId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      var dark = isDark();

      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? 'rgba(255,255,255,' + p.alpha * 0.6 + ')'
          : 'rgba(255,255,255,' + p.alpha + ')';
        ctx.fill();
      });

      var linkDist = 120;
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            var lineAlpha = dark
              ? 0.08 * (1 - dist / linkDist)
              : 0.2 * (1 - dist / linkDist);
            ctx.strokeStyle = 'rgba(255,255,255,' + lineAlpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      contactAnimId = requestAnimationFrame(animate);
    }
    animate();
  }

  /* ──────────────────────────────────────────────────────────────
     7. DASHBOARD BAR CHART — Animate on scroll
     ────────────────────────────────────────────────────────────── */
  function initDashboardBars() {
    var barsContainer = document.getElementById('dashboard-bars');
    if (!barsContainer) return;

    var bars = barsContainer.querySelectorAll('.dashboard__bar');
    var barObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            bars.forEach(function (bar, i) {
              var h = bar.dataset.height || '0';
              setTimeout(function () {
                bar.style.height = h + '%';
              }, i * 40);
            });
            barObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    barObserver.observe(barsContainer);
  }

  /* ──────────────────────────────────────────────────────────────
     8. HOVER EFFECTS — Feature cards, testimonials
     ────────────────────────────────────────────────────────────── */
  function initHoverEffects() {
    // Feature cards
    document.querySelectorAll('.feature-card').forEach(function (card) {
      var color = card.dataset.color || '#3B5BFF';
      card.addEventListener('mouseenter', function () {
        if (isDark()) {
          card.style.boxShadow =
            '0 0 30px ' + color + '22, 0 12px 40px rgba(0,0,0,0.4), inset 0 0 0 1px ' + color + '33';
          card.style.borderColor = color + '44';
        } else {
          card.style.boxShadow =
            '0 0 20px ' + color + '18, 0 16px 40px rgba(0,0,0,0.1), inset 0 0 0 1px ' + color + '30';
          card.style.borderColor = color + '55';
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.boxShadow = '';
        card.style.borderColor = '';
      });
    });

    // Footer social buttons
    document.querySelectorAll('.footer__social-btn').forEach(function (btn) {
      var color = btn.dataset.color || '#3B5BFF';
      btn.addEventListener('mouseenter', function () {
        btn.style.color = color;
        btn.style.boxShadow = '0 0 14px ' + color + '44';
        btn.style.borderColor = color + '44';
        btn.style.background = color + '12';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.color = '#94A3B8';
        btn.style.boxShadow = 'none';
        btn.style.borderColor = 'rgba(255,255,255,0.07)';
        btn.style.background = 'rgba(255,255,255,0.04)';
      });
    });

    // Portfolio v2 cards — accent glow on hover
    document.querySelectorAll('.pf2-card').forEach(function(card) {
      var accent = getComputedStyle(card).getPropertyValue('--accent').trim() || '#F97316';
      var glow   = getComputedStyle(card).getPropertyValue('--glow').trim()   || 'rgba(249,115,22,0.18)';
      card.addEventListener('mouseenter', function() {
        card.style.borderColor = accent + '44';
        card.style.boxShadow   = '0 0 60px ' + glow + ', 0 20px 60px rgba(0,0,0,0.5)';
      });
      card.addEventListener('mouseleave', function() {
        card.style.borderColor = '';
        card.style.boxShadow   = '';
      });
    });

    // Logo banner names hover
    document.querySelectorAll('.logo-banner__name').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        el.style.color = isDark()
          ? 'rgba(229,231,235,0.7)'
          : 'rgba(15,23,42,0.6)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.color = '';
      });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     9. PORTFOLIO SECTION ANIMATIONS (pf2)
     ────────────────────────────────────────────────────────────── */
  function initPortfolioAnimations() {

    /* ── Header elements ── */
    var pf2Anims = document.querySelectorAll('.pf2-anim');
    if (pf2Anims.length) {
      var headerObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.dataset.pf2Delay || el.dataset.pf2delay || '0', 10);
          setTimeout(function() {
            el.classList.add('pf2-visible');
          }, delay);
          headerObserver.unobserve(el);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      pf2Anims.forEach(function(el) { headerObserver.observe(el); });
    }

    /* ── Cards ── */
    var cards = document.querySelectorAll('.pf2-card--anim');
    if (!cards.length) return;

    var cardObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        /* Fire card animation immediately when it enters viewport */
        setTimeout(function() {
          /* 1. Card slides in */
          card.classList.add('pf2-card--visible');

          /* 2. Stagger each content row */
          card.querySelectorAll('.pf2-card__row--anim').forEach(function(row) {
            var rowDelay = parseInt(row.dataset.rowDelay || '0', 10);
            setTimeout(function() {
              row.style.transitionDelay = '0ms'; /* clear any CSS delay — we control it */
              row.style.opacity = '1';
              row.style.transform = 'translateY(0)';
            }, rowDelay);
          });

          /* 3. Tags pop in one by one */
          card.querySelectorAll('.pf2-card__tag--anim').forEach(function(tag) {
            var tagDelay = parseInt(tag.dataset.tagDelay || '0', 10);
            setTimeout(function() {
              tag.style.opacity = '1';
              tag.style.transform = 'scale(1) translateY(0)';
            }, tagDelay + 240);
          });

          /* 4. Metric values pop */
          card.querySelectorAll('.pf2-card__metric-value').forEach(function(mv, mi) {
            setTimeout(function() {
              mv.classList.add('pf2-metric-counted');
            }, 200 + mi * 80);
          });

        }, 0);

        cardObserver.unobserve(card);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    cards.forEach(function(card) { cardObserver.observe(card); });
  }

  /* ──────────────────────────────────────────────────────────────
     11. TEAM CAROUSEL
     ────────────────────────────────────────────────────────────── */
  function fadeSwapPhoto(img, url, alt) {
    if (!img) return;
    if (alt !== undefined) img.alt = alt || '';
    if (img.dataset.loadedSrc === url) return;
    if (!img.dataset.loadedSrc) {
      img.dataset.loadedSrc = url;
      return;
    }
    img.classList.add('is-photo-fading');
    function finish() {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      img.dataset.loadedSrc = url;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          img.classList.remove('is-photo-fading');
        });
      });
    }
    img.addEventListener('load', finish);
    img.addEventListener('error', finish);
    img.src = url;
    if (img.complete && img.naturalHeight > 0) {
      finish();
    }
  }

  function initTeamCarousel() {
    var TEAM = window.__TEAM_CAROUSEL__;
    if (!TEAM || !TEAM.length) return;

    /* ── constants ── */
    var PER_PAGE   = 4;
    var PAGE_COUNT = Math.ceil(TEAM.length / PER_PAGE);   /* 2 pages for 8 members */
    var SLIDE_MS   = 720;                                  /* must match --tm-slide-dur */

    /* ── state ── */
    var currentPage       = 0;
    var activeGlobalIndex = -1;
    var slideLocked       = false;

    /* ── DOM ── */
    var strip        = document.getElementById('team-strip');
    var prevBtn      = document.getElementById('team-prev');
    var nextBtn      = document.getElementById('team-next');
    var countCurrent = document.getElementById('team-count-current');
    var countTotal   = document.getElementById('team-count-total');
    var countLive    = document.getElementById('team-count-live');
    var progressFill = document.getElementById('team-progress-fill');
    var dotsWrap     = document.getElementById('team-dots');

    if (!strip || !prevBtn || !nextBtn) return;

    var allCards = Array.prototype.slice.call(
      document.querySelectorAll('.team-mem')
    );

    function prefersRM() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /* ── slide strip to page ── */
    function goToPage(page, instant) {
      currentPage = Math.max(0, Math.min(PAGE_COUNT - 1, page));
      if (instant || prefersRM()) {
        strip.style.transition = 'none';
        strip.style.transform  = 'translate3d(' + (-currentPage * 100) + '%, 0, 0)';
      } else {
        strip.style.transition = '';
        strip.style.transform  = 'translate3d(' + (-currentPage * 100) + '%, 0, 0)';
      }
    }

    /* ── expand-ready: reveal bio after flex-expand settles ── */
    function clearExpandListeners(card) {
      clearTimeout(card._expandFallback);
      if (card._expandListener) {
        card.removeEventListener('transitionend', card._expandListener);
        card._expandListener = null;
      }
    }

    function scheduleExpandReady(card) {
      clearExpandListeners(card);
      var done = false;
      function settle() {
        if (done) return;
        done = true;
        clearExpandListeners(card);
        card.classList.add('team-mem--expand-ready');
      }
      var onEnd = function (e) { if (e.target === card) settle(); };
      card._expandListener = onEnd;
      card.addEventListener('transitionend', onEnd);
      card._expandFallback = setTimeout(settle, 920);
    }

    /* ── description crossfade ── */
    function setDesc(desc, text, isActive, card) {
      if (!desc) return;
      if (prefersRM() || !isActive || !card.classList.contains('team-mem--expand-ready')) {
        desc.textContent = text;
        desc.dataset.descInit = '1';
        return;
      }
      if (desc.textContent === text) return;
      clearTimeout(desc._fadeOut);
      clearTimeout(desc._fadeIn);
      desc.classList.add('is-desc-fading');
      desc._fadeOut = setTimeout(function () {
        desc.textContent = text;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            desc.classList.remove('is-desc-fading');
          });
        });
      }, 300);
    }

    /* ── paint one card ── */
    function paintCard(card, member) {
      var g        = parseInt(card.dataset.global, 10);
      var isActive = activeGlobalIndex >= 0 && g === activeGlobalIndex;

      var isLight = document.body.classList.contains('light');
      var useBg       = isLight && member.bgGradientLight ? member.bgGradientLight : member.bgGradient;
      var useBgSolid  = isLight && member.bgLight         ? member.bgLight         : member.bg;
      var useDim      = isLight && member.accentDimLight  ? member.accentDimLight  : member.accentDim;
      var useShape1   = isLight && member.shape1Light     ? member.shape1Light     : member.shape1;
      var useShape2   = isLight && member.shape2Light     ? member.shape2Light     : member.shape2;

      card.style.background = useBg;
      card.style.setProperty('--tm-accent',   member.accent);
      card.style.setProperty('--tm-bg-solid', useBgSolid);
      card.style.setProperty('--tm-dim',      useDim);
      card.style.setProperty('--tm-shape1',   useShape1);
      card.style.setProperty('--tm-shape2',   useShape2);

      var wasActive = card.classList.contains('team-mem--active');
      card.classList.toggle('team-mem--active', isActive);

      if (!isActive) {
        clearExpandListeners(card);
        card.classList.remove('team-mem--expand-ready');
      } else if (!wasActive) {
        scheduleExpandReady(card);
      }

      var sp = card.querySelector('.team-mem__star path');
      if (sp) sp.setAttribute('fill', member.accent);

      var sel = [
        ['.team-mem__watermark',  member.number],
        ['.team-mem__specialty',  member.specialty],
        ['.team-mem__name',       member.name],
      ];
      sel.forEach(function (pair) {
        var el = card.querySelector(pair[0]);
        if (el) el.textContent = pair[1];
      });

      var roleEl = card.querySelector('.team-mem__role-badge');
      if (roleEl) {
        var r = String(member.role || '').trim();
        roleEl.textContent = r;
        roleEl.classList.toggle('team-mem__role-badge--hidden', !r);
        if (r) roleEl.removeAttribute('aria-hidden');
        else roleEl.setAttribute('aria-hidden', 'true');
      }

      var statVal = card.querySelector('.team-mem__stat-val');
      if (statVal) statVal.textContent = member.years + '+';

      var desc = card.querySelector('.team-mem__desc');
      setDesc(desc, member.description, isActive, card);

      var mainPhoto = card.querySelector('.team-mem__photo');
      fadeSwapPhoto(mainPhoto, member.image, member.name);
    }

    /* ── update counters, progress, dots, arrows ── */
    function updateChrome() {
      if (countCurrent) {
        countCurrent.textContent = activeGlobalIndex < 0 ? '—' : String(activeGlobalIndex + 1);
      }
      if (countTotal) countTotal.textContent = String(TEAM.length);
      if (countLive) {
        countLive.textContent = activeGlobalIndex < 0
          ? 'No team member selected.'
          : 'Selected member ' + (activeGlobalIndex + 1) + ' of ' + TEAM.length + '.';
      }
      var pct = activeGlobalIndex < 0 ? 0 : ((activeGlobalIndex + 1) / TEAM.length) * 100;
      if (progressFill) progressFill.style.width = pct + '%';

      prevBtn.classList.toggle('team__arrow--disabled', currentPage <= 0);
      nextBtn.classList.toggle('team__arrow--disabled', currentPage >= PAGE_COUNT - 1);

      if (dotsWrap) {
        dotsWrap.querySelectorAll('.team__dot').forEach(function (dot, i) {
          dot.classList.toggle('team__dot--on', i === activeGlobalIndex);
        });
      }

      if (window.lucide) lucide.createIcons();
    }

    /* ── render: paint all visible cards on current page ── */
    function render() {
      allCards.forEach(function (card) {
        var g = parseInt(card.dataset.global, 10);
        if (!isNaN(g) && TEAM[g]) paintCard(card, TEAM[g]);
      });
      updateChrome();
    }

    /* ── page navigation ── */
    function slideTo(page) {
      if (page < 0 || page >= PAGE_COUNT || page === currentPage || slideLocked) return;
      slideLocked = true;
      activeGlobalIndex = -1;   /* deselect on page change */
      goToPage(page);
      setTimeout(function () {
        slideLocked = false;
        render();
      }, SLIDE_MS + 50);
      updateChrome();
    }

    function handlePrev() { slideTo(currentPage - 1); }
    function handleNext() { slideTo(currentPage + 1); }

    prevBtn.addEventListener('click', handlePrev);
    nextBtn.addEventListener('click', handleNext);

    /* ── card click → expand / deselect ── */
    allCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a.team-mem__social')) return;
        var g = parseInt(card.dataset.global, 10);
        if (isNaN(g)) return;
        /* Only cards on the current page are interactive */
        if (Math.floor(g / PER_PAGE) !== currentPage) return;
        activeGlobalIndex = activeGlobalIndex === g ? -1 : g;
        render();
      });
    });

    /* ── dots ── */
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.team__dot').forEach(function (dot) {
        dot.addEventListener('click', function () {
          var idx = parseInt(dot.dataset.index, 10);
          if (isNaN(idx)) return;
          var targetPage = Math.floor(idx / PER_PAGE);
          if (targetPage !== currentPage) {
            slideTo(targetPage);
          } else {
            activeGlobalIndex = activeGlobalIndex === idx ? -1 : idx;
            render();
          }
        });
      });
    }

    /* ── init ── */
    goToPage(0, true);   /* instant jump to page 0, no animation */
    render();
  }

  /* ──────────────────────────────────────────────────────────────
     12. STEP PULSE DELAY
     ────────────────────────────────────────────────────────────── */
  function initPulseDelays() {
    document.querySelectorAll('.step__pulse').forEach(function (el) {
      var delay = parseInt(el.dataset.delay || '0', 10);
      el.style.animationDelay = delay + 'ms';
    });
  }

  /* ──────────────────────────────────────────────────────────────
     13. PAGE LOADER
     ────────────────────────────────────────────────────────────── */
  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('loaded');
      // Remove from DOM after animation completes
      setTimeout(() => {
        loader.remove();
      }, 600);
    }
  }

  /* ──────────────────────────────────────────────────────────────
     14. CONTACT FORM — validation + submit handling
     ────────────────────────────────────────────────────────────── */
  function initContactForm() {
    var form      = document.getElementById('contact-form');
    var submit    = document.getElementById('cf-submit');
    var panel     = document.getElementById('cf-form-panel');
    var successEl = document.getElementById('cf-success');
    var formWrap  = document.querySelector('.contact-form-wrap');
    var toastErr  = document.getElementById('cf-toast-err');
    if (!form) return;

    function scrollFormCardToCenter() {
      var wrap = document.querySelector('.contact-form-wrap');
      if (wrap) {
        setTimeout(function () {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

    function showContactSuccess() {
      form.classList.add('contact-form--sent');
      if (panel) {
        panel.hidden = true;
        panel.setAttribute('aria-hidden', 'true');
      }
      if (successEl) successEl.hidden = false;
      if (formWrap) formWrap.classList.add('contact-form-wrap--success-view');
      scrollFormCardToCenter();
      if (window.lucide) lucide.createIcons();
    }

    function resetContactSuccess() {
      form.classList.remove('contact-form--sent');
      if (successEl) successEl.hidden = true;
      if (panel) {
        panel.hidden = false;
        panel.removeAttribute('aria-hidden');
      }
      if (formWrap) formWrap.classList.remove('contact-form-wrap--success-view');
    }

    var cfResetBtn = document.getElementById('cf-success-reset');
    if (cfResetBtn) {
      cfResetBtn.addEventListener('click', function () {
        resetContactSuccess();
        form.reset();
        syncOtherField();
        if (window.lucide) lucide.createIcons();
      });
    }

    /* helpers */
    function getEl(id) { return document.getElementById(id); }

    function showError(inputId, errId, msg) {
      var inp = getEl(inputId);
      var err = getEl(errId);
      if (inp) inp.classList.add('is-invalid');
      if (err) err.textContent = msg;
    }

    function clearError(inputId, errId) {
      var inp = getEl(inputId);
      var err = getEl(errId);
      if (inp) inp.classList.remove('is-invalid');
      if (err) err.textContent = '';
    }

    function validateEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    }

    /* ── "Other" subject reveal ── */
    var subjectSel  = getEl('cf-subject');
    var otherWrap   = getEl('cf-other-wrap');
    var otherInput  = getEl('cf-other-subject');

    function syncOtherField() {
      var isOther = subjectSel && subjectSel.value === 'other';
      if (otherWrap) {
        otherWrap.classList.toggle('is-visible', isOther);
        /* keep hidden attr in sync so screen readers see it */
        otherWrap.hidden = !isOther;
        /* re-remove hidden right away so CSS transition can run */
        if (isOther) otherWrap.removeAttribute('hidden');
      }
      if (otherInput) {
        otherInput.required = isOther;
        if (!isOther) {
          otherInput.value = '';
          clearError('cf-other-subject', 'cf-other-err');
        }
        if (window.lucide) lucide.createIcons();
      }
    }

    if (subjectSel) {
      subjectSel.addEventListener('change', syncOtherField);
    }
    if (otherInput) {
      otherInput.addEventListener('input', function () {
        otherInput.classList.remove('is-invalid');
        var errEl = getEl('cf-other-err');
        if (errEl) errEl.textContent = '';
      });
    }

    /* inline clear on fix */
    ['cf-name', 'cf-email', 'cf-subject', 'cf-message'].forEach(function (id) {
      var el = getEl(id);
      if (!el) return;
      el.addEventListener('input', function () {
        el.classList.remove('is-invalid');
        var errEl = getEl(id + '-err');
        if (errEl) errEl.textContent = '';
      });
    });

    function validate() {
      var ok = true;

      var name = (getEl('cf-name') || {}).value || '';
      if (!name.trim()) {
        showError('cf-name', 'cf-name-err', 'Please enter your full name.');
        ok = false;
      } else {
        clearError('cf-name', 'cf-name-err');
      }

      var email = (getEl('cf-email') || {}).value || '';
      if (!email.trim()) {
        showError('cf-email', 'cf-email-err', 'Please enter your email address.');
        ok = false;
      } else if (!validateEmail(email)) {
        showError('cf-email', 'cf-email-err', 'Please enter a valid email address.');
        ok = false;
      } else {
        clearError('cf-email', 'cf-email-err');
      }

      var subject = (getEl('cf-subject') || {}).value || '';
      if (!subject) {
        showError('cf-subject', 'cf-subject-err', 'Please select a topic.');
        ok = false;
      } else {
        clearError('cf-subject', 'cf-subject-err');
      }

      /* validate "other" custom text when visible */
      if (subject === 'other') {
        var otherVal = (otherInput || {}).value || '';
        if (!otherVal.trim()) {
          showError('cf-other-subject', 'cf-other-err', 'Please describe your subject.');
          ok = false;
        } else {
          clearError('cf-other-subject', 'cf-other-err');
        }
      }

      var message = (getEl('cf-message') || {}).value || '';
      if (!message.trim() || message.trim().length < 10) {
        showError('cf-message', 'cf-message-err', 'Please write a message (at least 10 characters).');
        ok = false;
      } else {
        clearError('cf-message', 'cf-message-err');
      }

      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      if (toastErr) toastErr.hidden = true;

      submit.disabled = true;
      submit.classList.add('is-loading');

      var waToggle = document.getElementById('cf-wa-toggle');
      var waOn = waToggle && waToggle.getAttribute('aria-checked') === 'true';
      var waPhoneEl = document.getElementById('cf-wa-phone');
      var whatsappPhone = waOn && waPhoneEl ? String(waPhoneEl.value || '').trim() : '';

      var payload = {
        name: (getEl('cf-name') || {}).value || '',
        email: (getEl('cf-email') || {}).value || '',
        company: (getEl('cf-company') || {}).value || '',
        subject: (getEl('cf-subject') || {}).value || '',
        customSubject: (getEl('cf-other-subject') || {}).value || '',
        message: (getEl('cf-message') || {}).value || '',
        whatsappPhone: whatsappPhone
      };

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          });
        })
        .then(function (result) {
          submit.disabled = false;
          submit.classList.remove('is-loading');
          if (result.ok && result.data && result.data.success) {
            form.reset();
            syncOtherField();
            showContactSuccess();
            return;
          }
          var msg =
            (result.data && result.data.message) ||
            (result.status >= 500 ? 'Server error. Please try again later.' : 'Could not send your message.');
          if (toastErr) {
            var toastMsg = document.getElementById('cf-toast-err-msg');
            if (toastMsg) toastMsg.textContent = msg;
            toastErr.hidden = false;
            toastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        })
        .catch(function () {
          submit.disabled = false;
          submit.classList.remove('is-loading');
          if (toastErr) {
            var toastMsgBk = document.getElementById('cf-toast-err-msg');
            if (toastMsgBk) toastMsgBk.textContent = 'Network error. Check your connection and try again.';
            toastErr.hidden = false;
            toastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
    });
  }

  /* ──────────────────────────────────────────────────────────────
     14b. CONTACT TABS + WHATSAPP TOGGLE
     ────────────────────────────────────────────────────────────── */
  function initContactTabs() {
    var msgBtn  = document.getElementById('ctab-msg-btn');
    var bookBtn = document.getElementById('ctab-book-btn');
    var msgPanel  = document.getElementById('ctab-msg');
    var bookPanel = document.getElementById('ctab-book');
    if (!msgBtn || !bookBtn) return;

    function activate(tab) {
      var isMsg = (tab === 'msg');
      /* Clear success overlays when switching tabs */
      var cfs = document.getElementById('cf-success');
      var cfp = document.getElementById('cf-form-panel');
      var bks = document.getElementById('bk-success');
      var bkp = document.getElementById('bk-form-panel');
      var wrap = document.querySelector('.contact-form-wrap');
      if (cfs && cfp) { cfs.hidden = true; cfp.hidden = false; }
      if (bks && bkp) { bks.hidden = true; bkp.hidden = false; }
      if (wrap) wrap.classList.remove('contact-form-wrap--success-view');

      var cfFormEl = document.getElementById('contact-form');
      var bkFormTab = document.getElementById('book-form');
      if (cfFormEl) cfFormEl.classList.remove('contact-form--sent');
      if (bkFormTab) bkFormTab.classList.remove('bk-form--sent');

      msgBtn.classList.toggle('ctab__btn--active', isMsg);
      bookBtn.classList.toggle('ctab__btn--active', !isMsg);
      msgBtn.setAttribute('aria-selected', isMsg ? 'true' : 'false');
      bookBtn.setAttribute('aria-selected', isMsg ? 'false' : 'true');
      msgPanel.classList.toggle('ctab__panel--active', isMsg);
      bookPanel.classList.toggle('ctab__panel--active', !isMsg);
      msgPanel.hidden = !isMsg;
      bookPanel.hidden = isMsg;
      if (!isMsg && !bookPanel._bkInited) {
        bookPanel._bkInited = true;
        initBookingCalendar();
      }
      if (window.lucide) lucide.createIcons();
    }

    msgBtn.addEventListener('click',  function() { activate('msg');  });
    bookBtn.addEventListener('click', function() { activate('book'); });
  }

  /* ──────────────────────────────────────────────────────────────
     14c. WHATSAPP TOGGLE (shared helper)
     ────────────────────────────────────────────────────────────── */
  function initWaToggle(toggleId, wrapId) {
    var btn  = document.getElementById(toggleId);
    var wrap = document.getElementById(wrapId);
    if (!btn || !wrap) return;
    btn.addEventListener('click', function() {
      var on = btn.getAttribute('aria-checked') === 'true';
      btn.setAttribute('aria-checked', on ? 'false' : 'true');
      wrap.hidden = on;
    });
  }

  /* ──────────────────────────────────────────────────────────────
     14d. BOOKING CALENDAR (API + Cairo slot grid)
     ────────────────────────────────────────────────────────────── */
  var BK_IANA_CACHE = null;

  /**
   * Full IANA timezone ids (what engines expose via Intl). Same canonical set
   * the server accepts in booking APIs — covers countries/regions worldwide.
   */
  function getAllIANAZonesForBooking() {
    if (BK_IANA_CACHE) return BK_IANA_CACHE;
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        BK_IANA_CACHE = Intl.supportedValuesOf('timeZone').slice().sort();
      }
    } catch (err) {
      BK_IANA_CACHE = null;
    }
    if (!BK_IANA_CACHE || !BK_IANA_CACHE.length) {
      BK_IANA_CACHE = ['Africa/Cairo', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai'];
    }
    return BK_IANA_CACHE;
  }

  /** Edit distance for typo-tolerant timezone search (e.g. "dubia" → Dubai). */
  function levenshtein(a, b) {
    var n = a.length;
    var m = b.length;
    if (!n) return m;
    if (!m) return n;
    var i;
    var j;
    var v0 = [];
    var v1 = [];
    for (j = 0; j <= m; j++) v0[j] = j;
    for (i = 0; i < n; i++) {
      v1[0] = i + 1;
      for (j = 0; j < m; j++) {
        var cost = a.charAt(i) === b.charAt(j) ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      var tmp = v0;
      v0 = v1;
      v1 = tmp;
    }
    return v0[m];
  }

  /**
   * Rank IANA zones for a search string: exact substring first, then word-glue
   * match, then fuzzy match on each path segment (handles misspellings).
   */
  function pickTimezonesForQuery(all, raw) {
    var f = (raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (!f) return all.slice();

    function bestRankForZone(z, maxEdits) {
      var zl = z.toLowerCase();
      if (zl.indexOf(f) !== -1) return 0;
      var glue = zl.replace(/\//g, ' ').replace(/_/g, ' ');
      if (glue.indexOf(f) !== -1) return 1;
      if (f.length < 3) return null;
      var best = null;
      var parts = zl.split('/');
      for (var p = 0; p < parts.length; p++) {
        var segUnderscore = parts[p];
        var seg = segUnderscore.replace(/_/g, '');
        if (seg.length < 2) continue;
        if (seg.indexOf(f) !== -1) {
          best = best === null ? 2 : Math.min(best, 2);
          continue;
        }
        var d = levenshtein(seg, f);
        if (d <= maxEdits) {
          var score = 10 + d;
          best = best === null ? score : Math.min(best, score);
        }
      }
      return best;
    }

    function collect(maxEdits) {
      var scored = [];
      for (var i = 0; i < all.length; i++) {
        var z = all[i];
        var r = bestRankForZone(z, maxEdits);
        if (r !== null) scored.push({ z: z, r: r });
      }
      scored.sort(function (a, b) {
        if (a.r !== b.r) return a.r - b.r;
        return a.z.localeCompare(b.z);
      });
      return scored.map(function (x) {
        return x.z;
      });
    }

    var out = collect(f.length <= 4 ? 2 : 3);
    if (out.length) return out;
    out = collect(4);
    if (out.length) return out;

    /* Last resort: closest zones by segment distance (never an empty list) */
    var scored2 = [];
    for (var j = 0; j < all.length; j++) {
      var zz = all[j];
      var zl2 = zz.toLowerCase();
      var parts2 = zl2.split('/');
      var minD = 99;
      for (var q = 0; q < parts2.length; q++) {
        var sg = parts2[q].replace(/_/g, '');
        if (sg.length < 2) continue;
        var dist = levenshtein(sg, f);
        if (dist < minD) minD = dist;
      }
      if (minD < 99) scored2.push({ z: zz, r: 50 + minD });
    }
    scored2.sort(function (a, b) {
      if (a.r !== b.r) return a.r - b.r;
      return a.z.localeCompare(b.z);
    });
    return scored2.slice(0, 25).map(function (x) {
      return x.z;
    });
  }

  function initBookingCalendar() {
    var today = new Date();
    var viewYear = today.getFullYear();
    var viewMonth = today.getMonth();
    var selDate = null;
    var selStartsAt = null;

    var dayMap = {};
    var availabilityLoading = false;
    var availabilityReady = false;
    var tzSearchTimer = null;

    var monthLabel = document.getElementById('bk-month-label');
    var grid = document.getElementById('bk-cal-grid');
    var prevBtn = document.getElementById('bk-prev');
    var nextBtn = document.getElementById('bk-next');
    var slotsWrap = document.getElementById('bk-slots-wrap');
    var slotsGrid = document.getElementById('bk-slots-grid');
    var tzSel = document.getElementById('bk-tz');
    var tzSearch = document.getElementById('bk-tz-search');
    var tzNote = document.getElementById('bk-tz-note');
    var slotErr = document.getElementById('bk-slot-err');
    var bookedNote = document.getElementById('bk-booked-notice');
    var detailsWrap = document.getElementById('bk-details-wrap');
    var summaryEl = document.getElementById('bk-summary');

    if (!grid) return;

    function isoDate(d) {
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
      );
    }

    function rebuildTzOptions(filterStr) {
      if (!tzSel) return;
      var prev = tzSel.value || 'Africa/Cairo';
      var all = getAllIANAZonesForBooking();
      var matched = pickTimezonesForQuery(all, filterStr);
      if (!matched.length) {
        matched = ['Africa/Cairo'];
      }
      var frag = document.createDocumentFragment();
      matched.forEach(function (z) {
        var opt = document.createElement('option');
        opt.value = z;
        opt.textContent = z.replace(/_/g, ' ');
        frag.appendChild(opt);
      });
      tzSel.innerHTML = '';
      tzSel.appendChild(frag);
      if (matched.indexOf(prev) !== -1) {
        tzSel.value = prev;
      } else if (matched.length) {
        tzSel.value = matched[0];
      } else {
        tzSel.value = 'Africa/Cairo';
      }
    }

    rebuildTzOptions('');
    if (tzSearch) {
      tzSearch.addEventListener('input', function () {
        if (tzSearchTimer) clearTimeout(tzSearchTimer);
        var v = tzSearch.value;
        tzSearchTimer = setTimeout(function () {
          rebuildTzOptions(v);
          loadAvailability();
        }, 200);
      });
    }

    function loadAvailability() {
      availabilityLoading = true;
      availabilityReady = false;
      renderCalendar();
      var tz = tzSel && tzSel.value ? tzSel.value : 'Africa/Cairo';
      var url =
        '/api/booking/availability?year=' +
        viewYear +
        '&month=' +
        (viewMonth + 1) +
        '&timeZone=' +
        encodeURIComponent(tz);
      fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          availabilityLoading = false;
          dayMap = {};
          if (result.ok && result.data && result.data.success && result.data.days) {
            result.data.days.forEach(function (day) {
              dayMap[day.date] = day;
            });
            availabilityReady = true;
          } else {
            availabilityReady = false;
          }
          renderCalendar();
          if (selDate) {
            renderSlots();
            if (selStartsAt) showBookingDetails();
          }
        })
        .catch(function () {
          availabilityLoading = false;
          availabilityReady = false;
          dayMap = {};
          renderCalendar();
        });
    }

    if (tzSel) {
      tzSel.addEventListener('change', function () {
        loadAvailability();
        if (selDate) renderSlots();
        runEmailCheck();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        selDate = null;
        selStartsAt = null;
        loadAvailability();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        selDate = null;
        selStartsAt = null;
        loadAvailability();
      });
    }

    loadAvailability();

    initWaToggle('bk-wa-toggle', 'bk-wa-phone-wrap');

    var bkForm = document.getElementById('book-form');
    var bkSubmit = document.getElementById('bk-submit');
    var bkToastErr = document.getElementById('bk-toast-err');
    var bkToastMsg = document.getElementById('bk-toast-err-msg');
    var bkPanel = document.getElementById('bk-form-panel');
    var bkSuccessEl = document.getElementById('bk-success');
    var bkFormWrap = document.querySelector('.contact-form-wrap');

    var bkRescheduleMode = false;
    var bkExistingStartsAt = null;
    var bkBlockNewBooking = false;
    var bkHasActiveMeeting = false;
    var bkEmailCheckTimer = null;
    var emailActiveWrap = document.getElementById('bk-email-active-wrap');
    var emailActiveDesc = document.getElementById('bk-email-active-desc');
    var emailActiveChoice = document.getElementById('bk-email-active-choice');
    var btnRescheduleYes = document.getElementById('bk-reschedule-yes');
    var btnRescheduleNo = document.getElementById('bk-reschedule-no');
    var bkRescheduleBanner = document.getElementById('bk-reschedule-banner');
    var bkSubmitText = bkSubmit ? bkSubmit.querySelector('.contact-form__submit-text') : null;
    var bkSubmitHint = document.getElementById('bk-submit-block-hint');

    function bkEscHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function bkActiveMeetingDescHtml(ex) {
      var lv = (ex && ex.labelViewer ? String(ex.labelViewer) : '').trim();
      var lc = (ex && ex.labelCairo ? String(ex.labelCairo) : '').trim();
      var when;
      if (lv && lc && lv === lc) {
        when = '<strong>' + bkEscHtml(lv) + '</strong>';
      } else if (lv && lc) {
        when =
          '<strong>' +
          bkEscHtml(lv) +
          '</strong> <span class="bk-time-muted">(' +
          bkEscHtml(lc) +
          ' Cairo)</span>';
      } else {
        when = '<strong>' + bkEscHtml(lv || lc) + '</strong>';
      }
      return (
        'Booked for ' +
        when +
        '. Tap <strong>Change my time</strong> to move it, or <strong>I’ll use another email</strong> if you need a second meeting.'
      );
    }

    function setBkSubmitLabel() {
      if (!bkSubmitText) return;
      bkSubmitText.textContent = bkRescheduleMode ? 'Update appointment' : 'Confirm Booking';
    }

    function syncBkSubmitBlockState() {
      if (!bkSubmit) return;
      var block = bkHasActiveMeeting && !bkRescheduleMode;
      bkSubmit.disabled = block;
      if (bkSubmitHint) {
        if (block) {
          bkSubmitHint.hidden = false;
          bkSubmitHint.textContent =
            'Tap “Change my time” or “I’ll use another email” above to unlock the button—or use a different email.';
        } else {
          bkSubmitHint.hidden = true;
          bkSubmitHint.textContent = '';
        }
      }
    }

    function resetEmailActiveState() {
      bkRescheduleMode = false;
      bkExistingStartsAt = null;
      bkBlockNewBooking = false;
      bkHasActiveMeeting = false;
      if (emailActiveWrap) emailActiveWrap.hidden = true;
      if (emailActiveChoice) emailActiveChoice.hidden = false;
      if (bkRescheduleBanner) bkRescheduleBanner.hidden = true;
      setBkSubmitLabel();
      syncBkSubmitBlockState();
    }

    function runEmailCheck() {
      var emailEl = document.getElementById('bk-email');
      if (!emailEl) return;
      var em = String(emailEl.value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) {
        resetEmailActiveState();
        return;
      }
      var tz = tzSel && tzSel.value ? tzSel.value : 'Africa/Cairo';
      fetch(
        '/api/booking/check-email?email=' +
          encodeURIComponent(em) +
          '&timeZone=' +
          encodeURIComponent(tz),
        { headers: { Accept: 'application/json' } }
      )
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!data || !data.success) return;
          if (!data.hasActive) {
            resetEmailActiveState();
            return;
          }
          bkExistingStartsAt = data.existing && data.existing.startsAt ? data.existing.startsAt : null;
          bkHasActiveMeeting = true;
          if (emailActiveWrap) emailActiveWrap.hidden = false;
          if (emailActiveDesc) {
            emailActiveDesc.innerHTML = bkActiveMeetingDescHtml(data.existing);
          }
          if (bkRescheduleBanner) bkRescheduleBanner.hidden = true;
          bkRescheduleMode = false;
          bkBlockNewBooking = false;
          if (emailActiveChoice) emailActiveChoice.hidden = false;
          setBkSubmitLabel();
          syncBkSubmitBlockState();
          if (window.lucide) lucide.createIcons();
        })
        .catch(function () {
          /* ignore */
        });
    }

    var emailElBk = document.getElementById('bk-email');
    if (emailElBk) {
      emailElBk.addEventListener('blur', function () {
        if (bkEmailCheckTimer) clearTimeout(bkEmailCheckTimer);
        bkEmailCheckTimer = setTimeout(runEmailCheck, 320);
      });
      emailElBk.addEventListener('input', function () {
        bkRescheduleMode = false;
        bkBlockNewBooking = false;
        bkExistingStartsAt = null;
        bkHasActiveMeeting = false;
        if (emailActiveWrap) {
          emailActiveWrap.hidden = true;
          if (emailActiveChoice) emailActiveChoice.hidden = false;
        }
        if (bkRescheduleBanner) bkRescheduleBanner.hidden = true;
        setBkSubmitLabel();
        syncBkSubmitBlockState();
      });
    }

    if (btnRescheduleYes) {
      btnRescheduleYes.addEventListener('click', function () {
        bkRescheduleMode = true;
        bkBlockNewBooking = false;
        if (bkRescheduleBanner) bkRescheduleBanner.hidden = false;
        if (emailActiveChoice) emailActiveChoice.hidden = true;
        setBkSubmitLabel();
        syncBkSubmitBlockState();
        if (bkToastErr) bkToastErr.hidden = true;
        clearBkError('bk-email', 'bk-email-err');
        if (window.lucide) lucide.createIcons();
      });
    }

    if (btnRescheduleNo) {
      btnRescheduleNo.addEventListener('click', function () {
        bkRescheduleMode = false;
        bkBlockNewBooking = true;
        if (emailActiveChoice) emailActiveChoice.hidden = true;
        if (bkRescheduleBanner) bkRescheduleBanner.hidden = true;
        if (emailActiveDesc) {
          emailActiveDesc.innerHTML =
            'We won’t start a second booking on this email. Enter a <strong>different email</strong>, or tap <strong>Change my time</strong> to move your meeting.';
        }
        setBkSubmitLabel();
        syncBkSubmitBlockState();
        if (window.lucide) lucide.createIcons();
      });
    }

    syncBkSubmitBlockState();

    function scrollFormCardToCenterBk() {
      var wrap = document.querySelector('.contact-form-wrap');
      if (wrap) {
        setTimeout(function () {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

    function showBookingSuccess() {
      if (bkForm) bkForm.classList.add('bk-form--sent');
      if (bkPanel) {
        bkPanel.hidden = true;
        bkPanel.setAttribute('aria-hidden', 'true');
      }
      if (bkSuccessEl) bkSuccessEl.hidden = false;
      if (bkFormWrap) bkFormWrap.classList.add('contact-form-wrap--success-view');
      scrollFormCardToCenterBk();
      if (window.lucide) lucide.createIcons();
    }

    function resetBookingSuccessState() {
      if (bkForm) bkForm.classList.remove('bk-form--sent');
      if (bkSuccessEl) bkSuccessEl.hidden = true;
      if (bkPanel) {
        bkPanel.hidden = false;
        bkPanel.removeAttribute('aria-hidden');
      }
      if (bkFormWrap) bkFormWrap.classList.remove('contact-form-wrap--success-view');
    }

    var bkResetBtn = document.getElementById('bk-success-reset');
    if (bkResetBtn) {
      bkResetBtn.addEventListener('click', function () {
        resetBookingSuccessState();
        resetEmailActiveState();
        if (bkForm) bkForm.reset();
        selDate = null;
        selStartsAt = null;
        if (tzSearch) tzSearch.value = '';
        rebuildTzOptions('');
        loadAvailability();
        if (slotsWrap) slotsWrap.hidden = true;
        if (detailsWrap) detailsWrap.hidden = true;
        if (bookedNote) bookedNote.hidden = true;
        if (slotErr) slotErr.textContent = '';
        var waToggle = document.getElementById('bk-wa-toggle');
        var waWrap = document.getElementById('bk-wa-phone-wrap');
        if (waToggle) waToggle.setAttribute('aria-checked', 'false');
        if (waWrap) waWrap.hidden = true;
        if (window.lucide) lucide.createIcons();
      });
    }

    if (bkForm) {
      bkForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!selDate || !selStartsAt) {
          if (slotErr) slotErr.textContent = 'Please select a date and time slot.';
          return;
        }
        var nameEl = document.getElementById('bk-name');
        var emailEl = document.getElementById('bk-email');
        var reasonEl = document.getElementById('bk-reason');
        var companyEl = document.getElementById('bk-company');
        var ok = true;

        if (!nameEl || !nameEl.value.trim()) {
          showBkError('bk-name', 'bk-name-err', 'Please enter your full name.');
          ok = false;
        } else clearBkError('bk-name', 'bk-name-err');

        if (!emailEl || !emailEl.value.trim()) {
          showBkError('bk-email', 'bk-email-err', 'Please enter your email address.');
          ok = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim())) {
          showBkError('bk-email', 'bk-email-err', 'Please enter a valid email address.');
          ok = false;
        } else clearBkError('bk-email', 'bk-email-err');

        if (!reasonEl || !reasonEl.value.trim()) {
          showBkError('bk-reason', 'bk-reason-err', 'Please describe the meeting agenda.');
          ok = false;
        } else clearBkError('bk-reason', 'bk-reason-err');

        if (!ok) return;

        if (bkHasActiveMeeting && !bkRescheduleMode) {
          showBkError(
            'bk-email',
            'bk-email-err',
            'Tap “Change my time” or “I’ll use another email” above, or enter a different email address.'
          );
          if (emailActiveWrap) emailActiveWrap.hidden = false;
          if (emailActiveChoice) emailActiveChoice.hidden = false;
          return;
        }

        if (bkBlockNewBooking && !bkRescheduleMode) {
          showBkError(
            'bk-email',
            'bk-email-err',
            'Tap “Change my time” to pick a new slot, or use a different email address.'
          );
          if (emailActiveWrap) emailActiveWrap.hidden = false;
          if (emailActiveChoice) emailActiveChoice.hidden = true;
          return;
        }

        if (bkRescheduleMode && !bkExistingStartsAt) {
          runEmailCheck();
          if (bkToastMsg) {
            bkToastMsg.textContent =
              'We could not load your current appointment. Tab away from the email field to refresh, then try again.';
          }
          if (bkToastErr) {
            bkToastErr.hidden = false;
            bkToastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          if (window.lucide) lucide.createIcons();
          return;
        }

        var waToggleBk = document.getElementById('bk-wa-toggle');
        var waOnBk = waToggleBk && waToggleBk.getAttribute('aria-checked') === 'true';
        var waPhoneBk = document.getElementById('bk-wa-phone');
        var whatsappPhone =
          waOnBk && waPhoneBk ? String(waPhoneBk.value || '').trim() : '';

        bkSubmit.disabled = true;
        bkSubmit.classList.add('is-loading');
        if (bkToastErr) bkToastErr.hidden = true;

        var payload = {
          startsAt: selStartsAt,
          viewerTimeZone: tzSel && tzSel.value ? tzSel.value : 'Africa/Cairo',
          name: nameEl ? nameEl.value.trim() : '',
          email: emailEl ? emailEl.value.trim() : '',
          agenda: reasonEl ? reasonEl.value.trim() : '',
          company: companyEl ? companyEl.value.trim() : '',
          whatsappPhone: whatsappPhone
        };
        if (bkRescheduleMode && bkExistingStartsAt) {
          payload.previousStartsAt = bkExistingStartsAt;
        }

        var bookingUrl = bkRescheduleMode ? '/api/booking/reschedule' : '/api/booking';

        fetch(bookingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            return res.json().then(function (data) {
              return { ok: res.ok, status: res.status, data: data };
            });
          })
          .then(function (result) {
            bkSubmit.classList.remove('is-loading');
            bkSubmit.disabled = false;
            syncBkSubmitBlockState();
            if (result.ok && result.data && result.data.success) {
              resetEmailActiveState();
              bkForm.reset();
              selDate = null;
              selStartsAt = null;
              loadAvailability();
              if (slotsWrap) slotsWrap.hidden = true;
              if (detailsWrap) detailsWrap.hidden = true;
              if (bookedNote) bookedNote.hidden = true;
              var waT2 = document.getElementById('bk-wa-toggle');
              var waW2 = document.getElementById('bk-wa-phone-wrap');
              if (waT2) waT2.setAttribute('aria-checked', 'false');
              if (waW2) waW2.hidden = true;
              showBookingSuccess();
              return;
            }
            if (
              result.status === 409 &&
              result.data &&
              result.data.code === 'EMAIL_HAS_ACTIVE_BOOKING'
            ) {
              bkExistingStartsAt =
                result.data.existing && result.data.existing.startsAt
                  ? result.data.existing.startsAt
                  : null;
              bkRescheduleMode = false;
              bkBlockNewBooking = false;
              bkHasActiveMeeting = true;
              if (emailActiveWrap) emailActiveWrap.hidden = false;
              if (emailActiveChoice) emailActiveChoice.hidden = false;
              if (bkRescheduleBanner) bkRescheduleBanner.hidden = true;
              if (emailActiveDesc && result.data.existing) {
                emailActiveDesc.innerHTML = bkActiveMeetingDescHtml(result.data.existing);
              }
              setBkSubmitLabel();
              syncBkSubmitBlockState();
              if (bkToastMsg) bkToastMsg.textContent = result.data.message || '';
              if (bkToastErr) {
                bkToastErr.hidden = false;
                bkToastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
              if (window.lucide) lucide.createIcons();
              loadAvailability();
              return;
            }
            if (result.data && result.data.code === 'STALE_BOOKING_REFERENCE') {
              runEmailCheck();
              if (bkToastMsg) {
                bkToastMsg.textContent =
                  result.data.message ||
                  'Your meeting may have changed. Confirm your email again, then update your time.';
              }
              if (bkToastErr) {
                bkToastErr.hidden = false;
                bkToastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
              if (window.lucide) lucide.createIcons();
              loadAvailability();
              return;
            }
            var msg =
              (result.data && result.data.message) ||
              (result.status === 409
                ? 'That time slot was just taken. Please pick another.'
                : 'Could not complete booking.');
            if (bkToastMsg) bkToastMsg.textContent = msg;
            if (bkToastErr) {
              bkToastErr.hidden = false;
              bkToastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (window.lucide) lucide.createIcons();
            loadAvailability();
          })
          .catch(function () {
            bkSubmit.classList.remove('is-loading');
            bkSubmit.disabled = false;
            syncBkSubmitBlockState();
            if (bkToastMsg) bkToastMsg.textContent = 'Network error. Check your connection and try again.';
            if (bkToastErr) {
              bkToastErr.hidden = false;
              bkToastErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (window.lucide) lucide.createIcons();
          });
      });
    }

    function renderCalendar() {
      if (!monthLabel || !grid) return;
      var monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ];
      var titleExtra = availabilityLoading ? ' — Loading…' : !availabilityReady ? ' — Offline?' : '';
      monthLabel.textContent = monthNames[viewMonth] + ' ' + viewYear + titleExtra;

      grid.innerHTML = '';
      var first = new Date(viewYear, viewMonth, 1).getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var todayIso = isoDate(today);

      for (var e = 0; e < first; e++) {
        var empty = document.createElement('div');
        empty.className = 'bk-day bk-day--empty';
        grid.appendChild(empty);
      }

      for (var day = 1; day <= daysInMonth; day++) {
        var d = new Date(viewYear, viewMonth, day);
        var iso = isoDate(d);
        var isToday = iso === todayIso;
        var isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var isWeekend = d.getDay() === 0 || d.getDay() === 6;
        var dayState = dayMap[iso];
        var isBooked = !!(availabilityReady && !isWeekend && !isPast && dayState && dayState.fullyBooked);
        var hasPartial = !!(availabilityReady && !isWeekend && !isPast && dayState && dayState.partial);
        var isSelected = iso === selDate;

        var cell = document.createElement('div');
        cell.textContent = day;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', iso);

        var classes = ['bk-day'];
        if (isToday) classes.push('bk-day--today');
        if (isPast || isWeekend) classes.push('bk-day--past');
        if (isBooked) classes.push('bk-day--booked');
        if (hasPartial) classes.push('bk-day--partial');
        if (isSelected) classes.push('bk-day--selected');
        cell.className = classes.join(' ');

        var canPick =
          availabilityReady && !isPast && !isWeekend && dayState && !dayState.fullyBooked;
        if (canPick) {
          cell.setAttribute('tabindex', '0');
          (function (cellIso) {
            cell.addEventListener('click', function () {
              onDayClick(cellIso);
            });
            cell.addEventListener('keydown', function (ev) {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                onDayClick(cellIso);
              }
            });
          })(iso);
        }
        grid.appendChild(cell);
      }

      if (window.lucide) lucide.createIcons();
    }

    function onDayClick(iso) {
      var st = dayMap[iso];
      var fully = st && st.fullyBooked;
      selDate = iso;
      selStartsAt = null;
      renderCalendar();

      if (fully) {
        if (slotsWrap) slotsWrap.hidden = true;
        if (detailsWrap) detailsWrap.hidden = true;
        if (bookedNote) bookedNote.hidden = false;
        return;
      }
      if (bookedNote) bookedNote.hidden = true;
      renderSlots();
      if (slotsWrap) {
        slotsWrap.hidden = false;
        slotsWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function renderSlots() {
      if (!slotsGrid || !selDate) return;
      slotsGrid.innerHTML = '';
      var tz = tzSel && tzSel.value ? tzSel.value : 'Africa/Cairo';
      if (tzNote) tzNote.textContent = '— ' + tz.replace(/_/g, ' ');

      var dayState = dayMap[selDate];
      var slots = (dayState && dayState.slots) || [];
      var freeCount = 0;

      slots.forEach(function (slot) {
        var taken = !slot.available;
        var isSelected = slot.startsAt === selStartsAt;

        var btn = document.createElement('button');
        btn.type = 'button';
        var cls = 'bk-slot';
        if (taken) cls += ' bk-slot--taken';
        if (isSelected) cls += ' bk-slot--selected';
        btn.className = cls;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.setAttribute('aria-disabled', taken ? 'true' : 'false');
        btn.disabled = taken;

        if (taken) {
          btn.innerHTML =
            slot.labelInViewerTz + '<span class="bk-slot__taken-label">Taken</span>';
        } else {
          btn.textContent = slot.labelInViewerTz;
          freeCount++;
          (function (s) {
            btn.addEventListener('click', function () {
              selStartsAt = s.startsAt;
              if (slotErr) slotErr.textContent = '';
              renderSlots();
              showBookingDetails();
            });
          })(slot);
        }
        slotsGrid.appendChild(btn);
      });

      if (freeCount === 0 && selDate) {
        slotsGrid.innerHTML = '';
        if (slotsWrap) slotsWrap.hidden = true;
        if (bookedNote) bookedNote.hidden = false;
      }
    }

    function showBookingDetails() {
      if (!detailsWrap || !summaryEl || !selDate || !selStartsAt) return;
      var dayState = dayMap[selDate];
      var slots = (dayState && dayState.slots) || [];
      var slot = null;
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].startsAt === selStartsAt) {
          slot = slots[i];
          break;
        }
      }
      var d = new Date(selDate + 'T12:00:00');
      var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var label =
        dayNames[d.getDay()] +
        ', ' +
        months[d.getMonth()] +
        ' ' +
        d.getDate() +
        ', ' +
        d.getFullYear();
      var line =
        (slot ? slot.labelInViewerTz : '') +
        (slot && slot.labelCairo ? ' · Cairo: ' + slot.labelCairo : '');
      summaryEl.innerHTML =
        '<i data-lucide="calendar-check"></i>' +
        '<span><strong>' +
        label +
        '</strong> &nbsp;·&nbsp; ' +
        line +
        ' &nbsp;·&nbsp; ' +
        (tzSel ? tzSel.value.replace(/_/g, ' ') : '') +
        '</span>';
      detailsWrap.hidden = false;
      detailsWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (window.lucide) lucide.createIcons();
    }

    function showBkError(inputId, errId, msg) {
      var inp = document.getElementById(inputId);
      var err = document.getElementById(errId);
      if (inp) inp.classList.add('is-invalid');
      if (err) err.textContent = msg;
    }
    function clearBkError(inputId, errId) {
      var inp = document.getElementById(inputId);
      var err = document.getElementById(errId);
      if (inp) inp.classList.remove('is-invalid');
      if (err) err.textContent = '';
    }
  } /* end initBookingCalendar */

  /* ──────────────────────────────────────────────────────────────
     15. INIT ALL
     ────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initIcons();
    initHeroCanvas();
    initContactCanvas();
    initDashboardBars();
    initTeamCarousel();
    initHoverEffects();
    initPulseDelays();
    initPortfolioAnimations();
    initContactForm();
    initContactTabs();
    initWaToggle('cf-wa-toggle', 'cf-wa-phone-wrap');
  });

  // Hide loader when page fully loads (images, fonts, etc.)
  window.addEventListener('load', function () {
    // Small delay to ensure smooth transition
    setTimeout(hideLoader, 300);
  });
})();

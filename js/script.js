/* ==========================================================================
   Stackly - Main JavaScript
   Features: mobile nav, scroll reveal, counters, testimonial slider,
   FAQ accordion, contact form validation, newsletter, blog search,
   back-to-top button, sticky navbar.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Mobile nav toggle ---------- */
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', function () {
        navMenu.classList.toggle('open');
        navToggle.classList.toggle('open');
      });

      navMenu.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          navMenu.classList.remove('open');
          navToggle.classList.remove('open');
        });
      });
    }

    /* ---------- Sticky navbar shadow ---------- */
    var navbar = document.querySelector('.navbar');
    function onNavScroll() {
      if (!navbar) return;
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onNavScroll);
    onNavScroll();

    /* ---------- Back to top ---------- */
    var backTop = document.getElementById('backTop');
    if (backTop) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 500) {
          backTop.classList.add('show');
        } else {
          backTop.classList.remove('show');
        }
      });
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    /* ---------- Scroll progress bar ---------- */
    var progressBar = document.createElement('div');
    progressBar.id = 'scrollProgress';
    document.body.appendChild(progressBar);

    function updateProgress() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();

    /* ---------- Scroll reveal ---------- */
    var revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });

    /* ---------- Staggered grid reveal ---------- */
    var staggerWraps = document.querySelectorAll('[data-stagger]');
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    staggerWraps.forEach(function (wrap) {
      staggerObserver.observe(wrap);
    });

    /* ---------- Hero bars grow on load ---------- */
    var heroFills = document.querySelectorAll('.hero-bar .fill');
    heroFills.forEach(function (el, i) {
      var match = /width:\s*([0-9.]+%)/.exec(el.getAttribute('style') || '');
      var target = match ? match[1] : '0%';
      el.style.width = '0%';
      el.style.transitionDelay = (0.3 + i * 0.15) + 's';
      setTimeout(function () { el.style.width = target; }, 250);
    });

    /* ---------- Animated counters ---------- */
    var counters = document.querySelectorAll('.counter');
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });

    function animateCounter(el) {
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1800;
      var start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.floor(eased * target);
        el.textContent = prefix + value.toLocaleString() + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = prefix + target.toLocaleString() + suffix;
        }
      }
      requestAnimationFrame(step);
    }

    /* ---------- Testimonial slider ---------- */
    var track = document.getElementById('testimonialTrack');
    var dotsWrap = document.getElementById('sliderDots');
    var prevBtn = document.getElementById('prevSlide');
    var nextBtn = document.getElementById('nextSlide');

    if (track) {
      var slides = track.querySelectorAll('.testimonial-slide');
      var index = 0;

      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', function () {
          goToSlide(i);
        });
        if (dotsWrap) dotsWrap.appendChild(dot);
      });

      var dots = dotsWrap ? dotsWrap.querySelectorAll('button') : [];

      function goToSlide(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + index * 100 + '%)';
        dots.forEach(function (d, di) {
          d.classList.toggle('active', di === index);
        });
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(index - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(index + 1); });

      var timer = setInterval(function () {
        goToSlide(index + 1);
      }, 6000);

      var slider = document.querySelector('.testimonial-slider');
      if (slider) {
        slider.addEventListener('mouseenter', function () { clearInterval(timer); });
        slider.addEventListener('mouseleave', function () {
          clearInterval(timer);
          timer = setInterval(function () { goToSlide(index + 1); }, 6000);
        });
      }
    }

    /* ---------- FAQ accordion ---------- */
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
      var question = item.querySelector('.faq-q');
      var answer = item.querySelector('.faq-a');
      if (!question || !answer) return;

      question.addEventListener('click', function () {
        var isOpen = item.classList.contains('active');

        faqItems.forEach(function (other) {
          other.classList.remove('active');
          other.querySelector('.faq-a').style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });

    /* ---------- Contact form validation ---------- */
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
      var formSuccess = document.getElementById('formSuccess');

      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;

        var firstName = document.getElementById('firstName');
        var lastName = document.getElementById('lastName');
        var email = document.getElementById('email');
        var phone = document.getElementById('phone');
        var subject = document.getElementById('subject');
        var message = document.getElementById('message');

        var fields = [
          { el: firstName, check: function () { return firstName.value.trim().length > 0; } },
          { el: lastName, check: function () { return lastName.value.trim().length > 0; } },
          { el: email, check: function () {
              return /^[^\s@]+@gmail\.com$/i.test(email.value.trim());
            } },
          { el: phone, check: function () {
              return phone.value.trim() === '' || /^[+\d][\d\s().-]{6,}$/.test(phone.value.trim());
            } },
          { el: subject, check: function () { return subject.value !== ''; } },
          { el: message, check: function () { return message.value.trim().length >= 20; } }
        ];

        fields.forEach(function (field) {
          var ok = field.check();
          field.el.closest('.form-group').classList.toggle('error', !ok);
          if (!ok) valid = false;
        });

        if (valid) {
          window.location.href = '404.html';
        }
      });

      contactForm.querySelectorAll('input, select, textarea').forEach(function (input) {
        input.addEventListener('input', function () {
          input.closest('.form-group').classList.remove('error');
        });
      });
    }

    /* ---------- Newsletter forms ---------- */
    var newsletterForms = document.querySelectorAll('.newsletter-form');
    newsletterForms.forEach(function (form) {
      var errorEl = form.querySelector('.newsletter-error');
      var input = form.querySelector('input[type="email"]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var isValid = /^[^\s@]+@gmail\.com$/i.test(input.value.trim());
        if (!isValid) {
          form.classList.add('has-error');
          if (errorEl) errorEl.textContent = 'Please use a Gmail address (must end with @gmail.com).';
          input.focus();
          return;
        }
        form.classList.remove('has-error');
        window.location.href = '404.html';
      });
      if (input) {
        input.addEventListener('input', function () { form.classList.remove('has-error'); });
      }
    });

    /* ---------- Blog live search ---------- */
    var blogSearch = document.getElementById('blogSearch');
    var searchBtn = document.getElementById('searchBtn');

    function filterPosts() {
      var query = (blogSearch ? blogSearch.value : '').trim().toLowerCase();
      var posts = document.querySelectorAll('#postGrid .blog-card');
      var visible = 0;
      posts.forEach(function (post) {
        var matches = post.textContent.toLowerCase().indexOf(query) !== -1;
        post.style.display = matches ? '' : 'none';
        if (matches) visible++;
      });
      var note = document.getElementById('noResults');
      if (!note) {
        note = document.createElement('p');
        note.id = 'noResults';
        note.style.cssText = 'text-align:center;color:var(--text-light);padding:24px 0;font-weight:600;';
        var grid = document.getElementById('postGrid');
        if (grid) grid.appendChild(note);
      }
      note.textContent = visible === 0 ? 'No articles match your search.' : '';
    }

    if (blogSearch) {
      blogSearch.addEventListener('input', filterPosts);
      if (searchBtn) searchBtn.addEventListener('click', filterPosts);
    }

    /* ---------- Social sign-in/up redirect ---------- */
    document.querySelectorAll('.auth-social-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = '404.html';
      });
    });
  });

})();

/* ==========================================================================
   Stackly - Auth & 404 JavaScript
   Features: show/hide password, sign in validation, sign up validation,
   password strength meter, social button feedback, 404 search.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    var EMAIL_RE = /^[^\s@]+@gmail\.com$/i;
    var PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    /* ---------- Show / hide password ---------- */
    var toggles = document.querySelectorAll('.toggle-pass');

    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var targetId = toggle.getAttribute('data-toggle');
        var input = document.getElementById(targetId);
        if (!input) return;

        var isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.classList.toggle('show', isPassword);
        toggle.setAttribute('aria-pressed', isPassword ? 'true' : 'false');

        var svg = toggle.querySelector('svg');
        if (svg) {
          svg.innerHTML = isPassword
            ? '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>'
            : '<path d="M2 2l20 20M6.71 6.71A10.94 10.94 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5a10.9 10.9 0 0 0 4.29-.79M9.9 4.98A10.8 10.8 0 0 1 12 4.5c5 0 9.27 3.11 11 7.5a10.94 10.94 0 0 1-2.61 3.4M14.12 14.12a3 3 0 1 1-4.24-4.24"/>';
        }
      });
    });

    /* ---------- User / Admin role switch ---------- */
    var roleBtns = document.querySelectorAll('.role-btn');
    var selectedRole = 'user';

    roleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        roleBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        selectedRole = btn.getAttribute('data-role') || 'user';
      });
    });

    function roleLabel() {
      return selectedRole === 'admin' ? 'Admin' : 'User';
    }

    /* ---------- Field error helpers ---------- */
    function setError(fieldId, hasError) {
      var field = document.getElementById(fieldId);
      if (field) field.classList.toggle('error', hasError);
    }

    function clearErrorOnInput(input) {
      if (!input) return;
      input.addEventListener('input', function () {
        var field = input.closest('.auth-field');
        if (field) field.classList.remove('error');
      });
    }

    /* ---------- Success banner ---------- */
    function showBanner(bannerId, message) {
      var banner = document.getElementById(bannerId);
      if (!banner) return;
      banner.querySelector('span').textContent = message;
      banner.classList.add('show');
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function simulateSubmit(btn, done) {
      if (!btn) return done();
      var original = btn.innerHTML;
      btn.classList.add('btn-loading');
      btn.innerHTML = '<span class="spinner"></span> Processing…';
      btn.disabled = true;
      setTimeout(function () {
        btn.classList.remove('btn-loading');
        btn.innerHTML = original;
        btn.disabled = false;
        done();
      }, 1400);
    }

    function redirectTo(url) {
      setTimeout(function () { window.location.href = url; }, 1800);
    }

    /* ---------- Sign In ---------- */
    var signinForm = document.getElementById('signinForm');

    if (signinForm) {
      var signinEmail = document.getElementById('email');
      var signinPass = document.getElementById('password');
      var signinBtn = document.getElementById('signinBtn');
      var rememberBox = document.getElementById('remember');

      clearErrorOnInput(signinEmail);
      clearErrorOnInput(signinPass);

      if (rememberBox) {
        rememberBox.addEventListener('change', function () {
          setError('fieldRemember', false);
        });
      }

      signinForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var emailOk = signinEmail && EMAIL_RE.test(signinEmail.value.trim());
        var passOk = signinPass && PASSWORD_RE.test(signinPass.value.trim());
        var rememberOk = rememberBox && rememberBox.checked;

        setError('fieldEmail', !emailOk);
        setError('fieldPassword', !passOk);
        setError('fieldRemember', !rememberOk);

        if (!emailOk) { if (signinEmail) signinEmail.focus(); return; }
        if (!passOk) { if (signinPass) signinPass.focus(); return; }
        if (!rememberOk) { if (rememberBox) rememberBox.focus(); return; }

        simulateSubmit(signinBtn, function () {
          try {
            sessionStorage.setItem('stackly_session_email', signinEmail.value.trim());
            sessionStorage.setItem('stackly_session_role', selectedRole);
          } catch (err) { /* ignore */ }
          showBanner('authBanner', "Success! You've been signed in as " + roleLabel() + ". Redirecting…");
          redirectTo(selectedRole === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html');
        });
      });
    }

    /* ---------- Password strength meter ---------- */
    var strengthInput = document.getElementById('password');
    var strengthBar = document.getElementById('strengthBar');
    var strengthNote = document.getElementById('strengthNote');

    if (strengthInput && strengthBar && strengthNote) {
      strengthInput.addEventListener('input', function () {
        var value = strengthInput.value;
        var score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        var classes = ['', 'weak', 'fair', 'good', 'strong'];

        strengthBar.className = 'strength';
        if (value.length === 0) {
          strengthNote.textContent = '';
        } else {
          strengthBar.classList.add(classes[score]);
          strengthNote.textContent = labels[score] + ' password';
          strengthNote.className = 'strength-note ' + classes[score];
        }
      });
    }

    /* ---------- Sign Up ---------- */
    var signupForm = document.getElementById('signupForm');

    if (signupForm) {
      var nameInput = document.getElementById('fullName');
      var emailInput = document.getElementById('email');
      var companyInput = document.getElementById('company');
      var passInput = document.getElementById('password');
      var confirmInput = document.getElementById('confirm');
      var termsInput = document.getElementById('terms');
      var signupBtn = document.getElementById('signupBtn');

      clearErrorOnInput(nameInput);
      clearErrorOnInput(emailInput);
      clearErrorOnInput(companyInput);
      clearErrorOnInput(passInput);
      clearErrorOnInput(confirmInput);

      signupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var nameOk = nameInput && nameInput.value.trim().length >= 2;
        var emailOk = emailInput && EMAIL_RE.test(emailInput.value.trim());
        var companyOk = companyInput && companyInput.value.trim().length >= 2;
        var passOk = passInput && PASSWORD_RE.test(passInput.value);
        var confirmOk = confirmInput && passInput && confirmInput.value === passInput.value;
        var termsOk = termsInput && termsInput.checked;

        setError('fieldName', !nameOk);
        setError('fieldEmail', !emailOk);
        setError('fieldCompany', !companyOk);
        setError('fieldPassword', !passOk);
        setError('fieldConfirm', !confirmOk);

        if (termsInput) {
          termsInput.closest('.checkbox').style.color = termsOk ? '' : '#ef4444';
        }

        if (!nameOk) { if (nameInput) nameInput.focus(); return; }
        if (!emailOk) { if (emailInput) emailInput.focus(); return; }
        if (!companyOk) { if (companyInput) companyInput.focus(); return; }
        if (!passOk) { if (passInput) passInput.focus(); return; }
        if (!confirmOk) { if (confirmInput) confirmInput.focus(); return; }
        if (!termsOk) {
          if (termsInput) termsInput.focus();
          return;
        }

        simulateSubmit(signupBtn, function () {
          showBanner('authBanner', "Success! Your " + roleLabel() + " account has been created. Redirecting…");
          redirectTo('signin.html');
        });
      });
    }

    /* ---------- Social buttons ---------- */
    var socialBtns = document.querySelectorAll('.auth-social-btn');

    socialBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var original = btn.innerHTML;
        var label = btn.textContent.trim();
        btn.classList.add('btn-loading');
        btn.innerHTML = '<span class="spinner"></span> Connecting…';
        setTimeout(function () {
          btn.classList.remove('btn-loading');
          btn.innerHTML = original;
          showBanner('authBanner', label + ' sign-in is not configured in this demo.');
        }, 1000);
      });
    });

    /* ---------- 404: Go Back ---------- */
    var goBackBtn = document.getElementById('goBack');

    if (goBackBtn) {
      goBackBtn.addEventListener('click', function () {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = 'index.html';
        }
      });
    }

    /* ---------- 404 search ---------- */
    var nfSearch = document.getElementById('nfSearch');

    if (nfSearch) {
      nfSearch.addEventListener('submit', function (e) {
        e.preventDefault();
        var query = (document.getElementById('nfQuery') || {}).value || '';
        if (query.trim().length === 0) return;

        var btn = nfSearch.querySelector('.btn');
        var original = btn ? btn.innerHTML : '';
        if (btn) {
          btn.innerHTML = '<span class="spinner"></span> Searching…';
          btn.disabled = true;
        }

        setTimeout(function () {
          var foundPages = [
            { kw: ['service', 'sourcing', 'procure', 'category', 'vendor'], url: 'services.html' },
            { kw: ['about', 'team', 'story', 'company'], url: 'about.html' },
            { kw: ['blog', 'article', 'trend', 'news'], url: 'blog.html' },
            { kw: ['contact', 'support', 'help', 'quote', 'audit'], url: 'contact.html' },
            { kw: ['signin', 'login', 'account'], url: 'signin.html' },
            { kw: ['signup', 'register', 'create'], url: 'signup.html' },
            { kw: ['dashboard', 'portal', 'overview', 'user', 'orders', 'requests'], url: 'user-dashboard.html' },
            { kw: ['admin', 'manage', 'analytics', 'users', 'contracts'], url: 'admin-dashboard.html' }
          ];

          var q = query.trim().toLowerCase();
          var match = null;
          foundPages.forEach(function (page) {
            if (!match && page.kw.some(function (k) { return q.indexOf(k) !== -1; })) {
              match = page.url;
            }
          });

          if (match) {
            window.location.href = match;
          } else {
            var sub = nfSearch.closest('.nf-inner');
            var subText = document.querySelector('.nf-sub');
            if (subText) {
              subText.textContent = 'No matches for "' + query + '". Try the homepage or browse our services.';
            }
            if (btn) {
              btn.innerHTML = original;
              btn.disabled = false;
            }
          }
        }, 900);
      });
    }

    /* ---------- Spinner style for button loading ---------- */
    if (!document.getElementById('authSpinnerStyle')) {
      var style = document.createElement('style');
      style.id = 'authSpinnerStyle';
      style.textContent =
        '.spinner{width:18px;height:18px;border:2.5px solid rgba(10,31,60,.3);' +
        'border-top-color:currentColor;border-radius:50%;display:inline-block;' +
        'animation:authSpin .7s linear infinite;vertical-align:-3px}' +
        '@keyframes authSpin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }
  });

})();

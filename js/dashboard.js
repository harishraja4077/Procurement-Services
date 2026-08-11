/* ==========================================================================
   Stackly - Dashboard JavaScript (User + Admin)
   Features: sidebar toggle, dropdowns, page switching, SVG charts,
   animated counters, table search/filter/pagination, modals, toasts,
   settings forms, notifications.
   ========================================================================== */

(function () {
  'use strict';

  var CSS_INJECTED = false;

  document.addEventListener('DOMContentLoaded', function () {
    injectStyles();
    initShell();
    initPages();
    initDropdowns();
    initTables();
    initModals();
    initRowActions();
    initAdminForms();
    initSettings();
    initCharts();
    initCounters();
    initUserSession();
    initScrollProgress();
    initPlaceholderRedirect();
    initLogout();
  });

  /* ---------- Helper: toast ---------- */
  function showToast(message, type) {
    type = type || 'success';
    var wrap = document.getElementById('toastWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toastWrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<span class="t-ic"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      '<span>' + message + '</span>' +
      '<button type="button" aria-label="Dismiss">&times;</button>';

    wrap.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });

    function close() {
      toast.classList.remove('show');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    }

    toast.querySelector('button').addEventListener('click', close);
    setTimeout(close, 4000);
  }

  /* ---------- Helper: Gmail-only email rule ---------- */
  var GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

  function isGmailAddress(value) {
    return GMAIL_RE.test((value || '').trim());
  }

  function markEmailError(input, message) {
    if (!input) return;
    input.style.borderColor = 'var(--red)';
    input.focus();
    showToast(message, 'error');
  }

  document.addEventListener('input', function (e) {
    if (e.target && e.target.style && e.target.style.borderColor) {
      e.target.style.borderColor = '';
    }
  });

  /* ---------- Sidebar + mobile shell ---------- */
  var lockScrollPos = 0;

  function setSidebar(open) {
    var sidebar = document.getElementById('sidebar');
    var backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('open', open);
    if (backdrop) backdrop.classList.toggle('show', open);
    document.body.classList.toggle('no-scroll', open);
    if (open) {
      lockScrollPos = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = '-' + lockScrollPos + 'px';
    } else {
      document.body.style.top = '';
      window.scrollTo({ top: lockScrollPos, left: 0, behavior: 'instant' });
    }
  }

  function initShell() {
    var menuBtn = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');

    var dateEl = document.getElementById('todayDate');
    if (dateEl) {
      try {
        dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      } catch (err) { /* ignore */ }
    }

    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        setSidebar(!sidebar.classList.contains('open'));
      });
    }

    var backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        setSidebar(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
        setSidebar(false);
      }
    });
  }

  /* ---------- Page / tab switching ---------- */
  function initPages() {
    var navItems = document.querySelectorAll('[data-page]');
    var pages = document.querySelectorAll('.dash-page');

    function showPage(name) {
      pages.forEach(function (page) {
        page.classList.toggle('active', page.id === name);
      });
      navItems.forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-page') === name);
      });
      setSidebar(false);

      document.querySelector('.dash-content').scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderCharts();
    }

    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        showPage(item.getAttribute('data-page'));
      });
    });

    /* page-level chips (range filters on charts) */
    document.querySelectorAll('.chip[data-chart]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var group = chip.parentNode;
        if (group) {
          group.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        }
        chip.classList.add('active');
        if (typeof StacklyCharts !== 'undefined' && chip.getAttribute('data-chart') === 'line') {
          StacklyCharts.line(chip.getAttribute('data-range'));
        }
        if (typeof StacklyCharts !== 'undefined' && chip.getAttribute('data-chart') === 'bar') {
          StacklyCharts.bar(chip.getAttribute('data-range'));
        }
      });
    });
  }

  /* ---------- Dropdowns ---------- */
  function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach(function (btn) {
      var panelId = btn.getAttribute('data-dropdown');
      var panel = document.getElementById(panelId);
      if (!panel) return;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = panel.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) panel.classList.add('open');
      });
    });

    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDropdowns();
    });

    var markRead = document.getElementById('markAllRead');
    if (markRead) {
      markRead.addEventListener('click', function () {
        document.querySelectorAll('#notifList .dropdown-item').forEach(function (item) {
          item.style.opacity = '0.55';
        });
        var dots = document.querySelectorAll('.icon-btn .dot-indicator');
        dots.forEach(function (d) { d.style.display = 'none'; });
        showToast('All notifications marked as read.');
      });
    }

    function closeAllDropdowns() {
      document.querySelectorAll('.dropdown-panel.open').forEach(function (p) {
        p.classList.remove('open');
      });
    }
  }

  /* ---------- Generic tables (search / filter / paginate) ---------- */
  function initTables() {
    document.querySelectorAll('.data-table[data-table]').forEach(function (table) {
      var wrap = table.closest('.card') || table.closest('div');
      var searchInput = wrap ? wrap.querySelector('.js-table-search') : null;
      var filterSelects = wrap ? Array.prototype.slice.call(wrap.querySelectorAll('.js-table-filter')) : [];
      var tbody = table.querySelector('tbody');
      var rows = tbody ? Array.prototype.slice.call(tbody.querySelectorAll('tr')) : [];
      var pageSize = parseInt(table.getAttribute('data-page-size') || '6', 10);
      var state = { query: '', page: 1 };

      if (!tbody || !rows.length) return;

      function matches(row) {
        var text = row.getAttribute('data-search') || row.textContent || '';
        text = text.toLowerCase();
        if (state.query && text.indexOf(state.query) === -1) return false;
        var fv = (row.getAttribute('data-filter') || '').toLowerCase().split(/\s+/);
        for (var i = 0; i < filterSelects.length; i++) {
          var val = filterSelects[i].value.toLowerCase();
          if (val && fv.indexOf(val) === -1) return false;
        }
        return true;
      }

      function render() {
        var visible = rows.filter(matches);
        var totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
        if (state.page > totalPages) state.page = totalPages;

        var start = (state.page - 1) * pageSize;
        var pageRows = visible.slice(start, start + pageSize);

        rows.forEach(function (row) { row.style.display = 'none'; });
        pageRows.forEach(function (row) { row.style.display = ''; });

        var info = wrap.querySelector('.js-page-info');
        if (info) {
          var end = Math.min(start + pageSize, visible.length);
          info.textContent = visible.length
            ? 'Showing ' + (start + 1) + '\u2013' + end + ' of ' + visible.length
            : 'No results';
        }

        renderPagination(totalPages, visible.length);
      }

      function renderPagination(totalPages, total) {
        var holder = wrap.querySelector('.js-pagination');
        if (!holder) return;
        holder.innerHTML = '';

        var prev = makePageBtn('&lsaquo;', state.page - 1, state.page === 1);
        holder.appendChild(prev);

        var from = Math.max(1, state.page - 1);
        var to = Math.min(totalPages, state.page + 1);
        if (from > 1) holder.appendChild(makePageBtn('1', 1, false));
        if (from > 2) holder.appendChild(makeEllipsis());
        for (var i = from; i <= to; i++) holder.appendChild(makePageBtn(String(i), i, false));
        if (to < totalPages - 1) holder.appendChild(makeEllipsis());
        if (to < totalPages) holder.appendChild(makePageBtn(String(totalPages), totalPages, false));

        var next = makePageBtn('&rsaquo;', state.page + 1, state.page === totalPages);
        holder.appendChild(next);

        if (total === 0) {
          holder.innerHTML = '';
          var empty = wrap.querySelector('.js-table-empty');
          if (empty) empty.style.display = 'block';
        } else {
          var emptyEl = wrap.querySelector('.js-table-empty');
          if (emptyEl) emptyEl.style.display = 'none';
        }
      }

      function makePageBtn(label, target, disabled) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = label;
        if (disabled) btn.disabled = true;
        if (target === state.page) btn.classList.add('active');
        btn.addEventListener('click', function () {
          if (target < 1 || target > totalPagesOf()) return;
          state.page = target;
          render();
        });
        return btn;
      }

      function totalPagesOf() {
        var visible = rows.filter(matches);
        return Math.max(1, Math.ceil(visible.length / pageSize));
      }

      function makeEllipsis() {
        var span = document.createElement('span');
        span.textContent = '\u2026';
        span.style.cssText = 'padding:0 4px;color:var(--text-light);';
        return span;
      }

      if (searchInput) {
        searchInput.addEventListener('input', function () {
          state.query = searchInput.value.trim().toLowerCase();
          state.page = 1;
          render();
        });
      }

      filterSelects.forEach(function (select) {
        select.addEventListener('change', function () {
          state.page = 1;
          render();
        });
      });

      render();
    });
  }

  /* ---------- Modals ---------- */
  function initModals() {
    document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-open-modal');
        var modal = document.getElementById(id);
        if (modal) openModal(modal);
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modal = btn.closest('.modal-backdrop');
        if (modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal(modal);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.show').forEach(function (m) { closeModal(m); });
      }
    });

    document.querySelectorAll('form[data-modal-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailField = form.querySelector('input[type="email"]');
        if (emailField && (!emailField.value.trim() || !isGmailAddress(emailField.value))) {
          markEmailError(emailField, 'Email must be a Gmail address (@gmail.com).');
          return;
        }
        var modal = form.closest('.modal-backdrop');
        if (modal) closeModal(modal);
        showToast(form.getAttribute('data-success') || 'Saved successfully.');
      });
    });
  }

  function openModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    var input = modal.querySelector('input, select, textarea');
    if (input) setTimeout(function () { input.focus(); }, 200);
  }

  function closeModal(modal) {
    modal.classList.remove('show');
    if (!document.querySelector('.modal-backdrop.show')) document.body.style.overflow = '';
  }

  /* Confirm action with modal */
  function confirmAction(message, onConfirm) {
    var id = 'confirmModal';
    var modal = document.getElementById(id);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = id;
      modal.className = 'modal-backdrop';
      modal.innerHTML =
        '<div class="modal" role="dialog" aria-modal="true" style="max-width:400px;">' +
        '<div class="modal-body" style="text-align:center;">' +
        '<div class="e-ic" style="margin:0 auto 14px;width:58px;height:58px;border-radius:16px;background:rgba(239,68,68,.12);display:flex;align-items:center;justify-content:center;">' +
        '<svg viewBox="0 0 24 24" style="width:28px;height:28px;stroke:#ef4444;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>' +
        '</div>' +
        '<h3 style="color:var(--navy);font-size:1.05rem;font-weight:800;margin-bottom:6px;">Are you sure?</h3>' +
        '<p id="confirmMsg" style="color:var(--text-light);font-size:.88rem;margin-bottom:20px;"></p>' +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
        '<button type="button" class="btn btn-outline" data-confirm-cancel>Cancel</button>' +
        '<button type="button" class="btn btn-danger" data-confirm-ok>Yes, Delete</button>' +
        '</div>' +
        '</div>' +
        '</div>';
      document.body.appendChild(modal);

      modal.querySelector('[data-confirm-cancel]').addEventListener('click', function () { closeModal(modal); });
      modal.querySelector('[data-confirm-ok]').addEventListener('click', function () {
        closeModal(modal);
        if (onConfirm) onConfirm();
      });
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(modal); });
    }

    var msg = modal.querySelector('#confirmMsg');
    if (msg) msg.textContent = message;
    openModal(modal);
  }

  /* ---------- Row action buttons ---------- */
  function onRowActionClick(btn) {
    var action = btn.getAttribute('data-action');
    var row = btn.closest('tr');
    var badge = row ? row.querySelector('.badge') : null;

    if (action === 'approve') {
      if (badge) { badge.className = 'badge green'; badge.textContent = 'Approved'; }
      showToast('Request approved successfully.');
    } else if (action === 'reject') {
      if (badge) { badge.className = 'badge red'; badge.textContent = 'Rejected'; }
      showToast('Request rejected.', 'error');
    } else if (action === 'delete') {
      var what = btn.getAttribute('data-label') || 'this item';
      confirmAction('This will permanently delete ' + what + '. This action cannot be undone.', function () {
        if (row && row.parentNode) row.parentNode.removeChild(row);
        showToast(what.charAt(0).toUpperCase() + what.slice(1) + ' deleted.');
      });
    } else if (action === 'edit') {
      var modalId = btn.getAttribute('data-modal');
      if (modalId) {
        var modal = document.getElementById(modalId);
        if (modal) {
          var nameEl = row ? row.querySelector('.cell-user b') : null;
          var emailEl = row ? row.querySelector('.cell-user span') : null;
          var fName = modal.querySelector('#editName');
          var fEmail = modal.querySelector('#editEmail');
          if (fName && nameEl) fName.value = nameEl.textContent;
          if (fEmail && emailEl) fEmail.value = emailEl.textContent;
          openModal(modal);
        }
      } else {
        showToast('Edit mode opened for this row.');
      }
    } else {
      showToast(btn.getAttribute('data-toast') || 'Action completed successfully.');
    }
  }

  function initRowActions() {
    document.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () { onRowActionClick(btn); });
    });
  }

  /* ---------- Admin: add user form ---------- */
  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  function initAdminForms() {
    document.querySelectorAll('form[data-admin-user]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var table = document.getElementById(form.getAttribute('data-admin-user'));
        var name = form.querySelector('#addName');
        var email = form.querySelector('#addEmail');
        var role = form.querySelector('#addRole');
        var status = form.querySelector('#addStatus');
        var company = form.querySelector('#addCompany');

        var n = (name && name.value.trim()) || 'New User';
        var em = (email && email.value.trim()) || '';
        var r = (role && role.value) || 'User';
        var s = (status && status.value) || 'Active';
        var comp = (company && company.value.trim()) || 'Stackly';

        if (!email || !em || !isGmailAddress(em)) {
          markEmailError(email, 'Email must be a Gmail address (@gmail.com).');
          return;
        }

        if (table) {
          var tbody = table.querySelector('tbody');
          if (tbody) {
            var tr = document.createElement('tr');
            var roleClass = r === 'Admin' ? 'navy' : (r === 'Analyst' ? 'teal' : 'blue');
            var statusClass = s === 'Active' ? 'green' : (s === 'Suspended' ? 'red' : 'amber');
            tr.innerHTML =
              '<td><div class="cell-user"><span class="avatar sm">' + initials(n) + '</span><div><b>' + n + '</b><span>' + em + '</span></div></div></td>' +
              '<td><span class="badge ' + roleClass + '">' + r + '</span></td>' +
              '<td class="cell-muted">' + comp + '</td>' +
              '<td><span class="badge ' + statusClass + '">' + s + '</span></td>' +
              '<td class="cell-muted">Today</td>' +
              '<td><div class="row"><button type="button" class="btn btn-outline btn-sm" data-action="edit" data-modal="editUserModal">Edit</button><button type="button" class="btn btn-ghost btn-sm" data-action="delete" data-label="user">Delete</button></div></td>';
            tbody.insertBefore(tr, tbody.firstChild);
            bindRowActions(tr);
          }
        }

        var modal = form.closest('.modal-backdrop');
        if (modal) closeModal(modal);
        form.reset();
        showToast('User "' + n + '" created and invited.');
      });
    });
  }

  function bindRowActions(scope) {
    if (!scope) return;
    scope.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () { onRowActionClick(btn); });
    });
  }

  /* ---------- Settings forms ---------- */
  function initSettings() {
    document.querySelectorAll('form[data-settings]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var emailField = form.querySelector('input[type="email"]');
        if (emailField && (!emailField.value.trim() || !isGmailAddress(emailField.value))) {
          markEmailError(emailField, 'Work email must be a Gmail address (@gmail.com).');
          return;
        }
        showToast('Your changes have been saved successfully.', 'success');
      });
    });
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('.counter');
    counters.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var start = null;

      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = eased * target;
        el.textContent = prefix + val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      }
      requestAnimationFrame(step);
    });
  }

  /* ---------- Charts (pure SVG) ---------- */
  var CHART_DATA = {};

  function initCharts() {
    var scripts = document.querySelectorAll('script[data-chart-data]');
    scripts.forEach(function (s) {
      try {
        CHART_DATA = JSON.parse(s.textContent);
      } catch (err) {
        CHART_DATA = {};
      }
    });

    window.StacklyCharts = {
      line: function (range) { renderLineChart(range || '6m'); },
      bar: function (range) { renderBarChart(range || '6m'); }
    };

    renderCharts();
  }

  function renderCharts() {
    var page = document.querySelector('.dash-page.active');
    if (!page) return;
    if (page.querySelector('.chart-line[data-js]')) renderLineChart();
    if (page.querySelector('.chart-bar[data-js]')) renderBarChart();
    if (page.querySelector('.chart-donut[data-js]')) renderDonuts();
  }

  function getActiveChip(name) {
    var page = document.querySelector('.dash-page.active');
    if (!page) return null;
    var active = page.querySelector('.chip.active[data-chart="' + name + '"]');
    return active ? active.getAttribute('data-range') : null;
  }

  function dataset(name) {
    return (CHART_DATA && CHART_DATA[name]) || [];
  }

  function fmtNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  function chartWidth(node) {
    var w = node.clientWidth || 0;
    return Math.min(620, Math.max(300, w));
  }

  function renderLineChart(range) {
    range = range || getActiveChip('line') || '6m';
    var data = dataset(range);
    var nodes = document.querySelectorAll('.dash-page.active .chart-line[data-js]');
    if (!nodes.length || !data.length) return;

    nodes.forEach(function (node) {
      var labels = data.map(function (d) { return d.label; });
      var values = data.map(function (d) { return d.value; });
      var color = node.getAttribute('data-color') || '#f0a500';
      node.innerHTML = buildLineSvg(labels, values, color, chartWidth(node));
      var line = node.querySelector('.chart-line-anim');
      if (line) {
        var len = line.getAttribute('stroke-dasharray') || '0';
        line.setAttribute('stroke-dashoffset', len);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { line.style.strokeDashoffset = '0'; });
        });
      }
    });
  }

  function buildLineSvg(labels, values, color, W) {
    W = W || 620;
    var H = 250, PL = 46, PR = 14, PT = 16, PB = 30;
    var iw = W - PL - PR, ih = H - PT - PB;

    var max = Math.max.apply(null, values) * 1.15;
    var min = 0;
    var range = max - min || 1;

    function X(i) { return PL + (values.length <= 1 ? iw / 2 : (iw * i) / (values.length - 1)); }
    function Y(v) { return PT + ih - ((v - min) / range) * ih; }

    var path = '';
    values.forEach(function (v, i) {
      path += (i === 0 ? 'M' : 'L') + X(i).toFixed(2) + ' ' + Y(v).toFixed(2);
    });

    var area = path + ' L' + X(values.length - 1).toFixed(2) + ' ' + (PT + ih) + ' L' + X(0).toFixed(2) + ' ' + (PT + ih) + ' Z';

    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gy = PT + ih * (g / 4);
      var val = max - (range * g) / 4;
      grid += '<line x1="' + PL + '" y1="' + gy + '" x2="' + (W - PR) + '" y2="' + gy + '" stroke="#eef2f7" stroke-width="1"/>';
      grid += '<text x="' + (PL - 10) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="#9aa7b8">' + fmtNum(val) + '</text>';
    }

    var xlabels = '';
    var labelStep = labels.length > 8 && W < 520 ? 2 : 1;
    labels.forEach(function (l, i) {
      if (i % labelStep !== 0) return;
      xlabels += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#9aa7b8">' + l + '</text>';
    });

    var dots = '';
    values.forEach(function (v, i) {
      dots += '<circle cx="' + X(i).toFixed(2) + '" cy="' + Y(v).toFixed(2) + '" r="4" fill="#fff" stroke="' + color + '" stroke-width="2.5"><title>' + labels[i] + ': ' + fmtNum(v) + '</title></circle>';
    });

    var gradId = 'lg' + Math.random().toString(36).slice(2, 8);

    var len = 0;
    for (var li = 1; li < values.length; li++) {
      var dx = X(li) - X(li - 1);
      var dy = Y(values[li]) - Y(values[li - 1]);
      len += Math.sqrt(dx * dx + dy * dy);
    }
    len = len || iw;

    return (
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Trend chart">' +
      '<defs>' +
      '<linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/>' +
      '</linearGradient>' +
      '</defs>' +
      grid +
      '<path d="' + area + '" fill="url(#' + gradId + ')" class="chart-fill"/>' +
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="chart-line-anim" style="stroke-dasharray:' + len + ';stroke-dashoffset:' + len + ';"/>' +
      xlabels +
      dots +
      '</svg>'
    );
  }

  function renderBarChart(range) {
    var nodes = document.querySelectorAll('.dash-page.active .chart-bar[data-js]');
    if (!nodes.length) return;

    nodes.forEach(function (node) {
      var chipRange = getActiveChip('bar');
      var data;
      if (range) {
        data = dataset(range);
      } else if (chipRange) {
        data = dataset(chipRange);
      } else {
        data = dataset(node.getAttribute('data-dataset') || '6m');
      }
      if (!data.length) return;

      var labels = data.map(function (d) { return d.label; });
      var values = data.map(function (d) { return d.value; });
      var color = node.getAttribute('data-color') || '#12345f';
      node.innerHTML = buildBarSvg(labels, values, color, chartWidth(node));
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          node.querySelectorAll('.chart-bar-anim').forEach(function (bar) {
            bar.style.transform = 'scaleY(1)';
          });
        });
      });
    });
  }

  function buildBarSvg(labels, values, color, W) {
    W = W || 620;
    var H = 250, PL = 46, PR = 14, PT = 16, PB = 30;
    var iw = W - PL - PR, ih = H - PT - PB;
    var max = Math.max.apply(null, values) * 1.15;
    var range = max || 1;
    var slot = iw / labels.length;
    var bw = Math.min(46, slot * 0.55);
    var base = PT + ih;
    var showValues = slot > 42;

    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var gy = PT + ih * (g / 4);
      var val = max - (range * g) / 4;
      grid += '<line x1="' + PL + '" y1="' + gy + '" x2="' + (W - PR) + '" y2="' + gy + '" stroke="#eef2f7" stroke-width="1"/>';
      grid += '<text x="' + (PL - 10) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="#9aa7b8">' + fmtNum(val) + '</text>';
    }

    var bars = '';
    labels.forEach(function (l, i) {
      var h = (values[i] / range) * ih;
      var x = PL + slot * i + (slot - bw) / 2;
      var y = base - h;
      var valueText = showValues
        ? '<text x="' + (x + bw / 2).toFixed(2) + '" y="' + (base - 12) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#0a1f3c">' + fmtNum(values[i]) + '</text>'
        : '';
      bars +=
        '<g class="chart-bar-anim" style="transform-origin:' + (x + bw / 2) + 'px ' + base + 'px;">' +
        '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + h.toFixed(2) + '" rx="6" fill="' + color + '" opacity="0.92"><title>' + l + ': ' + fmtNum(values[i]) + '</title></rect>' +
        valueText +
        '</g>' +
        '<text x="' + (x + bw / 2).toFixed(2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#9aa7b8">' + l + '</text>';
    });

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bar chart">' + grid + bars + '</svg>';
  }

  function renderDonuts() {
    var nodes = document.querySelectorAll('.dash-page.active .chart-donut[data-js]');
    nodes.forEach(function (node) {
      var data = dataset(node.getAttribute('data-dataset'));
      if (!data.length) return;
      var centerTitle = node.getAttribute('data-center-title') || 'Total';
      var centerValue = node.getAttribute('data-center-value') || '';
      node.innerHTML = buildDonutSvg(data, centerTitle, centerValue);

      node.querySelectorAll('.chart-donut-seg').forEach(function (seg) {
        var target = seg.getAttribute('stroke-dasharray');
        var offset = seg.getAttribute('stroke-dashoffset');
        seg.setAttribute('stroke-dasharray', '0 1000');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            seg.setAttribute('stroke-dasharray', target);
            seg.setAttribute('stroke-dashoffset', offset);
          });
        });
      });

      var legend = node.parentNode ? node.parentNode.querySelector('.chart-legend') : null;
      if (legend && legend.getAttribute('data-js-legend')) {
        legend.innerHTML = '';
        data.forEach(function (d) {
          var item = document.createElement('span');
          item.className = 'legend-item';
          item.innerHTML = '<span class="legend-dot" style="background:' + d.color + ';"></span>' + d.label + ' &middot; <b style="color:var(--navy);">' + d.value + '%</b>';
          legend.appendChild(item);
        });
      }
    });
  }

  function buildDonutSvg(data, centerTitle, centerValue) {
    var size = 240, cx = 120, cy = 120, r = 90, sw = 30;
    var C = 2 * Math.PI * r;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0) || 1;

    var segs = '';
    var offset = 0;
    data.forEach(function (d) {
      var len = (d.value / total) * C;
      segs +=
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + d.color + '" stroke-width="' + sw + '" ' +
        'stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" ' +
        'transform="rotate(-90 ' + cx + ' ' + cy + ')" class="chart-donut-seg" stroke-linecap="butt">' +
        '<title>' + d.label + ': ' + d.value + '%</title></circle>';
      offset += len;
    });

    return (
      '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Donut chart">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#eef2f7" stroke-width="' + sw + '"/>' +
      segs +
      '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="26" font-weight="800" fill="#0a1f3c">' + centerValue + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 20) + '" text-anchor="middle" font-size="11" fill="#64748b" font-weight="600">' + centerTitle + '</text>' +
      '</svg>'
    );
  }

  /* ---------- Restore signed-in user from session ---------- */
  function initUserSession() {
    var email = '';
    var role = '';
    try {
      email = sessionStorage.getItem('stackly_session_email') || '';
      role = sessionStorage.getItem('stackly_session_role') || '';
    } catch (e) { /* ignore */ }
    if (!email) return;

    var name = email.split('@')[0]
      .replace(/[._\-+]+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); }) || 'User';

    var roleLabel = role === 'admin' ? 'Administrator' : 'Procurement Manager';

    document.querySelectorAll('.p-name').forEach(function (el) { el.textContent = name; });
    document.querySelectorAll('.u-name').forEach(function (el) { el.textContent = name; });
    document.querySelectorAll('.p-role').forEach(function (el) { el.textContent = email; });
    document.querySelectorAll('.u-role').forEach(function (el) { el.textContent = roleLabel; });

    var greeting = document.querySelector('.topbar-title h1');
    if (greeting && greeting.textContent.indexOf('Welcome') === 0) {
      greeting.textContent = 'Welcome back, ' + name;
    }

    var nameField = document.getElementById(role === 'admin' ? 'admName' : 'setName');
    var emailField = document.getElementById(role === 'admin' ? 'admEmail' : 'setEmail');
    if (nameField) nameField.value = name;
    if (emailField) emailField.value = email;
  }

  /* ---------- Scroll progress bar ---------- */
  function initScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgress';
      document.body.appendChild(bar);
    }
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Placeholder buttons redirect to 404 ---------- */
  function initPlaceholderRedirect() {
    var keep =
      'a.sidebar-brand, .side-nav-item, .back-site, .topbar-menu-btn, .icon-btn, .profile-btn, ' +
      '.profile-menu-item, .chip, #markAllRead, ' +
      '[data-page], [data-open-modal], [data-close-modal], [data-action], [data-logout], ' +
      '[data-dropdown], [data-chart], [data-confirm-cancel], [data-confirm-ok], ' +
      '.js-pagination button, form button, form a[href]';
    document.addEventListener('click', function (e) {
      var el = e.target.closest('button, a[href]');
      if (!el || el.matches(keep) || el.closest(keep)) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
    }, true);
  }

  /* ---------- Logout ---------- */
  function initLogout() {
    document.querySelectorAll('[data-logout]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        confirmAction('You will be signed out of your account.', function () {
          try {
            sessionStorage.removeItem('stackly_session_email');
            sessionStorage.removeItem('stackly_session_role');
          } catch (err) { /* ignore */ }
          showToast('Signed out successfully. Redirecting\u2026', 'success');
          setTimeout(function () { window.location.href = 'signin.html'; }, 1200);
        });
      });
    });
  }

  /* ---------- Inject chart animation styles ---------- */
  function injectStyles() {
    if (CSS_INJECTED) return;
    CSS_INJECTED = true;
    var style = document.createElement('style');
    style.id = 'dashChartStyle';
    style.textContent =
      '.chart-line-anim{transition:stroke-dashoffset 1.3s cubic-bezier(.25,.8,.25,1)}' +
      '.chart-bar-anim{transform:scaleY(0);transition:transform .9s cubic-bezier(.25,.8,.25,1)}' +
      '.chart-donut-seg{transition:stroke-dashoffset 1s ease,stroke-dasharray 1s ease}';
    document.head.appendChild(style);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.querySelectorAll('.chart-line-anim').forEach(function (el) {
          el.style.strokeDashoffset = '0';
        });
        document.querySelectorAll('.chart-bar-anim').forEach(function (el) {
          el.style.transform = 'scaleY(1)';
        });
      });
    });
  }

})();

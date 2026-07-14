// עץ הזית — שכבת אינטראקציה מלאה למוקאפ Front בלבד
// כל הפעולות כאן מדמות חוויית משתמש: ניווט, חיפוש, מודלים, תפריטי פעולה, הורדות וטפסים.

(function () {
  'use strict';

  var qs = function (selector, root) { return (root || document).querySelector(selector); };
  var qsa = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var activeFilter = null;
  var currentMenuContext = null;

  var screenAliases = {
    'פרויקטים': 'projects',
    'סיכונים': 'risks',
    'בקרות': 'controls',
    'ציות': 'compliance',
    'דוחות': 'reports',
    'ניהול': 'admin',
    'SLA': 'reports',
    'חריגות': 'reports',
    'משימות': 'home'
  };

  function showScreen(target) {
    var screenName = target || 'home';
    var section = document.getElementById('screen-' + screenName);
    if (!section) section = document.getElementById('screen-home');
    if (!section) return;

    qsa('.nav-item').forEach(function (b) {
      b.classList.toggle('active', b.dataset.screen === screenName);
    });
    qsa('.screen').forEach(function (s) { s.classList.remove('active'); });
    section.classList.add('active');
    clearSearchVisuals();
    activeFilter = null;
  }
  window.showScreen = showScreen;

  function boot() {
    createMockShell();
    wireNavigation();
    wireSearch();
    wireDelegatedActions();
    enrichClickableElements();

    var initial = (location.hash || '#home').replace('#', '');
    showScreen(initial || 'home');
  }

  function wireNavigation() {
    qsa('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.screen || 'home';
        location.hash = target;
        showScreen(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    window.addEventListener('hashchange', function () {
      showScreen((location.hash || '#home').replace('#', '') || 'home');
    });
  }

  function createMockShell() {
    if (!qs('#mock-toast')) {
      var toast = document.createElement('div');
      toast.id = 'mock-toast';
      toast.className = 'mock-toast';
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    if (!qs('#mock-modal')) {
      var modal = document.createElement('div');
      modal.id = 'mock-modal';
      modal.className = 'mock-modal-backdrop';
      modal.innerHTML = '' +
        '<div class="mock-modal" role="dialog" aria-modal="true" aria-labelledby="mock-modal-title">' +
          '<button class="mock-x" data-close-modal aria-label="סגירה">×</button>' +
          '<div class="mock-modal-head">' +
            '<span class="mock-chip">מוקאפ</span>' +
            '<h2 id="mock-modal-title"></h2>' +
          '</div>' +
          '<div class="mock-modal-body"></div>' +
          '<div class="mock-modal-actions"></div>' +
        '</div>';
      document.body.appendChild(modal);
    }

    if (!qs('#mock-menu')) {
      var menu = document.createElement('div');
      menu.id = 'mock-menu';
      menu.className = 'mock-menu';
      menu.innerHTML = '' +
        '<button data-menu-action="view">צפייה בפרטים</button>' +
        '<button data-menu-action="edit">עריכה מהירה</button>' +
        '<button data-menu-action="assign">שיוך אחראי</button>' +
        '<button data-menu-action="approve">אישור / סגירה</button>' +
        '<button data-menu-action="archive">ארכוב דמו</button>';
      document.body.appendChild(menu);
    }
  }

  function wireSearch() {
    var input = qs('.search-box input');
    if (!input) return;

    input.addEventListener('input', function () {
      var q = input.value.trim();
      filterActiveScreen(q);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        showSearchResults(input.value.trim());
      }
      if (event.key === 'Escape') {
        input.value = '';
        clearSearchVisuals();
        showToast('החיפוש נוקה');
      }
    });
  }

  function wireDelegatedActions() {
    document.addEventListener('click', function (event) {
      var target = event.target;

      if (target.closest('[data-close-modal]') || target.classList.contains('mock-modal-backdrop')) {
        closeModal();
        return;
      }

      var modalAction = target.closest('[data-modal-action]');
      if (modalAction) {
        handleModalAction(modalAction.dataset.modalAction, modalAction);
        return;
      }

      var menuAction = target.closest('[data-menu-action]');
      if (menuAction) {
        handleMenuAction(menuAction.dataset.menuAction);
        return;
      }

      if (!target.closest('#mock-menu')) closeMenu();

      var notificationButton = target.closest('.icon-btn');
      if (notificationButton) {
        openNotifications();
        return;
      }

      var userChip = target.closest('.user-chip');
      if (userChip) {
        openProfileMenu(userChip);
        return;
      }

      var searchBox = target.closest('.search-box');
      if (searchBox) {
        var input = qs('input', searchBox);
        if (input) input.focus();
        return;
      }

      var actionButton = target.closest('.action-icons button');
      if (actionButton) {
        handleReportAction(actionButton);
        return;
      }

      var evidenceLink = target.closest('.link-blue');
      if (evidenceLink) {
        event.preventDefault();
        openEvidenceModal(evidenceLink);
        return;
      }

      var kebab = target.closest('.kebab');
      if (kebab) {
        openContextMenu(kebab);
        return;
      }

      var pageBtn = target.closest('.page-btn');
      if (pageBtn) {
        handlePagination(pageBtn);
        return;
      }

      var newUser = target.closest('.btn-outline');
      if (newUser) {
        openUserForm();
        return;
      }

      var featureLink = target.closest('.feature-link');
      if (featureLink) {
        var cardForReport = featureLink.closest('.feature-card');
        openReportPreview(cardTitle(cardForReport) || 'דוח מערכת');
        return;
      }

      var panelLink = target.closest('.panel-link');
      if (panelLink) {
        handlePanelLink(panelLink);
        return;
      }

      var kpi = target.closest('.kpi-card');
      if (kpi) {
        handleKpiCard(kpi);
        return;
      }

      var featureCard = target.closest('.feature-card');
      if (featureCard) {
        handleFeatureCard(featureCard);
        return;
      }

      var listItem = target.closest('.task-item, .gap-item');
      if (listItem) {
        openListItemDetail(listItem);
        return;
      }

      var row = target.closest('table.data tbody tr');
      if (row) {
        openRowDetail(row);
        return;
      }

      var bar = target.closest('.bar-col, .chart-legend span');
      if (bar) {
        openChartInsight(bar);
        return;
      }

      if (target.closest('.line-chart-svg')) {
        openChartInsight(target.closest('.line-chart-svg'));
      }
    });
  }

  function enrichClickableElements() {
    qsa('.kpi-card, .feature-card, .task-item, .gap-item, table.data tbody tr, .link-blue, .bar-col, .chart-legend span, .line-chart-svg').forEach(function (el) {
      el.classList.add('mock-clickable');
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });

    document.addEventListener('keydown', function (event) {
      if ((event.key !== 'Enter' && event.key !== ' ') || event.target.matches('input, textarea, select, button')) return;
      if (event.target.classList.contains('mock-clickable')) {
        event.preventDefault();
        event.target.click();
      }
    });
  }

  function handlePanelLink(button) {
    var text = cleanText(button);
    var mapped = findScreenByText(text);
    if (mapped && mapped !== 'home') {
      navigateTo(mapped, 'נפתח מסך ' + getScreenLabel(mapped));
      return;
    }

    if (text.indexOf('משימות') > -1) {
      openModal('מרכז משימות', taskCenterHtml(), [
        { label: 'סימון משימה כבוצעה', action: 'complete-task', primary: true },
        { label: 'הקצאה לסוקר', action: 'assign-reviewer' }
      ]);
      return;
    }

    openModal('רשימה מורחבת', '<p>במערכת אמיתית יוצגו כאן כל הרשומות הרלוונטיות, עם סינון, מיון וייצוא.</p>' + mockTimelineHtml(), [
      { label: 'ייצוא רשימה', action: 'export-current', primary: true }
    ]);
  }

  function handleKpiCard(card) {
    var label = cleanText(qs('.kpi-label', card) || card);
    var value = cleanText(qs('.kpi-value', card) || card);
    var screen = findScreenByText(label);
    if (screen) {
      navigateTo(screen, 'סינון מוקאפ לפי: ' + label);
      activeFilter = label;
      showToast(label + ' — מוצגים נתוני מוקאפ (' + value + ')');
      return;
    }
    openModal(label, '<p>מדד דמו: <strong>' + escapeHtml(value) + '</strong></p>' + mockTimelineHtml(), [
      { label: 'פתיחת Drill Down', action: 'drill-down', primary: true },
      { label: 'ייצוא מדד', action: 'export-current' }
    ]);
  }

  function handleFeatureCard(card) {
    var title = cardTitle(card);
    var current = activeScreenId();

    if (current === 'projects') {
      openModal(title, projectCardHtml(title), [
        { label: 'פתיחת פרויקטים מתאימים', action: 'filter-projects', primary: true },
        { label: 'הפקת סטטוס לוועדה', action: 'export-current' }
      ]);
      return;
    }

    if (current === 'controls') {
      openModal(title, controlCardHtml(title), [
        { label: 'פתיחת רשימת בקרות', action: 'filter-controls', primary: true },
        { label: 'הוספת ראיה', action: 'add-evidence' }
      ]);
      return;
    }

    if (current === 'reports') {
      openReportPreview(title);
      return;
    }

    if (current === 'admin') {
      openAdminCard(title);
      return;
    }

    openModal(title, '<p>כרטיס דמו עם Drill Down, סינון והצגת פרטים.</p>' + mockTimelineHtml(), [
      { label: 'פתיחת Drill Down', action: 'drill-down', primary: true }
    ]);
  }

  function openListItemDetail(item) {
    var title = cleanText(qs('strong', item) || item);
    var subtitle = cleanText(qs('.task-body span, .gap-body span', item) || '');
    openModal(title, '' +
      '<div class="mock-summary-grid">' +
        '<div><span>סטטוס</span><strong>פתוח לטיפול</strong></div>' +
        '<div><span>עדיפות</span><strong>גבוהה</strong></div>' +
        '<div><span>אחראי</span><strong>דניאל לוי</strong></div>' +
        '<div><span>יעד</span><strong>7 ימים</strong></div>' +
      '</div>' +
      '<p>' + escapeHtml(subtitle || 'משימת מוקאפ הכוללת תיאור, אחראי, SLA ופעולות המשך.') + '</p>' +
      mockTimelineHtml(), [
        { label: 'לקיחת בעלות', action: 'take-ownership', primary: true },
        { label: 'פתיחת משימת המשך', action: 'create-followup' },
        { label: 'סימון כבוצע', action: 'complete-task' }
      ]);
  }

  function openRowDetail(row) {
    var title = cleanText(qs('.cell-title', row) || row.cells[0] || row);
    var cells = qsa('td', row).map(function (td, index) {
      var value = cleanText(td);
      if (!value) value = 'פעולות';
      return '<div><span>שדה ' + (index + 1) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
    }).join('');

    openModal(title, '' +
      '<div class="mock-summary-grid">' + cells + '</div>' +
      '<h3>תמונת מצב מוקאפ</h3>' +
      '<p>במסך אמיתי יוצגו כאן היסטוריית אישורים, ראיות, סיכונים מקושרים, בעלי עניין והחלטות ועדה.</p>' +
      mockTimelineHtml(), [
        { label: 'פתיחת תיק מלא', action: 'open-record', primary: true },
        { label: 'עדכון סטטוס', action: 'update-status' },
        { label: 'ייצוא פרטים', action: 'export-current' }
      ]);
  }

  function setDefaultContextMenu(menu) {
    menu.innerHTML = '' +
      '<button data-menu-action="view">צפייה בפרטים</button>' +
      '<button data-menu-action="edit">עריכה מהירה</button>' +
      '<button data-menu-action="assign">שיוך אחראי</button>' +
      '<button data-menu-action="approve">אישור / סגירה</button>' +
      '<button data-menu-action="archive">ארכוב דמו</button>';
  }

  function openContextMenu(button) {
    currentMenuContext = button.closest('tr') || button.closest('.panel') || document.body;
    var menu = qs('#mock-menu');
    setDefaultContextMenu(menu);
    var rect = button.getBoundingClientRect();
    menu.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    menu.style.left = (window.scrollX + rect.left - 150) + 'px';
    menu.classList.add('open');
  }

  function closeMenu() {
    var menu = qs('#mock-menu');
    if (menu) menu.classList.remove('open');
  }

  function handleMenuAction(action) {
    closeMenu();
    var row = currentMenuContext && currentMenuContext.matches && currentMenuContext.matches('tr') ? currentMenuContext : null;
    var title = row ? cleanText(qs('.cell-title', row) || row.cells[0]) : 'רשומה';

    if (action === 'profile') return openModal('פרופיל משתמש', '<div class="mock-summary-grid"><div><span>שם</span><strong>דניאל לוי</strong></div><div><span>תפקיד</span><strong>מנהל אבטחת מידע</strong></div><div><span>הרשאה</span><strong>מנהל מערכת דמו</strong></div></div>', [{ label: 'עריכת פרופיל', action: 'save-settings', primary: true }]);
    if (action === 'preferences') return openModal('העדפות תצוגה', '<form class="mock-form"><label>תצוגת ברירת מחדל<select><option>דף הבית</option><option>פרויקטים</option><option>דוחות</option></select></label><label>צפיפות טבלאות<select><option>רגילה</option><option>צפופה</option><option>מרווחת</option></select></label></form>', [{ label: 'שמירת העדפות', action: 'save-settings', primary: true }]);
    if (action === 'permissions') return navigateTo('admin', 'נפתח מסך הרשאות ותפקידים');
    if (action === 'logout') return showToast('יציאה דמו — לא בוצע ניתוק אמיתי');
    if (action === 'view' && row) return openRowDetail(row);
    if (action === 'edit') return openQuickEdit(title);
    if (action === 'assign') return openAssignDialog(title);
    if (action === 'approve') return confirmMockAction('אישור / סגירה', title, 'האישור נשמר במוקאפ ונוספה החלטה לציר הזמן.');
    if (action === 'archive') return confirmMockAction('ארכוב דמו', title, 'הרשומה סומנה כמאורכבת במוקאפ.');
    showToast('פעולת תפריט בוצעה במוקאפ');
  }

  function handlePagination(btn) {
    var container = btn.closest('.pagination');
    if (!container) return;
    qsa('.page-btn', container).forEach(function (b) { b.classList.remove('active'); });
    if (cleanText(btn)) btn.classList.add('active');
    var value = cleanText(btn) || 'עמוד סמוך';
    showToast('מעבר דמו ל' + value + ' — הנתונים נשארים כמדגם');
  }

  function handleReportAction(button) {
    var title = cleanText(qs('.cell-title', button.closest('tr')) || button.closest('tr') || 'דוח');
    var action = button.getAttribute('title') || cleanText(button);
    if (action.indexOf('הורדה') > -1) {
      downloadMockReport(title);
    } else {
      openReportPreview(title);
    }
  }

  function openEvidenceModal(link) {
    var row = link.closest('tr');
    var title = cleanText(qs('.cell-title', row) || row || 'ראיות');
    var count = cleanText(link);
    openModal('ראיות עבור ' + title, '' +
      '<p>נמצאו <strong>' + escapeHtml(count) + '</strong> עבור הבקרה. הרשימה מדמה קבצים, אישורים ותצלומי מסך.</p>' +
      '<ul class="mock-file-list">' +
        '<li><span>מדיניות הרשאות חתומה.pdf</span><button data-modal-action="view-file">צפייה</button></li>' +
        '<li><span>תצלום מסך ממערכת IAM.png</span><button data-modal-action="view-file">צפייה</button></li>' +
        '<li><span>לוג ביקורת אחרון.csv</span><button data-modal-action="download-evidence">הורדה</button></li>' +
      '</ul>', [
        { label: 'הוספת ראיה', action: 'add-evidence', primary: true },
        { label: 'סימון ראיות כמספיקות', action: 'approve-evidence' }
      ]);
  }

  function openReportPreview(title) {
    openModal(title, '' +
      '<div class="mock-report-preview">' +
        '<div class="mock-report-page">' +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p>תקציר מנהלים: סטטוס GRC יציב, נדרשת תשומת לב לחריגות SLA, פערי ראיות ובקרות בתהליך.</p>' +
          '<div class="mock-mini-bars"><i style="height:82%"></i><i style="height:64%"></i><i style="height:92%"></i><i style="height:71%"></i></div>' +
        '</div>' +
      '</div>', [
        { label: 'הורדת דוח דמו', action: 'download-report', primary: true },
        { label: 'שליחה לוועדה', action: 'send-committee' }
      ]);
  }

  function openNotifications() {
    openModal('התראות מערכת', '' +
      '<ul class="mock-alert-list">' +
        '<li><strong>3 פרויקטים</strong><span>ממתינים לאישור ועדת ארכיטקטורה</span></li>' +
        '<li><strong>2 בקרות</strong><span>חסרות ראיות עדכניות</span></li>' +
        '<li><strong>חריגת SLA</strong><span>פרויקט BI ארגוני חרג ב־4 ימים</span></li>' +
      '</ul>', [
        { label: 'פתיחת כל ההתראות', action: 'open-alerts', primary: true },
        { label: 'סימון הכל כנקרא', action: 'mark-read' }
      ]);
  }

  function openProfileMenu(button) {
    currentMenuContext = button;
    var menu = qs('#mock-menu');
    var rect = button.getBoundingClientRect();
    menu.innerHTML = '' +
      '<button data-menu-action="profile">פרופיל משתמש</button>' +
      '<button data-menu-action="preferences">העדפות תצוגה</button>' +
      '<button data-menu-action="permissions">הרשאות ותפקידים</button>' +
      '<button data-menu-action="logout">יציאה דמו</button>';
    menu.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    menu.style.left = (window.scrollX + rect.left - 130) + 'px';
    menu.classList.add('open');
  }

  function openUserForm() {
    openModal('משתמש חדש', '' +
      '<form class="mock-form" id="mock-user-form">' +
        '<label>שם מלא<input name="fullName" value="נועה ישראלי"></label>' +
        '<label>שם משתמש<input name="username" value="noa.israeli"></label>' +
        '<label>תפקיד<select name="role"><option>סוקר רגולציה</option><option>מנהל סיכונים</option><option>קצין ציות</option><option>מנהל מערכת</option></select></label>' +
        '<label>מחלקה<input name="department" value="רגולציה"></label>' +
        '<label>דוא״ל<input name="email" value="noa.israeli@etzhazait.co.il"></label>' +
      '</form>', [
        { label: 'שמירת משתמש', action: 'save-user', primary: true },
        { label: 'בדיקת הרשאות', action: 'check-permissions' }
      ]);
  }

  function openAdminCard(title) {
    var body = '<p>מסך הגדרות מוקאפ עבור <strong>' + escapeHtml(title) + '</strong>.</p>';
    if (title.indexOf('תפקידים') > -1) {
      body += '<div class="mock-summary-grid"><div><span>תפקידים</span><strong>8</strong></div><div><span>קבוצות</span><strong>14</strong></div><div><span>חריגים</span><strong>2</strong></div></div>';
    } else if (title.indexOf('מסלולי') > -1) {
      body += '<div class="mock-flow"><span>קליטה</span><span>שאלון</span><span>סוקר</span><span>ועדה</span><span>אישור</span></div>';
    } else {
      body += '<ul class="mock-file-list"><li><span>שאלון IT 3.1</span><button data-modal-action="view-file">פתיחה</button></li><li><span>תבנית מצגת ועדה</span><button data-modal-action="view-file">פתיחה</button></li></ul>';
    }
    openModal(title, body, [
      { label: 'פתיחת מסך ניהול', action: 'admin-open', primary: true },
      { label: 'שמירת שינוי דמו', action: 'save-settings' }
    ]);
  }

  function openQuickEdit(title) {
    openModal('עריכה מהירה — ' + title, '' +
      '<form class="mock-form">' +
        '<label>סטטוס<select><option>בתהליך</option><option>ממתין לאישור</option><option>הושלם</option><option>נדרש תיקון</option></select></label>' +
        '<label>אחראי<input value="דניאל לוי"></label>' +
        '<label>הערה<textarea>עודכן במסגרת מוקאפ.</textarea></label>' +
      '</form>', [
        { label: 'שמירת שינוי', action: 'save-quick-edit', primary: true },
        { label: 'הוספת הערה', action: 'add-note' }
      ]);
  }

  function openAssignDialog(title) {
    openModal('שיוך אחראי — ' + title, '' +
      '<form class="mock-form">' +
        '<label>אחראי חדש<select><option>דניאל לוי</option><option>יונתן כהן</option><option>מירב לוי</option><option>שירה כהן</option></select></label>' +
        '<label>סיבת שיוך<textarea>נדרש טיפול מקצועי ובקרת המשך.</textarea></label>' +
      '</form>', [
        { label: 'שיוך ושמירה', action: 'assign-save', primary: true },
        { label: 'שליחת התראה', action: 'notify-owner' }
      ]);
  }

  function confirmMockAction(title, record, message) {
    openModal(title + ' — ' + record, '<p>' + escapeHtml(message) + '</p>' + mockTimelineHtml(), [
      { label: 'אישור פעולה', action: 'confirm-action', primary: true },
      { label: 'ביטול', action: 'close' }
    ]);
  }

  function openChartInsight(el) {
    var label = cleanText(el) || 'מגמה לאורך זמן';
    openModal('תובנות דמו — ' + label, '' +
      '<p>לחיצה על תרשים פותחת Drill Down עם מגמות, חריגים והמלצות פעולה.</p>' +
      '<div class="mock-summary-grid">' +
        '<div><span>מגמה</span><strong>שיפור קל</strong></div>' +
        '<div><span>חריגים</span><strong>6</strong></div>' +
        '<div><span>מוקדי טיפול</span><strong>3</strong></div>' +
      '</div>', [
        { label: 'פתיחת ניתוח מלא', action: 'drill-down', primary: true },
        { label: 'ייצוא תרשים', action: 'export-current' }
      ]);
  }

  function handleModalAction(action, button) {
    if (action === 'close') return closeModal();
    if (action === 'save-user') return saveMockUser();
    if (action === 'download-report') return downloadMockReport(qs('#mock-modal-title').textContent || 'דוח מוקאפ');
    if (action === 'export-current' || action === 'download-evidence') return downloadMockReport('ייצוא מוקאפ');
    if (action === 'filter-projects') return navigateTo('projects', 'נפתח סינון פרויקטים');
    if (action === 'filter-controls') return navigateTo('controls', 'נפתח סינון בקרות');
    if (action === 'open-alerts') return navigateTo('home', 'נפתח מרכז ההתראות בדף הבית');
    if (action === 'admin-open') return navigateTo('admin', 'נפתח מסך ניהול');
    if (action === 'view-file') return showToast('קובץ מוקאפ נפתח לתצוגה');
    if (action === 'mark-read') {
      var dot = qs('.icon-btn .badge-dot');
      if (dot) dot.style.display = 'none';
      return showToast('כל ההתראות סומנו כנקראו');
    }
    showToast(mockActionLabel(action, button) + ' — בוצע במוקאפ');
  }

  function saveMockUser() {
    var form = qs('#mock-user-form');
    if (!form) return showToast('טופס המשתמש נשמר במוקאפ');
    var data = new FormData(form);
    var tbody = qs('#screen-admin table.data tbody');
    if (tbody) {
      var tr = document.createElement('tr');
      tr.innerHTML = '' +
        '<td><span class="cell-title">' + escapeHtml(data.get('fullName') || 'משתמש חדש') + '</span></td>' +
        '<td>' + escapeHtml(data.get('username') || 'new.user') + '</td>' +
        '<td>' + escapeHtml(data.get('role') || 'סוקר רגולציה') + '</td>' +
        '<td>' + escapeHtml(data.get('department') || 'רגולציה') + '</td>' +
        '<td>' + escapeHtml(data.get('email') || 'new.user@example.local') + '</td>' +
        '<td><span class="status st-blue"><span class="dot"></span>חדש</span></td>' +
        '<td>היום</td>' +
        '<td><button class="kebab"><svg width="17" height="17"><use href="#i-dots"/></svg></button></td>';
      tbody.prepend(tr);
      tr.classList.add('mock-new-row', 'mock-clickable');
    }
    closeModal();
    showToast('המשתמש נוסף לטבלת הניהול במוקאפ');
  }

  function navigateTo(screen, toast) {
    location.hash = screen;
    showScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (toast) showToast(toast);
  }

  function filterActiveScreen(query) {
    clearSearchVisuals();
    if (!query) return;
    var active = qs('.screen.active');
    if (!active) return;
    var targets = qsa('table.data tbody tr, .task-item, .gap-item, .feature-card, .kpi-card', active);
    var lower = query.toLowerCase();
    var found = 0;
    targets.forEach(function (el) {
      var match = cleanText(el).toLowerCase().indexOf(lower) > -1;
      el.classList.toggle('mock-hidden-by-search', !match);
      if (match) {
        el.classList.add('mock-highlight');
        found += 1;
      }
    });
    var box = qs('.search-box');
    if (box) box.dataset.results = found + ' תוצאות';
  }

  function clearSearchVisuals() {
    qsa('.mock-hidden-by-search').forEach(function (el) { el.classList.remove('mock-hidden-by-search'); });
    qsa('.mock-highlight').forEach(function (el) { el.classList.remove('mock-highlight'); });
    var box = qs('.search-box');
    if (box) delete box.dataset.results;
  }

  function showSearchResults(query) {
    if (!query) return openModal('חיפוש במערכת', '<p>הקלד טקסט לחיפוש בפרויקטים, סיכונים, בקרות, ציות או דוחות.</p>', [
      { label: 'סגירה', action: 'close', primary: true }
    ]);
    var active = qs('.screen.active');
    var matches = qsa('table.data tbody tr, .task-item, .gap-item, .feature-card, .kpi-card', active).filter(function (el) {
      return cleanText(el).toLowerCase().indexOf(query.toLowerCase()) > -1;
    });
    var items = matches.slice(0, 8).map(function (el) {
      return '<li>' + escapeHtml(cleanText(el).slice(0, 130)) + '</li>';
    }).join('') || '<li>לא נמצאו תוצאות במסך הנוכחי</li>';
    openModal('תוצאות חיפוש — ' + query, '<p>נמצאו ' + matches.length + ' תוצאות במסך הנוכחי.</p><ul class="mock-results">' + items + '</ul>', [
      { label: 'פתיחת חיפוש מתקדם', action: 'advanced-search', primary: true },
      { label: 'ניקוי חיפוש', action: 'close' }
    ]);
  }

  function openModal(title, bodyHtml, actions) {
    var backdrop = qs('#mock-modal');
    qs('#mock-modal-title', backdrop).textContent = title;
    qs('.mock-modal-body', backdrop).innerHTML = bodyHtml || '';
    qs('.mock-modal-actions', backdrop).innerHTML = (actions || [{ label: 'סגירה', action: 'close', primary: true }]).map(function (a) {
      return '<button class="mock-action ' + (a.primary ? 'primary' : '') + '" data-modal-action="' + escapeHtml(a.action) + '">' + escapeHtml(a.label) + '</button>';
    }).join('');
    backdrop.classList.add('open');
    document.body.classList.add('mock-modal-open');
  }

  function closeModal() {
    var backdrop = qs('#mock-modal');
    if (backdrop) backdrop.classList.remove('open');
    document.body.classList.remove('mock-modal-open');
  }

  function showToast(message) {
    var toast = qs('#mock-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  function downloadMockReport(title) {
    var content = 'עץ הזית — מערכת GRC ארגונית\n' +
      'דוח מוקאפ: ' + title + '\n' +
      'תאריך הפקה: ' + new Date().toLocaleString('he-IL') + '\n\n' +
      'זהו קובץ דמו שנוצר מתוך מוקאפ ה-Front. במערכת אמיתית יחובר למנוע דוחות, הרשאות ונתוני אמת.\n';
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = safeFileName(title) + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('קובץ דמו הורד לדפדפן');
  }

  function cardTitle(card) {
    return cleanText(qs('h3', card) || card);
  }

  function cleanText(el) {
    if (!el) return '';
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function findScreenByText(text) {
    var keys = Object.keys(screenAliases);
    for (var i = 0; i < keys.length; i += 1) {
      if ((text || '').indexOf(keys[i]) > -1) return screenAliases[keys[i]];
    }
    return null;
  }

  function activeScreenId() {
    var active = qs('.screen.active');
    return active ? active.id.replace('screen-', '') : 'home';
  }

  function getScreenLabel(screen) {
    var nav = qs('.nav-item[data-screen="' + screen + '"]');
    return nav ? cleanText(nav).replace('⌄', '') : screen;
  }

  function projectCardHtml(title) {
    return '' +
      '<p>Drill Down עבור <strong>' + escapeHtml(title) + '</strong>: קליטת פרויקט, מסלול אישור, ועדות נדרשות ו-SLA.</p>' +
      '<div class="mock-flow"><span>קליטה</span><span>שאלון</span><span>סיווג</span><span>ועדה</span><span>אישור</span></div>' +
      '<div class="mock-summary-grid"><div><span>מסלול מלא</span><strong>18</strong></div><div><span>מסלול מקוצר</span><strong>24</strong></div><div><span>חריגי SLA</span><strong>6</strong></div></div>';
  }

  function controlCardHtml(title) {
    return '' +
      '<p>סטטוס בקרות עבור <strong>' + escapeHtml(title) + '</strong>, כולל ראיות, סוקרים ופערי מימוש.</p>' +
      '<div class="mock-summary-grid"><div><span>מיושמות</span><strong>48</strong></div><div><span>בתהליך</span><strong>17</strong></div><div><span>חסרות ראיות</span><strong>11</strong></div></div>';
  }

  function taskCenterHtml() {
    return '' +
      '<ul class="mock-alert-list">' +
        '<li><strong>עדכון הערכת סיכון</strong><span>פתוח, יעד בעוד 3 ימים</span></li>' +
        '<li><strong>טיפול בממצאי בקרה</strong><span>4 ממצאים ממתינים לסוקר</span></li>' +
        '<li><strong>אישור מדיניות</strong><span>ממתין לוועדת ציות</span></li>' +
      '</ul>';
  }

  function mockTimelineHtml() {
    return '' +
      '<ol class="mock-timeline">' +
        '<li><strong>נוצר</strong><span>קליטת פריט במערכת</span></li>' +
        '<li><strong>נבדק</strong><span>סקירת סוקר מקצועי</span></li>' +
        '<li><strong>ממתין החלטה</strong><span>דיון ועדה / מנהל אחראי</span></li>' +
      '</ol>';
  }

  function mockActionLabel(action, button) {
    var labels = {
      'complete-task': 'משימה סומנה כבוצעה',
      'assign-reviewer': 'נפתחה הקצאה לסוקר',
      'take-ownership': 'נלקחה בעלות',
      'create-followup': 'נפתחה משימת המשך',
      'open-record': 'נפתח תיק מלא',
      'update-status': 'סטטוס עודכן',
      'add-evidence': 'נפתחה הוספת ראיה',
      'approve-evidence': 'ראיות אושרו',
      'send-committee': 'דוח נשלח לוועדה',
      'check-permissions': 'הרשאות נבדקו',
      'save-settings': 'הגדרות נשמרו',
      'save-quick-edit': 'השינוי נשמר',
      'add-note': 'הערה נוספה',
      'assign-save': 'האחראי שויך',
      'notify-owner': 'התראה נשלחה',
      'confirm-action': 'הפעולה אושרה',
      'drill-down': 'נפתח Drill Down',
      'advanced-search': 'חיפוש מתקדם נפתח',
      'profile': 'פרופיל משתמש נפתח',
      'preferences': 'העדפות תצוגה נפתחו',
      'permissions': 'מסך הרשאות נפתח',
      'logout': 'יציאה דמו בוצעה'
    };
    return labels[action] || cleanText(button) || 'פעולת מוקאפ';
  }

  function safeFileName(title) {
    return (title || 'mock-report').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_').slice(0, 80);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[ch];
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();

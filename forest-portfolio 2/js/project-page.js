// project-page.js — Handles theme/season for project detail pages
(function () {
  // --- Utility: Get season and theme from localStorage ---
  function getSeason() {
    return localStorage.getItem('season') || 'spring';
  }
  function getNightMode() {
    return localStorage.getItem('nightMode') === 'true';
  }

  // --- Apply theme classes to body ---
  function applyTheme() {
    const season = getSeason();
    document.body.classList.remove('season-spring', 'season-summer', 'season-fall', 'season-winter');
    document.body.classList.add('season-' + season);
    if (getNightMode()) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
    // Update badge
    const badge = document.getElementById('season-badge');
    if (badge) {
      badge.textContent = season.charAt(0).toUpperCase() + season.slice(1);
    }
  }

  // --- Clear preferences ---
  function clearPrefs() {
    localStorage.removeItem('season');
    localStorage.removeItem('nightMode');
    location.reload();
  }

  // --- Attach clear button handler ---
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme();
    var clearBtn = document.getElementById('clear-prefs-btn');
    if (clearBtn) clearBtn.addEventListener('click', clearPrefs);
  });
})();

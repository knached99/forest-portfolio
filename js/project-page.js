// project-page.js — Handles theme/season for project detail pages
(function () {

  function getRealSeason() {
  const m = new Date().getMonth(); // 0–11

  if (m >= 2 && m <= 4) return 'spring';  // Mar–May
  if (m >= 5 && m <= 7) return 'summer';  // Jun–Aug
  if (m >= 8 && m <= 10) return 'fall';   // Sep–Nov
  return 'winter';                        // Dec–Feb
}

  // --- Utility: Get season and theme from localStorage ---
  function getSeason() {
  const raw = localStorage.getItem('selectedSeason');
  if (!raw) return getRealSeason();

  try {
    const data = JSON.parse(raw);

    if (Date.now() > data.expires) {
      localStorage.removeItem('selectedSeason');
      return getRealSeason();
    }

    return data.season || getRealSeason();
  } catch {
    localStorage.removeItem('selectedSeason');
    return getRealSeason();
  }
}


 function getNightMode() {
  const raw = localStorage.getItem('timeOfDay');
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);

    if (Date.now() > data.expires) {
      localStorage.removeItem('timeOfDay');
      return false;
    }

    return !!data.isNight;
  } catch {
    localStorage.removeItem('timeOfDay');
    return false;
  }
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

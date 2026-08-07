/* ===========================================================
   The Portfolio Briefcase — shared session + nav logic
   Include this on every page along with eppn-common.css.
   Each page should have <div id="eppn-nav-root"></div> as the
   first thing in <body>, and set <body data-page="..."> to one
   of: home, login, subscribe, edit-portfolio, unsubscribe, feedback
   =========================================================== */

const EPPN = {
  API_BASE: 'https://eppn-backend.onrender.com',
  STORAGE_KEY: 'eppn_token',

  getToken() {
    return localStorage.getItem(this.STORAGE_KEY);
  },
  setToken(token) {
    localStorage.setItem(this.STORAGE_KEY, token);
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  logout() {
    // Best-effort: invalidate the token server-side too, so it can't be
    // reused even if it leaked. Don't block on the response — clearing the
    // local copy is what actually matters for this browser.
    const token = this.getToken();
    if (token) {
      fetch(`${this.API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /* Wrapper around fetch() that attaches the session token as a Bearer
     Authorization header. Use this instead of raw fetch() for any call to a
     login-gated endpoint (get-portfolio, portfolio-quotes, update-portfolio,
     unsubscribe). */
  authFetch(path, options = {}) {
    const token = this.getToken();
    const headers = Object.assign({}, options.headers || {}, {
      'Authorization': `Bearer ${token}`
    });
    return fetch(`${this.API_BASE}${path}`, Object.assign({}, options, { headers }));
  },

  /* Call at the top of a page that requires login. Redirects to the login
     page (with a "next" param to bounce back afterward) if not logged in.
     Returns true if the page should keep rendering, false if it's bouncing. */
  requireLogin(currentPageFile) {
    if (this.isLoggedIn()) return true;
    const next = currentPageFile || (location.pathname.split('/').pop() || 'index.html');
    location.href = `login.html?next=${encodeURIComponent(next)}`;
    return false;
  }
};

const BRIEFCASE_ICON = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2.5" y="8" width="19" height="12.5" rx="1.8" stroke="#ffffff" stroke-width="1.6"/>
  <path d="M8.5 8V6.3C8.5 5.1 9.5 4 10.8 4H13.2C14.5 4 15.5 5.1 15.5 6.3V8" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
  <rect x="10.3" y="12.5" width="3.4" height="2.4" rx="0.5" fill="#ffffff"/>
</svg>`;

function eppnRenderNav() {
  const root = document.getElementById('eppn-nav-root');
  if (!root) return;

  const currentPage = document.body.getAttribute('data-page') || '';
  const loggedIn = EPPN.isLoggedIn();

  root.innerHTML = `
    <div class="eppn-topbar">
      <button class="eppn-hamburger" id="eppn-menu-btn" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <a href="index.html" class="eppn-brand">
        ${BRIEFCASE_ICON}
        <span class="eppn-brand-name">The Portfolio Briefcase</span>
      </a>
    </div>
    <div class="eppn-drawer-overlay" id="eppn-overlay"></div>
    <nav class="eppn-drawer" id="eppn-drawer" aria-label="Main menu">
      <div class="eppn-drawer-header">Menu</div>
      <a href="index.html" data-page="home">Home</a>
      <a href="${loggedIn ? '#' : 'login.html'}" id="eppn-login-link" data-page="login">${loggedIn ? 'Log out' : 'Log in'}</a>
      <a href="subscribe.html" data-page="subscribe">Subscribe</a>
      <a href="edit-portfolio.html" data-page="edit-portfolio">Edit portfolio</a>
      <a href="unsubscribe.html" data-page="unsubscribe">Unsubscribe</a>
      <a href="feedback.html" data-page="feedback">Feedback</a>
    </nav>
  `;

  // Highlight current page
  root.querySelectorAll('.eppn-drawer a[data-page]').forEach(a => {
    if (a.dataset.page === currentPage) a.classList.add('active');
  });

  // Drawer open/close
  const menuBtn = document.getElementById('eppn-menu-btn');
  const drawer = document.getElementById('eppn-drawer');
  const overlay = document.getElementById('eppn-overlay');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Log out link behavior
  const loginLink = document.getElementById('eppn-login-link');
  if (loggedIn) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      EPPN.logout();
      location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', eppnRenderNav);

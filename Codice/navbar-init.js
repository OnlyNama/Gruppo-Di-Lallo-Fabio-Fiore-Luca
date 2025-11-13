// Navbar initialization moved out of navbar.html so it can be called after
// the navbar is injected via fetch/innerHTML.
(function(){
  function initNavbar() {
    console.log('[navbar-init] initNavbar start');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.getElementById('primary-navigation');
    const menuLabelEl = menuToggle ? menuToggle.querySelector('.menu-label') : null;
    console.log('[navbar-init] menuToggle:', menuToggle, 'navLinks:', navLinks);
    if(!menuToggle || !navLinks) {
      console.warn('[navbar-init] missing elements, aborting init');
      return;
    }

    // prevent double-init
    if(menuToggle._navbarInitialized) { console.log('[navbar-init] already initialized'); return; }
    menuToggle._navbarInitialized = true;

    function openMenu() {
      console.log('[navbar-init] openMenu');
      menuToggle.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
    }
    function closeMenu() {
      console.log('[navbar-init] closeMenu');
      menuToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    }

    menuToggle.addEventListener('click', function(e){
      console.log('[navbar-init] toggle click, aria-expanded=', this.getAttribute('aria-expanded'));
      const expanded = this.getAttribute('aria-expanded') === 'true';
      if(expanded) closeMenu(); else openMenu();
      e.stopPropagation();
    });

    // Set the menu label to the current page name by matching location pathname
    try {
      let label = null;
      const links = Array.from(navLinks.querySelectorAll('a'));
      // derive current filename from location.pathname; default to index.html
      let path = (location.pathname || '').split('/').pop();
      if(!path) path = 'index.html';
      path = decodeURIComponent(path).toLowerCase();

      // Find link whose href filename matches the path
      let matched = links.find(a => {
        const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
        return href === path;
      });

      // If no exact match and path is index.html, try to match '/' or empty hrefs
      if(!matched && path === 'index.html') {
        matched = links.find(a => {
          const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
          return href === '' || href === 'index.html';
        });
      }

      // Fallback to first link if still not matched
      if(!matched) matched = links[0] || null;

      // Update active class on links
      links.forEach(a => a.classList.remove('active'));
      if(matched) matched.classList.add('active');

      if(matched) label = matched.textContent.trim();
      if(!label) label = 'Menu';
      if(menuLabelEl) menuLabelEl.textContent = label;
    } catch (e) { console.error('[navbar-init] error setting label', e); }

    // Chiudi il menu quando si clicca su un link (utile per mobile)
    document.querySelectorAll('#primary-navigation a').forEach(a => a.addEventListener('click', ()=>{
      console.log('[navbar-init] link click');
      closeMenu();
    }));

    // Chiudi se si clicca fuori del menu
    document.addEventListener('click', function(e){
      if(!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        console.log('[navbar-init] click outside -> close');
        closeMenu();
      }
    });

    // Chiudi con ESC
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') { console.log('[navbar-init] ESC pressed'); closeMenu(); }
    });
  }

  // expose to global so pages that load navbar via fetch can call it
  window.initNavbar = initNavbar;
})();

// Carica navbar e footer da file separati
document.addEventListener("DOMContentLoaded", () => {
  // Navbar
  fetch("navbar.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("navbar").innerHTML = data;
      // load navbar-init.js and call initNavbar after it's loaded
      const s = document.createElement('script');
      s.src = 'navbar-init.js';
      s.onload = function(){
        try { if(window.initNavbar) window.initNavbar(); }
        catch(e){ console.error('initNavbar error', e); }
      };
      document.body.appendChild(s);
    });

  fetch("footer.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
    });
});

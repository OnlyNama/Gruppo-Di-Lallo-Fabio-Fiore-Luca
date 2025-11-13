document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Controllo semplice per la conferma password
    if (password !== confirmPassword) {
      alert("Le password non coincidono. Riprova.");
      return;
    }

    // Simulazione registrazione riuscita
    alert(`Registrazione completata! Benvenuto/a, ${fullname}.`);

    // Reindirizza sempre al login
    window.location.href = "login.html";
  });
});

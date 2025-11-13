document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // evita il refresh della pagina

    // Recupera i dati (non vengono verificati)
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Simulazione login riuscito
    alert(`Benvenuto, ${username || "utente"}! Accesso effettuato con successo.`);

    // Reindirizza sempre alla home ovvero index
    window.location.href = "index.html";
  });
});

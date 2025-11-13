// Documenti demo
const docs = [
  { name: "DivinaCommedia.pdf", date: "2025-08-15" },
  { name: "Pirandellovita.pdf", date: "2025-07-22" },
  { name: "Storiadellosport.pdf", date: "2025-06-10" },
  { name: "Primaguerramondiale.pdf", date: "2025-05-05" },
  { name: "Interfacciauomomacchina.pdf", date: "2026-04-18" }
];

// Popola la tabella documenti
function renderDocs() {
  const tbody = document.getElementById("docsTable");
  tbody.innerHTML = "";

  docs.forEach(doc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.name}</td>
      <td>${doc.date}</td>
      <td><a href="#">Download</a></td>
      <td><a href="#">Visualizza</a></td>
    `;
    tbody.appendChild(row);
  });
}

// Gestione modifica profilo
document.getElementById("profileForm").addEventListener("submit", e => {
  e.preventDefault();
  const newName = document.getElementById("nameInput").value;
  const newEmail = document.getElementById("emailInput").value;

  document.getElementById("profileName").textContent = newName;
  document.getElementById("profileEmail").textContent = newEmail;

  alert("Profilo aggiornato!");
});

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  renderDocs();
});

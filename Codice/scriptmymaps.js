// Array iniziale con alcune mappe d'esempio
const maps = [
    { title: "Mappa Studio", description: "Organizza i concetti per l'esame." },
    { title: "Mappa Progetto", description: "Struttura il flusso di lavoro del progetto." },
    { title: "Mappa Viaggio", description: "Itinerario del prossimo viaggio." }
  ];
  
  // Funzione per generare le card nella griglia
  function renderMaps() {
    const grid = document.getElementById("mapGrid");
    grid.innerHTML = "";
    maps.forEach((m, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h2>${m.title}</h2>
        <p>${m.description}</p>
        <button onclick="viewMap(${i})">Apri</button>
      `;
      grid.appendChild(card);
    });
  }
  
  // Funzione per aprire una mappa
  function viewMap(index) {
    alert("Hai aperto: " + maps[index].title);
    // Qui potresti fare redirect a una pagina dettagliata della mappa
  }
  
  // Funzione per aggiungere una nuova mappa
  function addNewMap() {
    const title = prompt("Nome della nuova mappa:");
    if (title) {
      maps.push({ title: title, description: "Descrizione da aggiungere..." });
      renderMaps();
    }
  }
  
  // Al caricamento della pagina renderizza le mappe
  document.addEventListener("DOMContentLoaded", renderMaps);
  
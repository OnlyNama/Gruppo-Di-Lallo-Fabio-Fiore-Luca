// Includo navbar e footer
async function includeHTML(id, file) {
  const res = await fetch(file);
  const text = await res.text();
  document.getElementById(id).innerHTML = text;
}
includeHTML("navbar", "navbar.html").then(()=>{
  // if navbar-init.js isn't already loaded, load it and call init
  if(!window.initNavbar) {
    const s = document.createElement('script');
    s.src = 'navbar-init.js';
    s.onload = function(){ try { if(window.initNavbar) window.initNavbar(); } catch(e){ console.error(e); } };
    document.body.appendChild(s);
  } else {
    try { window.initNavbar(); } catch(e){ console.error(e); }
  }
});
includeHTML("footer", "footer.html");

// ----------------------------
// Calendario interattivo (2 mesi)
// ----------------------------
const monthYearLabel1 = document.getElementById("month-year-1");
const monthYearLabel2 = document.getElementById("month-year-2");
const calendarGrid1 = document.getElementById("calendar-grid-1");
const calendarGrid2 = document.getElementById("calendar-grid-2");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const eventList = document.getElementById("event-list");
const selectedDateTitle = document.getElementById("selected-date-title");

let currentDate = new Date();

// Eventi di esempio
const events = {
  "2025-10-04": [
    { time: "10:00 - 11:00", title: "Studio Divina Commedia" },
    { time: "15:00 - 16:00", title: "Studiare il PDF su Pirandello" }
  ],
  "2025-11-10": [
    { time: "09:00 - 10:00", title: "Ripasso Matematica" }
  ]
};

const monthNames = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

function renderCalendar(date, gridEl, labelEl) {
  const year = date.getFullYear();
  const month = date.getMonth();

  labelEl.textContent = `${monthNames[month]} ${year}`;
  gridEl.innerHTML = "";

  // Intestazioni
  const dayNames = ["D","L","M","M","G","V","S"];
  dayNames.forEach(d => {
    const div = document.createElement("div");
    div.classList.add("day-name");
    div.textContent = d;
    gridEl.appendChild(div);
  });

  // Giorno della settimana del 1°
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Celle vuote prima del 1°
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.classList.add("day", "empty");
    gridEl.appendChild(empty);
  }

  // Giorni del mese
  for (let d = 1; d <= daysInMonth; d++) {
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = d;

    // Evidenzia oggi
    const today = new Date();
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      day.classList.add("today");
    }

    // Click sul giorno
    day.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach(el => el.classList.remove("selected"));
      day.classList.add("selected");
      showEvents(year, month + 1, d);
    });

    gridEl.appendChild(day);
  }
}

function showEvents(year, month, day) {
  const key = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  selectedDateTitle.textContent = `${day} ${monthNames[month - 1]} ${year}`;
  eventList.innerHTML = "";

  if (events[key]) {
    events[key].forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${e.time}</strong> ${e.title}`;
      eventList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.textContent = "Nessun evento";
    eventList.appendChild(li);
  }
}

function renderTwoMonths() {
  renderCalendar(currentDate, calendarGrid1, monthYearLabel1);

  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  renderCalendar(nextMonthDate, calendarGrid2, monthYearLabel2);
}

// Navigazione mesi
prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderTwoMonths();
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderTwoMonths();
});

// Prima render
renderTwoMonths();

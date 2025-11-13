let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.2,
    canvas = document.getElementById("pdfCanvas"),
    ctx = canvas.getContext("2d");

const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const uploadBtn = document.getElementById("uploadBtn");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const readBtn = document.getElementById("readPdf");
const stopBtn = document.getElementById("stopRead");

// Caricamento file
uploadBox.addEventListener("click", () => fileInput.click());
uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type === "application/pdf") {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const typedarray = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
        pdfDoc = pdf;
        pageNum = 1;
        renderPage(pageNum);
      });
    };
    fileReader.readAsArrayBuffer(file);
  } else {
    alert("Seleziona un file PDF valido.");
  }
});

// Renderizza una pagina
function renderPage(num) {
  pageRendering = true;
  pdfDoc.getPage(num).then(function(page) {
    const viewport = page.getViewport({ scale: scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    const renderTask = page.render(renderContext);

    renderTask.promise.then(function() {
      pageRendering = false;
      pageInfo.textContent = `Pagina ${num} / ${pdfDoc.numPages}`;

      if (pageNumPending !== null) {
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

// Navigazione pagine
prevPage.addEventListener("click", () => {
  if (pageNum <= 1) return;
  pageNum--;
  renderPage(pageNum);
});

nextPage.addEventListener("click", () => {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  renderPage(pageNum);
});

// Text-to-Speech
let synth = window.speechSynthesis;
let utterance;

readBtn.addEventListener("click", () => {
  if (!pdfDoc) {
    alert("Carica un PDF prima.");
    return;
  }
  pdfDoc.getPage(pageNum).then(function(page) {
    page.getTextContent().then(function(textContent) {
      const text = textContent.items.map(item => item.str).join(" ");
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "it-IT"; // voce italiana
      synth.speak(utterance);
    });
  });
});

stopBtn.addEventListener("click", () => {
  if (synth.speaking) {
    synth.cancel();
  }
});

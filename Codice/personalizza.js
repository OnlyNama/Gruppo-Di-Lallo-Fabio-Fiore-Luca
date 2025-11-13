// Elementi DOM
const dropArea = document.getElementById("dropArea");
const pdfInput = document.getElementById("pdfInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileName = document.getElementById("fileName");

const fontSelect = document.getElementById("fontSelect");
const fontSize = document.getElementById("fontSize");
const fontColor = document.getElementById("fontColor");

const exampleText = document.getElementById("exampleText");
const previewText = document.getElementById("previewText");

const confirmBtn = document.getElementById("confirmBtn");
const resetBtn = document.getElementById("resetBtn");

// Upload PDF
uploadBtn.addEventListener("click", () => pdfInput.click());

pdfInput.addEventListener("change", () => {
  if (pdfInput.files.length > 0) {
    fileName.textContent = `Caricato: ${pdfInput.files[0].name}`;
  }
});

dropArea.addEventListener("dragover", e => {
  e.preventDefault();
  dropArea.style.backgroundColor = "#eef5ff";
});
dropArea.addEventListener("dragleave", () => {
  dropArea.style.backgroundColor = "#f9fbfd";
});
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  pdfInput.files = e.dataTransfer.files;
  if (pdfInput.files.length > 0) {
    fileName.textContent = `Caricato: ${pdfInput.files[0].name}`;
  }
  dropArea.style.backgroundColor = "#f9fbfd";
});

// Aggiorna preview testo
function updatePreview() {
  const font = fontSelect.value;
  const size = `${fontSize.value}px`;
  const color = fontColor.value;

  exampleText.style.fontFamily = font;
  exampleText.style.fontSize = size;
  exampleText.style.color = color;

  previewText.style.fontFamily = font;
  previewText.style.fontSize = size;
  previewText.style.color = color;
}

fontSelect.addEventListener("change", updatePreview);
fontSize.addEventListener("input", updatePreview);
fontColor.addEventListener("input", updatePreview);

// Pulsanti
confirmBtn.addEventListener("click", () => {
  alert("Modifiche confermate!");
});
resetBtn.addEventListener("click", () => {
  fontSelect.value = "Inter";
  fontSize.value = 16;
  fontColor.value = "#000000";
  updatePreview();
  fileName.textContent = "";
  pdfInput.value = "";
});

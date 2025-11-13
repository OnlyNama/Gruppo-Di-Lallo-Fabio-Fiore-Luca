const canvas = document.getElementById("canvas");
const connections = document.getElementById("connections");
const canvasArea = document.querySelector('.canvas-area');

// Ensure the sidebar and toolbar sit below the navbar by measuring
// the navbar height at runtime and publishing it as a CSS variable.
function updateNavbarTop() {
  const navbarEl = document.getElementById('navbar');
  // default to 100px if navbar isn't present yet
  const navbarHeight = navbarEl ? Math.ceil(navbarEl.getBoundingClientRect().height) : 100;
  const gap = 8; // small gap so controls don't touch the navbar
  document.documentElement.style.setProperty('--navbar-height', (navbarHeight + gap) + 'px');
}

// run on load and resize so the layout stays correct if navbar content changes
window.addEventListener('load', updateNavbarTop);
window.addEventListener('resize', updateNavbarTop);
// also run shortly after script loads in case navbar is injected dynamically
setTimeout(updateNavbarTop, 120);

// Utility: sync SVG size/position with canvas
function syncSVG() {
  const rect = canvas.getBoundingClientRect();
  // setta width/height e viewBox dell'SVG in coordinate del canvas
  connections.setAttribute('width', rect.width);
  connections.setAttribute('height', rect.height);
  connections.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
}
window.addEventListener('resize', syncSVG);
// initial sync
setTimeout(syncSVG, 50);

// Ensure the canvas has an inner wrapper we can transform for mobile panning
function ensureCanvasInner() {
  let inner = canvas.querySelector('.canvas-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'canvas-inner';
    // move existing children (svg and any nodes) into inner
    Array.from(canvas.childNodes).forEach(ch => inner.appendChild(ch));
    canvas.appendChild(inner);
  }
  return inner;
}

// Read current transform (translate and scale) applied to .canvas-inner
function getCanvasTransform() {
  const inner = document.querySelector('.canvas-inner');
  if (!inner) return { scale: 1, tx: 0, ty: 0 };
  const m = inner.style.transform || '';
  const tr = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(m);
  const sc = /scale\((-?\d+(?:\.\d+)?)\)/.exec(m);
  const tx = tr ? parseFloat(tr[1]) : 0;
  const ty = tr ? parseFloat(tr[2]) : 0;
  const s = sc ? parseFloat(sc[1]) : 1;
  return { scale: s, tx, ty };
}

// Pinch-to-zoom implementation for mobile: scale the .canvas-inner using
// translate(x,y) scale(s). We only handle two-pointer gestures so single-
// finger interactions (drag node, edit text) are unaffected.
function enablePinchZoom() {
  if (canvas._pinchEnabled) return;
  canvas._pinchEnabled = true;
  const inner = ensureCanvasInner();
  const pointers = new Map();
  let initialDist = 0;
  let initialScale = 1;
  // transform state
  let state = { scale: 1, tx: 0, ty: 0 };

  function parseTransform() {
    const m = inner.style.transform || '';
    const tr = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(m);
    const sc = /scale\((-?\d+(?:\.\d+)?)\)/.exec(m);
    const tx = tr ? parseFloat(tr[1]) : 0;
    const ty = tr ? parseFloat(tr[2]) : 0;
    const s = sc ? parseFloat(sc[1]) : 1;
    state = { scale: s, tx, ty };
  }

  function applyTransform(s, tx, ty) {
    inner.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    state = { scale: s, tx, ty };
  }

  function getDistance(p1, p2) {
    const dx = p2.x - p1.x; const dy = p2.y - p1.y; return Math.hypot(dx, dy);
  }

  canvas.addEventListener('pointerdown', (e) => {
    // only on small screens
    if (window.innerWidth > 600) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      parseTransform();
      // start gesture
      const pts = Array.from(pointers.values());
      initialDist = getDistance(pts[0], pts[1]);
      initialScale = state.scale || 1;
      // prevent other handlers from interfering during pinch
      e.preventDefault();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (window.innerWidth > 600) return;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // compute scale relative to initial
      const pts = Array.from(pointers.values());
      const dist = getDistance(pts[0], pts[1]);
      if (initialDist <= 0) return;
      const newScale = Math.max(0.25, Math.min(4, initialScale * (dist / initialDist)));
      // compute gesture center in canvas coordinates
      const canvasRect = canvas.getBoundingClientRect();
      const centerScreenX = (pts[0].x + pts[1].x) / 2;
      const centerScreenY = (pts[0].y + pts[1].y) / 2;
      // offset of center relative to canvas (screen coords)
      const cx = centerScreenX - canvasRect.left;
      const cy = centerScreenY - canvasRect.top;
      // compute content-space offset of the center point
      const contentOffsetX = (cx - state.tx) / state.scale;
      const contentOffsetY = (cy - state.ty) / state.scale;
      // new translate so that contentOffset stays under the same screen point
      const newTx = cx - contentOffsetX * newScale;
      const newTy = cy - contentOffsetY * newScale;
      applyTransform(newScale, newTx, newTy);
      e.preventDefault();
    }
  });

  function up(e) {
    if (pointers.has(e.pointerId)) pointers.delete(e.pointerId);
    // if gesture ended, update initialScale
    if (pointers.size < 2) {
      parseTransform();
      initialDist = 0; initialScale = state.scale;
    }
  }
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  // reset transform when switching back to desktop so positions match original layout
  window.addEventListener('resize', () => {
    if (window.innerWidth > 600) {
      const innerEl = document.querySelector('.canvas-inner');
      if (innerEl) innerEl.style.transform = '';
      // reset stored state
      state = { scale: 1, tx: 0, ty: 0 };
    }
  });
}

// initialize pinch-zoom on load/resize
window.addEventListener('load', () => { ensureCanvasInner(); enablePinchZoom(); syncSVG(); });
window.addEventListener('resize', () => { ensureCanvasInner(); enablePinchZoom(); syncSVG(); });

// Creazione forme dal menu
document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const shape = btn.dataset.shape;
    createShape(shape);
  });
});

// Sidebar toggle behavior
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const editorContainer = document.querySelector('.editor-container');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
    editorContainer.classList.toggle('shifted');
  });
}

// Funzione per creare nuove forme
function createShape(type) {
  if (type === "line") {
    // Linea SVG vera
    syncSVG();
    const rect = canvas.getBoundingClientRect();
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  // create a wider invisible hit line to make selection easier on thin strokes
  const hitLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    // coord relative all'SVG (partiamo da due punti dentro il canvas)
    const x1 = 60;
    const y1 = 60;
    const x2 = 260;
    const y2 = 60;
    // set coordinates on both hit line and visible line
    [hitLine, line].forEach(l => {
      l.setAttribute("x1", x1);
      l.setAttribute("y1", y1);
      l.setAttribute("x2", x2);
      l.setAttribute("y2", y2);
    });
    // visible thin line
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    line.classList.add("svg-line");
  // hit line: wider stroke to increase hit area
  // make it effectively invisible but still hittable (very low opacity)
  hitLine.setAttribute('stroke', 'rgba(0,0,0,0.01)');
    hitLine.setAttribute('stroke-opacity', '0.01');
    hitLine.setAttribute('stroke-width', '18');
    hitLine.setAttribute('stroke-linecap', 'round');
    hitLine.classList.add('svg-hitline');
    // append hit line first (beneath visible line)
    connections.appendChild(hitLine);
    connections.appendChild(line);

    // create a delete button for the line, positioned at the midpoint
    const lineDelete = document.createElement('div');
    lineDelete.className = 'line-delete';
    // midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    lineDelete.style.left = `${midX}px`;
    lineDelete.style.top = `${midY}px`;
    // append into inner so zoom/pan transform affects it too
    ensureCanvasInner().appendChild(lineDelete);
  line._deleteBtn = lineDelete;
  // keep reference to hitLine so we can remove it later and sync
  line._hit = hitLine;
  hitLine._linkedLine = line;
    lineDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      // remove line and its handles and delete button using stored refs
      try { if (line._handles) line._handles.forEach(h => { try { h.remove(); } catch(e){} }); } catch (e) {}
      try { if (line._deleteBtn) line._deleteBtn.remove(); } catch (e) {}
      try { if (line._hit) line._hit.remove(); } catch (e) {}
      try { line.remove(); } catch (e) {}
      // deselect all after deletion
      deselectAll();
    });

  // create handles: li inseriamo in canvas-area e li teniamo in sync
  const handle1 = document.createElement('div');
  const handle2 = document.createElement('div');
    handle1.className = 'line-handle';
    handle2.className = 'line-handle';
  // posizione iniziale: posizioniamo gli handle dentro il canvas (coordinate relative al canvas)
  handle1.style.left = `${x1}px`;
  handle1.style.top = `${y1}px`;
  handle2.style.left = `${x2}px`;
  handle2.style.top = `${y2}px`;
    handle1._linked = { line, attrX: 'x1', attrY: 'y1', handle: handle1, other: handle2 };
    handle2._linked = { line, attrX: 'x2', attrY: 'y2', handle: handle2, other: handle1 };
  // appendi gli handle come figli del canvas per posizionamento relativo
  // append handles into the inner wrapper so they scale with pinch zoom
  ensureCanvasInner().appendChild(handle1);
  ensureCanvasInner().appendChild(handle2);

    // hide handles initially (CSS hides but ensure state tracking)
    handle1.style.display = 'none';
    handle2.style.display = 'none';
    line._handles = [handle1, handle2];

    // keep delete button in the middle when handles move
    function updateLineMidpoint() {
      const xA = parseFloat(line.getAttribute('x1')) || 0;
      const yA = parseFloat(line.getAttribute('y1')) || 0;
      const xB = parseFloat(line.getAttribute('x2')) || 0;
      const yB = parseFloat(line.getAttribute('y2')) || 0;
      const mx = (xA + xB) / 2;
      const my = (yA + yB) / 2;
      if (line._deleteBtn) {
        line._deleteBtn.style.left = `${mx}px`;
        line._deleteBtn.style.top = `${my}px`;
      }
      // also keep hit line coords in sync
      if (line._hit) {
        line._hit.setAttribute('x1', xA);
        line._hit.setAttribute('y1', yA);
        line._hit.setAttribute('x2', xB);
        line._hit.setAttribute('y2', yB);
      }
    }
    // attach update to handle moves
    handle1._updateMid = updateLineMidpoint;
    handle2._updateMid = updateLineMidpoint;

    makeHandleDraggable(handle1);
    makeHandleDraggable(handle2);

    // clicking the hitLine or visible line selects it (show handles/delete)
  function onLineClick(e) {
    e.stopPropagation();
    e.preventDefault();
    // determine the visible line target: if user clicked the hitLine map to the linked visible line
    const targetLine = (e.currentTarget && e.currentTarget._linkedLine) ? e.currentTarget._linkedLine : line;
    deselectAll();
    selectLine(targetLine);
  }
    line.addEventListener('click', onLineClick);
    hitLine.addEventListener('click', onLineClick);
    // allow dragging the whole line (translate both endpoints) by dragging the hitLine/line
    (function enableLineDrag(line, hitLine) {
      let draggingLine = false;
      let startSvgX = 0, startSvgY = 0;
      let orig = { x1: 0, y1: 0, x2: 0, y2: 0 };
      function onDown(e) {
        // don't start a line drag if user clicked a handle or the delete button
        const target = e.target;
        if (target.classList && (target.classList.contains('line-handle') || target.classList.contains('line-delete') )) return;
        e.stopPropagation(); e.preventDefault();
  const canvasRect = canvas.getBoundingClientRect();
  const t = getCanvasTransform();
  startSvgX = (e.clientX - canvasRect.left - t.tx) / t.scale;
  startSvgY = (e.clientY - canvasRect.top - t.ty) / t.scale;
        orig.x1 = parseFloat(line.getAttribute('x1')) || 0;
        orig.y1 = parseFloat(line.getAttribute('y1')) || 0;
        orig.x2 = parseFloat(line.getAttribute('x2')) || 0;
        orig.y2 = parseFloat(line.getAttribute('y2')) || 0;
        draggingLine = true;
        // show selection when starting to drag
        deselectAll(); selectLine(line);
      }
      function onMove(e) {
        if (!draggingLine) return;
  const canvasRect = canvas.getBoundingClientRect();
  const t = getCanvasTransform();
  const curX = (e.clientX - canvasRect.left - t.tx) / t.scale;
  const curY = (e.clientY - canvasRect.top - t.ty) / t.scale;
  const dx = curX - startSvgX;
  const dy = curY - startSvgY;
        const nx1 = Math.max(0, Math.min(canvas.clientWidth, orig.x1 + dx));
        const ny1 = Math.max(0, Math.min(canvas.clientHeight, orig.y1 + dy));
        const nx2 = Math.max(0, Math.min(canvas.clientWidth, orig.x2 + dx));
        const ny2 = Math.max(0, Math.min(canvas.clientHeight, orig.y2 + dy));
        line.setAttribute('x1', nx1); line.setAttribute('y1', ny1);
        line.setAttribute('x2', nx2); line.setAttribute('y2', ny2);
        // update hit line coords (also in content coords)
        if (line._hit) {
          line._hit.setAttribute('x1', nx1); line._hit.setAttribute('y1', ny1);
          line._hit.setAttribute('x2', nx2); line._hit.setAttribute('y2', ny2);
        }
        // move handles
        if (line._handles && line._handles.length === 2) {
          try { line._handles[0].style.left = `${nx1}px`; line._handles[0].style.top = `${ny1}px`; } catch(e){}
          try { line._handles[1].style.left = `${nx2}px`; line._handles[1].style.top = `${ny2}px`; } catch(e){}
        }
        // update midpoint delete
        if (line._deleteBtn) {
          const mx = (nx1 + nx2) / 2; const my = (ny1 + ny2) / 2;
          line._deleteBtn.style.left = `${mx}px`; line._deleteBtn.style.top = `${my}px`;
        }
      }
      function onUp() { draggingLine = false; }
      // attach listeners
    // use pointer events so touch works on mobile
    hitLine.addEventListener('pointerdown', onDown);
    line.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    })(line, hitLine);
    // clicking a handle should select its line
    handle1.addEventListener('click', (e) => { e.stopPropagation(); deselectAll(); selectLine(line); });
    handle2.addEventListener('click', (e) => { e.stopPropagation(); deselectAll(); selectLine(line); });

  // associa context menu anche alla linea e al hitLine (mappa al line visibile)
  addContextMenu(line, "line");
  addContextMenu(hitLine, "line");
    // associa anche menu agli handle per poterli eliminare
    addContextMenu(handle1, 'line-handle');
    addContextMenu(handle2, 'line-handle');
    return;
  }

  // Nodi (rettangolo o cerchio)
  const node = document.createElement("div");
  node.classList.add("node");
  // il nodo esterno NON è contenteditable: creiamo un elemento interno per il testo
  const content = document.createElement('div');
  content.className = 'node-content';
  content.setAttribute('contenteditable', 'true');

  if (type === "circle") {
    node.style.borderRadius = "50%";
    node.style.width = "120px";
    node.style.height = "120px";
    content.innerText = "Cerchio";
  } else if (type === "rect") {
    node.style.width = "160px";
    node.style.height = "80px";
    content.innerText = "Rettangolo";
  } else if (type === "pdf") {
    alert("Funzione Apri PDF da implementare.");
    return;
  }

  node.style.top = "50px";
  node.style.left = "50px";
  // append content and then add behaviors
  node.appendChild(content);
  // If node is circle or rect, add an edit (pencil) button that reveals extra actions
  if (type === 'circle' || type === 'rect') {
    const editBtn = document.createElement('div');
    editBtn.className = 'object-edit';
    editBtn.title = 'Modifica';
    editBtn.innerHTML = '✎';
    // action buttons container (hidden until editBtn clicked)
    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    // increase border thickness
    // increase border thickness
    const thickBtn = document.createElement('div'); thickBtn.className = 'edit-btn'; thickBtn.title = 'Aumenta spessore'; thickBtn.innerText = '⤒';
    // decrease border thickness
    const thinBtn = document.createElement('div'); thinBtn.className = 'edit-btn'; thinBtn.title = 'Diminuisci spessore'; thinBtn.innerText = '⤓';
    // change border color (cycles)
    const colorBtn = document.createElement('div'); colorBtn.className = 'edit-btn'; colorBtn.title = 'Cambia colore bordo'; colorBtn.innerText = '●';
    actions.appendChild(thickBtn);
    actions.appendChild(thinBtn);
    actions.appendChild(colorBtn);
    node.appendChild(editBtn);
    node.appendChild(actions);

    // state
    let colorIndex = 0;
    const colors = ['#000000', '#0b84ff', '#e74c3c', '#27ae60', '#8e44ad'];

    editBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      actions.classList.toggle('show');
    });

    thickBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      // increase border width up to a max
      const cur = parseInt(window.getComputedStyle(node).borderWidth) || 2;
      const next = Math.min(12, cur + 2);
      node.style.borderWidth = next + 'px';
    });

    thinBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const cur = parseInt(window.getComputedStyle(node).borderWidth) || 2;
      const next = Math.max(1, cur - 2);
      node.style.borderWidth = next + 'px';
    });

    colorBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      colorIndex = (colorIndex + 1) % colors.length;
      node.style.borderColor = colors[colorIndex];
    });
  }
  makeDraggable(node);
  makeResizable(node);
  // aggiungi pulsante delete al nodo
  const del = document.createElement('div');
  del.className = 'object-delete';
  del.innerText = '×';
  del.title = 'Elimina';
  del.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (node.parentNode) node.parentNode.removeChild(node);
  });
  node.appendChild(del);
  addContextMenu(node, "node");
  // clicking a node selects it
  node.addEventListener('click', (e) => {
    e.stopPropagation();
    deselectAll();
    selectNode(node);
  });
  // append node into inner so it scales with pinch zoom
  ensureCanvasInner().appendChild(node);

  // NOTE: do NOT stop propagation on the editable content here.
  // We use a small movement threshold in makeDraggable so a click
  // focuses the text for editing, while a deliberate drag (move)
  // will start moving the node. This keeps editing and dragging usable.
}

// helper: add the edit (pencil) button and actions to a node element
function addEditControls(node) {
  if (!node) return;
  // avoid adding twice
  if (node.querySelector && node.querySelector('.object-edit')) return;
  const editBtn = document.createElement('div');
  editBtn.className = 'object-edit';
  editBtn.title = 'Modifica';
  editBtn.innerHTML = '✎';
  const actions = document.createElement('div'); actions.className = 'edit-actions';
  const thickBtn = document.createElement('div'); thickBtn.className = 'edit-btn'; thickBtn.title = 'Aumenta spessore'; thickBtn.innerText = '⤒';
  const thinBtn = document.createElement('div'); thinBtn.className = 'edit-btn'; thinBtn.title = 'Diminuisci spessore'; thinBtn.innerText = '⤓';
  const colorBtn = document.createElement('div'); colorBtn.className = 'edit-btn'; colorBtn.title = 'Cambia colore bordo'; colorBtn.innerText = '●';
  actions.appendChild(thickBtn); actions.appendChild(thinBtn); actions.appendChild(colorBtn);
  node.appendChild(editBtn); node.appendChild(actions);

  let colorIndex = 0;
  const colors = ['#000000', '#0b84ff', '#e74c3c', '#27ae60', '#8e44ad'];

  editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); actions.classList.toggle('show'); });
  thickBtn.addEventListener('click', (ev) => { ev.stopPropagation(); const cur = parseInt(window.getComputedStyle(node).borderWidth) || 2; const next = Math.min(12, cur + 2); node.style.borderWidth = next + 'px'; });
  thinBtn.addEventListener('click', (ev) => { ev.stopPropagation(); const cur = parseInt(window.getComputedStyle(node).borderWidth) || 2; const next = Math.max(1, cur - 2); node.style.borderWidth = next + 'px'; });
  colorBtn.addEventListener('click', (ev) => { ev.stopPropagation(); colorIndex = (colorIndex + 1) % colors.length; node.style.borderColor = colors[colorIndex]; });
}

// Selection helpers
function deselectAll() {
  // deselect nodes
  document.querySelectorAll('.node.selected').forEach(n => n.classList.remove('selected'));
  // deselect lines
  document.querySelectorAll('line.selected').forEach(l => {
    try { l.classList.remove('selected'); } catch(e){}
    // also clear selection on any associated hit link
    try { if (l._hit) l._hit.classList.remove('selected'); } catch(e){}
  });
  // hide all line handles and delete buttons
  Array.from(document.querySelectorAll('.line-handle')).forEach(h => { h.style.display = 'none'; try { h.style.zIndex = ''; } catch(e){} });
  Array.from(document.querySelectorAll('.line-delete')).forEach(b => { b.style.display = 'none'; try { b.style.zIndex = ''; } catch(e){} });
  // hide any open edit action toolbars on nodes
  Array.from(document.querySelectorAll('.edit-actions')).forEach(a => { a.classList.remove('show'); });
  // hide text formatting toolbar
  const tt = document.querySelector('.text-toolbar'); if (tt) tt.classList.remove('show');
}

function selectNode(node) {
  if (!node) return;
  node.classList.add('selected');
  // show text toolbar only if the node has .node-content (editable text)
  const content = node.querySelector && node.querySelector('.node-content');
  if (content) showTextToolbarFor(content);
}

// --- Text formatting toolbar ---
function ensureTextToolbar() {
  let tb = document.querySelector('.text-toolbar');
  if (tb) return tb;
  tb = document.createElement('div'); tb.className = 'text-toolbar';
  const inner = document.createElement('div'); inner.className = 'toolbar-inner';
  // font select
  const fontSelect = document.createElement('select');
  ['Inter','DM Sans','Arial','Georgia','Courier New'].forEach(f => {
    const opt = document.createElement('option'); opt.value = f; opt.innerText = f; fontSelect.appendChild(opt);
  });
  // size select
  const sizeSelect = document.createElement('select'); [12,14,16,18,20,24,30].forEach(s => { const o = document.createElement('option'); o.value = s; o.innerText = s + 'px'; sizeSelect.appendChild(o); });
  // color input
  const colorInput = document.createElement('input'); colorInput.type = 'color'; colorInput.value = '#000000';
  // bold / italic
  const boldBtn = document.createElement('button'); boldBtn.type = 'button'; boldBtn.innerText = 'B'; boldBtn.style.fontWeight = 'bold';
  const italicBtn = document.createElement('button'); italicBtn.type = 'button'; italicBtn.innerText = 'I'; italicBtn.style.fontStyle = 'italic';

  inner.appendChild(fontSelect); inner.appendChild(sizeSelect); inner.appendChild(colorInput); inner.appendChild(boldBtn); inner.appendChild(italicBtn);
  tb.appendChild(inner);
  document.body.appendChild(tb);

  // state: current target editable element
  tb._target = null;

  function applyToTarget() {
    const t = tb._target; if (!t) return;
    t.style.fontFamily = fontSelect.value;
    t.style.fontSize = sizeSelect.value + 'px';
    t.style.color = colorInput.value;
    t.style.fontWeight = boldBtn.classList.contains('active') ? 'bold' : 'normal';
    t.style.fontStyle = italicBtn.classList.contains('active') ? 'italic' : 'normal';
  }

  fontSelect.addEventListener('change', () => { applyToTarget(); });
  sizeSelect.addEventListener('change', () => { applyToTarget(); });
  colorInput.addEventListener('change', () => { applyToTarget(); });
  boldBtn.addEventListener('click', (e) => { e.stopPropagation(); boldBtn.classList.toggle('active'); applyToTarget(); });
  italicBtn.addEventListener('click', (e) => { e.stopPropagation(); italicBtn.classList.toggle('active'); applyToTarget(); });

  return tb;
}

function showTextToolbarFor(editableEl) {
  const tb = ensureTextToolbar();
  tb.classList.add('show');
  tb._target = editableEl;
  // initialize controls from element computed style
  const cs = window.getComputedStyle(editableEl);
  const font = cs.fontFamily.split(',')[0].replace(/['"]/g,'');
  try { tb.querySelector('select').value = font; } catch(e){}
  try { tb.querySelectorAll('select')[1].value = parseInt(cs.fontSize); } catch(e){}
  try { tb.querySelector('input[type=color]').value = rgbToHex(cs.color); } catch(e){}
  // reset toggle states
  const boldBtn = tb.querySelector('button'); const italicBtn = tb.querySelectorAll('button')[1];
  if (boldBtn) { if (cs.fontWeight === '700' || parseInt(cs.fontWeight) >= 600) boldBtn.classList.add('active'); else boldBtn.classList.remove('active'); }
  if (italicBtn) { if (cs.fontStyle === 'italic') italicBtn.classList.add('active'); else italicBtn.classList.remove('active'); }
}

function rgbToHex(rgb) {
  // rgb(...) or rgba(...)
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000000';
  const r = parseInt(m[1]).toString(16).padStart(2,'0');
  const g = parseInt(m[2]).toString(16).padStart(2,'0');
  const b = parseInt(m[3]).toString(16).padStart(2,'0');
  return `#${r}${g}${b}`;
}

function selectLine(line) {
  if (!line) return;
  // mark as selected (useful if we add CSS for selected line)
  line.classList.add('selected');
  // ensure hit line also gets a selected marker (useful for later references)
  try { if (line._hit) line._hit.classList.add('selected'); } catch(e){}
  // show handles
  if (line._handles && line._handles.length) {
    line._handles.forEach(h => { h.style.display = 'block'; try { h.style.zIndex = 9999; } catch(e){} });
  }
  // show delete button
  if (line._deleteBtn) { line._deleteBtn.style.display = 'inline-flex'; try { line._deleteBtn.style.zIndex = 10000; } catch(e){} }
}

// clicking on canvas deselects everything
canvas.addEventListener('click', (e) => {
  e.stopPropagation();
  deselectAll();
});

// Drag & drop per nodi
function makeDraggable(el) {
  // We'll use a press + small-move threshold so a click still focuses
  // editable content, while a deliberate drag starts moving the node.
  let isDown = false;
  let dragging = false;
  let startX = 0, startY = 0;
  let offsetX = 0, offsetY = 0;

  // prefer pointer events for cross-device drag
  el.addEventListener("pointerdown", (e) => {
    if (e.button === 2) return; // right-click: no drag
    // don't start drag when clicking the resize handle
    if (e.target.classList && e.target.classList.contains('node-resize')) return;
    isDown = true;
    dragging = false;
    startX = e.clientX;
    startY = e.clientY;
    // If the click happened inside editable content, allow the default
    // so the element can receive focus and enter edit mode. Otherwise
    // preventDefault to avoid text selection during drag.
    const clickedEditable = (e.target && e.target.isContentEditable) ||
      (e.target && e.target.closest && e.target.closest('.node-content'));
    if (!clickedEditable) {
      e.preventDefault();
    }
  });

  function onMove(e) {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist2 = dx*dx + dy*dy;
    const thresholdPx = 9; // threshold squared approx (3px movement)

    // Only start the actual dragging after the small threshold
    if (!dragging) {
      if (dist2 < thresholdPx) return;
      dragging = true;
      // clear any text selection so dragging isn't blocked by browser selection
      try { const sel = window.getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
      // prevent user-select during drag
      try { document.body.style.userSelect = 'none'; } catch (e) {}
      // compute offsets using element rect at drag start
      const rect = el.getBoundingClientRect();
      offsetX = startX - rect.left;
      offsetY = startY - rect.top;
    }

    const canvasRect = canvas.getBoundingClientRect();
    // convert client coords to content coords considering canvas-inner transform
    const t = getCanvasTransform();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const contentX = (clientX - canvasRect.left - t.tx) / t.scale;
    const contentY = (clientY - canvasRect.top - t.ty) / t.scale;
    let left = contentX - offsetX;
    let top = contentY - offsetY;
    left = Math.max(0, Math.min(left, canvas.clientWidth - el.offsetWidth));
    top = Math.max(0, Math.min(top, canvas.clientHeight - el.offsetHeight));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", () => { isDown = false; dragging = false; try { document.body.style.userSelect = ''; } catch(e){} });
}

// Rendi un nodo ridimensionabile con una maniglia in basso a destra
function makeResizable(el) {
  const handle = document.createElement('div');
  handle.className = 'node-resize';
  el.appendChild(handle);
  let resizing = false;
  let startX = 0, startY = 0, startW = 0, startH = 0;

  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    resizing = true;
    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;
  });

  document.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    // map pointer movement into content space
    const canvasRect = canvas.getBoundingClientRect();
    const t = getCanvasTransform();
    const curContentX = (e.clientX - canvasRect.left - t.tx) / t.scale;
    const curContentY = (e.clientY - canvasRect.top - t.ty) / t.scale;
    const startContentX = (startX - canvasRect.left - t.tx) / t.scale;
    const startContentY = (startY - canvasRect.top - t.ty) / t.scale;
    const dx = curContentX - startContentX;
    const dy = curContentY - startContentY;
    const newW = Math.max(60, startW + dx);
    const newH = Math.max(40, startH + dy);
    el.style.width = `${newW}px`;
    el.style.height = `${newH}px`;
  });

  document.addEventListener('pointerup', () => { resizing = false; });
}

// ---------------------
// Context menu
// ---------------------
const contextMenu = document.createElement("div");
contextMenu.className = "context-menu";
contextMenu.innerHTML = `
  <ul>
    <li id="delete">Elimina</li>
  </ul>
`;
document.body.appendChild(contextMenu);

function addContextMenu(el, type) {
  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    contextMenu.style.display = "block";
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.left = `${e.pageX}px`;

    contextMenu.currentTarget = el;
    contextMenu.currentType = type;
  });
}

document.getElementById("delete").addEventListener("click", () => {
  if (!contextMenu.currentTarget) {
    contextMenu.style.display = "none";
    return;
  }
  let target = contextMenu.currentTarget;
  // If user right-clicked the invisible hitLine, map to the visible line
  if (target && target._linkedLine) target = target._linkedLine;

  // se è un handle della linea, rimuoviamo anche l'altro handle e la linea collegata
  if (target.classList && target.classList.contains('line-handle')) {
    const linked = target._linked;
    if (linked) {
      try { if (linked.line._handles) linked.line._handles.forEach(h => { try { h.remove(); } catch(e){} }); } catch(e){}
      try { if (linked.line._deleteBtn) linked.line._deleteBtn.remove(); } catch(e){}
      try { if (linked.line._hit) linked.line._hit.remove(); } catch(e){}
      try { linked.line.remove(); } catch (e) {}
    } else {
      target.remove();
    }
  } else if (target.tagName && target.tagName.toLowerCase() === 'line') {
    // rimuovere anche eventuali handle collegati e il pulsante delete usando riferimenti se presenti
    try {
      if (target._handles && target._handles.length) {
        target._handles.forEach(h => { try { h.remove(); } catch(e){} });
      } else {
        const allHandles = Array.from(canvasArea.querySelectorAll('.line-handle'));
        allHandles.forEach(h => { if (h._linked && h._linked.line === target) try { h.remove(); } catch(e){} });
      }
      if (target._deleteBtn) try { target._deleteBtn.remove(); } catch(e){}
      if (target._hit) try { target._hit.remove(); } catch(e){}
    } catch(e){}
    try { target.remove(); } catch(e){}
  } else {
    // nodo normale
    if (target.parentNode) target.parentNode.removeChild(target);
  }
  contextMenu.style.display = "none";
});

// Chiudi menu cliccando fuori
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// Rende centrale il nodo iniziale draggable + menu e lo uniforma agli altri nodi
const central = document.querySelector(".central-node");
if (central) {
  // If the central node uses contenteditable on the container, convert it
  // to the same structure we use for created nodes: an inner .node-content
  // element that is contenteditable.
  try {
    // preserve current inner HTML/text
    const existing = central.innerHTML;
    // clear and create inner editable content
    central.innerHTML = '';
    const content = document.createElement('div');
    content.className = 'node-content';
    content.setAttribute('contenteditable', 'true');
    content.innerHTML = existing;
    central.appendChild(content);

    // remove any container-level contenteditable (if present)
    if (central.isContentEditable) central.removeAttribute('contenteditable');

    // compute a pixel top/left relative to the canvas so we can remove
    // the transform-based centering and use absolute positioning like other nodes
    const canvasRect = canvas.getBoundingClientRect();
    const cRect = central.getBoundingClientRect();
    let left = Math.round(cRect.left - canvasRect.left);
    let top = Math.round(cRect.top - canvasRect.top);
    // clamp inside canvas
    left = Math.max(0, Math.min(left, canvas.clientWidth - cRect.width));
    top = Math.max(0, Math.min(top, canvas.clientHeight - cRect.height));
    central.style.left = `${left}px`;
    central.style.top = `${top}px`;
  // remove transform so positioning behaves like other nodes
  // set to 'none' to override the class rule (which used translate(-50%,-50%))
  central.style.transform = 'none';

    // add delete button like other nodes
    const del = document.createElement('div');
    del.className = 'object-delete';
    del.innerText = '×';
    del.title = 'Elimina';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (central.parentNode) central.parentNode.removeChild(central);
    });
    central.appendChild(del);

    // wire interactions
    makeDraggable(central);
    makeResizable(central);
    addContextMenu(central, 'node');
  // add the same edit controls (pencil + actions) to the central node
  try { addEditControls(central); } catch (e) {}
    // clicking central selects it
    central.addEventListener('click', (e) => { e.stopPropagation(); deselectAll(); selectNode(central); });
  } catch (e) {
    // fallback: at least make it draggable and add context menu
    makeDraggable(central);
    addContextMenu(central, 'node');
  }
}

// Gestione drag per gli handle: aggiornano la linea collegata
function makeHandleDraggable(handle) {
  let dragging = false;
  let offsetX = 0, offsetY = 0;
  // pointer-based dragging for handles
  handle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    dragging = true;
    const r = handle.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;
  });
  document.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const canvasRect = canvas.getBoundingClientRect();
    const t = getCanvasTransform();
    // posizione relativa alla canvas (coordinate contenuto)
    const contentX = (e.clientX - canvasRect.left - t.tx) / t.scale;
    const contentY = (e.clientY - canvasRect.top - t.ty) / t.scale;
    const x = Math.max(0, Math.min(contentX, canvas.clientWidth));
    const y = Math.max(0, Math.min(contentY, canvas.clientHeight));
    // aggiorna handle (posizione relativa dentro il canvas)
    handle.style.left = `${x}px`;
    handle.style.top = `${y}px`;
    // aggiorna linea
    const linked = handle._linked;
    if (linked && linked.line) {
      linked.line.setAttribute(linked.attrX, x);
      linked.line.setAttribute(linked.attrY, y);
      // update delete button midpoint when line changes
      if (handle._updateMid) handle._updateMid();
    }
  });
  document.addEventListener('pointerup', () => { dragging = false; });
}

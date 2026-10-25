// Inicio (Galería): hora, fecha y tiempo; la cartela de la obra; el índice de apps del inicio
// y la barra de abajo (Tele, HDMI, Todas las apps, Modo Arte, Ajustes). Solo flechas y OK.
(function (A) {
  'use strict';

  var KEY = A.config.KEY;
  var fila = 0, col = [0, 0];
  var elementos = [[], []];

  function appsInicio() {
    return (A.prefs.inicio || []).map(A.apps.byId).filter(function (a) { return !!a; });
  }

  function render() {
    var dock = A.$('dock'), barra = A.$('barra');
    dock.textContent = ''; barra.textContent = '';
    elementos = [[], []];
    appsInicio().forEach(function (app) {
      var d = A.el('div', 'app');
      d.style.setProperty('--c', A.apps.color(app));
      d.appendChild(A.el('span', 'punto'));
      d.appendChild(document.createTextNode(A.apps.nombre(app)));
      dock.appendChild(d);
      elementos[0].push({ el: d, accion: function () { A.apps.launch(app); } });
    });
    function boton(texto, accion, clase) {
      var d = A.el('div', clase || '', texto);
      barra.appendChild(d);
      elementos[1].push({ el: d, accion: accion });
    }
    A.entradas.visibles().forEach(function (s) { boton(A.entradas.nombre(s), function () { A.entradas.abrir(s); }); });
    boton('Todas las apps', function () { A.ir('catalogo'); });
    var empuje = true;
    if (A.prefs.botonArte) { boton('Modo Arte', A.arte.poner, 'empuje'); empuje = false; }
    if (A.prefs.botonSamsung) { boton('Inicio de Samsung', A.homewatch.useSamsungHome, empuje ? 'empuje' : ''); empuje = false; }
    boton('Ajustes', function () { A.ir('ajustes'); }, empuje ? 'empuje' : '');
    if (!elementos[0].length) { fila = 1; }
    pintar();
  }

  function pintar() {
    document.querySelectorAll('#inicio .foco').forEach(function (e) { e.classList.remove('foco'); });
    var lista = elementos[fila];
    if (!lista.length) { return; }
    col[fila] = Math.max(0, Math.min(col[fila], lista.length - 1));
    lista[col[fila]].el.classList.add('foco');
  }

  function tecla(k) {
    var lista = elementos[fila];
    if (k === KEY.LEFT) { col[fila] -= 1; }
    else if (k === KEY.RIGHT) { col[fila] += 1; }
    else if (k === KEY.DOWN && fila === 0 && elementos[1].length) { fila = 1; }
    else if (k === KEY.UP && fila === 1 && elementos[0].length) { fila = 0; }
    else if (k === KEY.ENTER) { if (lista[col[fila]]) { lista[col[fila]].accion(); } return true; }
    else { return false; }
    pintar();
    return true;
  }

  A.inicio = { render: render, tecla: tecla, alMostrar: function () { document.body.classList.remove('oscuro'); render(); } };
})(window.AeroTizen);

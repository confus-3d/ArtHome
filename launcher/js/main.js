// Arranque y reparto de teclas entre las tres pantallas (inicio, catálogo y ajustes).
(function (A) {
  'use strict';

  var KEY = A.config.KEY;
  var PANTALLAS = { inicio: A.inicio, catalogo: A.catalogo, ajustes: A.ajustes };
  A.pantalla = 'inicio';

  A.ir = function (nombre, opciones) {
    Object.keys(PANTALLAS).forEach(function (n) { A.$(n).hidden = n !== nombre; });
    A.pantalla = nombre;
    PANTALLAS[nombre].alMostrar(opciones);
    A.cabecera.pintar();
  };
  A.redibujar = function () { if (A.pantalla === 'inicio') { A.inicio.render(); } };

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode, activo = document.activeElement;
    // Escribiendo: el teclado en pantalla manda; OK o Hecho guardan, Atrás cancela.
    if (activo && activo.tagName === 'INPUT') {
      var guardar = k === KEY.ENTER || k === KEY.IME_DONE;
      var cancelar = k === KEY.BACK || k === KEY.ESC || k === KEY.IME_CANCEL;
      if (guardar || cancelar) {
        e.preventDefault();
        if (activo.id === 'campo-nombre') { A.catalogo.terminarNombre(guardar); } else { A.ajustes.terminarTexto(guardar); }
      }
      return;
    }
    var hecho = PANTALLAS[A.pantalla].tecla(k);
    // Atrás nunca cierra ArtHome: en el inicio no hace nada.
    if (hecho || k === KEY.BACK) { e.preventDefault(); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { return; }
    A.cabecera.pintar();
    A.entradas.cargar(A.redibujar);
    A.arte.refrescar();
  });

  // ---- arranque ----------------------------------------------------------------------
  // En el navegador del Mac, encajar los 1920×1080 en la ventana.
  if (!A.tizen) {
    var encajar = function () {
      var r = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      document.body.style.transformOrigin = '0 0';
      document.body.style.transform = 'scale(' + r + ')';
    };
    window.addEventListener('resize', encajar); encajar();
  }
  A.prefs.cargar();
  A.cabecera.start();
  A.network.start();
  A.arte.refrescar();
  setInterval(function () { if (!document.hidden) { A.arte.refrescar(); } }, 120000);
  A.apps.load(function () {
    A.prefs.completar(A.apps.all);
    A.entradas.cargar(function () { A.ir('inicio'); });
    A.homewatch.start();
    A.homewatch.vigilante(A.prefs.vigilante);
    setTimeout(function () { A.homewatch.reportApps(A.apps.realIds); }, 1500);
  });
})(window.AeroTizen);

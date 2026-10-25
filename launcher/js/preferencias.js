// Preferencias de Paco, guardadas en la tele (localStorage; sobreviven a las actualizaciones).
(function (A) {
  'use strict';

  var cfg = A.config;
  var p = A.prefs = {};

  function copia(x) { return JSON.parse(JSON.stringify(x)); }

  p.cargar = function () {
    var datos = copia(cfg.DEFAULTS), guardado = {};
    var crudo = null;
    try { crudo = localStorage.getItem(cfg.STORAGE_KEY); guardado = JSON.parse(crudo) || {}; } catch (e) { guardado = {}; }
    p.nuevo = !crudo;  // sin ajustes guardados: recién instalado o reinstalado
    Object.keys(datos).forEach(function (k) { if (guardado[k] !== undefined) { datos[k] = guardado[k]; } });
    Object.keys(datos).forEach(function (k) { p[k] = datos[k]; });
    p.aplicarAcento();
  };
  p.aplicarAcento = function () { document.documentElement.style.setProperty('--acento', p.acento || '#d9b77c'); };

  p.guardar = function () {
    var out = {};
    Object.keys(cfg.DEFAULTS).forEach(function (k) { out[k] = p[k]; });
    try { localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(out)); } catch (e) { /* almacenamiento lleno o bloqueado */ }
    // Copia de seguridad en el servicio (y de ahí al Mac), agrupando cambios seguidos.
    clearTimeout(p.temporizadorCopia);
    p.temporizadorCopia = setTimeout(function () { if (A.homewatch) { A.homewatch.guardarCopia(out); } }, 2000);
  };

  // Recuperar una copia (de la tele o subida desde el Mac).
  p.aplicarCopia = function (copia) {
    var ajustes = copia && copia.ajustes;
    if (!ajustes || typeof ajustes !== 'object') { return false; }
    try { localStorage.setItem(cfg.STORAGE_KEY, JSON.stringify(ajustes)); } catch (e) { return false; }
    p.cargar();
    return true;
  };

  // La primera vez, elige la fila del inicio y las escondidas por nombre.
  p.completar = function (apps) {
    function porNombre(lista) {
      var ids = [];
      lista.forEach(function (quiero) {
        apps.forEach(function (a) {
          if (ids.indexOf(a.id) < 0 && a.name.toLowerCase().indexOf(quiero) === 0) { ids.push(a.id); }
        });
      });
      return ids;
    }
    var cambiado = false;
    if (p.inicio === null) { p.inicio = porNombre(cfg.INICIO_DE_SERIE); cambiado = true; }
    if (p.ocultas === null) { p.ocultas = porNombre(cfg.OCULTAS_DE_SERIE); cambiado = true; }
    if (cambiado) { p.guardar(); }
  };
})(window.AeroTizen);

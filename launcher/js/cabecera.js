// Hora, fecha y tiempo de la esquina del inicio. El tiempo sale de Open-Meteo (sin cuenta
// ni rastreo); se guarda la última lectura para mostrar algo al encender sin red.
(function (A) {
  'use strict';

  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var CACHE = 'arthome.tiempo.v1', CADA = 30 * 60 * 1000;
  var lectura = null, reloj = null;

  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function hora(d) {
    if (A.prefs.formato24) { return dos(d.getHours()) + ':' + dos(d.getMinutes()); }
    var h = d.getHours() % 12 || 12;
    return h + ':' + dos(d.getMinutes()) + (d.getHours() < 12 ? ' a. m.' : ' p. m.');
  }
  function fecha(d) { return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }

  function cielo(codigo) {
    if (codigo === 0) { return 'Despejado'; }
    if (codigo === 1) { return 'Casi despejado'; }
    if (codigo === 2) { return 'Algo nublado'; }
    if (codigo === 3) { return 'Nublado'; }
    if (codigo === 45 || codigo === 48) { return 'Niebla'; }
    if (codigo >= 51 && codigo <= 57) { return 'Llovizna'; }
    if (codigo >= 61 && codigo <= 67) { return 'Lluvia'; }
    if (codigo >= 71 && codigo <= 77) { return 'Nieve'; }
    if (codigo >= 80 && codigo <= 82) { return 'Chubascos'; }
    if (codigo >= 85 && codigo <= 86) { return 'Chubascos de nieve'; }
    if (codigo >= 95) { return 'Tormenta'; }
    return '';
  }

  function pintarTiempo() {
    var el = A.$('tiempo');
    if (!el) { return; }
    var c = A.prefs.ciudad;
    if (!A.prefs.mostrarTiempo || !c) { el.textContent = ''; return; }
    var partes = [c.nombre];
    if (lectura && lectura.ciudad === c.nombre) {
      partes.push(Math.round(lectura.temp) + '°');
      if (cielo(lectura.codigo)) { partes.push(cielo(lectura.codigo)); }
    }
    el.textContent = partes.join(' · ');
  }

  function pedirTiempo() {
    var c = A.prefs.ciudad;
    if (!A.prefs.mostrarTiempo || !c) { return; }
    var x = new XMLHttpRequest();
    x.open('GET', 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon + '&current=temperature_2m,weather_code');
    x.timeout = 8000;
    x.onload = function () {
      try {
        var m = JSON.parse(x.responseText).current;
        if (typeof m.temperature_2m === 'number') {
          lectura = { temp: m.temperature_2m, codigo: m.weather_code, ciudad: c.nombre, at: Date.now() };
          try { localStorage.setItem(CACHE, JSON.stringify(lectura)); } catch (e) {}
          pintarTiempo();
        }
      } catch (e) { /* respuesta rara: se queda la anterior */ }
    };
    x.send();
  }

  // Buscar una ciudad por nombre (Ajustes → Hora y tiempo). Devuelve la primera coincidencia.
  function buscarCiudad(texto, cb) {
    var x = new XMLHttpRequest();
    x.open('GET', 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=es&format=json&name=' + encodeURIComponent(texto));
    x.timeout = 8000;
    x.onload = function () {
      try {
        var r = (JSON.parse(x.responseText).results || [])[0];
        cb(r ? { nombre: r.name, lat: r.latitude, lon: r.longitude } : null);
      } catch (e) { cb(null); }
    };
    x.onerror = x.ontimeout = function () { cb(null); };
    x.send();
  }

  function tic() {
    var d = new Date();
    if (A.$('hora')) { A.$('hora').textContent = hora(d); }
    if (A.$('fecha')) { A.$('fecha').textContent = fecha(d); }
    document.querySelectorAll('.hora-pequena').forEach(function (el) { el.textContent = hora(d); });
  }

  A.cabecera = {
    hora: hora,
    buscarCiudad: buscarCiudad,
    refrescarTiempo: function () { pintarTiempo(); pedirTiempo(); },
    pintar: function () { tic(); pintarTiempo(); },
    start: function () {
      try { lectura = JSON.parse(localStorage.getItem(CACHE)); } catch (e) { lectura = null; }
      tic(); pintarTiempo();
      setInterval(tic, 10000);
      if (!lectura || Date.now() - lectura.at > CADA) { pedirTiempo(); }
      clearInterval(reloj); reloj = setInterval(pedirTiempo, CADA);
    }
  };
})(window.AeroTizen);

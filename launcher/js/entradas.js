// Tele y HDMI. Se abren con el visor de Samsung (org.tizen.tv-viewer): pintar la tele dentro
// del launcher, como hacía AeroTizen, dejaba en esta Frame la imagen fija y sin mando.
(function (A) {
  'use strict';

  var tz = A.tizen, cfg = A.config;
  var e = A.entradas = { lista: [] };

  e.nombrePuerto = function (s) { return s.type === 'TV' ? 'Tele' : s.type + ' ' + s.number; };
  e.nombre = function (s) {
    var puerto = e.nombrePuerto(s);
    return (A.prefs.nombresEntradas && A.prefs.nombresEntradas[puerto]) || puerto;
  };

  // Las que se ven en el inicio: la tele y los HDMI (sin los desconectados si así se pide).
  e.visibles = function () {
    if (!A.prefs.mostrarEntradas) { return []; }
    return e.lista.filter(function (s) { return s.type === 'TV' || !A.prefs.ocultarHdmiSinConectar || s.connected; });
  };

  e.cargar = function (hecho) {
    if (!tz || !tz.systeminfo) {
      e.lista = [{ type: 'TV', number: 1, connected: true }, { type: 'HDMI', number: 1, connected: true },
        { type: 'HDMI', number: 2, connected: false }];
      return hecho && hecho();
    }
    try {
      tz.systeminfo.getPropertyValue('VIDEOSOURCE', function (info) {
        function marcar(lista, conectada) {
          return (lista || []).filter(function (s) { return s.type === 'TV' || s.type === 'HDMI'; }).map(function (s) {
            return { type: s.type, number: s.number, connected: conectada, raw: s };
          });
        }
        e.lista = marcar(info.connected, true).concat(marcar(info.disconnected, false)).sort(function (a, b) {
          return (b.type === 'TV') - (a.type === 'TV') || a.number - b.number;
        });
        if (hecho) { hecho(); }
      }, function () { if (hecho) { hecho(); } });
    } catch (err) { if (hecho) { hecho(); } }
  };

  e.abrir = function (s) {
    var nombre = e.nombre(s);
    if (!tz || !tz.tvwindow) { return A.toast('Abriría ' + nombre); }
    A.homewatch.tele();  // el vigilante se aparta mientras se ve la tele o el HDMI
    try {
      tz.tvwindow.setSource(s.raw || s, function () {
        tz.application.launch(cfg.VISOR_TELE, null, function () { A.toast('No se pudo abrir ' + nombre); });
      }, function () { A.toast('No se pudo cambiar a ' + nombre); }, 'MAIN');
    } catch (err) { A.toast('No se pudo cambiar a ' + nombre); }
  };

  if (tz && tz.systeminfo) {
    try { tz.systeminfo.addPropertyValueChangeListener('VIDEOSOURCE', function () { e.cargar(A.redibujar); }); } catch (err) { /* sin avisos */ }
  }
})(window.AeroTizen);

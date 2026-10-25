// Habla con el servicio de fondo (service/index.js). Las apps web ocultas se congelan en la
// tele, así que la vigilancia y las peticiones a la tele van allí; el launcher solo cuenta qué
// abre y cuándo vuelve a estar delante. Basado en AeroTizen (MIT).
(function (A) {
  'use strict';

  var cfg = A.config, tz = A.tizen;
  var leaving = false;

  function pedir(ruta, cb, espera) {
    var x = new XMLHttpRequest();
    x.open('GET', cfg.SERVICE_URL + ruta);
    x.timeout = espera || 1500;
    x.onload = function () {
      var datos = null;
      try { datos = JSON.parse(x.responseText); } catch (e) {}
      if (cb) { cb(datos); }
    };
    x.onerror = x.ontimeout = function () { if (tz) { start(); } if (cb) { cb(null); } };
    x.send();
  }

  function start() {
    if (!tz) { return; }
    try {
      tz.application.launchAppControl(new tz.ApplicationControl('http://tizen.org/appcontrol/operation/service'),
        cfg.SERVICE_ID, null, null);
    } catch (e) { /* sin servicio, Home lleva al inicio de Samsung */ }
  }

  A.homewatch = {
    start: start,
    // El launcher va a abrir `appId`; Home dentro de ella debe volver aquí.
    watch: function (appId) { pedir('/watch?id=' + encodeURIComponent(A.catalog.preloadedStoreId(appId) || appId)); },  // appId ya es el número de tienda si se conoce
    reportApps: function (ids) { pedir('/apps?ids=' + ids.map(encodeURIComponent).join(',')); },
    // Salida al inicio de Samsung hasta que se vuelva a abrir ArtHome.
    useSamsungHome: function () {
      leaving = true;
      pedir('/leave');
      try { tz.application.getCurrentApplication().exit(); } catch (e) { A.toast('Pulsa Home para ir al inicio de Samsung'); }
    },
    isLeaving: function () { return leaving; },
    // ArtHome
    tele: function () { pedir('/tele'); },
    vigilante: function (activo, cb) { pedir('/vigilante?activo=' + (activo ? '1' : '0'), cb); },
    arte: function (cb) { pedir('/arte', cb, 6000); },
    tecla: function (nombre, cb) { pedir('/tecla?k=' + encodeURIComponent(nombre), cb, 35000); },
    obra: function (cb) { pedir('/obra', cb, 10000); },
    obras: function (cb) { pedir('/obras', cb, 3000); },
    guardarCopia: function (ajustes) { pedir('/copia?datos=' + encodeURIComponent(JSON.stringify(ajustes)), null, 3000); },
    leerCopia: function (restaurar, cb) { pedir('/copia' + (restaurar ? '?restaurar=1' : ''), cb, 3000); }
  };

  document.addEventListener('visibilitychange', function () { if (!document.hidden) { pedir('/home'); } });
})(window.AeroTizen);

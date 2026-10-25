// Apps instaladas: descubrirlas, nombres, colores y abrirlas. Basado en AeroTizen (MIT).
(function (A) {
  'use strict';

  var cfg = A.config, tz = A.tizen;
  var apps = A.apps = { all: [], realIds: [] };

  function isRealApp(a) {
    return a.show !== false && (cfg.STORE_PACKAGE.test(a.packageId || '') || !!A.catalog.preloadedStoreId(a.id));
  }

  function hbbtvLink(appId) {
    try {
      if (!tz.application.getAppMetaData) { return ''; }
      var metadata = tz.application.getAppMetaData(appId);
      for (var i = 0; metadata && i < metadata.length; i++) {
        var item = metadata[i];
        if (item && item.key === cfg.HBBTV_LINK_METADATA && typeof item.value === 'string' && item.value.trim()) {
          return item.value;
        }
      }
    } catch (e) { /* algunas teles no dan los metadatos de otra app */ }
    return '';
  }

  // Nombre corto de la tienda («Spotify - Música y podcasts» → «Spotify»).
  apps.nombreTienda = function (app) { return app.name.replace(/ - .*/, '').replace(/NextGeneration$/, ''); };
  // Nombre que se ve: el propio de Paco si lo tiene.
  apps.nombre = function (app) { return (A.prefs.nombres && A.prefs.nombres[app.id]) || apps.nombreTienda(app); };
  // Color de la marca para el punto del índice.
  apps.color = function (app) {
    if (A.prefs.colores && A.prefs.colores[app.id]) { return A.prefs.colores[app.id]; }
    return apps.colorMarca(app);
  };
  apps.colorMarca = function (app) {
    var propios = cfg.COLORES || [];
    for (var j = 0; j < propios.length; j++) { if (propios[j][0].test(app.name)) { return propios[j][1]; } }
    var marca = A.catalog.brand(app);
    if (marca) {
      // El color más «de marca»: ni blanco ni casi negro (Spotify tiene el logo negro sobre verde).
      var vivo = function (c) { return c && !/^#(fff(fff)?|000(000)?|0f0f0f|111111|141414|1[0-9a-f]{5})$/i.test(c); };
      if (vivo(marca.logoColour)) { return marca.logoColour; }
      if (vivo(marca.background)) { return marca.background; }
    }
    var h = 0, n = app.name;
    for (var i = 0; i < n.length; i++) { h = (h * 31 + n.charCodeAt(i)) % 360; }
    return 'hsl(' + h + ', 55%, 62%)';
  };

  // Arranque rápido: la tele cierra ArtHome cuando le falta memoria; al volver se pinta primero
  // con la última lista guardada y luego se actualiza.
  var CACHE_APPS = 'arthome.apps.v1';
  apps.desdeCache = function () {
    try {
      var guardadas = JSON.parse(localStorage.getItem(CACHE_APPS));
      if (guardadas && guardadas.all && guardadas.all.length) { apps.all = guardadas.all; apps.realIds = guardadas.realIds || []; return true; }
    } catch (e) {}
    return false;
  };
  function guardarCache() {
    try { localStorage.setItem(CACHE_APPS, JSON.stringify({ all: apps.all, realIds: apps.realIds })); } catch (e) {}
  }

  apps.load = function (done) {
    if (!tz || !tz.application) {  // vista previa en el navegador: las apps de la tele de Paco
      apps.all = ['Netflix', 'Prime Video', 'Disney+', 'Movistar Plus', 'Apple TV', 'SkyShowtime', 'Crunchyroll',
        'Rakuten TV', 'Atresplayer', 'RTVE Play', '3Cat', 'YouTube', 'Spotify - Música y podcasts',
        'TizenBrewNextGeneration', 'Browser', 'Amazon Alexa', 'Security Center', 'Xbox', 'GeForce NOW', 'Amazon Luna']
        .map(function (name, i) { return { id: 'demo' + i, name: name, icon: '' }; });
      return done();
    }
    tz.application.getAppsInfo(function (list) {
      apps.realIds = list.filter(function (a) { return (isRealApp(a) || a.id === cfg.HBBTV_APP_ID) && !/service|DclHome001/i.test(a.id); })
        .map(function (a) { return apps.idVigilancia({ id: a.id, icon: a.iconPath || '' }); });
      apps.all = list.filter(function (a) { return isRealApp(a) && a.name && !cfg.HIDDEN_APPS.test(a.id) && !cfg.HIDDEN_APPS.test(a.name); })
        .map(function (a) { return { id: a.id, name: a.name, icon: a.iconPath || '' }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      guardarCache();
      done();
    }, function () { if (!apps.all.length) { apps.all = []; } done(); });
  };

  // Número de tienda de una app: la tele solo dice si está «visible» por ese número, no por su
  // nombre interno (comprobado con Disney+). Sale de la ruta de la carátula o del catálogo.
  apps.idVigilancia = function (app) {
    var cache = (app.icon || '').match(/apps_icon\/(?:all|FirstScreen)\/(\d+)\//);
    return (cache && cache[1]) || A.catalog.preloadedStoreId(app.id) || app.id;
  };

  apps.byId = function (id) {
    for (var i = 0; i < apps.all.length; i++) { if (apps.all[i].id === id) { return apps.all[i]; } }
    return null;
  };

  apps.launch = function (app) {
    var nombre = apps.nombre(app);
    if (!tz || !tz.application) { return A.toast('Abriría ' + nombre); }
    var link = hbbtvLink(app.id);
    if (link) {
      try {
        var data = [
          new tz.ApplicationControlData('tizenid', [app.id]),
          new tz.ApplicationControlData('hbbtv', [link]),
          new tz.ApplicationControlData('deeplink', ['true'])
        ];
        var control = new tz.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, data);
        A.homewatch.watch(cfg.HBBTV_APP_ID);
        tz.application.launchAppControl(control, cfg.HBBTV_APP_ID, null, function () { A.toast('No se pudo abrir ' + nombre); });
      } catch (e) { A.toast('No se pudo abrir ' + nombre); }
      return;
    }
    A.homewatch.watch(apps.idVigilancia(app));
    tz.application.launch(app.id, null, function () { A.toast('No se pudo abrir ' + nombre); });
  };
})(window.AeroTizen);

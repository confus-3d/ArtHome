// Todas las apps: catálogo por tipos, ficha de la app enfocada y su menú de OK (abrir, cambiar
// posición en el inicio, añadir o quitar del inicio, cambiar nombre, esconder). Sin colores.
(function (A) {
  'use strict';

  var KEY = A.config.KEY, cfg = A.config, p = A.prefs;
  var zona = 'catalogo', gi = 0, ai = 0, mi = 0, verOcultas = false, antes = null, colorAntes = null, ci = 0;
  function paleta() { return [null].concat(cfg.PALETA.map(function (x) { return x[0]; })); }
  function nombreColor(c) { for (var i = 0; i < cfg.PALETA.length; i++) { if (cfg.PALETA[i][0] === c) { return cfg.PALETA[i][1]; } } return 'el de la marca'; }
  var grupos = [];

  function oculta(app) { return (p.ocultas || []).indexOf(app.id) >= 0; }
  function posicion(app) { return (p.inicio || []).indexOf(app.id); }

  function agrupar() {
    var porTipo = cfg.TIPOS.map(function (t) { return { titulo: t.titulo, patron: t.patron, apps: [] }; });
    A.apps.all.forEach(function (app) {
      var nombre = A.apps.nombreTienda(app);
      for (var i = 0; i < porTipo.length; i++) { if (porTipo[i].patron.test(nombre)) { porTipo[i].apps.push(app); break; } }
    });
    porTipo.forEach(function (g) { g.apps.sort(function (a, b) { return A.apps.nombre(a).localeCompare(A.apps.nombre(b)); }); });
    grupos = porTipo.filter(function (g) { return g.apps.length; });
  }
  function visibles(g) { return g.apps.filter(function (a) { return verOcultas || !oculta(a); }); }
  function appActual() {
    if (!grupos.length) { return null; }
    gi = Math.max(0, Math.min(gi, grupos.length - 1));
    var l = visibles(grupos[gi]);
    while (!l.length && gi > 0) { gi--; l = visibles(grupos[gi]); }
    ai = Math.max(0, Math.min(ai, l.length - 1));
    return l[ai] || null;
  }

  function opciones(app) {
    var l = [['abrir', 'Abrir']];
    if (posicion(app) >= 0) { l.push(['mover', 'Cambiar posición en el inicio']); }
    l.push(['inicio', posicion(app) >= 0 ? 'Quitar del inicio' : 'Añadir al inicio']);
    l.push(['renombrar', 'Cambiar nombre']);
    l.push(['color', 'Cambiar color']);
    if (p.nombres[app.id]) { l.push(['original', 'Volver al nombre original']); }
    l.push(['esconder', oculta(app) ? 'Volver a mostrar' : 'Esconder']);
    return l;
  }

  function caratula(app) {
    var caja = A.$('caratula'), fuentes = A.artwork.sources(app);
    caja.textContent = '';
    caja.style.color = A.apps.color(app);
    function texto() { caja.textContent = A.apps.nombre(app); }
    if (!fuentes.length) { return texto(); }
    var img = new Image(), i = 0;
    img.onerror = function () { i += 1; if (i < fuentes.length) { img.src = fuentes[i]; } else { texto(); } };
    img.src = 'file://' + fuentes[0];
    img.onload = function () { if (caja.dataset.app === app.id) { caja.textContent = ''; caja.appendChild(img); } };
    caja.dataset.app = app.id;
  }

  function render() {
    var cols = A.$('columnas');
    cols.textContent = '';
    var total = 0, escondidas = 0;
    grupos.forEach(function (g) {
      var c = A.el('div', 'grupo');
      c.appendChild(A.el('h2', '', g.titulo));
      visibles(g).forEach(function (app) {
        var f = A.el('div', 'fila' + (oculta(app) ? ' oculta' : ''));
        f.style.setProperty('--c', A.apps.color(app));
        f.appendChild(A.el('span', 'punto'));
        f.appendChild(A.el('span', '', A.apps.nombre(app)));
        var pos = posicion(app);
        f.appendChild(A.el('span', 'fijada', pos >= 0 ? '◆ ' + (pos + 1) : ''));
        f.dataset.id = app.id;
        c.appendChild(f);
      });
      g.apps.forEach(function (app) { total++; if (oculta(app)) { escondidas++; } });
      cols.appendChild(c);
    });
    A.$('cuenta').textContent = (total - escondidas) + ' apps · ' + escondidas + ' escondidas';
    A.$('conmutar').textContent = verOcultas ? 'Ocultar las escondidas' : 'Ver las escondidas';
    pintar();
  }

  function pintar() {
    document.querySelectorAll('#catalogo .foco').forEach(function (e) { e.classList.remove('foco'); });
    var app = appActual();
    if (zona === 'cabecera') { A.$('conmutar').classList.add('foco'); }
    if (!app) { return; }
    var fila = document.querySelector('#columnas .fila[data-id="' + app.id + '"]');
    if (fila && zona !== 'cabecera') { fila.classList.add('foco'); }
    if (A.$('caratula').dataset.app !== app.id) { caratula(app); }
    A.$('caratula').style.color = A.apps.color(app);
    A.$('ficha-nombre').textContent = A.apps.nombre(app);
    var pos = posicion(app), estado;
    if (zona === 'posicion') { estado = 'Posición ' + (pos + 1) + ' de ' + p.inicio.length + ' · ▲ ▼ para mover, OK para dejarla, Atrás para cancelar'; }
    else if (zona === 'nombre') { estado = 'Escribe el nombre nuevo · OK para guardarlo, Atrás para cancelar'; }
    else if (zona === 'color') { estado = 'Color: ' + nombreColor(p.colores[app.id]) + ' · ◀ ▶ para cambiar, OK para guardarlo, Atrás para cancelar'; }
    else if (oculta(app)) { estado = 'Escondida: no sale en el catálogo'; }
    else if (p.nombres[app.id]) { estado = 'Se llama «' + A.apps.nombreTienda(app) + '» en la tele' + (pos >= 0 ? ' · inicio, posición ' + (pos + 1) : ''); }
    else { estado = pos >= 0 ? 'En tu inicio, posición ' + (pos + 1) + ' de ' + p.inicio.length : 'No está en tu inicio'; }
    A.$('ficha-estado').textContent = estado;
    var acc = A.$('acciones');
    acc.textContent = '';
    if (zona === 'menu') {
      opciones(app).forEach(function (o, i) { acc.appendChild(A.el('div', 'accion' + (i === mi ? ' foco' : ''), o[1])); });
    }
    A.$('pista').style.visibility = zona === 'catalogo' || zona === 'cabecera' ? '' : 'hidden';
    A.$('campo-nombre').hidden = zona !== 'nombre';
  }

  function elegir(accion, app) {
    zona = 'catalogo';
    if (accion === 'abrir') { A.apps.launch(app); }
    else if (accion === 'mover') { antes = p.inicio.slice(); zona = 'posicion'; }
    else if (accion === 'inicio') {
      var pos = posicion(app);
      if (pos >= 0) { p.inicio.splice(pos, 1); A.toast('Quitada del inicio'); }
      else { p.inicio.push(app.id); A.toast('Añadida al inicio en la posición ' + p.inicio.length); }
      p.guardar();
    }
    else if (accion === 'renombrar') {
      zona = 'nombre';
      var campo = A.$('campo-nombre');
      campo.value = A.apps.nombre(app);
      setTimeout(function () { campo.focus(); }, 0);
    }
    else if (accion === 'color') { zona = 'color'; colorAntes = p.colores[app.id] || null; ci = paleta().indexOf(colorAntes); }
    else if (accion === 'original') { delete p.nombres[app.id]; p.guardar(); A.toast('Vuelve a llamarse ' + A.apps.nombre(app)); }
    else if (accion === 'esconder') {
      var i = p.ocultas.indexOf(app.id);
      if (i >= 0) { p.ocultas.splice(i, 1); A.toast('Visible de nuevo'); } else { p.ocultas.push(app.id); A.toast('Escondida'); }
      p.guardar();
    }
    render();
  }

  function mover(app, paso) {
    var pos = posicion(app), q = pos + paso;
    if (pos < 0 || q < 0 || q >= p.inicio.length) { return; }
    p.inicio[pos] = p.inicio[q]; p.inicio[q] = app.id;
  }

  function tecla(k) {
    var app = appActual();
    if (zona === 'color') {
      var pl = paleta();
      if (k === KEY.LEFT || k === KEY.UP) { ci = (ci - 1 + pl.length) % pl.length; }
      else if (k === KEY.RIGHT || k === KEY.DOWN) { ci = (ci + 1) % pl.length; }
      else if (k === KEY.ENTER) { zona = 'catalogo'; p.guardar(); A.toast('Color guardado'); render(); return true; }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { ci = pl.indexOf(colorAntes); zona = 'catalogo'; }
      else { return false; }
      if (pl[ci]) { p.colores[app.id] = pl[ci]; } else { delete p.colores[app.id]; }
      render(); return true;
    }
    if (zona === 'posicion') {
      if (k === KEY.UP || k === KEY.LEFT) { mover(app, -1); }
      else if (k === KEY.DOWN || k === KEY.RIGHT) { mover(app, 1); }
      else if (k === KEY.ENTER) { zona = 'catalogo'; p.guardar(); A.toast('Posición ' + (posicion(app) + 1) + ' guardada'); }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { p.inicio = antes; zona = 'catalogo'; }
      else { return false; }
      render(); return true;
    }
    if (zona === 'menu') {
      var n = opciones(app).length;
      if (k === KEY.DOWN) { mi = Math.min(mi + 1, n - 1); }
      else if (k === KEY.UP) { mi = Math.max(mi - 1, 0); }
      else if (k === KEY.ENTER) { elegir(opciones(app)[mi][0], app); return true; }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE || k === KEY.LEFT) { zona = 'catalogo'; }
      else { return false; }
      pintar(); return true;
    }
    if (zona === 'cabecera') {
      if (k === KEY.DOWN) { zona = 'catalogo'; }
      else if (k === KEY.ENTER) { verOcultas = !verOcultas; render(); return true; }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { A.ir('inicio'); return true; }
      else { return false; }
      pintar(); return true;
    }
    if (k === KEY.DOWN) { ai++; }
    else if (k === KEY.UP) { if (ai === 0) { zona = 'cabecera'; } else { ai--; } }
    else if (k === KEY.RIGHT) { gi = Math.min(gi + 1, grupos.length - 1); }
    else if (k === KEY.LEFT) { gi = Math.max(gi - 1, 0); }
    else if (k === KEY.ENTER) { if (app) { zona = 'menu'; mi = 0; } }
    else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { A.ir('inicio'); return true; }
    else { return false; }
    pintar(); return true;
  }

  // Texto del nombre nuevo (teclado en pantalla de la tele).
  function terminarNombre(guardar) {
    var app = appActual(), campo = A.$('campo-nombre'), v = campo.value.replace(/^\s+|\s+$/g, '');
    campo.blur();
    if (guardar && app) {
      if (v && v !== A.apps.nombreTienda(app)) { p.nombres[app.id] = v; } else { delete p.nombres[app.id]; }
      p.guardar();
      A.toast('Ahora se llama ' + A.apps.nombre(app));
    }
    zona = 'catalogo';
    render();
  }

  A.catalogo = {
    tecla: tecla,
    terminarNombre: terminarNombre,
    alMostrar: function (opciones) {
      document.body.classList.add('oscuro');
      zona = 'catalogo'; verOcultas = !!(opciones && opciones.verOcultas);
      agrupar(); render();
    }
  };
})(window.AeroTizen);

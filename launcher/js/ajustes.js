// Ajustes: secciones a la izquierda y opciones a la derecha. Interruptores, valores que se
// cambian con OK, acciones y campos de texto (teclado en pantalla de la tele).
(function (A) {
  'use strict';

  var KEY = A.config.KEY, p = A.prefs;
  var col = 0, s = 0, o = 0, editando = null;

  function nombresInicio() {
    return (p.inicio || []).map(A.apps.byId).filter(Boolean).map(A.apps.nombre).join(', ') || 'Ninguna';
  }
  function nombresOcultas() {
    return (p.ocultas || []).map(A.apps.byId).filter(Boolean).map(A.apps.nombre).join(', ') || 'Ninguna';
  }
  function guardarY(fn) { return function () { p.guardar(); if (fn) { fn(); } }; }

  function secciones() {
    var hdmi = A.entradas.lista.filter(function (e) { return e.type === 'HDMI'; });
    return [
      { titulo: 'Inicio', intro: 'Qué apps aparecen en el índice del inicio y en qué orden.', opciones: [
        { tipo: 'accion', texto: 'Apps del inicio', det: nombresInicio(), valor: 'Ordenar ›', hacer: function () { A.ir('catalogo'); } },
        { tipo: 'accion', texto: 'Apps escondidas', det: 'No salen en «Todas las apps»: ' + nombresOcultas(), valor: (p.ocultas || []).length + ' ›',
          hacer: function () { A.ir('catalogo', { verOcultas: true }); } },
        { tipo: 'interruptor', texto: 'Botón de Modo Arte en el inicio', clave: 'botonArte' },
        { tipo: 'interruptor', texto: 'Mostrar Tele y HDMI en el inicio', clave: 'mostrarEntradas' }
      ] },
      { titulo: 'Fondo y obra', intro: 'El fondo es la obra que esté mostrando el Modo Arte, difuminada.', opciones: [
        { tipo: 'ciclo', texto: 'Intensidad del difuminado', clave: 'difuminado', valores: ['suave', 'media', 'fuerte'],
          nombres: { suave: 'Suave', media: 'Media', fuerte: 'Fuerte' }, luego: A.arte.redibujar },
        { tipo: 'interruptor', texto: 'Mostrar la cartela', det: 'Título, autor y año, sacados de tu listado de obras', clave: 'cartela', luego: A.arte.redibujar },
        { tipo: 'info', texto: 'Tus obras', det: Object.keys(window.OBRAS || {}).length + ' obras identificadas' }
      ] },
      { titulo: 'Colores', intro: 'El color de los detalles y el de cada app (su punto y su subrayado). Pulsa OK para ir cambiando.',
        opciones: opcionesColores() },
      { titulo: 'Al encender y con Home', intro: 'Si lo apagas, ArtHome deja de abrirse solo y queda como una app más; el inicio de Samsung vuelve a ser el de siempre.', opciones: [
        { tipo: 'interruptor', texto: 'Abrir ArtHome al encender y al pulsar Home', det: 'Vuelve solo desde Netflix, YouTube y Spotify', clave: 'vigilante',
          luego: function () { A.homewatch.vigilante(p.vigilante); } },
        { tipo: 'accion', texto: 'Ir al inicio de Samsung', det: 'Hasta que vuelvas a abrir ArtHome', valor: 'Abrir ›', hacer: A.homewatch.useSamsungHome }
      ] },
      { titulo: 'Tele y entradas', intro: 'Los ajustes de la tele se abren encima de ArtHome, sin salir de él.', opciones: [
        { tipo: 'accion', texto: 'Ajustes de la tele', det: 'Imagen, sonido, red, general…', valor: 'Abrir ›', hacer: function () {
          if (!A.tizen) { return A.toast('Abriría los ajustes de la tele'); }
          A.toast('Abriendo los ajustes de la tele…');
          A.homewatch.tecla('KEY_MENU', function (r) {
            if (!r || r.error) { A.toast(r && r.error === 'sin permiso del mando' ? 'Acepta el aviso de permiso en la tele y vuelve a probar' : 'No se pudieron abrir los ajustes'); }
          });
        } },
        { tipo: 'interruptor', texto: 'Ocultar entradas sin nada conectado', clave: 'ocultarHdmiSinConectar' }
      ].concat(hdmi.map(function (e) {
        var puerto = A.entradas.nombrePuerto(e);
        return { tipo: 'texto', texto: 'Nombre de ' + puerto, det: e.connected ? 'Conectado' : 'Sin nada conectado', valor: A.entradas.nombre(e),
          guardar: function (v) { if (v && v !== puerto) { p.nombresEntradas[puerto] = v; } else { delete p.nombresEntradas[puerto]; } p.guardar(); } };
      })) },
      { titulo: 'Hora y tiempo', intro: 'Arriba a la izquierda, junto a la hora.', opciones: [
        { tipo: 'ciclo', texto: 'Formato de hora', clave: 'formato24', valores: [true, false], nombres: { 'true': '24 horas', 'false': '12 horas' }, luego: A.cabecera.pintar },
        { tipo: 'texto', texto: 'Ciudad', det: 'Para el tiempo de la esquina', valor: p.ciudad ? p.ciudad.nombre : 'Ninguna',
          guardar: function (v) {
            if (!v) { return; }
            A.toast('Buscando ' + v + '…');
            A.cabecera.buscarCiudad(v, function (c) {
              if (!c) { A.toast('No encuentro esa ciudad'); return; }
              p.ciudad = c; p.guardar(); A.cabecera.refrescarTiempo(); A.toast('Ciudad: ' + c.nombre); render();
            });
          } },
        { tipo: 'interruptor', texto: 'Mostrar el tiempo', clave: 'mostrarTiempo', luego: A.cabecera.refrescarTiempo },
        { tipo: 'interruptor', texto: 'Indicador de red', det: 'Cable, wifi o sin conexión, junto al tiempo', clave: 'mostrarRed', luego: A.network.updateVisibility }
      ] },
      { titulo: 'Acerca de', intro: 'ArtHome se basa en AeroTizen (licencia MIT), de Hamza El Alaoui.', opciones: [
        { tipo: 'info', texto: 'Versión', valor: A.config.VERSION + ' · base AeroTizen 2.3.0' },
        { tipo: 'accion', texto: 'Restaurar la copia de seguridad', det: 'Tus ajustes se copian solos en cada cambio; el Mac puede bajar la copia y volver a subirla',
          valor: 'Restaurar ›', hacer: function () {
            A.homewatch.leerCopia(true, function (copia) {
              if (A.prefs.aplicarCopia(copia)) { A.toast('Ajustes restaurados'); A.ir('ajustes'); } else { A.toast('No hay ninguna copia'); }
            });
          } },
        { tipo: 'info', texto: 'Quitar ArtHome', det: 'Primero «Ir al inicio de Samsung»; después desinstálalo en Apps → Ajustes' }
      ] }
    ];
  }

  // Color de una app en Ajustes: «De la marca» y luego la paleta.
  function nombreColor(c) {
    var todos = A.config.PALETA.concat(A.config.ACENTOS);
    for (var i = 0; i < todos.length; i++) { if (todos[i][0] === c) { return todos[i][1]; } }
    return 'De la marca';
  }
  function opcionesColores() {
    var cfg = A.config;
    var ordenadas = (p.inicio || []).map(A.apps.byId).filter(Boolean);
    A.apps.all.forEach(function (a) { if (ordenadas.indexOf(a) < 0 && (p.ocultas || []).indexOf(a.id) < 0) { ordenadas.push(a); } });
    return [{ tipo: 'ciclo', texto: 'Color de los detalles', det: 'Líneas de foco, rombos y títulos', clave: 'acento',
      valores: cfg.ACENTOS.map(function (x) { return x[0]; }),
      nombres: cfg.ACENTOS.reduce(function (m, x) { m[x[0]] = x[1]; return m; }, {}), muestra: true, luego: p.aplicarAcento }]
      .concat(ordenadas.map(function (app) {
        return { tipo: 'colorApp', texto: A.apps.nombre(app), app: app };
      }));
  }

  var lista = [];
  function render() {
    lista = secciones();
    s = Math.max(0, Math.min(s, lista.length - 1));
    var izq = A.$('secciones'), der = A.$('panel');
    izq.textContent = ''; der.textContent = '';
    lista.forEach(function (sec, i) {
      izq.appendChild(A.el('div', 'seccion' + (i === s ? (col === 0 ? ' foco' : ' activa') : ''), sec.titulo));
    });
    var sec = lista[s];
    der.appendChild(A.el('p', 'intro', sec.intro));
    o = Math.max(0, Math.min(o, sec.opciones.length - 1));
    sec.opciones.forEach(function (op, i) {
      var fila = A.el('div', 'opcion' + (col === 1 && i === o ? ' foco' : ''));
      var texto = A.el('span', 'texto', op.texto);
      if (op.det) { texto.appendChild(A.el('span', 'det', op.det)); }
      fila.appendChild(texto);
      if (op.tipo === 'interruptor') { fila.appendChild(A.el('span', 'interruptor' + (p[op.clave] ? ' on' : ''))); }
      else if (op.tipo === 'ciclo') {
        var v = A.el('span', 'valor', op.nombres[String(p[op.clave])] || '');
        if (op.muestra) { var m = A.el('span', 'muestra'); m.style.setProperty('--m', p[op.clave]); v.appendChild(m); }
        fila.appendChild(v);
      }
      else if (op.tipo === 'colorApp') {
        var c = A.apps.color(op.app), vc = A.el('span', 'valor', nombreColor(p.colores[op.app.id]));
        var mc = A.el('span', 'muestra'); mc.style.setProperty('--m', c); vc.appendChild(mc);
        fila.appendChild(vc);
      }
      else if (op.tipo === 'texto' && editando === op) {
        var campo = A.el('input', 'campo'); campo.id = 'campo-ajuste'; campo.type = 'text'; campo.maxLength = 30; campo.value = op.valor === 'Ninguna' ? '' : op.valor;
        texto.appendChild(campo);
        setTimeout(function () { campo.focus(); }, 0);
      }
      else if (op.valor) { fila.appendChild(A.el('span', 'valor', op.valor + (op.tipo === 'texto' ? ' ›' : ''))); }
      der.appendChild(fila);
    });
    // Listas largas (Colores): desplazar el panel para que la opción enfocada se vea.
    var enfocada = der.querySelector('.opcion.foco'), desplazar = 0;
    if (enfocada && enfocada.offsetTop + enfocada.offsetHeight > 740) { desplazar = enfocada.offsetTop + enfocada.offsetHeight - 740; }
    der.style.transform = desplazar ? 'translateY(' + (-desplazar) + 'px)' : '';
  }

  function activar(op) {
    if (op.tipo === 'interruptor') { p[op.clave] = !p[op.clave]; guardarY(op.luego)(); A.toast(p[op.clave] ? 'Activado' : 'Desactivado'); }
    else if (op.tipo === 'ciclo') {
      var i = op.valores.indexOf(p[op.clave]);
      p[op.clave] = op.valores[(i + 1) % op.valores.length];
      guardarY(op.luego)();
    }
    else if (op.tipo === 'colorApp') {
      var paleta = [null].concat(A.config.PALETA.map(function (x) { return x[0]; }));
      var j = paleta.indexOf(p.colores[op.app.id] || null);
      var nuevo = paleta[(j + 1) % paleta.length];
      if (nuevo) { p.colores[op.app.id] = nuevo; } else { delete p.colores[op.app.id]; }
      p.guardar();
    }
    else if (op.tipo === 'accion') { op.hacer(); return; }
    else if (op.tipo === 'texto') { editando = op; }
    render();
  }

  function tecla(k) {
    if (col === 0) {
      if (k === KEY.DOWN) { s++; o = 0; }
      else if (k === KEY.UP) { s = Math.max(0, s - 1); o = 0; }
      else if (k === KEY.RIGHT || k === KEY.ENTER) { col = 1; }
      else if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { A.ir('inicio'); return true; }
      else { return false; }
    } else {
      if (k === KEY.DOWN) { o++; }
      else if (k === KEY.UP) { o = Math.max(0, o - 1); }
      else if (k === KEY.ENTER) { activar(lista[s].opciones[o]); return true; }
      else if (k === KEY.LEFT || k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) { col = 0; }
      else { return false; }
    }
    render();
    return true;
  }

  function terminarTexto(guardar) {
    var campo = A.$('campo-ajuste'), op = editando;
    editando = null;
    if (campo) { campo.blur(); }
    if (guardar && op && campo) { op.guardar(campo.value.replace(/^\s+|\s+$/g, '')); }
    render();
  }

  A.ajustes = {
    tecla: tecla,
    terminarTexto: terminarTexto,
    alMostrar: function () { document.body.classList.add('oscuro'); col = 0; editando = null; render(); }
  };
})(window.AeroTizen);

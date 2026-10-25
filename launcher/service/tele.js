'use strict';

// Conversaciones cortas con la propia tele por su API local: qué obra muestra el Modo Arte
// y su imagen, pasar a Modo Arte y pulsar una tecla del mando. Cada petición abre su canal,
// espera su respuesta y lo cierra. ES5 y solo módulos de Node, como el resto del servicio.
//
// En esta tele (The Frame 2022), la parte del Modo Arte solo contesta las peticiones que
// van «a todos» (to: broadcast); las que van «al anfitrión» se quedan sin respuesta.
// La imagen de una obra solo llega con get_thumbnail_list (no con get_thumbnail).
var http = require('http');
var https = require('https');
var net = require('net');
var tls = require('tls');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var HOST = process.env.ARTHOME_TELE || '127.0.0.1';  // en pruebas desde el Mac, la IP de la tele
var NOMBRE = buf('ArtHome').toString('base64');
var LIMITE = 4 * 1024 * 1024;
// Node antiguo de la tele: Buffer.from/alloc pueden no existir.
function buf(valor, codif) { return Buffer.from && Buffer.alloc ? (typeof valor === 'number' ? Buffer.alloc(valor) : Buffer.from(valor, codif)) : new Buffer(valor, codif); }

// ---- datos guardados (permiso del mando y ajustes del servicio) -------------------------
var carpeta = null;
function carpetaDatos() {
  if (carpeta) { return carpeta; }
  var opciones = [path.join(__dirname, '..', '..', '..', 'data'), path.join(__dirname, '..', 'data'), '/tmp/arthome'];
  for (var i = 0; i < opciones.length; i++) {
    try {
      if (!fs.existsSync(opciones[i])) { fs.mkdirSync(opciones[i]); }
      fs.writeFileSync(path.join(opciones[i], '.prueba'), 'ok');
      carpeta = opciones[i];
      return carpeta;
    } catch (e) { /* sin permiso aquí: probar la siguiente */ }
  }
  return null;
}
function leerDatos() {
  try { return JSON.parse(fs.readFileSync(path.join(carpetaDatos(), 'arthome.json'), 'utf8')) || {}; }
  catch (e) { return {}; }
}
function guardarDatos(cambios) {
  var datos = leerDatos();
  Object.keys(cambios).forEach(function (k) { datos[k] = cambios[k]; });
  try { fs.writeFileSync(path.join(carpetaDatos(), 'arthome.json'), JSON.stringify(datos)); return true; }
  catch (e) { return false; }
}

// ---- canal WebSocket mínimo ---------------------------------------------------------
function canal(seguro, ruta, alMensaje, alCerrar) {
  var clave = crypto.randomBytes(16).toString('base64');
  var modulo = seguro ? https : http;
  var socket = null, entrada = buf(0), cerrado = false;
  var peticion = modulo.request({
    host: HOST, port: seguro ? 8002 : 8001, method: 'GET', path: ruta, rejectUnauthorized: false,
    headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': clave }
  });
  function cerrar(motivo) {
    if (cerrado) { return; }
    cerrado = true;
    try { if (socket) { socket.destroy(); } else { peticion.abort(); } } catch (e) {}
    if (alCerrar) { alCerrar(motivo); }
  }
  function enviar(objeto) {
    if (!socket || cerrado) { return false; }
    var datos = buf(JSON.stringify(objeto), 'utf8');
    var extra = datos.length < 126 ? 0 : 2;
    var trama = buf(2 + extra + 4 + datos.length);
    trama[0] = 129;
    trama[1] = 128 | (extra ? 126 : datos.length);
    if (extra) { trama.writeUInt16BE(datos.length, 2); }
    var mascara = crypto.randomBytes(4);
    mascara.copy(trama, 2 + extra);
    for (var i = 0; i < datos.length; i++) { trama[6 + extra + i] = datos[i] ^ mascara[i % 4]; }
    socket.write(trama);
    return true;
  }
  function recibir(trozo) {
    entrada = Buffer.concat([entrada, trozo]);
    if (entrada.length > LIMITE) { cerrar('demasiados datos'); return; }
    while (entrada.length >= 2) {
      var opcode = entrada[0] & 15, largo = entrada[1] & 127, inicio = 2;
      if (largo === 126) { if (entrada.length < 4) { return; } largo = entrada.readUInt16BE(2); inicio = 4; }
      else if (largo === 127) { if (entrada.length < 10) { return; } largo = entrada.readUInt32BE(6); inicio = 10; }
      if (entrada.length < inicio + largo) { return; }
      var carga = entrada.slice(inicio, inicio + largo);
      entrada = entrada.slice(inicio + largo);
      if (opcode === 8) { cerrar('la tele cerró el canal'); return; }
      if (opcode === 1) {
        var mensaje = null;
        try { mensaje = JSON.parse(carga.toString('utf8')); } catch (e) {}
        if (mensaje) { alMensaje(mensaje, enviar); }
      }
    }
  }
  peticion.on('upgrade', function (res, sock, cabeza) {
    socket = sock;
    sock.on('data', recibir);
    sock.on('error', function () { cerrar('error del canal'); });
    sock.on('close', function () { cerrar('canal cerrado'); });
    if (cabeza && cabeza.length) { recibir(cabeza); }
  });
  peticion.on('response', function () { cerrar('la tele no abrió el canal'); });
  peticion.on('error', function () { cerrar('no se pudo conectar'); });
  peticion.end();
  return { cerrar: cerrar };
}

// ---- Modo Arte ----------------------------------------------------------------------
function peticionArte(peticion, espera, cb) {
  var id = crypto.randomBytes(8).toString('hex'), hecho = false, conexion = null;
  peticion.id = id; peticion.request_id = id;
  function fin(error, respuesta) {
    if (hecho) { return; }
    hecho = true; clearTimeout(reloj);
    if (conexion) { conexion.cerrar('hecho'); }
    cb(error, respuesta);
  }
  var reloj = setTimeout(function () { fin(new Error('la tele no contestó a ' + peticion.request)); }, espera);
  conexion = canal(false, '/api/v2/channels/com.samsung.art-app?name=' + NOMBRE, function (mensaje, enviar) {
    if (mensaje.event === 'ms.channel.ready') {
      enviar({ method: 'ms.channel.emit', params: { event: 'art_app_request', to: 'broadcast', data: JSON.stringify(peticion) } });
    } else if (mensaje.event === 'd2d_service_message') {
      var datos = null;
      try { datos = typeof mensaje.data === 'string' ? JSON.parse(mensaje.data) : mensaje.data; } catch (e) {}
      if (datos && (datos.request_id === id || datos.id === id)) {
        if (datos.event === 'error') { fin(new Error('la tele respondió con un error')); } else { fin(null, datos); }
      }
    }
  }, function (motivo) { fin(new Error(motivo)); });
}

// La imagen llega por una conexión aparte: 4 bytes con el tamaño de la cabecera, la cabecera
// en JSON (fileLength) y el archivo.
function descargar(info, cb) {
  var hecho = false, buffer = buf(0), cabecera = null, inicio = 0;
  function fin(error, datos) { if (hecho) { return; } hecho = true; clearTimeout(reloj); try { sock.destroy(); } catch (e) {} cb(error, datos); }
  var reloj = setTimeout(function () { fin(new Error('la imagen no llegó')); }, 15000);
  var conectar = info.secured ? tls.connect : net.connect;
  var sock = conectar({ host: info.ip, port: Number(info.port), rejectUnauthorized: false });
  sock.on('data', function (trozo) {
    buffer = Buffer.concat([buffer, trozo]);
    if (buffer.length > LIMITE) { fin(new Error('imagen demasiado grande')); return; }
    if (!cabecera && buffer.length >= 4) {
      var largo = buffer.readUInt32BE(0);
      if (buffer.length < 4 + largo) { return; }
      try { cabecera = JSON.parse(buffer.slice(4, 4 + largo).toString('utf8')); } catch (e) { fin(new Error('cabecera ilegible')); return; }
      inicio = 4 + largo;
    }
    if (cabecera && buffer.length >= inicio + Number(cabecera.fileLength)) {
      fin(null, buffer.slice(inicio, inicio + Number(cabecera.fileLength)));
    }
  });
  sock.on('error', function () { fin(new Error('fallo al recibir la imagen')); });
}

var cache = { id: null, imagen: null };
function obraActual(cb) {
  peticionArte({ request: 'get_current_artwork' }, 5000, function (error, datos) {
    if (error || !datos || !datos.content_id) { cb(error || new Error('sin obra')); return; }
    cb(null, datos.content_id);
  });
}
function imagenObra(id, cb) {
  if (cache.id === id && cache.imagen) { cb(null, cache.imagen); return; }
  peticionArte({
    request: 'get_thumbnail_list', content_id_list: [{ content_id: id }],
    conn_info: { d2d_mode: 'socket', connection_id: Math.floor(Math.random() * 4294967295), id: crypto.randomBytes(8).toString('hex') }
  }, 8000, function (error, datos) {
    if (error) { cb(error); return; }
    var info = null;
    try { info = typeof datos.conn_info === 'string' ? JSON.parse(datos.conn_info) : datos.conn_info; } catch (e) {}
    if (!info || !info.ip || !info.port) { cb(new Error('la tele no dio la dirección de la imagen')); return; }
    descargar(info, function (err, imagen) {
      if (!err) { cache = { id: id, imagen: imagen }; }
      cb(err, imagen);
    });
  });
}
function ponerModoArte(cb) {
  peticionArte({ request: 'set_artmode_status', value: 'on' }, 4000, function (error) {
    // Algunas versiones no contestan a esta petición aunque la cumplen.
    cb(null, !error);
  });
}

// ---- teclas del mando -----------------------------------------------------------------
// La primera vez la tele pide permiso en pantalla para «ArtHome»; el permiso se guarda.
function tecla(nombre, cb) {
  var token = leerDatos().token, hecho = false, conexion = null;
  function fin(error) { if (hecho) { return; } hecho = true; clearTimeout(reloj); if (conexion) { conexion.cerrar('hecho'); } cb(error); }
  var reloj = setTimeout(function () { fin(new Error('la tele no aceptó la conexión del mando')); }, 30000);
  conexion = canal(true, '/api/v2/channels/samsung.remote.control?name=' + NOMBRE + (token ? '&token=' + token : ''),
    function (mensaje, enviar) {
      if (mensaje.event === 'ms.channel.connect') {
        if (mensaje.data && mensaje.data.token) { guardarDatos({ token: mensaje.data.token }); }
        enviar({ method: 'ms.remote.control', params: { Cmd: 'Click', DataOfCmd: nombre, Option: 'false', TypeOfRemote: 'SendRemoteKey' } });
        setTimeout(function () { fin(null); }, 400);
      } else if (mensaje.event === 'ms.channel.unauthorized') {
        fin(new Error('sin permiso del mando'));
      }
    }, function (motivo) { fin(new Error(motivo)); });
}

module.exports = {
  leerDatos: leerDatos, guardarDatos: guardarDatos, carpetaDatos: carpetaDatos,
  obraActual: obraActual, imagenObra: imagenObra, ponerModoArte: ponerModoArte, tecla: tecla
};

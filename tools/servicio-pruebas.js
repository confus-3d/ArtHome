// Servicio de pruebas para ver ArtHome en el navegador del Mac con la obra real de la tele.
// Contesta como launcher/service/index.js pero solo lee: no pasa a Modo Arte ni pulsa teclas.
// Uso: ARTHOME_TELE=192.168.31.232 node tools/servicio-pruebas.js   (escucha en el 47790)
'use strict';
var http = require('http');
var url = require('url');
var tele = require('../launcher/service/tele');

function responder(res, codigo, tipo, cuerpo) {
  res.writeHead(codigo, { 'Access-Control-Allow-Origin': '*', 'Content-Type': tipo, 'Cache-Control': 'no-store' });
  res.end(cuerpo);
}
http.createServer(function (req, res) {
  var u = url.parse(req.url, true);
  if (u.pathname === '/obra') {
    tele.obraActual(function (e, id) { responder(res, 200, 'application/json', JSON.stringify(e ? { error: e.message } : { id: id })); });
  } else if (u.pathname === '/obra.jpg') {
    tele.imagenObra(String(u.query.id || ''), function (e, img) {
      if (e) { responder(res, 502, 'text/plain', e.message); } else { responder(res, 200, 'image/jpeg', img); }
    });
  } else if (u.pathname === '/vigilante') {
    responder(res, 200, 'application/json', JSON.stringify({ activo: u.query.activo !== '0', prueba: true }));
  } else {
    responder(res, 200, 'application/json', JSON.stringify({ ok: true, prueba: true }));
  }
}).listen(47790, '127.0.0.1', function () { console.log('Servicio de pruebas de ArtHome en http://127.0.0.1:47790'); });

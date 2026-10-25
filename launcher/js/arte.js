// Fondo y cartela: la obra que está mostrando el Modo Arte, difuminada, con su título y autor.
// El difuminado sale casi gratis: se desenfoca una vez la miniatura en un lienzo pequeño y el
// navegador lo estira a 1920×1080. Nada de filtros en vivo, que el motor de la tele va justo.
(function (A) {
  'use strict';

  var cfg = A.config;
  // Desenfoque aplicado una sola vez sobre un lienzo de 384×216; después el navegador lo estira.
  var DESENFOQUE = { suave: 3, media: 7, fuerte: 13 };
  var ANCHO = 384, ALTO = 216;
  var actual = null, imagen = null;

  function dibujar() {
    var lienzo = A.$('fondo');
    if (!lienzo || !imagen) { return; }
    var radio = DESENFOQUE[A.prefs.difuminado] || DESENFOQUE.media;
    lienzo.width = ANCHO; lienzo.height = ALTO;
    try {
      var ctx = lienzo.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.filter = 'blur(' + radio + 'px)';
      // Recorte «cover» a 16:9 por si la obra no lo es; un poco más grande para que el borde
      // desenfocado no deje un marco oscuro.
      var r = Math.max(ANCHO / imagen.width, ALTO / imagen.height) * 1.08, w = imagen.width * r, h = imagen.height * r;
      ctx.drawImage(imagen, (ANCHO - w) / 2, (ALTO - h) / 2, w, h);
      lienzo.classList.add('listo');
    } catch (e) { /* imagen no disponible: queda el fondo liso */ }
  }

  function cartela() {
    var caja = A.$('cartela'), obra = actual && window.OBRAS && window.OBRAS[actual];
    if (!caja) { return; }
    if (!A.prefs.cartela || !obra) { caja.hidden = true; return; }
    A.$('cartela-titulo').textContent = obra.t;
    A.$('cartela-autor').textContent = obra.a + (obra.y ? ', ' + obra.y : '');
    caja.hidden = false;
  }

  function cargar(id) {
    var img = new Image();
    img.onload = function () { imagen = img; dibujar(); };
    img.src = cfg.SERVICE_URL + '/obra.jpg?id=' + encodeURIComponent(id);
  }

  A.arte = {
    redibujar: function () { dibujar(); cartela(); },
    refrescar: function () {
      A.homewatch.obra(function (datos) {
        // Si la tele no contesta (canal ocupado, recién encendida), se reintenta en un rato.
        if (!datos || !datos.id) { clearTimeout(A.arte.reintento); A.arte.reintento = setTimeout(A.arte.refrescar, 15000); return; }
        if (datos.id !== actual) { actual = datos.id; cargar(actual); }
        cartela();
      });
    },
    poner: function () {
      if (!A.tizen) { return A.toast('Pasaría a Modo Arte'); }
      A.homewatch.arte(function (r) { if (!r) { A.toast('No se pudo pasar a Modo Arte'); } });
    }
  };
})(window.AeroTizen);

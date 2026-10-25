// ArtHome: configuración. Basado en AeroTizen (MIT, Hamza El Alaoui); la identidad de la app
// se mantiene (DclHome001) para instalarse encima como una actualización.
window.AeroTizen = window.AeroTizen || {};

AeroTizen.config = {
  APP_ID: 'DclHome001.Home',
  SERVICE_ID: 'DclHome001.Watcher',
  // En el navegador del Mac se puede apuntar a un servicio de pruebas con ?servicio=URL.
  SERVICE_URL: (location.search.match(/[?&]servicio=([^&]+)/) || [])[1] ? decodeURIComponent(location.search.match(/[?&]servicio=([^&]+)/)[1]) : 'http://127.0.0.1:47790',
  VERSION: '1.1',

  STORAGE_KEY: 'arthome.preferencias.v1',

  // Teclas del mando de la Frame (sin botones de colores) y del teclado en pruebas.
  KEY: { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27, BACKSPACE: 8, IME_DONE: 65376, IME_CANCEL: 65385 },

  // Apps reales: paquetes de la tienda (10 caracteres) y las preinstaladas conocidas.
  STORE_PACKAGE: /^[A-Za-z0-9]{10}$/,
  HIDDEN_APPS: /service|emanual|e-manual|companion|dummy|widget|DclHome001/i,
  STORE_APP_IDS: ['org.volt.apps', 'com.samsung.tv.store'],
  HBBTV_APP_ID: 'org.tizen.hbbtv',
  HBBTV_LINK_METADATA: 'http://samsung.com/tv/metadata/hbbtv.link',
  VISOR_TELE: 'org.tizen.tv-viewer',

  // Primera vez: fila del inicio y apps escondidas, por comienzo del nombre.
  INICIO_DE_SERIE: ['netflix', 'movistar', 'prime video', 'disney', 'youtube', 'spotify', 'crunchyroll'],
  OCULTAS_DE_SERIE: ['xbox', 'geforce', 'amazon luna', 'e-manual', 'rakuten'],

  // Colores de marca de las apps de Paco que no están en el catálogo de AeroTizen.
  COLORES: [
    [/^movistar/i, '#019df4'], [/^atresplayer/i, '#ff6b00'], [/^rtve/i, '#e5332a'], [/^3cat/i, '#2f6fdb'],
    [/^skyshowtime/i, '#7b4dff'], [/^apple tv/i, '#c7c7cc'], [/^amazon alexa/i, '#00caff'], [/^amazon luna/i, '#9146ff'],
    [/^security center/i, '#8e9aa6'], [/^browser|^internet/i, '#7aa7ff'], [/^tizenbrew/i, '#ff4e45'],
    [/^xbox/i, '#2ca243'], [/^geforce/i, '#76b900'], [/^rakuten/i, '#bf0000'], [/^disney/i, '#2f7cf6']
  ],

  // Tipos del catálogo «Todas las apps», por nombre.
  TIPOS: [
    { titulo: 'Cine y series', patron: /netflix|prime video|disney|movistar|apple tv|skyshowtime|crunchyroll|rakuten|max|hbo|filmin|plex|mubi|flixol|paramount/i },
    { titulo: 'Televisión', patron: /atresplayer|rtve|3cat|mitele|tv plus|pluto|dazn|eurosport|la liga/i },
    { titulo: 'Música y vídeo', patron: /youtube|spotify|tizenbrew|tizentube|twitch|deezer|tidal|apple music|vimeo/i },
    { titulo: 'Otras', patron: /./ }
  ],

  // Color de los detalles (líneas de foco, rombos, títulos) y paleta para las apps.
  ACENTOS: [['#d9b77c', 'Dorado'], ['#c9cdd2', 'Plata'], ['#d08a5b', 'Cobre'], ['#9fb89a', 'Salvia'],
    ['#8fb2d9', 'Azul'], ['#d9a0b0', 'Rosa'], ['#f3eee4', 'Blanco']],
  PALETA: [['#e5332a', 'Rojo'], ['#f47521', 'Naranja'], ['#e8b931', 'Amarillo'], ['#3fb950', 'Verde'],
    ['#2bb5a8', 'Turquesa'], ['#019df4', 'Azul'], ['#5b6cf0', 'Añil'], ['#9b59d0', 'Morado'], ['#e05aa0', 'Rosa'],
    ['#c7c7cc', 'Gris']],

  DEFAULTS: {
    inicio: null,          // ids en orden; null = de serie la primera vez
    ocultas: null,         // ids escondidos en el catálogo; null = de serie
    nombres: {},           // id -> nombre propio
    colores: {},           // id -> color propio (si no, el de la marca)
    acento: '#d9b77c',     // color de los detalles
    botonArte: true,
    mostrarEntradas: true,
    ocultarHdmiSinConectar: true,
    nombresEntradas: {},   // 'HDMI 1' -> nombre propio
    difuminado: 'media',   // suave | media | fuerte
    cartela: true,
    vigilante: true,
    formato24: true,
    ciudad: { nombre: 'Madrid', lat: 40.4168, lon: -3.7038 },
    mostrarTiempo: true,
    mostrarRed: true
  }
};

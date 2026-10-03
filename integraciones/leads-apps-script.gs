/**
 * TERRA 563 · Receptor de leads del sitio web.
 *
 * Pegar en la hoja "TERRA 563 · Leads web": Extensiones > Apps Script.
 * Implementar > Nueva implementación > Aplicación web
 *   Ejecutar como: Yo
 *   Quién tiene acceso: Cualquier persona
 * Copiar la URL /exec y ponerla en LEADS_ENDPOINT de index.html.
 *
 * Columnas: Fecha | Nombre | Teléfono | Correo | Interés | Mensaje | Origen | Estatus | Notas
 */

var MAX_LEN = 500;

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Honeypot: los bots llenan el campo oculto "empresa"; las personas no lo ven.
  if (p.empresa) return ok_();

  var nombre = clean_(p.nombre);
  var telefono = clean_(p.telefono);
  var correo = clean_(p.correo);
  if (!nombre || (!telefono && !correo)) return ok_();

  // Freno simple contra envíos repetidos del mismo teléfono/correo en 10 minutos.
  var cache = CacheService.getScriptCache();
  var key = 'lead_' + Utilities.base64EncodeWebSafe(telefono + '|' + correo).slice(0, 200);
  if (cache.get(key)) return ok_();
  cache.put(key, '1', 600);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
      new Date(),
      nombre,
      telefono,
      correo,
      clean_(p.interes),
      clean_(p.mensaje),
      clean_(p.origen) || 'web',
      'Nuevo',
      ''
    ]);
  } finally {
    lock.releaseLock();
  }
  return ok_();
}

function doGet() {
  return ContentService.createTextOutput('TERRA 563 leads: activo');
}

// Recorta, limita longitud y evita que un texto se interprete como fórmula.
function clean_(v) {
  v = String(v == null ? '' : v).trim().slice(0, MAX_LEN);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function ok_() {
  return ContentService.createTextOutput('ok');
}

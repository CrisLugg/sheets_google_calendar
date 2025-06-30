// Configuración global
const API_URL = 'https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT}'; 
const ACCESS_TOKEN = '{REEMPLAZAR_POR_RUNAMATIC_API_KEY}'; 
const SHEET_NAME_CONSULTA = '{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}'; 
const WATCH_SHEET_FECHAS = '{REEMPLAZAR_POR_NOMBRE_HOJA_DE CONSULTA}';
const CALENDAR_ID = '{REEMPLAZAR_POR_ID_DEL_CALENDARIO}'; //generalmente es el mail del calendario de google

// Función contenedora para el activador de calendario
function alActualizarCalendario() {
  regenerarHorariosDisponibles(); // Para Disponibilidad
}

// Función para generar franjas predefinidas en la hoja "Disponibilidad"
function regenerarHorariosDisponibles() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Disponibilidad') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Disponibilidad');

  sheet.clear();
  sheet.appendRow(['Fecha', 'Franja Horaria', 'Disponibilidad']);

  var today = new Date();
  var future = new Date();
  future.setDate(today.getDate() + 119); // cantidad de días que se van actualizar

  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var events = calendar.getEvents(today, future);

  var eventosPorDia = {};
  events.forEach(function(evento) {
    var fecha = evento.getStartTime();
    var dia = Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push({
      inicio: evento.getStartTime(),
      fin: evento.getEndTime()
    });
  });

  var franjas = [
    { inicio: "12:00", fin: "14:30" },
    { inicio: "15:00", fin: "17:30" },
    { inicio: "18:00", fin: "20:30" },
    { inicio: "21:00", fin: "23:30" }
  ]; //formato de los horarios

  var nuevasFilas = [];
  var iterarDias = Math.ceil((future - today) / (1000 * 60 * 60 * 24));

  for (var i = 0; i <= iterarDias; i++) {
    var dia = new Date();
    dia.setDate(today.getDate() + i);
    var diaStr = Utilities.formatDate(dia, Session.getScriptTimeZone(), "yyyy-MM-dd");

    franjas.forEach(function(franja) {
      var disponible = true;
      var franjaInicio = new Date(dia);
      franjaInicio.setHours(parseInt(franja.inicio.split(":")[0]), parseInt(franja.inicio.split(":")[1]));
      var franjaFin = new Date(dia);
      franjaFin.setHours(parseInt(franja.fin.split(":")[0]), parseInt(franja.fin.split(":")[1]));

      if (eventosPorDia[diaStr]) {
        eventosPorDia[diaStr].forEach(function(evento) {
          if (evento.fin > franjaInicio && evento.inicio < franjaFin) {
            disponible = false;
          }
        });
      }

      nuevasFilas.push([
        diaStr,
        franja.inicio + ' - ' + franja.fin,
        disponible ? 'Disponible' : 'Ocupado'
      ]);
    });
  }

  if (nuevasFilas.length > 0) {
    Logger.log(`Generando ${nuevasFilas.length} filas en la hoja Disponibilidad`);
    sheet.getRange(2, 1, nuevasFilas.length, 3).setValues(nuevasFilas);
  }
}

// Función onChange para manejar cambios en Fechas
function onChange(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const hojaActiva = e && e.source.getActiveSheet().getName();
    
    // Verificar si el cambio ocurrió en la hoja de interés
    if (!hojaActiva || hojaActiva !== WATCH_SHEET_FECHAS) return;

    // Consulta original 
    const hojaConsulta = spreadsheet.getSheetByName(SHEET_NAME_CONSULTA);
    if (!hojaConsulta) {
      Logger.log(`Error: La hoja "${SHEET_NAME_CONSULTA}" no existe.`);
      listSheetNames();
      return;
    }
    const datos = hojaConsulta.getDataRange().getValues();
    const contenido = convertToText(datos);
    sendDataToApp(contenido, API_URL);
  } catch (error) {
    Logger.log('Error en la función onChange: ' + error.message);
  }
}

// Función para convertir datos a texto
function convertToText(data) {
  const headers = data[0];
  const rows = data.slice(1);
  const textArray = rows.map(row => {
    return row.map((cell, index) => `${headers[index]}: ${cell}`).join(', ');
  });
  return textArray.join('\n');
}

// Función para enviar datos a la API
function sendDataToApp(sheetContent, apiUrl) {
  const payload = `value=${encodeURIComponent(sheetContent)}`;
  const options = {
    method: 'POST',
    contentType: 'application/x-www-form-urlencoded',
    headers: {
      'X-ACCESS-TOKEN': ACCESS_TOKEN
    },
    payload: payload
  };
  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    Logger.log(`Datos enviados exitosamente a ${apiUrl}: ${response.getContentText()}`);
  } catch (error) {
    Logger.log(`Error al enviar datos a ${apiUrl}: ${error.message}`);
  }
}

// Función para listar nombres de hojas
function listSheetNames() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  Logger.log('Hojas disponibles en este archivo:');
  sheets.forEach(sheet => Logger.log('- ' + sheet.getName()));
}

// Configuración global
const API_URL = 'https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT}'; // API para Consulta2
const API_URL_SALON = 'https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT_SALON}'; // API para ConsultaSalon
const ACCESS_TOKEN = '{REEMPLAZAR_POR_RUNAMATIC_API_KEY}'; // Token para ambas APIs
const SHEET_NAME_CONSULTA = '{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}'; // Hoja original
const WATCH_SHEET_FECHAS = '{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}'; // Hoja original de fechas
const SHEET_NAME_CONSULTA_SALON = '{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}'; // Hoja para consulta del salón
const WATCH_SHEET_FECHAS_SALON = '{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}'; // Hoja de fechas del salón
const CALENDAR_ID = '{REEMPLAZAR_POR_ID_CALENDAR}'; // ID del calendario

// Función contenedora para el activador de calendario
function alActualizarCalendario() {
  regenerarHorariosDisponibles(); // Para Disponibilidad
  generarHorariosSalon(); // Para Salon
}

// Función para generar horarios del salón
function generarHorariosSalon() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Salon') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Salon');
  hoja.clear();
  hoja.appendRow(['Fecha', 'Horarios Disponibles']);

  const hoy = new Date();
  const fechaInicio = new Date(hoy);
  fechaInicio.setDate(hoy.getDate() + 1); // Empieza el día siguiente
  const fechaFutura = new Date(fechaInicio);
  fechaFutura.setDate(fechaInicio.getDate() + 14); // 2 semanas

  const calendario = CalendarApp.getCalendarById(CALENDAR_ID);
  const eventos = calendario.getEvents(fechaInicio, fechaFutura);

  const eventosPorDia = {};
  eventos.forEach(function(evento) {
    const fecha = evento.getStartTime();
    const dia = Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push({
      inicio: evento.getStartTime(),
      fin: evento.getEndTime()
    });
  });

  const nuevasFilas = [];
  const diasIterar = Math.ceil((fechaFutura - fechaInicio) / (1000 * 60 * 60 * 24));

  for (let i = 0; i < diasIterar; i++) {
    const dia = new Date(fechaInicio);
    dia.setDate(fechaInicio.getDate() + i);
    const diaStr = Utilities.formatDate(dia, Session.getScriptTimeZone(), "yyyy-MM-dd");
    const diaFormateado = Utilities.formatDate(dia, Session.getScriptTimeZone(), "EEEE dd/MM");

    const inicioDia = new Date(dia);
    inicioDia.setHours(12, 0);
    const finDia = new Date(dia);
    finDia.setHours(23, 30);

    const ventanasDisponibles = [];

    if (eventosPorDia[diaStr]) {
      // Ordenar eventos por hora de inicio
      eventosPorDia[diaStr].sort((a, b) => a.inicio - b.inicio);

      // Agrupar eventos en bloques si sus márgenes se superponen
      const bloques = [];
      let bloqueActual = null;

      eventosPorDia[diaStr].forEach(function(evento) {
        const inicioMargen = new Date(evento.inicio.getTime() - 60 * 60 * 1000); // 1 hora antes
        const finMargen = new Date(evento.fin.getTime() + 60 * 60 * 1000); // 1 hora después

        if (!bloqueActual) {
          bloqueActual = { inicio: inicioMargen, fin: finMargen, eventos: [evento] };
        } else if (inicioMargen <= bloqueActual.fin) {
          // Si el nuevo margen se superpone, extender el bloque
          bloqueActual.fin = finMargen > bloqueActual.fin ? finMargen : bloqueActual.fin;
          bloqueActual.eventos.push(evento);
        } else {
          // Finalizar el bloque actual y empezar uno nuevo
          bloques.push(bloqueActual);
          bloqueActual = { inicio: inicioMargen, fin: finMargen, eventos: [evento] };
        }
      });

      if (bloqueActual) {
        bloques.push(bloqueActual);
      }

      // Validar y ajustar cada bloque
      bloques.forEach(function(bloque) {
        // Ajustar los límites del bloque al rango del día
        const inicioValido = bloque.inicio < inicioDia ? inicioDia : bloque.inicio;
        const finValido = bloque.fin > finDia ? finDia : bloque.fin;

        // Verificar si la franja está libre de conflictos con eventos fuera del bloque
        let franjaValida = true;
        eventosPorDia[diaStr].forEach(function(evento) {
          if (!bloque.eventos.includes(evento)) {
            const otroInicio = evento.inicio;
            const otroFin = evento.fin;
            if (inicioValido < otroFin && finValido > otroInicio) {
              franjaValida = false;
            }
          }
        });

        // Agregar la franja si es válida
        if (franjaValida) {
          ventanasDisponibles.push({
            inicio: inicioValido,
            fin: finValido
          });
        }
      });
    }

    // Formatear horarios disponibles
    const horarios = ventanasDisponibles
      .map(function(ventana) {
        const horaInicio = Utilities.formatDate(ventana.inicio, Session.getScriptTimeZone(), "HH:mm");
        const horaFin = Utilities.formatDate(ventana.fin, Session.getScriptTimeZone(), "HH:mm");
        return `${horaInicio} a ${horaFin}`;
      })
      .join(' | ');

    // Agregar la fila solo si hay horarios disponibles
    if (horarios) {
      nuevasFilas.push([diaFormateado, horarios]);
    }
  }

  if (nuevasFilas.length > 0) {
    hoja.getRange(2, 1, nuevasFilas.length, 2).setValues(nuevasFilas);
  }
}

// Función para generar franjas predefinidas en la hoja "Disponibilidad"
function regenerarHorariosDisponibles() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Disponibilidad') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Disponibilidad');

  sheet.clear();
  sheet.appendRow(['Fecha', 'Franja Horaria', 'Disponibilidad']);

  var today = new Date();
  var future = new Date();
  future.setMonth(today.getMonth() + 5);

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
  ];

  var nuevasFilas = [];
  var iterarDias = (future - today) / (1000 * 60 * 60 * 24);
  iterarDias = Math.ceil(iterarDias);

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
    sheet.getRange(2, 1, nuevasFilas.length, 3).setValues(nuevasFilas);
  }
}

// Función onChange para manejar cambios en Fechas y FechasSalon
function onChange(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const hojaActiva = e && e.source.getActiveSheet().getName();
    
    // Verificar si el cambio ocurrió en las hojas de interés
    if (!hojaActiva || ![WATCH_SHEET_FECHAS, WATCH_SHEET_FECHAS_SALON].includes(hojaActiva)) return;

    // Consulta original (Consulta2)
    if (hojaActiva === WATCH_SHEET_FECHAS) {
      const hojaConsulta = spreadsheet.getSheetByName(SHEET_NAME_CONSULTA);
      if (!hojaConsulta) {
        Logger.log(`Error: La hoja "${SHEET_NAME_CONSULTA}" no existe.`);
        listSheetNames();
        return;
      }
      const datos = hojaConsulta.getDataRange().getValues();
      const contenido = convertToText(datos);
      sendDataToApp(contenido, API_URL);
    }

    // Consulta del salón (ConsultaSalon)
    if (hojaActiva === WATCH_SHEET_FECHAS_SALON) {
      const hojaConsultaSalon = spreadsheet.getSheetByName(SHEET_NAME_CONSULTA_SALON);
      if (!hojaConsultaSalon) {
        Logger.log(`Error: La hoja "${SHEET_NAME_CONSULTA_SALON}" no existe.`);
        listSheetNames();
        return;
      }
      const datos = hojaConsultaSalon.getDataRange().getValues();
      const contenido = convertToText(datos);
      sendDataToApp(contenido, API_URL_SALON);
    }
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

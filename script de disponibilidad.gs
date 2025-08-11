// Configuración global
// TODO: Reemplaza con tu propia URL de la API
const API_URL = '[INSERT_YOUR_API_URL_HERE]';
// TODO: Reemplaza con tu propio token de acceso
const ACCESS_TOKEN = '[INSERT_YOUR_ACCESS_TOKEN_HERE]';
const SHEET_NAME_CONSULTA = 'Available_Dates';
const WATCH_SHEET_FECHAS = 'Consultation_Dates';
const CALENDAR_ID = '[INSERT_YOUR_CALENDAR_ID_HERE]'; // Ejemplo: 'your.email@domain.com'
const DIAS_FUTUROS = 30; // Cantidad de días a actualizar
const INTERVALO_DISPONIBILIDAD = 15; // Intervalo en minutos para las franjas horarias
const TIME_ZONE = '[INSERT_YOUR_TIMEZONE_HERE]'; // Ejemplo: 'America/Santiago'
const MAX_EVENTOS_SUPERPUESTOS = 3; // Máximo de eventos superpuestos permitidos
const RESERVA_SHEET = 'Booking'; // Nombre de la hoja de reservas
const HABILITAR_AGENDAMIENTO_CALENDARIO = true; // true para habilitar, false para deshabilitar el agendamiento en el calendario
const UBICACION_EVENTO = '[INSERT_YOUR_EVENT_LOCATION_HERE]'; // Ejemplo: '123 Main St, City, Country'

// Define los servicios disponibles. Para servicios con subcategorías (como 'Assessment'),
// especifica los subtipos permitidos en 'subtipos'. Ejemplo: ['Type1', 'Type2', ...]
const SERVICIOS = [
  { nombre: '15 minutes', duracion: 15, sheet: 'Availability_15min' },
  { nombre: '30 minutes', duracion: 30, sheet: 'Availability_30min' },
  { nombre: '45 minutes', duracion: 45, sheet: 'Availability_45min' },
  { nombre: '1 hour', duracion: 60, sheet: 'Availability_1hour' },
  { nombre: '1 hour 15 minutes', duracion: 75, sheet: 'Availability_1hour15min' },
  { nombre: '1 hour 30 minutes', duracion: 90, sheet: 'Availability_1hour30min' },
  { nombre: '2 hours', duracion: 120, sheet: 'Availability_2hours' },
  { 
    nombre: 'Assessment', 
    duracion: 30, 
    sheet: 'Availability_Assessment',
    maxEventos: 1, // Solo permite 1 evento por franja
    subtipos: ['Type1', 'Type2', 'Type3', 'Type4', 'Type5'] // TODO: Define tus propios subtipos
  }
];

// TODO: Ajusta los horarios según tus necesidades
const HORARIOS = {
  weekdays: { inicio: '09:00', fin: '17:00' },
  saturday: { inicio: '09:00', fin: '13:00' }
};

// Encabezados esperados en la hoja de reservas
const RESERVA_HEADERS = [
  'First Name', 'Last Name', 'Email', 'Phone Number', 'ID',
  'Service Type', 'Duration', 'Booking Date', 'Booking Time'
];

// Función contenedora para el activador de calendario
function alActualizarCalendario() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    Logger.log(`Error: Could not access calendar with ID ${CALENDAR_ID}. Check the ID and permissions.`);
    return;
  }
  SERVICIOS.forEach(servicio => regenerarHorariosDisponibles(servicio));
}

// Función para generar franjas horarias en la hoja correspondiente a cada servicio
function regenerarHorariosDisponibles(servicio) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(servicio.sheet) || 
              SpreadsheetApp.getActiveSpreadsheet().insertSheet(servicio.sheet);
  sheet.getRange('A:A').setNumberFormat('@'); // Set column A to plain text
  sheet.clear();
  sheet.appendRow(['Date', 'Time Slot', 'Availability']);
  
  var today = new Date();
  var future = new Date();
  future.setDate(today.getDate() + DIAS_FUTUROS);
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    Logger.log(`Error: Could not access calendar with ID ${CALENDAR_ID} in regenerarHorariosDisponibles. Check the ID and permissions.`);
    return;
  }
  var events = calendar.getEvents(today, future);
  
  // Organizar eventos por día
  var eventosPorDia = {};
  events.forEach(function(evento) {
    var fecha = evento.getStartTime();
    var dia = Utilities.formatDate(fecha, TIME_ZONE, 'yyyy-MM-dd');
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push({
      inicio: evento.getStartTime(),
      fin: evento.getEndTime(),
      titulo: evento.getTitle()
    });
  });
  
  var nuevasFilas = [];
  var iterarDias = Math.ceil((future - today) / (1000 * 60 * 60 * 24));
  
  for (var i = 0; i <= iterarDias; i++) {
    var dia = new Date();
    dia.setDate(today.getDate() + i);
    var diaStr = Utilities.formatDate(dia, TIME_ZONE, 'yyyy-MM-dd');
    var esSabado = dia.getDay() === 6;
    
    // Ignorar domingos
    if (dia.getDay() === 0) continue;

    var horario = esSabado ? HORARIOS.saturday : HORARIOS.weekdays;

    // Definir inicio y fin del día
    var [horaInicio, minInicio] = horario.inicio.split(':').map(Number);
    var [horaFin, minFin] = horario.fin.split(':').map(Number);

    // Ajustar hora final según duración del servicio
    var finAjustado = new Date(dia);
    finAjustado.setHours(horaFin, minFin);
    finAjustado.setMinutes(finAjustado.getMinutes() - servicio.duracion);

    // Generar franjas de 15 minutos
    var currentTime = new Date(dia);
    currentTime.setHours(horaInicio, minInicio, 0, 0);

    while (currentTime <= finAjustado) {
      var franjaFin = new Date(currentTime);
      franjaFin.setMinutes(franjaFin.getMinutes() + servicio.duracion);

      // Contar eventos superpuestos y verificar si hay evaluaciones
      var eventosSuperpuestos = 0;
      var tieneEvaluacion = false;
      if (eventosPorDia[diaStr]) {
        eventosPorDia[diaStr].forEach(function(evento) {
          if (evento.fin > currentTime && evento.inicio < franjaFin) {
            eventosSuperpuestos++;
            if (evento.titulo.startsWith('Assessment')) {
              tieneEvaluacion = true;
            }
          }
        });
      }

      // Determinar disponibilidad
      var maxEventosPermitidos = servicio.maxEventos || MAX_EVENTOS_SUPERPUESTOS;
      var disponible;
      if (servicio.nombre === 'Assessment') {
        disponible = !tieneEvaluacion && eventosSuperpuestos < MAX_EVENTOS_SUPERPUESTOS;
      } else {
        disponible = eventosSuperpuestos < maxEventosPermitidos;
      }
      
      var horaInicioStr = Utilities.formatDate(currentTime, TIME_ZONE, 'HH:mm');
      var horaFinStr = Utilities.formatDate(franjaFin, TIME_ZONE, 'HH:mm');

      nuevasFilas.push([
        diaStr,
        `${horaInicioStr} - ${horaFinStr}`,
        disponible ? 'Available' : 'Booked'
      ]);

      currentTime.setMinutes(currentTime.getMinutes() + INTERVALO_DISPONIBILIDAD);
    }
  }
  
  if (nuevasFilas.length > 0) {
    Logger.log(`Generating ${nuevasFilas.length} rows in sheet ${servicio.sheet}`);
    sheet.getRange(2, 1, nuevasFilas.length, 3).setValues(nuevasFilas);
  }
}

// Función para manejar cambios en las hojas (Booking o WATCH_SHEET_FECHAS)
function onChange(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const hojaActiva = e && e.source.getActiveSheet();
    if (!hojaActiva) {
      Logger.log('Error: Could not retrieve active sheet in onChange.');
      return;
    }
    const nombreHoja = hojaActiva.getName();
    
    // Procesar cambios en la hoja Booking
    if (nombreHoja === RESERVA_SHEET) {
      procesarReserva(hojaActiva);
    }

    // Procesar cambios en WATCH_SHEET_FECHAS para la API
    if (nombreHoja === WATCH_SHEET_FECHAS) {
      const hojaConsulta = spreadsheet.getSheetByName(SHEET_NAME_CONSULTA);
      if (!hojaConsulta) {
        Logger.log(`Error: Sheet "${SHEET_NAME_CONSULTA}" does not exist.`);
        listSheetNames();
        return;
      }
      const datos = hojaConsulta.getDataRange().getValues();
      const contenido = convertToText(datos);
      sendDataToApp(contenido, API_URL);
    }
  } catch (error) {
    Logger.log('Error in onChange function: ' + error.message);
    notifyError('Error in onChange: ' + error.message);
  }
}

// Función para procesar cambios en la hoja Booking
function procesarReserva(sheet) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    const errorMsg = `Error: Could not access calendar with ID ${CALENDAR_ID}. Check the ID and permissions.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Forzar formato de texto para la columna "Booking Date" (columna 8)
  sheet.getRange('H:H').setNumberFormat('@');
  
  // Verificar encabezados
  const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
  if (!headers.every((h, i) => h === RESERVA_HEADERS[i])) {
    const errorMsg = `Error: Headers in sheet ${RESERVA_SHEET} do not match expected headers.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  const range = sheet.getActiveRange();
  const row = range.getRow();
  if (row === 1) return; // Skip header row
  const data = sheet.getRange(row, 1, 1, 9).getValues()[0];
  
  // Validar campos obligatorios (todos menos ID)
  const [nombre, apellido, correo, telefono, id, serviceType, duracion, diaReservaRaw, horarioReserva] = data;
  if (!nombre || !apellido || !correo || !telefono || !serviceType || !duracion || !diaReservaRaw || !horarioReserva) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: All mandatory fields (except ID) must be completed.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Normalizar diaReserva a string en formato dd-mm-yyyy
  let diaReserva;
  if (diaReservaRaw instanceof Date) {
    diaReserva = Utilities.formatDate(diaReservaRaw, TIME_ZONE, 'dd-MM-yyyy');
    Logger.log(`Booking Date converted from Date to string: ${diaReserva}`);
  } else {
    diaReserva = String(diaReservaRaw);
    Logger.log(`Raw Booking Date: ${diaReservaRaw} (type: ${typeof diaReservaRaw})`);
  }
  
  // Validar formato de Booking Date (dd-mm-yyyy)
  if (!diaReserva.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Invalid Booking Date format (${diaReserva}). Must be dd-mm-yyyy.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Validar formato de Booking Time (hh-mm am/pm)
  const match = horarioReserva.match(/^(\d{2})-(\d{2})\s*(am|pm)$/i);
  if (!match) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Invalid Booking Time format (${horarioReserva}). Must be hh-mm am/pm with optional space.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  const hora = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = match[3].toLowerCase();
  let horaInicio = hora;
  if (period === 'pm' && hora !== 12) horaInicio += 12;
  if (period === 'am' && hora === 12) horaInicio = 0;
  
  // Validar Duración
  const servicio = SERVICIOS.find(s => s.nombre === duracion);
  if (!servicio) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Invalid Duration (${duracion}). Must be one of: ${SERVICIOS.map(s => s.nombre).join(', ')}.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Validar Service Type para Assessment
  if (duracion === 'Assessment' && servicio.subtipos) {
    if (!servicio.subtipos.includes(serviceType)) {
      const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Invalid Service Type (${serviceType}) for Assessment. Must be one of: ${servicio.subtipos.join(', ')}.`;
      Logger.log(errorMsg);
      notifyError(errorMsg);
      return;
    }
  }
  
  // Parsear fecha (dd-mm-yyyy)
  const [day, month, year] = diaReserva.split('-').map(Number);
  
  // Crear fecha usando Utilities.parseDate para asegurar la zona horaria
  const fechaStr = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year} ${horaInicio.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
  const inicioEvento = Utilities.parseDate(fechaStr, TIME_ZONE, 'dd-MM-yyyy HH:mm:ss');
  if (!inicioEvento) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Error parsing date and time (${fechaStr}).`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  const finEvento = new Date(inicioEvento);
  finEvento.setMinutes(finEvento.getMinutes() + servicio.duracion);
  
  // Log para depuración
  Logger.log(`Entered Date: ${diaReserva}`);
  Logger.log(`Entered Time: ${horarioReserva}`);
  Logger.log(`Event Start: ${Utilities.formatDate(inicioEvento, TIME_ZONE, 'yyyy-MM-dd HH:mm')}`);
  Logger.log(`Event End: ${Utilities.formatDate(finEvento, TIME_ZONE, 'yyyy-MM-dd HH:mm')}`);
  
  // Verificar que la fecha sea correcta
  const fechaEvento = Utilities.formatDate(inicioEvento, TIME_ZONE, 'dd-MM-yyyy');
  if (fechaEvento !== diaReserva) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Event date error (${fechaEvento} instead of ${diaReserva}).`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Verificar duración del evento
  const duracionMinutos = (finEvento - inicioEvento) / (1000 * 60);
  if (duracionMinutos !== servicio.duracion) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Calculated duration (${duracionMinutos} minutes) does not match ${duracion} (${servicio.duracion} minutes).`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Verificar eventos superpuestos
  const eventosExistentes = calendar.getEvents(inicioEvento, finEvento);
  const maxEventosPermitidos = servicio.maxEventos || MAX_EVENTOS_SUPERPUESTOS;
  let eventosEvaluacion = 0;
  eventosExistentes.forEach(evento => {
    if (evento.getTitle().startsWith('Assessment Booking')) {
      eventosEvaluacion++;
    }
  });
  
  // Validaciones específicas para Assessment
  if (duracion === 'Assessment') {
    if (eventosEvaluacion > 0) {
      const errorMsg = `Row ${row} in ${RESERVA_SHEET}: An Assessment already exists at ${diaReserva} ${horarioReserva}. No more Assessments can be booked in this slot.`;
      Logger.log(errorMsg);
      notifyError(errorMsg);
      return;
    }
    if (eventosExistentes.length >= MAX_EVENTOS_SUPERPUESTOS) {
      const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Cannot create Assessment at ${diaReserva} ${horarioReserva}. All slots are occupied.`;
      Logger.log(errorMsg);
      notifyError(errorMsg);
      return;
    }
  } else {
    if (eventosExistentes.length >= maxEventosPermitidos) {
      const errorMsg = `Row ${row} in ${RESERVA_SHEET}: Cannot create event at ${diaReserva} ${horarioReserva}. Limit of ${maxEventosPermitidos} overlapping events reached.`;
      Logger.log(errorMsg);
      notifyError(errorMsg);
      return;
    }
  }
  
  // Validar que la franja exista y esté disponible
  const disponibilidadSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(servicio.sheet);
  if (!disponibilidadSheet) {
    const errorMsg = `Error: Sheet ${servicio.sheet} does not exist.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  const horaInicioStr = Utilities.formatDate(inicioEvento, TIME_ZONE, 'HH:mm');
  const horaFinStr = Utilities.formatDate(finEvento, TIME_ZONE, 'HH:mm');
  const franjaHoraria = `${horaInicioStr} - ${horaFinStr}`;
  const fechaYyyyMmDd = Utilities.formatDate(inicioEvento, TIME_ZONE, 'yyyy-MM-dd');
  const disponibilidadData = disponibilidadSheet.getDataRange().getValues();
  let franjaEncontrada = false;
  let franjaDisponible = false;
  
  Logger.log(`Searching for slot: ${fechaYyyyMmDd} ${franjaHoraria} in ${servicio.sheet}`);
  
  for (let i = 1; i < disponibilidadData.length; i++) {
    if (disponibilidadData[i][0] === fechaYyyyMmDd && disponibilidadData[i][1] === franjaHoraria) {
      franjaEncontrada = true;
      if (disponibilidadData[i][2] === 'Available') {
        franjaDisponible = true;
      }
      break;
    }
  }
  
  if (!franjaEncontrada) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: The slot ${fechaYyyyMmDd} ${franjaHoraria} does not exist in ${servicio.sheet}.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  if (!franjaDisponible) {
    const errorMsg = `Row ${row} in ${RESERVA_SHEET}: The slot ${fechaYyyyMmDd} ${franjaHoraria} is not available in ${servicio.sheet}.`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Verificar si el agendamiento en el calendario está habilitado
  if (!HABILITAR_AGENDAMIENTO_CALENDARIO) {
    Logger.log(`Calendar booking disabled for ${diaReserva} ${horarioReserva} (${duracion}). No event created or availability updated.`);
    notifyError(`Calendar booking disabled. No event created or availability updated for ${diaReserva} ${horarioReserva}.`);
    return;
  }
  
  // Crear evento
  // TODO: Personaliza el título del evento según tus necesidades
  const tituloEvento = `${serviceType} at [INSERT_YOUR_BUSINESS_NAME_HERE]`;
  const descripcionEvento = `NOTE: Modifications and cancellations must be made through the provided email or by contacting the business. THIS EVENT IS FOR REFERENCE ONLY.`;
  
  let evento;
  try {
    evento = calendar.createEvent(tituloEvento, inicioEvento, finEvento);
    evento.setDescription(descripcionEvento);
    evento.setLocation(UBICACION_EVENTO);
    evento.addPopupReminder(30);
    if (eventosExistentes.length === 0) {
      evento.setColor(CalendarApp.EventColor.PALE_BLUE);
      Logger.log('Event created with color PALE_BLUE (first event, no prior bookings)');
    } else if (eventosExistentes.length === 1) {
      evento.setColor(CalendarApp.EventColor.ORANGE);
      Logger.log('Event created with color ORANGE (second event, 1 prior booking)');
    } else if (eventosExistentes.length === 2) {
      evento.setColor(CalendarApp.EventColor.RED);
      Logger.log('Event created with color RED (third event, 2 prior bookings)');
    }
    Logger.log(`Event created: ${diaReserva} ${horarioReserva} (${duracion}) - ${tituloEvento}`);
    Logger.log(`Location: ${UBICACION_EVENTO}`);
    Logger.log(`Description: ${descripcionEvento}`);
    Logger.log('Reminder: 30 minutes before');
  } catch (error) {
    const errorMsg = `Error creating event for ${diaReserva} ${horarioReserva} in ${RESERVA_SHEET}: ${error.message}`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
    return;
  }
  
  // Actualizar hoja de disponibilidad
  for (let i = 1; i < disponibilidadData.length; i++) {
    if (disponibilidadData[i][0] === fechaYyyyMmDd && disponibilidadData[i][1] === franjaHoraria) {
      disponibilidadSheet.getRange(i + 1, 3).setValue('Booked');
      Logger.log(`Slot marked as Booked: ${fechaYyyyMmDd} ${franjaHoraria} in ${servicio.sheet}`);
      break;
    }
  }
  
  // Mover la reserva a la hoja "Booked"
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let reservadoSheet = spreadsheet.getSheetByName('Booked');
    
    // Crear la hoja "Booked" si no existe
    if (!reservadoSheet) {
      reservadoSheet = spreadsheet.insertSheet('Booked');
      reservadoSheet.getRange(1, 1, 1, RESERVA_HEADERS.length).setValues([RESERVA_HEADERS]);
      Logger.log('Sheet "Booked" created with headers.');
    }

    // Forzar diaReserva como string en formato dd-mm-yyyy al copiar a "Booked"
    const dataToCopy = [...data];
    dataToCopy[7] = diaReserva;
    reservadoSheet.appendRow(dataToCopy);
    Logger.log(`Booking copied to sheet "Booked": ${diaReserva} ${horarioReserva} (${duracion})`);

    // Eliminar la fila de la hoja "Booking"
    sheet.deleteRow(row);
    Logger.log(`Row ${row} deleted from sheet ${RESERVA_SHEET}`);
  } catch (error) {
    const errorMsg = `Error moving booking to sheet "Booked" for ${diaReserva} ${horarioReserva}: ${error.message}`;
    Logger.log(errorMsg);
    notifyError(errorMsg);
  }
}

// Funciones existentes sin cambios
function convertToText(data) {
  const headers = data[0];
  const rows = data.slice(1);
  const textArray = rows.map(row => {
    return row.map((cell, index) => `${headers[index]}: ${cell}`).join(', ');
  });
  return textArray.join('\n');
}

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
    Logger.log(`Data successfully sent to ${apiUrl}: ${response.getContentText()}`);
  } catch (error) {
    Logger.log(`Error sending data to ${apiUrl}: ${error.message}`);
  }
}

function listSheetNames() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  Logger.log('Available sheets in this spreadsheet:');
  sheets.forEach(sheet => Logger.log('- ' + sheet.getName()));
}

function notifyError(message) {
  const email = Session.getActiveUser().getEmail();
  if (email) {
    MailApp.sendEmail(email, 'Booking Script Error', message);
  }
  const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Errors') || 
                  SpreadsheetApp.getActiveSpreadsheet().insertSheet('Errors');
  logSheet.appendRow([new Date(), message]);
}

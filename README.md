# sheets_google_calendar#






DOBLE DISPONIBILIDAD.

Este script de Google Apps Script gestiona la disponibilidad de horarios en un calendario de Google y sincroniza datos con APIs externas al editar ciertas hojas en un Google Spreadsheet.

## Funcionalidad
1. **Generación de Horarios Disponibles**:
   - Lee eventos del calendario de Google con el ID configurado en `CALENDAR_ID`.
   - Para la disponibilidad general (`regenerarHorariosDisponibles`):
     - Genera horarios en franjas predefinidas (12:00-14:30, 15:00-17:30, 18:00-20:30, 21:00-23:30) para los próximos 5 meses.
     - Marca cada franja como "Disponible" u "Ocupado" según los eventos del calendario.
     - Guarda los resultados en una hoja llamada `Disponibilidad`.
   - Para el salón (`generarHorariosSalon`):
     - Genera horarios disponibles en bloques dinámicos para los próximos 14 días.
     - Guarda los resultados en una hoja llamada `Salon`.

2. **Sincronización con API**:
   - Cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`, envía los datos de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA}` a la API configurada en `API_URL`.
   - Cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`, envía los datos de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}` a la API configurada en `API_URL_SALON`.
   - Los datos se envían en formato texto, usando un token de acceso para autenticación.

3. **Automatización**:
   - El script se ejecuta automáticamente al actualizar el calendario (función `alActualizarCalendario`) o al editar las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}` (función `onChange`).

## Archivos y Hojas
- **Hojas de Google Sheets**:
  - `Disponibilidad`: Almacena las fechas, franjas horarias y su estado (Disponible/Ocupado).
  - `Salon`: Almacena los horarios disponibles para el salón.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA}`: Contiene los datos enviados a la API principal.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`: Contiene los datos enviados a la API del salón.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`: Hoja que activa el envío de datos para la API principal.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`: Hoja que activa el envío de datos para la API del salón.

## Configuración
- **Constantes globales**:
  - `API_URL`: URL de la API principal (`https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT}`).
  - `API_URL_SALON`: URL de la API del salón (`https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT_SALON}`).
  - `ACCESS_TOKEN`: Token para autenticar las solicitudes a ambas APIs (`{REEMPLAZAR_POR_RUNAMATIC_API_KEY}`).
  - `SHEET_NAME_CONSULTA`: Nombre de la hoja principal (`{REEMPLAZAR_POR_NOMBRE_HOJA}`).
  - `WATCH_SHEET_FECHAS`: Hoja que activa el envío a la API principal (`{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`).
  - `SHEET_NAME_CONSULTA_SALON`: Nombre de la hoja del salón (`{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`).
  - `WATCH_SHEET_FECHAS_SALON`: Hoja que activa el envío a la API del salón (`{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`).
  - `CALENDAR_ID`: ID del calendario de Google.

## Funciones Principales
- `alActualizarCalendario()`: Ejecuta la generación de horarios disponibles para ambas funcionalidades.
- `regenerarHorariosDisponibles()`: Crea la lista de horarios disponibles en la hoja `Disponibilidad`.
- `generarHorariosSalon()`: Crea la lista de horarios disponibles en la hoja `Salon`.
- `onChange(e)`: Detecta cambios en las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}` y envía datos a las APIs correspondientes.
- `convertToText(data)`: Convierte los datos de las hojas en formato texto.
- `sendDataToApp(sheetContent, apiUrl)`: Envía los datos a la API.
- `listSheetNames()`: Registra los nombres de las hojas en caso de error.

## Requisitos
- Un Google Spreadsheet con las hojas `Disponibilidad`, `Salon`, `{REEMPLAZAR_POR_NOMBRE_HOJA}`, `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`, `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` y `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`.
- Acceso al calendario de Google con el ID configurado.
- Permisos para ejecutar Google Apps Script y conectar con las APIs externas.

## Uso
1. Configura el script en un proyecto de Google Apps Script asociado a tu Google Spreadsheet.
2. Reemplaza las constantes `{REEMPLAZAR_POR_*}` con los valores correspondientes (IDs de APIs, token, nombres de hojas, y ID del calendario).
3. Asegúrate de que las hojas y el calendario estén correctamente configurados.
4. El script se ejecutará automáticamente al actualizar el calendario o al editar las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`.

## Notas
- Si las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}` no existen, el script registra un error y lista las hojas disponibles.
- Los errores durante el envío a las APIs se registran en el log de Google Apps Script.

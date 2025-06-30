# sheets_google_calendar#






## DOBLE DISPONIBILIDAD.
# README - Script de Gestión de Disponibilidad y Salón

Este script de Google Apps Script gestiona horarios disponibles en un calendario de Google y sincroniza datos con APIs externas al editar hojas específicas en un Google Spreadsheet.

## Funcionalidad
1. **Generación de Horarios Disponibles**:
   - Lee eventos del calendario de Google configurado en `CALENDAR_ID`.
   - **Disponibilidad General** (`regenerarHorariosDisponibles`):
     - Genera horarios en franjas predefinidas (12:00-14:30, 15:00-17:30, 18:00-20:30, 21:00-23:30) para los próximos 5 meses.
     - Marca cada franja como "Disponible" u "Ocupado" según los eventos del calendario.
     - Guarda los resultados en la hoja `Disponibilidad`.
   - **Salón** (`generarHorariosSalon`):
     - Genera horarios disponibles en bloques dinámicos para los próximos 14 días, considerando márgenes de 1 hora antes y después de cada evento.
     - Guarda los resultados en la hoja `Salon`.

2. **Sincronización con APIs**:
   - Cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`, envía los datos de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}` a la API configurada en `API_URL`.
   - Cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`, envía los datos de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}` a la API configurada en `API_URL_SALON`.
   - Los datos se envían en formato texto, autenticados con el token `{REEMPLAZAR_POR_RUNAMATIC_API_KEY}`.

3. **Automatización**:
   - Se ejecuta automáticamente al actualizar el calendario (`alActualizarCalendario`) o al editar las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}` (`onChange`).

## Archivos y Hojas
- **Hojas de Google Sheets**:
  - `Disponibilidad`: Almacena fechas, franjas horarias y estado (Disponible/Ocupado).
  - `Salon`: Almacena horarios disponibles para el salón.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}`: Contiene datos enviados a la API principal.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`: Contiene datos enviados a la API del salón.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`: Activa el envío a la API principal.
  - `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`: Activa el envío a la API del salón.

## Configuración
- **Constantes globales**:
  - `API_URL`: URL de la API principal (`https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT}`).
  - `API_URL_SALON`: URL de la API del salón (`https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT_SALON}`).
  - `ACCESS_TOKEN`: Token para autenticar las APIs (`{REEMPLAZAR_POR_RUNAMATIC_API_KEY}`).
  - `SHEET_NAME_CONSULTA`: Hoja principal (`{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}`).
  - `WATCH_SHEET_FECHAS`: Hoja que activa el envío a la API principal (`{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}`).
  - `SHEET_NAME_CONSULTA_SALON`: Hoja del salón (`{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`).
  - `WATCH_SHEET_FECHAS_SALON`: Hoja que activa el envío a la API del salón (`{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`).
  - `CALENDAR_ID`: ID del calendario de Google (`{REEMPLAZAR_POR_ID_CALENDAR}`).

## Funciones Principales
- `alActualizarCalendario()`: Ejecuta la generación de horarios para disponibilidad y salón.
- `regenerarHorariosDisponibles()`: Genera horarios en la hoja `Disponibilidad`.
- `generarHorariosSalon()`: Genera horarios en la hoja `Salon`.
- `onChange(e)`: Detecta cambios en `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}` y envía datos a las APIs.
- `convertToText(data)`: Convierte datos de las hojas a texto.
- `sendDataToApp(sheetContent, apiUrl)`: Envía datos a la API.
- `listSheetNames()`: Lista las hojas disponibles en caso de error.

## Requisitos
- Google Spreadsheet con las hojas `Disponibilidad`, `Salon`, `{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}`, `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}`, `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` y `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`.
- Acceso al calendario de Google configurado en `CALENDAR_ID`.
- Permisos para ejecutar Google Apps Script y conectar con las APIs externas.

## Uso
1. Configura el script en un proyecto de Google Apps Script asociado a tu Google Spreadsheet.
2. Reemplaza las constantes `{REEMPLAZAR_POR_*}` con los valores correspondientes (IDs de APIs, token, nombres de hojas, ID del calendario).
3. Asegúrate de que las hojas y el calendario estén configurados.
4. El script se ejecuta automáticamente al actualizar el calendario o al editar las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_FECHAS_SALON}`.

## Notas
- Si las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_CONSULTAS}` o `{REEMPLAZAR_POR_NOMBRE_HOJA_SALON}` no existen, el script registra un error y lista las hojas disponibles.
- Los errores durante el envío a las APIs se registran en el log de Google Apps Script.

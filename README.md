# sheets_google_calendar
## README - Script de Gestión de Disponibilidad

### ¡IMPORTANTE!
Para que el script funcione correctamente, es necesario lo siguiente:

#### Activadores de Google Apps Script:
- **Desde la hoja de cálculo - Al modificar**: Activa la función `onChange` cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`. Esto envía el contenido de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` al campo de bot en la API.
- **Calendario - Modificado**: Activa la función `alActualizarCalendario` cuando se modifica el calendario configurado en `CALENDAR_ID`. Esto actualiza la hoja `Disponibilidad`.

#### Hojas:
- **Disponibilidad**: Almacena fechas, franjas horarias y estado (Disponible/Ocupado).
- **`{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}`**: Contiene los datos enviados a la API. Debe tener el siguiente formato:
  - **Encabezados (A1:B1)**: Franja horaria, Disponibilidad.
  - **Celda A2**: Contiene la siguiente fórmula `ARRAYFORMULA` para filtrar horarios disponibles según el rango de fechas:
    ```excel
    =ARRAYFORMULA(
      QUERY(
        {
          FILTER(
            TEXTO(Disponibilidad!A2:A, "yyyy-mm-dd") & " " & Disponibilidad!B2:B,
            (TO_PURE_NUMBER(Disponibilidad!A2:A) + HORANUMERO(IZQUIERDA(Disponibilidad!B2:B,5)) >= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(HOJA_DE_FECHA!$A$2,10))) + HORANUMERO(EXTRAE(HOJA_DE_FECHA!$A$2,12,5))) *
            (TO_PURE_NUMBER(Disponibilidad!A2:A) + HORANUMERO(DERECHA(Disponibilidad!B2:B,5)) <= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(HOJA_DE_FECHA!$B$2,10))) + HORANUMERO(EXTRAE(HOJA_DE_FECHA!$B$2,12,5)))
          ),
          FILTER(
            Disponibilidad!C2:C,
            (TO_PURE_NUMBER(Disponibilidad!A2:A) + HORANUMERO(IZQUIERDA(Disponibilidad!B2:B,5)) >= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(HOJA_DE_FECHA!$A$2,10))) + HORANUMERO(EXTRAE(HOJA_DE_FECHA!$A$2,12,5))) *
            (TO_PURE_NUMBER(Disponibilidad!A2:A) + HORANUMERO(DERECHA(Disponibilidad!B2:B,5)) <= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(HOJA_DE_FECHA!$B$2,10))) + HORANUMERO(EXTRAE(HOJA_DE_FECHA!$B$2,12,5)))
          )
        },
        "Select Col1, Col2"
      )
    )
    ```
- **`{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`**: Activa el envío de datos al editarse. Debe tener el siguiente formato:
  - **Encabezados (A1:B1)**: fecha inicial, fecha final.
  - **Fila 2 (A2:B2)**: Fechas en formato ISO cargadas desde Runamatic como campos de fecha y hora, por ejemplo:
    - A2: `2025-09-13T00:00:00-03:00`
    - B2: `2025-09-13T23:59:00-03:00`

### Funcionalidad

#### Generación de Horarios Disponibles:
- Lee eventos del calendario de Google configurado en `CALENDAR_ID` (generalmente el correo del calendario).
- Genera horarios en franjas predefinidas (configuradas en la constante `FRANJAS_HORARIAS`, por defecto: 12:00-14:30, 15:00-17:30, 18:00-20:30, 21:00-23:30) para los próximos días definidos en la constante `DIAS_FUTUROS` (por defecto: 119 días).
- Marca cada franja como "Disponible" u "Ocupado" según los eventos del calendario.
- Guarda los resultados en la hoja `Disponibilidad`.

#### Sincronización con API:
- Cuando se edita la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`, envía los datos de la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` a la API configurada en `API_URL`.
- Los datos se envían en formato texto, autenticados con el token `{REEMPLAZAR_POR_RUNAMATIC_API_KEY}`.

#### Automatización:
- Se ejecuta automáticamente al actualizar el calendario (`alActualizarCalendario`) o al editar la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}` (`onChange`).

### Configuración

#### Constantes globales:
- `API_URL`: URL de la API (`https://app.runamatic.io/api/accounts/bot_fields/{REEMPLAZAR_POR_ID_CAMPO_BOT}`).
- `ACCESS_TOKEN`: Token para autenticar la API (`{REEMPLAZAR_POR_RUNAMATIC_API_KEY}`).
- `SHEET_NAME_CONSULTA`: Hola con los datos enviados (`{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}`).
- `WATCH_SHEET_FECHAS`: Hoja que activa el envío (`{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`).
- `CALENDAR_ID`: ID del calendario de Google, generalmente el correo del calendario (`{REEMPLAZAR_POR_ID_DEL_CALENDARIO}`).
- `DIAS_FUTUROS`: Número de días hacia el futuro para generar horarios (por defecto: 119).
- `FRANJAS_HORARIAS`: Lista de franjas horarias predefinidas (por defecto: `[{inicio: "12:00", fin: "14:30"}, {inicio: "15:00", fin: "17:30"}, {inicio: "18:00", fin: "20:30"}, {inicio: "21:00", fin: "23:30"}]`).

#### Funciones Principales:
- `alActualizarCalendario()`: Ejecuta la generación de horarios disponibles.
- `regenerarHorariosDisponibles()`: Genera horarios en la hoja `Disponibilidad`.
- `onChange(e)`: Detecta cambios en `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}` y envía datos de `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` a la API.
- `convertToText(data)`: Convierte datos de la hoja a texto.
- `sendDataToApp(sheetContent, apiUrl)`: Envía datos a la API.
- `listSheetNames()`: Lista las hojas disponibles en caso de error.

### Requisitos
- Google Spreadsheet con las hojas `Disponibilidad`, `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` y `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`.
- Acceso al calendario de Google configurado en `CALENDAR_ID`.
- Permisos para ejecutar Google Apps Script y conectar con la API externa.

### Uso
1. Configura el script en un proyecto de Google Apps Script asociado a tu Google Spreadsheet.
2. Reemplaza las constantes `{REEMPLAZAR_POR_*}` con los valores correspondientes (ID de la API, token, nombres de hojas, ID del calendario).
3. Configura las hojas `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` y `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}` con los formatos indicados.
4. Opcionalmente, ajusta las constantes `DIAS_FUTUROS` y `FRANJAS_HORARIAS` en el script para personalizar el rango de días y las franjas horarias.
5. Configura los activadores en Google Apps Script:
   - **Desde la hoja de cálculo - Al modificar**: Para la función `onChange`.
   - **Calendario - Modificado**: Para la función `alActualizarCalendario`.
6. El script se ejecuta automáticamente al actualizar el calendario o al editar la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}`.

### Notas
- Si la hoja `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` no existe, el script registra un error y lista las hojas disponibles.
- Los errores durante el envío a la API se registran en el log de Google Apps Script.
- Asegúrate de que la fórmula en `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_CONSULTA}` y las fechas en `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}` estén correctamente configuradas para evitar errores.
- Los datos en `{REEMPLAZAR_POR_NOMBRE_HOJA_DE_FECHA}` deben provenir de Runamatic como campos de fecha y hora en formato ISO.

---
# README - Script de Gestión de Doble Disponibilidad

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

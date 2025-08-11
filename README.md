# Booking Script

Script en **Google Apps Script** para gestionar reservas y disponibilidad en Google Calendar, integrado con Google Sheets y una API externa.

## Características
- Genera franjas horarias disponibles desde un calendario.
- Procesa reservas desde la hoja `Booking`, validando datos.
- Mueve reservas a `Booked` y actualiza el calendario.
- Envía disponibilidad a una API externa.
- Registra errores en la hoja `Errors` y envía notificaciones por correo.

## Configuración

### 1. Configura placeholders en `script.js`
- `API_URL`: URL de tu API.
- `ACCESS_TOKEN`: Token de acceso.
- `CALENDAR_ID`: ID del calendario (ej: `your.email@domain.com`).
- `TIME_ZONE`: Zona horaria (ej: `America/Santiago`).
- `UBICACION_EVENTO`: Dirección del evento (ej: `123 Main St, City`).

### 2. Personaliza horarios
<details>
<summary>Ver código</summary>

```javascript
const HORARIOS = {
  weekdays: { inicio: '09:00', fin: '17:00' },
  saturday: { inicio: '09:00', fin: '13:00' }
};
```
</details>

### 3. Define servicios y subtipos
<details>
<summary>Ver código</summary>

```javascript
subtipos: ['Consultation', 'Evaluation', 'Follow-up'] // Ajusta según tu necesidad
```
</details>

### 4. Configura encabezados de la hoja `Booking`
<details>
<summary>Ver código</summary>

```javascript
['First Name', 'Last Name', 'Email', 'Phone Number', 'ID', 'Service Type', 'Duration', 'Booking Date', 'Booking Time']
```
</details>

> **Importante:** `Service Type` debe coincidir con un servicio o subtipo de Assessment.

### 5. Configura la hoja `Consultation_Dates`
Pega en **A2** la siguiente fórmula:

<details>
<summary>Ver fórmula</summary>

```excel
=ARRAYFORMULA(
  QUERY(
    {
      FILTER(
        TEXTO(INDIRECTO("'"&Consultation_Dates!C2&"'!A2:A"), "yyyy-mm-dd") & " " & INDIRECTO("'"&Consultation_Dates!C2&"'!B2:B"),
        (TO_PURE_NUMBER(INDIRECTO("'"&Consultation_Dates!C2&"'!A2:A")) + HORANUMERO(IZQUIERDA(INDIRECTO("'"&Consultation_Dates!C2&"'!B2:B"),5)) >= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(Consultation_Dates!$A$2,10))) + HORANUMERO(EXTRAE(Consultation_Dates!$A$2,12,5))) *
        (TO_PURE_NUMBER(INDIRECTO("'"&Consultation_Dates!C2&"'!A2:A")) + HORANUMERO(DERECHA(INDIRECTO("'"&Consultation_Dates!C2&"'!B2:B"),5)) <= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(Consultation_Dates!$B$2,10))) + HORANUMERO(EXTRAE(Consultation_Dates!$B$2,12,5)))
      ),
      FILTER(
        INDIRECTO("'"&Consultation_Dates!C2&"'!C2:C"),
        (TO_PURE_NUMBER(INDIRECTO("'"&Consultation_Dates!C2&"'!A2:A")) + HORANUMERO(IZQUIERDA(INDIRECTO("'"&Consultation_Dates!C2&"'!B2:B"),5)) >= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(Consultation_Dates!$A$2,10))) + HORANUMERO(EXTRAE(Consultation_Dates!$A$2,12,5))) *
        (TO_PURE_NUMBER(INDIRECTO("'"&Consultation_Dates!C2&"'!A2:A")) + HORANUMERO(DERECHA(INDIRECTO("'"&Consultation_Dates!C2&"'!B2:B"),5)) <= TO_PURE_NUMBER(FECHANUMERO(IZQUIERDA(Consultation_Dates!$B$2,10))) + HORANUMERO(EXTRAE(Consultation_Dates!$B$2,12,5)))
      )
    },
    "Select Col1, Col2"
  )
)
```
</details>

**Importante:**  
- `C2`: nombre de la hoja de disponibilidad (ej: `Availability_15min`).  
- `A2` y `B2`: rango de fechas y horas (`dd-mm-yyyy hh:mm`).  
- La hoja de disponibilidad debe tener columnas: `Date`, `Time Slot`, `Availability`.

### 6. Autoriza permisos
Ejecuta el script una vez para permitir acceso a Google Calendar, Sheets y MailApp.

### 7. Configura activadores

#### **alActualizarCalendario**
- **Importancia:** Sincroniza calendario con hojas de disponibilidad.
- **Configuración:**  
  1. En el editor de Apps Script, ve a **Activadores**.  
  2. Crear activador para `alActualizarCalendario`.  
  3. Tipo: `Desde el calendario` → `En actualización del calendario`.  
  4. Usa `CALENDAR_ID`.

#### **onChange**
- **Importancia:** Procesa reservas y envía datos a la API.
- **Configuración:**  
  1. En **Activadores**, crear para `onChange`.  
  2. Tipo: `Desde la hoja de cálculo` → `En cambio`.

---

## Uso

1. **Pegar script:**  
   Desde Google Sheets → Extensiones → Apps Script → pegar `script.js`.

2. **Configurar Google Sheet:**  
   - Hoja `Booking` con encabezados `RESERVA_HEADERS`.  
   - Hoja `Consultation_Dates` con fórmula en A2.

3. **Formato de reservas:**
   - `Booking Date`: `dd-mm-yyyy` (ej: `15-08-2025`).  
   - `Booking Time`: `hh-mm am/pm` (ej: `09-30 am`).  
   - `Service Type`: servicio o subtipo.  
   - `Duration`: nombre del servicio (ej: `15 minutes`).

4. **Pruebas:**
   - Ejecutar `alActualizarCalendario` manualmente para inicializar.  
   - Agregar evento en calendario y verificar actualización en disponibilidad.  
   - Añadir reserva en `Booking` y confirmar creación en calendario y movimiento a `Booked`.  
   - Modificar `A2`, `B2` o `C2` en `Consultation_Dates` y verificar envío a API.

---

## Solución de problemas
- **Calendario no se actualiza:** Revisar `CALENDAR_ID` y activador `alActualizarCalendario`.
- **Reservas no procesadas:** Revisar activador `onChange` y encabezados de `Booking`.
- **Error en API:** Verificar `API_URL` y `ACCESS_TOKEN`.
- **Fórmula no funciona:** Revisar `C2`, formato de `A2`/`B2` y datos de disponibilidad.

---

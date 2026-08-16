# Historias de Usuario — iHelp Médica

> Requisitos funcionales del sistema expresados desde la perspectiva de cada actor.
> Formato: **Como** [actor] **quiero** [acción] **para** [beneficio].

---

## Actores del sistema

| Actor | Rol | Acceso |
|---|---|---|
| **Paciente** | Usuario externo | Formularios públicos, portal de docs |
| **Vendedor** | Referidor externo | Portal OTP — solo lectura |
| **Agente** | Call center interno | Leads asignados + nuevos sin asignar |
| **Supervisor** | Coordinación | Todos los leads + reportes |
| **Admin** | Dueño del sistema | Configuración total |

---

## 1. Paciente / Lead

### Captura inicial

- **HU-P01** — Como paciente, quiero llenar un formulario desde el celular escaneando un QR, para solicitar asesoría sobre mi cirugía sin necesidad de llamar.
- **HU-P02** — Como paciente, quiero recibir un número de folio al enviar mi solicitud, para saber que mi información fue registrada correctamente.
- **HU-P03** — Como paciente, quiero poder acceder al formulario desde el link que me compartió un amigo por WhatsApp, para que la persona que me refirió reciba su comisión.
- **HU-P04** — Como paciente de una empresa con convenio, quiero ver los servicios y descuentos disponibles antes de llenar el formulario, para decidir si me conviene.

### Subida de documentos

- **HU-P05** — Como paciente, quiero subir fotos de mis estudios médicos desde mi celular con el link que me mandaron, para no tener que ir a la clínica solo a entregar papeles.
- **HU-P06** — Como paciente, quiero saber qué documentos me están pidiendo y cuáles ya subí, para no olvidar nada.
- **HU-P07** — Como paciente, quiero que el link para subir documentos expire después de usarlo, para que nadie más pueda acceder a mis datos médicos.

---

## 2. Vendedor

### Dashboard personal

- **HU-V01** — Como vendedor, quiero ver cuántos leads he traído en total y cuántos se han convertido, para saber si mi trabajo está dando resultados.
- **HU-V02** — Como vendedor, quiero ver el estado actual de cada lead que referí, para hacer seguimiento con mis contactos sin tener que preguntar al equipo.
- **HU-V03** — Como vendedor, quiero ver mis comisiones pendientes, aprobadas y pagadas, para saber cuánto dinero espero recibir.
- **HU-V04** — Como vendedor, quiero entrar al portal solo con mi número de teléfono y un código por WhatsApp, para no tener que recordar una contraseña.

### Material de captación

- **HU-V05** — Como vendedor, quiero descargar mi QR personalizado, para compartirlo en mis redes sociales y grupos de WhatsApp.
- **HU-V06** — Como vendedor, quiero tener un link único con mi código, para poder compartirlo en mensajes de texto sin necesidad del QR.

---

## 3. Agente de Call Center

### Gestión de leads

- **HU-A01** — Como agente, quiero ver la lista de leads nuevos sin asignar, para tomarlos y empezar a trabajarlos.
- **HU-A02** — Como agente, quiero ver el detalle completo de un lead (datos del paciente, seguro, procedimiento) en una sola pantalla, para no tener que buscar información en varios lugares.
- **HU-A03** — Como agente, quiero actualizar la etapa del lead con un clic, para que el pipeline refleje el avance real en tiempo real.
- **HU-A04** — Como agente, quiero registrar notas de cada interacción con el paciente, para que cualquier compañero que tome el lead sepa el historial.
- **HU-A05** — Como agente, quiero buscar un lead por nombre, teléfono o folio, para encontrarlo rápido sin recorrer toda la lista.

### Validación de seguro

- **HU-A06** — Como agente, quiero capturar los datos de la póliza GMM del paciente (aseguradora, número de póliza, vigencia, deducible), para poder iniciar el trámite con la aseguradora.
- **HU-A07** — Como agente, quiero marcar qué coberturas incluye el seguro (anestesiólogo, hospitalización, estudios), para tener clara la viabilidad antes de continuar.
- **HU-A08** — Como agente, quiero subir la carta de autorización de la aseguradora directamente desde el sistema, para que quede adjunta al expediente del lead.
- **HU-A09** — Como agente, quiero registrar el número de autorización cuando la aseguradora aprueba, para que el lead pase automáticamente a etapa "Viable".

### Atención desde celular

- **HU-A10** — Como agente en campo, quiero que la lista de leads se muestre como tarjetas en mi celular, para poder revisar y actualizar leads sin necesitar una computadora.
- **HU-A11** — Como agente, quiero filtrar mis leads por etapa o prioridad, para concentrarme en los más urgentes primero.

---

## 4. Supervisor

### Visibilidad del equipo

- **HU-S01** — Como supervisor, quiero ver todos los leads del equipo con filtros por agente, etapa y fecha, para identificar cuellos de botella en el pipeline.
- **HU-S02** — Como supervisor, quiero ver métricas de conversión por agente (leads trabajados, convertidos, tiempo promedio por etapa), para identificar quién necesita apoyo.
- **HU-S03** — Como supervisor, quiero reasignar un lead de un agente a otro, para balancear la carga de trabajo.
- **HU-S04** — Como supervisor, quiero ver el volumen de leads por fuente (QR, WhatsApp, formulario, convenio), para saber qué canal funciona mejor.

### Seguimiento de conversiones

- **HU-S05** — Como supervisor, quiero ver qué leads están en validación por más de 72 horas, para hacer seguimiento con la aseguradora y no perder la oportunidad.
- **HU-S06** — Como supervisor, quiero exportar un reporte de comisiones por vendedor del mes, para procesar los pagos fuera del sistema.

---

## 5. Administrador

### Gestión de usuarios

- **HU-AD01** — Como admin, quiero crear, editar y desactivar usuarios del sistema (agentes, supervisores), para controlar quién tiene acceso.
- **HU-AD02** — Como admin, quiero crear vendedores con su código único y nivel de comisión asignado, para que puedan empezar a referir leads.
- **HU-AD03** — Como admin, quiero cambiar el nivel de comisión de un vendedor, para reflejar cambios en su desempeño o acuerdo comercial.
- **HU-AD04** — Como admin, quiero desactivar un vendedor, para que su código ya no sea válido sin perder el historial de leads que trajo.

### Configuración de comisiones

- **HU-AD05** — Como admin, quiero definir los niveles de comisión con nombre y monto fijo (ej: Estándar = $500, Premium = $800), para que el sistema calcule automáticamente al convertir un lead.
- **HU-AD06** — Como admin, quiero aprobar comisiones generadas antes de marcarlas como pagadas, para revisar que todo esté correcto antes de procesar el pago.
- **HU-AD07** — Como admin, quiero marcar una comisión como pagada, para que el vendedor vea su estatus actualizado en su portal.

### Convenios empresariales

- **HU-AD08** — Como admin, quiero crear una landing personalizada para cada empresa con convenio (logo, descripción, servicios y precios), para que los empleados de esa empresa lleguen a una página específica.
- **HU-AD09** — Como admin, quiero generar el QR y link de la landing de cada empresa, para distribuirlo a los ejecutivos de cuenta.
- **HU-AD10** — Como admin, quiero definir qué campos extra pide el formulario de cada empresa (número de empleado, departamento, etc.), para capturar la información que cada empresa necesita.
- **HU-AD11** — Como admin, quiero subir el logo de la empresa al portal, para que la landing se vea personalizada.

### Catálogos del sistema

- **HU-AD12** — Como admin, quiero mantener el catálogo de procedimientos quirúrgicos con códigos CIE-9/CPT, para que los agentes puedan seleccionar el correcto en cada lead.
- **HU-AD13** — Como admin, quiero mantener el catálogo de aseguradoras con sus datos de contacto y proceso de autorización, para que los agentes tengan la información a la mano.
- **HU-AD14** — Como admin, quiero mantener el catálogo de médicos con su especialidad, hospital y aseguradoras que acepta, para poder asignar el médico correcto en la etapa de programación.

### Bot de WhatsApp

- **HU-AD15** — Como admin, quiero configurar las plantillas de mensajes del bot, para personalizar la comunicación según la campaña activa.
- **HU-AD16** — Como admin, quiero ver los leads que llegaron por WhatsApp en cola de revisión, para que los agentes los confirmen antes de procesarlos como leads reales.

---

## 6. Sistema (comportamientos automáticos)

- **HU-SYS01** — Como sistema, cuando un lead llega vía bot de WhatsApp, debo crear el lead en estado `en_cola_revision = true` para que un agente lo confirme antes de procesarlo.
- **HU-SYS02** — Como sistema, cuando un lead pasa a etapa `ganado`, debo crear automáticamente un registro de comisión con el monto del nivel actual del vendedor.
- **HU-SYS03** — Como sistema, cuando se recibe un mensaje de WhatsApp, debo validar la firma HMAC-SHA256 de Meta antes de procesar cualquier dato.
- **HU-SYS04** — Como sistema, debo registrar en `audit_log` cualquier acción relevante (creación, actualización de etapa, acceso a carta de autorización, aprobación de comisión).
- **HU-SYS05** — Como sistema, cuando alguien accede a una URL firmada de carta de autorización, debo registrar el acceso con IP, timestamp y usuario, para cumplir con el audit trail médico.
- **HU-SYS06** — Como sistema, debo rechazar solicitudes de formularios públicos que superen 5 envíos por IP en 10 minutos, para proteger contra spam automatizado.
- **HU-SYS07** — Como sistema, cuando el código de referido del URL no corresponde a ningún vendedor activo, debo registrar el lead igualmente pero sin atribuirlo a ningún vendedor.

---

## Matriz actor / historia

| Historia | Paciente | Vendedor | Agente | Supervisor | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Captura con QR | ✅ | | | | |
| Portal vendedor | | ✅ | | | |
| Pipeline de leads | | | ✅ | ✅ | ✅ |
| Validación de seguro | | | ✅ | ✅ | |
| Subida de documentos | ✅ | | ✅ | | |
| Reportes y métricas | | | | ✅ | ✅ |
| Gestión de comisiones | | ✅ | | ✅ | ✅ |
| Convenios empresariales | ✅ | | | | ✅ |
| Config del sistema | | | | | ✅ |
| Bot WhatsApp | ✅ | | | | ✅ |

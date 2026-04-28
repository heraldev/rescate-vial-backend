const solicitudRegistradaTemplate = (nombre) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Solicitud registrada con éxito</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu solicitud fue registrada correctamente.</p>
      <p>En cuanto sea revisada, recibirás otro correo indicando si fue aprobada o rechazada.</p>
      <p>Gracias por registrarte en Rescate Vial.</p>
    </div>
  `;
};

const solicitudRechazadaTemplate = (nombre, motivo) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Solicitud rechazada</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Lamentamos informarte que tu solicitud fue rechazada.</p>
      <p><strong>Motivo:</strong> ${motivo || 'No se especificó un motivo.'}</p>
      <p>Si lo deseas, puedes volver a intentarlo corrigiendo la información.</p>
    </div>
  `;
};

const solicitudAprobadaTemplate = (nombre, linkCrearPassword) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Solicitud aprobada</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Tu solicitud fue aprobada correctamente.</p>
      <p>Para activar tu acceso, crea tu contraseña en el siguiente enlace:</p>
      <p>
        <a href="${linkCrearPassword}" 
           style="display:inline-block; padding:10px 18px; background:#0d6efd; color:#fff; text-decoration:none; border-radius:6px;">
           Crear contraseña
        </a>
      </p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p>${linkCrearPassword}</p>
    </div>
  `;
};

module.exports = {
  solicitudRegistradaTemplate,
  solicitudRechazadaTemplate,
  solicitudAprobadaTemplate
};
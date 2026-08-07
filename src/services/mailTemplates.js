const LOGO_URL = "https://URL_DEL_LOGO_AQUI.png"; 

// Estilo base compartido para mantener consistencia visual
const baseTemplate = (contenidoHeader, cuerpoHtml) => `
  <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; line-height: 1.6;">
    <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      
      <div style="background-color: #09090b; padding: 24px; text-align: center;">
        <img src="${LOGO_URL}" alt="Rescate Vial" style="height: 40px; margin-bottom: 12px; display: inline-block;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">${contenidoHeader}</h2>
      </div>

      <div style="padding: 32px 24px;">
        ${cuerpoHtml}
      </div>

      <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #e4e4e7;">
        <p style="margin: 0; font-size: 12px; color: #71717a;">Este es un mensaje automático de Rescate Vial. Por favor no respondas a este correo.</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa;">&copy; 2026 Harvey Solutions. Todos los derechos reservados.</p>
      </div>

    </div>
  </div>
`;

const solicitudRegistradaTemplate = (nombre) => {
  const header = "¡Recibimos tu solicitud!";
  const cuerpo = `
    <p style="font-size: 16px; margin-top: 0;">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size: 15px; color: #3f3f46;">Queremos agradecerte el interés en formar parte de nuestra red de asistencia en el camino. Tu solicitud de registro para el taller ha sido ingresada correctamente.</p>
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #1e3a8a; font-weight: 500;">⚡ Siguiente paso:</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e40af;">Nuestro equipo revisara los datos provistos en un lapso no mayor a 48 horas hábiles. Te enviaremos una notificación en cuanto se tome una resolución.</p>
    </div>
    <p style="font-size: 15px; color: #3f3f46; margin-bottom: 0;">Gracias por confiar en <strong>Rescate Vial</strong>.</p>
  `;
  return baseTemplate(header, cuerpo);
};

const solicitudAprobadaTemplate = (nombre, linkCrearPassword) => {
  const header = "🎉 ¡Felicidades! Solicitud Aprobada";
  const cuerpo = `
    <p style="font-size: 16px; margin-top: 0;">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size: 15px; color: #3f3f46;">¡Nos complace darte la bienvenida! Tu perfil ha sido revisado y <strong>has sido aprobado oficialmente para trabajar en nuestra plataforma</strong> de auxilio vial.</p>
    <p style="font-size: 15px; color: #3f3f46;">A partir de este momento, conductores podrán localizar tu taller para recibir servicios mecánicos y soporte.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <p style="font-size: 14px; color: #71717a; margin-bottom: 12px;">Para activar tu cuenta y acceder al panel, por favor define tu contraseña</p>
      <a href="${linkCrearPassword}" 
         style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
         Establecer Contraseña
      </a>
    </div>

    <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">Si el botón no funciona, copia y pega este enlace seguro en tu navegador:<br>
    <a href="${linkCrearPassword}" style="color: #2563eb; word-break: break-all;">${linkCrearPassword}</a></p>
  `;
  return baseTemplate(header, cuerpo);
};

const solicitudRechazadaTemplate = (nombre, motivo) => {
  const header = "Actualización sobre tu solicitud";
  const cuerpo = `
    <p style="font-size: 16px; margin-top: 0;">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size: 15px; color: #3f3f46;">Agradecemos profundamente el tiempo dedicado a registrar tu taller en nuestra plataforma. Lamentablemente, tras evaluar la información provista, **tu solicitud ha sido declinada en esta ocasión**.</p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; color: #7f1d1d; font-weight: 600;">Motivo de la resolución:</p>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #991b1b;">${motivo || 'Reservado'}</p>
    </div>

    <p style="font-size: 15px; color: #3f3f46;">¡No te desanimes! Sigue trabajando en la mejora de tu taller. Si consideras que esto fue un error o logras corregir los detalles mencionados, puedes volver a iniciar una solicitud en nuestro portal en cualquier momento.</p>
    <p style="font-size: 15px; color: #3f3f46; margin-bottom: 0;">Te deseamos el mayor de los éxitos.</p>
  `;
  return baseTemplate(header, cuerpo);
};

module.exports = {
  solicitudRegistradaTemplate,
  solicitudRechazadaTemplate,
  solicitudAprobadaTemplate
};
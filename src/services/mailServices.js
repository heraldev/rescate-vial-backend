const nodemailer = require('nodemailer');
const { solicitudRegistradaTemplate, solicitudRechazadaTemplate, solicitudAprobadaTemplate } = require('./mailTemplates');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const enviarCorreo = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"Rescate Vial" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });
};

const enviarSolicitudRegistrada = async ({ correo, nombre }) => {
  const html = solicitudRegistradaTemplate(nombre);

  return enviarCorreo({
    to: correo,
    subject: 'Tu solicitud ha sido recibida - Solicitud de Registro de taller',
    html
  });
};

const enviarSolicitudRechazada = async ({ correo, nombre, motivo }) => {
  const html = solicitudRechazadaTemplate(nombre, motivo);

  return enviarCorreo({
    to: correo,
    subject: 'Actualización de tu cuenta - Solicitud de Registro de taller',
    html
  });
};

const enviarSolicitudAprobada = async ({ correo, nombre, linkCrearPassword }) => {
  const html = solicitudAprobadaTemplate(nombre, linkCrearPassword);

  return enviarCorreo({
    to: correo,
    subject: '¡Felicidades! Has sido aprobado - Solicitud de Registro de taller',
    html
  });
};

module.exports = {
  enviarSolicitudRegistrada,
  enviarSolicitudRechazada,
  enviarSolicitudAprobada
};
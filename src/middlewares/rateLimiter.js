const rateLimit = require('express-rate-limit');

// Limitador general para el login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Bloqueo por un lapso de 15 minutos
    max: 15, // Máximo 15 intentos de login por IP por cada 15 min
    message: {
        ok: false,
        mensaje: 'Demasiados intentos de inicio de sesión de la misma direccion. Por favor, intente de nuevo en 15 min.'
    },
    standardHeaders: true, // Devuelve información del límite en los headers RateLimit-*
    legacyHeaders: false, // Desactiva los headers X-RateLimit-* antiguos
    
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

// Limitador general para el resto de la API (evita abuso de spam de clics en la app)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // Máximo 60 peticiones por minuto por IP
    message: {
        error: 'Demasiadas peticiones'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

module.exports = {
    loginLimiter,
    apiLimiter
};
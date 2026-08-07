const jwt = require('jsonwebtoken');
const { publicKeyEC } = require('../config/keys/keys.js');

const verificarToken = (req, res, next) => {
    // Busca el token en el header 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Corta el "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        // Verificar usando la llave pública y el algoritmo correcto
        const decoded = jwt.verify(token, publicKeyEC, { algorithms: ['ES256'] });
        
        // Inyectamos los datos decodificados en el objeto 'req' (req.user)
        req.user = decoded; 
        
        next(); // El token es real, se autoriza el acceso a la ruta
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

module.exports = { verificarToken };
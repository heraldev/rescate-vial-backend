const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: ['http://216.238.92.39','http://localhost:5173'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static('uploads'));

app.use('/api/provider', require('./routes/providersRoutes')); //ruta para listar marcas y modelos de autos
app.use('/api/keys', require('./routes/keysRoutes')); //ruta de las keys para cifrado RSA/EC
app.use('/api/auth', require('./routes/authRoutes')); //rutas para registro y login(publicas)
app.use('/api/user', require('./routes/userRoutes')); //rutas de usuarios
app.use('/api/taller', require('./routes/tallerRoutes')); //rutas para usuarios talleres
app.use('/api/admin', require('./routes/adminRoutes')); //rutas para admin


app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;


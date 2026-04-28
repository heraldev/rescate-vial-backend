const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:54198', 'http://localhost:3001','http://216.238.92.39'],
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando' });
});

app.use('/api/keys', require('./routes/keysRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/taller', require('./routes/tallerRoutes'));
app.use('/api/provider', require('./routes/providersRoutes'));
app.use('/api/config', require('./routes/configRoutes'));


app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;


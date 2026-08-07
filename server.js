require('dotenv').config();
const app = require('./src/app');
require('./src/config/mongo');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

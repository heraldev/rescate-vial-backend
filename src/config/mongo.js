const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGOAtlas;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 5000 
});

async function connectMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("❌ Error en MongoDB:", error.message);
  }
}

// Esto inicia la conexión en cuanto alguien haga 'require' de este archivo
connectMongo();

// EXPORTA EL CLIENTE, no la función
module.exports = client;
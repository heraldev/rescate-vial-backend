const axios = require('axios');
require('dotenv').config();
const vehicleModel = require('../models/mysql/providerModel');

//obtiene marcas de autos
const listBrands = async () => {
    return await vehicleModel.getVehicleBrands();
};

//obtiene modelos de autos por marca
const listModelsByBrand = async (id_brand) => {
    return await vehicleModel.getVehicleModelsByBrand(id_brand);
};

/* Actualmente no se usan estas funciones, pero se dejan comentadas por si se desea usar la api de NHTSA
// Api para obtener vehiculos NHTSA
const fetchBrandsNH = async () => {
  const response = await axios.get(
    'https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json'
  );
  return response.data.Results.map(b => b.Make_Name).sort();
};
const fetchModelsNH = async (make) => {
  const response = await axios.get(
    `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`
  );
  return response.data.Results.map(m => m.Model_Name).sort();
};

*/

module.exports = { listBrands, listModelsByBrand };
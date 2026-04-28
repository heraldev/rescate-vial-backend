const axios = require('axios');
require('dotenv').config();
const vehicleModel = require('../models/mysql/providerModel');

const listBrands = async () => {
    return await vehicleModel.getVehicleBrands();
};

const listModelsByBrand = async (id_brand) => {
    return await vehicleModel.getVehicleModelsByBrand(id_brand);
};


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

const listProviders = async () => {
  return await vehicleModel.getProviders();
};


module.exports = { listBrands, listModelsByBrand, listProviders };
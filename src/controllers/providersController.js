const providerService = require('../services/providerService');

//obtiene marcas de autos
const getBrands = async (req, res) => {
    try {
        const brands = await providerService.listBrands();
        res.status(200).json(brands);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener marcas", error: error.message });
    }
};

//obtiene modelos de autos por marca
const getModels = async (req, res) => {
    try {
        const { id_brand } = req.params;
        const models = await providerService.listModelsByBrand(id_brand);
        res.status(200).json(models);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener modelos", error: error.message });
    }
};

/* Actualmente no se usan estas funciones, pero se dejan comentadas por si se desea usar la api de NHTSA

// Api para obtener vehiculos NHTSA
const getBrandsNH = async (req, res) => {
  try {
    const brands = await authService.fetchBrands();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener marcas', error: error.message });
  }
};

const getModelsNH = async (req, res) => {
  try {
    const models = await authService.fetchModels(req.params.make);
    res.status(200).json(models);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener modelos', error: error.message });
  }
};

*/

module.exports = { getBrands, getModels };
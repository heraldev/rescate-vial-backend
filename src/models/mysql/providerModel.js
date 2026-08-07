const db = require('../../config/db');

exports.getVehicleBrands = async () => {
    const [rows] = await db.query('SELECT * FROM vehicle_brands ORDER BY brand_name ASC');
    return rows; // Retorna el array completo
};

exports.getVehicleModelsByBrand = async (id_brand) => {
    const [rows] = await db.query(
        'SELECT * FROM vehicle_models WHERE id_brand = ? ORDER BY model_name ASC',
        [id_brand]
    );
    return rows;
};

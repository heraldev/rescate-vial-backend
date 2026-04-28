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

exports.getProviders = async () => {
    const [rows] = await db.query(`
        SELECT
            ut.id_usertaller,
            ut.name_usertaller,
            ut.phone_taller,
            ut.schudel_usertaller,
            ut.onsiteservice_usertaller,
            ut.dateregister_usertaller,
            ut.status_taller,
            u.email_user,
            uta.municipio_addresstaller,
            uta.estado_addresstaller
        FROM UserTaller ut
        INNER JOIN Users u ON ut.id_user = u.id_user
        LEFT JOIN UserTallerAddress uta ON ut.id_usertaller = uta.id_usertaller
        ORDER BY ut.dateregister_usertaller DESC
    `);

    return rows;
};

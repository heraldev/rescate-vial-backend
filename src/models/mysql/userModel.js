const db = require('../../config/db');

// U1
exports.insertUserCar = async ({
  id_user,
  type_usercar,
  brand_usercar,
  model_usercar,
  year_usercar,
  mileage_usercar,
  colour_usercar,
}) => {
  const [result] = await db.query(
    `INSERT INTO UsersCars 
            (id_user, type_usercar, brand_usercar, model_usercar, year_usercar, mileage_usercar, colour_usercar)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id_user,
      type_usercar,
      brand_usercar,
      model_usercar,
      year_usercar,
      mileage_usercar,
      colour_usercar,
    ]
  );
  return result;
};

// U2
exports.getUserCarsByUser = async (id_user) => {
  const [rows] = await db.query(
    `SELECT id_usercar, type_usercar, brand_usercar, model_usercar, 
                year_usercar, colour_usercar
         FROM UsersCars 
         WHERE id_user = ?
         ORDER BY id_usercar DESC`,
    [id_user]
  );
  return rows;
};

// U3
exports.getCarById = async (id_usercar) => {
  const [rows] = await db.query(
    `SELECT 
        c.id_usercar,
        c.id_user,
        c.type_usercar,
        c.brand_usercar,
        c.model_usercar,
        c.year_usercar,
        c.mileage_usercar AS initial_mileage,
        COALESCE(m.value_mileage, c.mileage_usercar) AS current_mileage,
        m.daterecorded_mileage AS last_mileage_update,
        c.colour_usercar
     FROM UsersCars c
     LEFT JOIN (
        SELECT id_usercar, value_mileage, daterecorded_mileage
        FROM MileageLog
        WHERE (id_usercar, daterecorded_mileage) IN (
            SELECT id_usercar, MAX(daterecorded_mileage)
            FROM MileageLog
            GROUP BY id_usercar
        )
     ) m ON c.id_usercar = m.id_usercar
     WHERE c.id_usercar = ?`,
    [id_usercar]
  );
  return rows[0] ?? null;
};

// U7
exports.getTallerByIdUser = async (id_user) => {
  const [rows] = await db.query(
    `SELECT 
      ut.id_usertaller,
      ut.id_user,
      ut.name_usertaller,
      ut.schudel_usertaller,
      ut.phone_taller,
      uta.latitud,
      uta.longitud
     FROM UserTaller ut
     LEFT JOIN UserTallerAddress uta ON uta.id_usertaller = ut.id_usertaller
     WHERE ut.id_user = ?
     LIMIT 1`,
    [id_user]
  );
  return rows[0] ?? null;
};

// U10
exports.getMisCalificaciones = async (id_user) => {
  const [rows] = await db.query(`
    SELECT
      sh.id_history,
      sh.id_service,
      sh.id_user,
      sh.issue_type,
      sh.description_service,
      sh.fecha_solicitud,
      sh.service_status,

      ut.id_usertaller,
      ut.name_usertaller,
      ut.phone_taller,

      uc.id_usercar,
      uc.brand_usercar,
      uc.model_usercar,
      uc.year_usercar,

      r.id_rating,
      r.score_rating,
      r.comentario,
      r.date_rating

    FROM ServiceHistory sh
    INNER JOIN UserTaller ut
      ON sh.id_usertaller = ut.id_usertaller
    INNER JOIN UsersCars uc
      ON sh.id_usercar = uc.id_usercar
    INNER JOIN ratings r
      ON r.id_service = sh.id_service
      AND r.id_user = sh.id_user

    WHERE sh.id_user = ?
      AND sh.service_status = 'completed'

    ORDER BY sh.fecha_solicitud DESC, r.date_rating DESC
  `, [id_user]);

  return rows;
};


// BITACORA

// Obtener el último kilometraje (para calcular la diferencia)
exports.getLatestMileage = async (id_usercar) => {
  const [rows] = await db.query(
    `SELECT value_mileage, start_mileage 
     FROM MileageLog 
     WHERE id_usercar = ? 
     ORDER BY daterecorded_mileage DESC 
     LIMIT 1`,
    [id_usercar]
  );
  return rows[0] ?? null;
};

// Insertar nuevo registro en MileageLog
exports.addMileageLog = async ({ id_usercar, start_mileage, value_mileage, diff_mileage }) => {
  const [result] = await db.query(
    `INSERT INTO MileageLog (id_usercar, start_mileage, value_mileage, diff_mileage)
     VALUES (?, ?, ?, ?)`,
    [id_usercar, start_mileage, value_mileage, diff_mileage]
  );
  return result;
};

exports.getTiposServicio = async () => { //carga los tipos de servicios
  const [rows] = await db.query(
    `SELECT 
      id_tipo_servicio, 
      nombre 
     FROM tipo_servicio_bitacora 
     WHERE activo = 1 
     ORDER BY id_tipo_servicio ASC`
  );
  return rows;
};

//crea un nuevo registro en la bitacora
exports.crearRegistro = async (data) => {
  const {
    id_user,
    id_usercar,
    id_tipo_servicio,
    descripcion,
    pieza_cambiada,
    taller,
    costo_piezas,
    costo_mano_obra,
    kilometraje,
    fecha_servicio,
  } = data;

  const query = `
    INSERT INTO bitacora 
      (id_user, id_usercar, id_tipo_servicio, descripcion, pieza_cambiada, taller, costo_piezas, costo_mano_obra, kilometraje, fecha_servicio) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_user,
    id_usercar,
    id_tipo_servicio,
    descripcion,
    pieza_cambiada || null,
    taller || null,
    costo_piezas || 0.00,
    costo_mano_obra || 0.00,
    kilometraje,
    fecha_servicio,
  ];

  const [result] = await db.query(query, values);
  return result;
};

exports.obtenerBitacoraPorAutoYServicio = async (id_usercar, id_tipo_servicio) => {
  const query = `
    SELECT 
      b.id,
      b.id_user,
      b.id_usercar,
      b.id_tipo_servicio,
      ts.nombre AS nombre_tipo_servicio,
      b.descripcion,
      b.pieza_cambiada,
      b.taller,
      b.costo_piezas,
      b.costo_mano_obra,
      (b.costo_piezas + b.costo_mano_obra) AS costo_total,
      b.kilometraje,
      b.fecha_servicio,
      b.created_at
    FROM bitacora b
    INNER JOIN tipo_servicio_bitacora ts ON b.id_tipo_servicio = ts.id_tipo_servicio
    WHERE b.id_usercar = ? AND b.id_tipo_servicio = ?
    ORDER BY b.fecha_servicio DESC, b.created_at DESC
  `;

  const [rows] = await db.query(query, [id_usercar, id_tipo_servicio]);
  return rows;
};









// U11
exports.getMaintenanceCarData = async (id_user, id_usercar) => {
  const [rows] = await db.query(`
    SELECT
      uc.id_usercar,
      uc.id_user,
      uc.type_usercar,
      uc.brand_usercar,
      uc.model_usercar,
      uc.year_usercar,
      uc.mileage_usercar,
      uc.colour_usercar,
      ml.start_mileage,
      ml.value_mileage,
      ml.diff_mileage,
      ml.daterecorded_mileage
    FROM UsersCars uc
    LEFT JOIN MileageLog ml
      ON uc.id_usercar = ml.id_usercar
    WHERE uc.id_user = ?
      AND uc.id_usercar = ?
    ORDER BY ml.daterecorded_mileage ASC
    LIMIT 1
  `, [id_user, id_usercar]);

  if (rows.length === 0) return null;
  return rows[0];
};

//neuorona
exports.runMaintenanceNeuron = async ({
  typeUsercar,
  brand,
  model,
  year,
  mileageBase,
  startMileage,
  currentMileage,
  diffMileage,
}) => {
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  const normalize = (value, min, max) => {
    if (max === min) return 0;
    const n = (value - min) / (max - min);
    return Math.max(0, Math.min(1, n));
  };

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(0, currentYear - Number(year || currentYear));

  const baseMileage = Number(mileageBase || 0);

  // Ajuste por tipo de vehículo
  let typeFactor = 0;
  if (typeUsercar === 'SUV') typeFactor = 0.15;
  if (typeUsercar === 'Pickup') typeFactor = 0.20;
  if (typeUsercar === 'Hatchback') typeFactor = 0.08;

  // ACEITE
  const oilKm = normalize(diffMileage, 0, 15000);
  const oilAge = normalize(ageYears, 0, 20);
  const oilUsage = normalize(baseMileage, 0, 200000);
  const oilZ = (2.5 * oilKm) + (0.5 * oilAge) + (0.4 * oilUsage) + typeFactor - 1.5;
  const oilScore = sigmoid(oilZ);

  // LLANTAS
  const tireKm = normalize(diffMileage, 0, 60000);
  const tireAge = normalize(ageYears, 0, 20);
  const tireUsage = normalize(baseMileage, 0, 250000);
  const tireZ = (2.0 * tireKm) + (0.8 * tireAge) + (0.5 * tireUsage) + typeFactor - 1.6;
  const tireScore = sigmoid(tireZ);

  // AMORTIGUADORES
  const shockKm = normalize(diffMileage, 0, 80000);
  const shockAge = normalize(ageYears, 0, 20);
  const shockUsage = normalize(baseMileage, 0, 250000);
  const shockZ = (1.8 * shockKm) + (1.0 * shockAge) + (0.6 * shockUsage) + typeFactor - 1.7;
  const shockScore = sigmoid(shockZ);

  const level = (score) => {
    if (score >= 0.75) return 'urgente';
    if (score >= 0.55) return 'proximo';
    return 'ok';
  };

  const recommendation = (name, score) => {
    const l = level(score);
    if (l === 'urgente') return `Ya conviene revisar o cambiar ${name}.`;
    if (l === 'proximo') return `${name} está próximo a requerir mantenimiento.`;
    return `${name} aún se encuentra dentro de rango.`;
  };

  return {
    oil: {
      score: Number(oilScore.toFixed(2)),
      level: level(oilScore),
      message: recommendation('aceite', oilScore),
    },
    tires: {
      score: Number(tireScore.toFixed(2)),
      level: level(tireScore),
      message: recommendation('llantas', tireScore),
    },
    shocks: {
      score: Number(shockScore.toFixed(2)),
      level: level(shockScore),
      message: recommendation('amortiguadores', shockScore),
    },
  };
};
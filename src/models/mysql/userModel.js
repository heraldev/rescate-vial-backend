const db = require('../../config/db');

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

exports.getCarById = async (id_usercar) => {
    const [rows] = await db.query(
        `SELECT 
            id_usercar,
            id_user,
            type_usercar,
            brand_usercar,
            model_usercar,
            year_usercar,
            mileage_usercar,
            colour_usercar
         FROM UsersCars
         WHERE id_usercar = ?`,
        [id_usercar]
    );
    return rows[0] ?? null;
};

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
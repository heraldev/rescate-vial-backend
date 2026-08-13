// src/utils/healthCalculator.js

/**
 * Calcula la salud de una pieza basada en su kilometraje recorrido y sus parámetros λ y k.
 * @param {number} currentMileage - Kilometraje actual del auto
 * @param {number} lastChangeMileage - Kilometraje en que se cambió/registró la pieza
 * @param {number} lifespanKm - λ: Vida útil en km
 * @param {number} fatigueK - k: Factor de fatiga
 */
const calculatePartHealth = (currentMileage, lastChangeMileage, lifespanKm, fatigueK) => {
  const kmTraveled = Math.max(0, currentMileage - lastChangeMileage);
  
  // Ecuación de Desgaste Exponencial: S(x) = 100 * e^(-k * Δx)
  const healthRatio = Math.exp(-fatigueK * kmTraveled);
  let healthPercentage = Math.round(healthRatio * 100);

  // Asegurar límites entre 0 y 100
  if (healthPercentage > 100) healthPercentage = 100;
  if (healthPercentage < 0) healthPercentage = 0;

  // Kilómetros restantes estimados
  const kmRemaining = Math.max(0, lifespanKm - kmTraveled);

  // Estado cualitativo (🔴 CRÍTICO, 🟡 ADVERTENCIA, 🟢 EXCELENTE)
  let status = 'EXCELENTE';
  if (healthPercentage < 30) status = 'CRITICO';
  else if (healthPercentage < 65) status = 'ADVERTENCIA';

  return {
    kmTraveled,
    healthPercentage,
    kmRemaining,
    status
  };
};

module.exports = {
  calculatePartHealth
};
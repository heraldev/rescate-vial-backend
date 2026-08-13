// src/services/aiServices.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Consulta a la IA los parámetros de desgaste para una pieza de un auto específico.
 */
const fetchPartMetadataFromAI = async (brand, model, year, partName) => {
  try {
    const modelAI = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Actúa como un ingeniero automotriz experto. Necesito los parámetros de desgaste preventivo para la pieza "${partName}" del vehículo ${brand} ${model} año ${year}.
      
      Responde ÚNICAMENTE en formato JSON plano con la siguiente estructura (sin markdown ni texto extra):
      {
        "lifespan_km": número entero con la vida útil promedio en kilómetros (ej. 35000),
        "fatigue_k": número flotante para el factor de fatiga k entre 0.00002 y 0.00010 (ej. 0.00006)
      }
    `;

    const result = await modelAI.generateContent(prompt);
    const textResponse = result.response.text().trim();
    
    // Limpieza de formato markdown
    const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("❌ Error en aiService:", error);
    return {
      lifespan_km: 40000,
      fatigue_k: 0.00005
    };
  }
};

module.exports = {
  fetchPartMetadataFromAI
};
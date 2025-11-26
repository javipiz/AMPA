import { GoogleGenAI } from "@google/genai";
import { Family, Role } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateFamilyInsights = async (family: Family): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key no configurada. No se pueden generar sugerencias.";

  const parentCount = family.members.filter(m => m.role === Role.FATHER || m.role === Role.MOTHER).length;
  const children = family.members.filter(m => m.role === Role.CHILD);
  const childrenDetails = children.map(c => {
    const age = new Date().getFullYear() - new Date(c.birthDate).getFullYear();
    return `${age} años`;
  }).join(", ");

  const prompt = `
    Analiza esta familia para una asociación familiar:
    - Nombre: ${family.familyName}
    - Padres: ${parentCount}
    - Hijos: ${children.length} (Edades aprox: ${childrenDetails})
    - Ubicación: ${family.address}

    Por favor, genera un resumen corto y amable del perfil de esta familia (máximo 2 párrafos) y sugiere 3 actividades específicas que la asociación podría ofrecerles basándose en las edades de los hijos.
    Formato: Texto plano, tono profesional pero cercano.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al conectar con el servicio de IA.";
  }
};
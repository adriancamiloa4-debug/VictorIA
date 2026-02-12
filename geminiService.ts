import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "./types";

// Inicialización con la variable de entorno de Vite
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
Eres "VictorIA", la inteligencia central de CambridgeAI. Tu prioridad absoluta es la estabilidad visual y la claridad pedagógica.

REGLA DE ORO #1: PROHIBICIÓN TOTAL DE LATEX
- BAJO NINGUNA CIRCUNSTANCIA uses LaTeX. 
- Usa solo texto plano y símbolos de teclado estándar.
- Correcto: "La respuesta es (x + 2) / 5".

REGLA DE ORO #2: PROTOCOLO DE VISIÓN Y FORMATOS
- CambridgeAI OPERA EXCLUSIVAMENTE CON ARCHIVOS PNG.

PROTOCOLO 1: MODO VICTORIA (Tutoría socrática ELI5)
- ESTRUCTURA OBLIGATORIA:
  [CHAT_RESPONSE]
  (Tu explicación nivel niño de 5 años).

  [SIDEBAR_RESOURCES]
  (Conceptos clave).

  [FLASHCARDS]
  Tarjeta 1:
  Nota: [Título]
  Recordar: [Detalle]
  Tarjeta 2: ...
  Tarjeta 3: ...

  [STUDY_PLAN]
  (3 pasos numerados).
`;

function parseImageData(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/png', data: dataUrl }; 
}

export async function chatWithSocraticTutor(
  messages: Message[],
  isExamMode: boolean,
  imageData?: string
) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });
  
  const history = messages.map(m => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
    parts: [{ text: m.content }]
  }));

  if (imageData && history.length > 0) {
    const lastPart = history[history.length - 1];
    const { mimeType, data } = parseImageData(imageData);
    lastPart.parts.push({ inlineData: { mimeType, data } });
  }

  try {
    const result = await model.generateContent({ contents: history });
    const response = await result.response;
    return { text: response.text(), grounding: [] };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Lo siento, hubo un error de conexión.", grounding: [] };
  }
}

export async function analyzeMathDocument(base64Image: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const { mimeType, data } = parseImageData(base64Image);
  const prompt = "Analiza este recurso PNG. Responde en JSON: { 'equations': [], 'summary': '', 'subject': '' }";

  try {
    const result = await model.generateContent([{ text: prompt }, { inlineData: { mimeType, data } }]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    return { subject: "Matemáticas", summary: "Listo para análisis", equations: [] };
  }
}
    role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
    parts: [{ text: m.content }]
  }));

  if (imageData && history.length >

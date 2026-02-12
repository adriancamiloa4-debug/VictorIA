import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Message } from "./types";

// 1. Configuración correcta para Vite y la nueva librería
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
Eres "VictorIA", la inteligencia central de CambridgeAI. Tu prioridad absoluta es la estabilidad visual y la claridad pedagógica.

REGLA DE ORO #1: PROHIBICIÓN TOTAL DE LATEX
- BAJO NINGUNA CIRCUNSTANCIA uses LaTeX. 
- NO uses comandos como \\frac, \\sqrt, \\int o signos de dólar $.
- Usa solo texto plano y símbolos de teclado estándar.

REGLA DE ORO #2: PROTOCOLO DE VISIÓN Y FORMATOS
- CambridgeAI OPERA EXCLUSIVAMENTE CON ARCHIVOS PNG.
- Si recibes una imagen y hay un error de procesamiento, responde: "Parece que hubo un pequeño problema al leer la imagen. ¿Podrías intentar subirla de nuevo o describirme el ejercicio para ayudarte?"

PROTOCOLO 1: MODO VICTORIA (Tutoría socrática ELI5 - Por defecto)
- OBJETIVO: Explicar conceptos complejos para que un niño de 5 años los entienda.
- ESTRUCTURA OBLIGATORIA DE RESPUESTA:
  [CHAT_RESPONSE]
  (Tu explicación nivel niño de 5 años usando analogías).

  [SIDEBAR_RESOURCES]
  (Conceptos clave y archivos PNG activos en texto plano).

  [FLASHCARDS]
  Tarjeta 1:
  Nota: [Título corto]
  Recordar: [Detalle simple]
  Tarjeta 2: ...
  Tarjeta 3: ...

  [STUDY_PLAN]
  (Hoja de ruta de 3 pasos numerados).

PROTOCOLO 2: MODO EXAMEN (Evaluador Riguroso)
- ESTRUCTURA OBLIGATORIA:
  [CHAT_RESPONSE] -> Solo la pregunta del examen.
  [SIDEBAR_RESOURCES] -> Estado: Pregunta X de 5.
  [FLASHCARDS] -> [DESACTIVADO].
  [STUDY_PLAN] -> [PROTOCOLO EVALUACIÓN ACTIVO].
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
  imageData?: string,
  useSearch: boolean = false
) {
  // 2. Inicialización correcta del modelo
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION
  });
  
  const contextHistory = [...messages];
  const lastMsgIndex = contextHistory.length - 1;
  
  if (isExamMode && lastMsgIndex >= 0 && !contextHistory[lastMsgIndex].content.includes("[MODO EXAMEN]")) {
    contextHistory[lastMsgIndex].content += "\n[SISTEMA: ACTIVAR PROTOCOLO 2: MODO EXAMEN]";
  } else if (!isExamMode && lastMsgIndex >= 0 && !contextHistory[lastMsgIndex].content.includes("[MODO VICTORIA]")) {
    contextHistory[lastMsgIndex].content += "\n[SISTEMA: ACTIVAR PROTOCOLO 1: MODO VICTORIA ELI5]";
  }

  const history = contextHistory.map(m => ({
    role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
    parts: [{ text: m.content }]
  }));

  if (imageData && history.length >


import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SoilData, AnalysisResult } from '../types';

// FIX: Initialize GoogleGenAI with API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Audio Utilities ---
// Decodes base64 string to Uint8Array
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer for playback
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        soil_health_score: { 
            type: Type.NUMBER, 
            description: "A score from 0 to 100 representing overall soil health." 
        },
        interpretation: { 
            type: Type.STRING, 
            description: "A detailed but easy-to-understand interpretation of the soil data provided." 
        },
        recommendations: {
            type: Type.OBJECT,
            properties: {
                plants: {
                    type: Type.ARRAY,
                    description: "A list of 3-5 suitable plants for this soil.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            reasoning: { type: Type.STRING, description: "Why this plant is suitable." },
                            care_tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific care tips for this plant in this soil." },
                            ideal_conditions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideal growing conditions (e.g., 'Full Sun', 'Well-drained soil')." }
                        },
                        required: ["name", "reasoning", "care_tips", "ideal_conditions"]
                    }
                },
                amendments: {
                    type: Type.ARRAY,
                    description: "A list of recommended soil amendments.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            reasoning: { type: Type.STRING, description: "Why this amendment is recommended." },
                            application_rate: { type: Type.STRING, description: "How much to apply (e.g., '2 lbs per 100 sq ft')." }
                        },
                        required: ["name", "reasoning", "application_rate"]
                    }
                }
            },
            required: ["plants", "amendments"]
        }
    },
    required: ["soil_health_score", "interpretation", "recommendations"]
};


export const analyzeSoil = async (data: SoilData, language: 'en' | 'te', image?: {data: string, mimeType: string} | null): Promise<AnalysisResult> => {
    const prompt = `
        Analyze the following soil data and provide a detailed report.
        ${image ? 'In addition to the data below, analyze the provided soil image for its visual characteristics like color and texture to improve the accuracy of your report.' : ''}
        Soil Data:
        - pH: ${data.ph}
        - Moisture: ${data.moisture}%
        - Temperature: ${data.temperature}°C
        - Nitrogen (N): ${data.nitrogen} ppm
        - Phosphorus (P): ${data.phosphorus} ppm
        - Potassium (K): ${data.potassium} ppm

        Provide your analysis in the specified JSON format. The interpretation should be detailed but accessible to a home gardener.
        Recommend 3-5 plants that would thrive in these conditions, explaining why.
        For each plant, provide specific care tips and also list its ideal growing conditions (e.g., sunlight, water needs).
        Also, recommend specific soil amendments if necessary, including application rates.
        Give a soil health score from 0-100.
        
        IMPORTANT: The entire JSON response, including all string values (interpretation, names, reasoning, tips, etc.), must be in the language specified by this language code: ${language}. For example, if the language code is 'te', all strings must be in Telugu.
    `;

    const textPart = { text: prompt };
    let contents: any;

    if (image) {
        const imagePart = {
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        };
        contents = { parts: [textPart, imagePart] };
    } else {
        contents = prompt;
    }

    try {
        // FIX: Use ai.models.generateContent for querying GenAI.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Use a suitable model
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            }
        });
        
        // FIX: Access the text property directly from the response.
        const jsonText = response.text;
        
        if (!jsonText) {
            throw new Error("API returned an empty response.");
        }
        
        return JSON.parse(jsonText) as AnalysisResult;

    } catch (error) {
        console.error("Error analyzing soil data:", error);
        throw new Error("Failed to get analysis from AI. Please check your API key and network connection.");
    }
};

export const translateAnalysis = async (
    analysis: AnalysisResult, 
    targetLanguageCode: string, 
    targetLanguageName: string
): Promise<AnalysisResult> => {
    const prompt = `
        Translate all user-facing string values in the following JSON object into the ${targetLanguageName} language (language code: ${targetLanguageCode}).
        The strings to translate are: 'interpretation', 'name', 'reasoning', 'care_tips' array elements, 'ideal_conditions' array elements, and 'application_rate'.
        Maintain the exact original JSON structure, including all keys and data types. Only translate the text content of the specified string values. Do not translate the JSON keys.

        Original JSON object:
        ${JSON.stringify(analysis, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema, // Reuse the existing schema
                temperature: 0.2,
            }
        });

        const jsonText = response.text;
        
        if (!jsonText) {
            throw new Error("API returned an empty response for translation.");
        }
        
        return JSON.parse(jsonText) as AnalysisResult;

    } catch (error) {
        console.error("Error translating analysis data:", error);
        throw new Error(`Failed to translate analysis to ${targetLanguageName}.`);
    }
};


export const getChatResponse = async (
  soilData: SoilData,
  analysisResult: AnalysisResult,
  chatHistory: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  language: 'en' | 'te'
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are Soil Sage, an expert gardening assistant.
You are having a conversation with a user about their soil.
Here is the soil data you have already analyzed:
- pH: ${soilData.ph}
- Moisture: ${soilData.moisture}%
- Temperature: ${soilData.temperature}°C
- Nitrogen (N): ${soilData.nitrogen} ppm
- Phosphorus (P): ${soilData.phosphorus} ppm
- Potassium (K): ${soilData.potassium} ppm

Here is your initial analysis:
${analysisResult.interpretation}

Your recommended plants are: ${analysisResult.recommendations.plants.map(p => p.name).join(', ')}.
Your recommended amendments are: ${analysisResult.recommendations.amendments.map(a => a.name).join(', ')}.

Keep your answers concise and helpful, directly related to gardening and the user's soil conditions. Do not answer questions outside of this scope.

IMPORTANT: Your entire response must be in the language specified by this language code: ${language}. For example, if the language code is 'te', your response must be in Telugu.
`;
  
  const contents = [
    ...chatHistory,
    { role: 'user', parts: [{ text: newMessage }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error getting chat response:", error);
    throw new Error("Failed to get response from AI assistant.");
  }
};

export const translateText = async (
    text: string,
    targetLanguageName: string,
): Promise<string> => {
    const prompt = `Translate the following text into ${targetLanguageName}. Only return the translated text, without any additional explanation or quotation marks.\n\nText to translate: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0,
            }
        });

        const translatedText = response.text.trim().replace(/^"|"$/g, ''); // Clean up potential quotes
        
        if (!translatedText) {
            // Fallback to original text if translation is empty
            return text;
        }
        
        return translatedText;

    } catch (error) {
        console.error(`Error translating text to ${targetLanguageName}:`, error);
        // Fallback to original text on error
        return text;
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("API did not return audio data.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech from AI.");
    }
};

const soilDataSchema = {
    type: Type.OBJECT,
    properties: {
        ph: { type: Type.NUMBER },
        moisture: { type: Type.NUMBER },
        temperature: { type: Type.NUMBER },
        nitrogen: { type: Type.NUMBER },
        phosphorus: { type: Type.NUMBER },
        potassium: { type: Type.NUMBER },
    },
};

export const parseSoilDataFromText = async (
    text: string, 
    language: 'en' | 'te'
): Promise<Partial<SoilData>> => {
    const langName = language === 'te' ? 'Telugu' : 'English';
    const prompt = `
        Analyze the following text which is in ${langName} and extract any mentioned soil data parameters.
        The parameters to look for are: ph, moisture, temperature, nitrogen, phosphorus, potassium.

        Follow these rules carefully:
        1.  **Natural Language Interpretation**: Understand conversational phrases.
            - For qualitative descriptions, map them to reasonable quantitative values. For example:
                - 'high moisture' or 'very wet' -> 80
                - 'normal moisture' or 'damp' -> 50
                - 'low moisture' or 'dry' -> 25
                - 'high nitrogen' -> 40
                - 'low potassium' -> 10
            - For approximations like 'around 25 degrees', use the number given (e.g., 25).
        2.  **Temperature Conversion**: The user might state temperature in Fahrenheit. If units like 'F' or 'Fahrenheit' are mentioned, you MUST convert the value to Celsius before returning it. If no unit is specified, assume Celsius.
        3.  **Extraction**: Only extract values that are explicitly mentioned or can be reasonably inferred from the text. Do not invent values for unmentioned parameters.
        4.  **Output Format**: Return the result in the specified JSON format. If no parameters can be confidently extracted from the text, return an empty JSON object.

        Text to parse: "${text}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: soilDataSchema,
            }
        });
        const jsonText = response.text;
        if (!jsonText) {
            return {};
        }
        const cleanedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedJson) as Partial<SoilData>;

    } catch (error) {
        console.error("Error parsing voice command:", error);
        throw new Error("Failed to understand voice command.");
    }
};

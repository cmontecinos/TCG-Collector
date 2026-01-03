
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ScanResult, MylCard } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractCardsFromImage = async (base64Image: string): Promise<ScanResult[]> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const prompt = `Identify all 'Mitos y Leyendas' TCG cards in this photo. 
  For each card, extract the precise name and edition. 
  Determine if it is a 'Real' (physical) card or a 'Promo'. 
  Return the list in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            edition: { type: Type.STRING },
            type: { type: Type.STRING, description: "Card type like Aliado, Talismán, Oro, etc." }
          },
          required: ["name", "edition", "type"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const fetchCardMetadata = async (cardName: string, edition: string): Promise<Partial<MylCard> | null> => {
  const ai = getAI();
  const model = "gemini-3-flash-preview"; 

  // We explicitly guide the model to find the direct image link from the fandom wiki
  const prompt = `Perform a deep search for the 'Mitos y Leyendas' card "${cardName}" from the edition "${edition}".
  Search specifically on myl.fandom.com or torneo.cl.
  Extract:
  1. The direct URL of the card art image (ending in .png, .jpg, or .webp). This is usually the main image in the Wiki infobox.
  2. The Card Ability text.
  3. Strength (Fuerza) as a number.
  4. Cost (Coste) as a number.
  5. Rarity (Frecuencia).
  6. Race (Raza).
  7. The Wiki page URL.
  
  Return as a valid JSON object.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rarity: { type: Type.STRING },
          ability: { type: Type.STRING },
          strength: { type: Type.NUMBER },
          cost: { type: Type.NUMBER },
          race: { type: Type.STRING },
          imageUrl: { type: Type.STRING, description: "The direct absolute URL to the card image file." },
          sourceUrl: { type: Type.STRING, description: "The Wiki page URL." }
        },
        required: ["imageUrl"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    // Sometimes Google Search grounding results provide better image links in the metadata chunks
    const searchSource = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.find(chunk => 
      chunk.web?.uri?.includes('fandom.com') || chunk.web?.uri?.includes('torneo.cl')
    );

    return { 
      ...data, 
      sourceUrl: data.sourceUrl || searchSource?.web?.uri,
      // If the model didn't find an image, we don't overwrite with undefined
      imageUrl: data.imageUrl || undefined
    };
  } catch (e) {
    console.error("Failed to fetch metadata", e);
    return null;
  }
};

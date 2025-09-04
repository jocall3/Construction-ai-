import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to convert File to a base64 string
const fileToGenerativePart = async (file: Blob) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        // Fallback for ArrayBuffer case
        const arrayBuffer = reader.result as ArrayBuffer;
        const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        resolve(base64String);
      }
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const editImageWithGemini = async (imageFile: Blob, prompt: string, maskFile: Blob | null): Promise<string> => {
  try {
    const enhancedPrompt = `${prompt}. Ensure the final image is high-resolution, 4k quality, photorealistic, and seamlessly blended with the original photo. The lighting and shadows should be consistent with the original image.`;
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: enhancedPrompt };

    const parts = [imagePart, textPart];

    if (maskFile) {
      const maskPart = await fileToGenerativePart(maskFile);
      parts.push(maskPart);
    }


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Find the first image part in the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    // If no image is returned, check for text which might contain an error or refusal
    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            throw new Error(`The model responded with text instead of an image: "${part.text}"`);
        }
    }
    
    throw new Error('No image data found in the AI response.');

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate image. The model may have refused the request. Please try a different prompt or image.');
  }
};
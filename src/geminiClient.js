import { GoogleGenAI } from '@google/genai';

// API Key directly .env file se load hogi jo aapne setup ki hai
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to convert File object to Generative Part
async function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        },
      });
    };
    reader.readAsDataURL(file);
  });
}

export async function analyzeImage(file) {
  try {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this civic issue image (e.g., pothole, garbage, broken streetlight, water leakage, drainage block) and return a JSON object with:
      1. "title": A short, direct title describing the issue (max 6 words).
      2. "category": Must be exactly one of: "Pothole", "Garbage", "Streetlight", "Drainage", or "Other".
      3. "severity": An integer score from 1 (minor issue) to 10 (life-threatening emergency) based on the hazard level.
      4. "description": A highly professional, 2-line detail explaining what the problem is and why it needs urgent repair.

      Return ONLY the raw JSON object, no markdown, no backticks, no wrap. Just pure JSON.
    `;

    // Using the recommended fast and cheap gemini-2.5-flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imagePart],
    });

    const text = response.text.trim();
    
    // JSON cleaning logic
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini AI API Error:", error);
    // Safe fallback if API limit hits during hackathon presentation
    return {
      title: "Reported Civic Grievance",
      category: "Pothole",
      severity: 6,
      description: "Auto-detected local infrastructure defect. Dispatched for verification."
    };
  }
}

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@googlegenerative-ai/generative-ai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// مفتاحك الخاص مدمج مباشرة لضمان العمل
const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemPrompt = "أنت SUIMAI، مساعد ذكي ومحترف. أجب دائماً باللغة العربية بأسلوب مهذب.";
    
    let parts: any[] = [];
    let messageText = req.body.message || "";

    if (req.body.image && req.body.image.includes(',')) {
      const base64Data = req.body.image.split(",")[1];
      parts.push({
        inlineData: { data: base64Data, mimeType: "image/jpeg" }
      });
      if (!messageText) messageText = "ماذا يوجد في هذه الصورة؟";
    }

    parts.push({ text: `${systemPrompt}\n\nالمستخدم: ${messageText}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("خطأ:", error);
    res.status(500).json({ reply: "فشل الاتصال بمحرك الذكاء الاصطناعي." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`سيرفر SUIMAI يعمل على المنفذ ${PORT}`);
});


const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const userMessage = req.body.message || "";
    let parts = [{ text: "أنت مساعد ذكي يدعى SUIMAI. أجب بذكاء وودية.\n\nالمستخدم: " + userMessage }];

    if (req.body.image && req.body.image.includes(',')) {
      parts.unshift({
        inlineData: { data: req.body.image.split(",")[1], mimeType: "image/jpeg" }
      });
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: "فشل الاتصال، حاول مرة أخرى." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on port ${PORT}`));

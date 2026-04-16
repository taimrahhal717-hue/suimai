const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// مفتاحك اللي شغال 100%
const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

// رسالة ترحيبية لما تفتح الرابط بالمتصفح عشان تطمن إنه شغال
app.get('/', (req, res) => {
  res.send("<h1>SUIMAI Server is LIVE 🚀</h1>");
});

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // التعليمات اللي بتخلي الرد فخم ومثل ما بدك
    const systemPrompt = "أنت SUIMAI، مساعد ذكي ومحترف جداً. ردودك يجب أن تكون ذكية، ودودة، وباللغة العربية.";
    
    let parts = [];
    const messageText = req.body.message || "";

    // إذا بعت صورة، الكود رح يعالجها فوراً
    if (req.body.image && req.body.image.includes(',')) {
      parts.push({
        inlineData: { data: req.body.image.split(",")[1], mimeType: "image/jpeg" }
      });
    }

    // دمج التعليمات مع رسالة المستخدم
    parts.push({ text: `${systemPrompt}\n\nالمستخدم: ${messageText}` });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "حدث خطأ في الاتصال، تأكد من المفتاح." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SUIMAI is ready!`));

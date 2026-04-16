const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// مفتاحك الشغال
const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

// تعديل المسار الأساسي ليعرض واجهة الشات مباشرة
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SUIMAI AI</title>
        <style>
            body { background-color: #000; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
            #chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
            .message { padding: 12px 18px; border-radius: 20px; max-width: 80%; line-height: 1.5; font-size: 16px; }
            .user-message { background-color: #007bff; align-self: flex-start; color: white; }
            .ai-message { background-color: #262626; align-self: flex-end; color: #efefef; }
            .input-area { padding: 15px; background-color: #121212; display: flex; gap: 10px; border-top: 1px solid #333; }
            input { flex: 1; padding: 12px; border-radius: 25px; border: 1px solid #444; background: #1a1a1a; color: white; outline: none; }
            button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; }
            button:hover { background: #0056b3; }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <div class="message ai-message">أهلاً بك! أنا SUIMAI، كيف يمكنني مساعدتك اليوم؟</div>
        </div>
        <div class="input-area">
            <input type="text" id="userInput" placeholder="اكتب رسالتك هنا..." onkeypress="if(event.key === 'Enter') sendMessage()">
            <button onclick="sendMessage()">إرسال</button>
        </div>

        <script>
            const chatContainer = document.getElementById('chat-container');
            const userInput = document.getElementById('userInput');

            async function sendMessage() {
                const message = userInput.value.trim();
                if (!message) return;

                // إضافة رسالة المستخدم للواجهة
                appendMessage(message, 'user-message');
                userInput.value = '';

                try {
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: message })
                    });
                    const data = await response.json();
                    appendMessage(data.reply, 'ai-message');
                } catch (error) {
                    appendMessage("عذراً، حدث خطأ في الاتصال بالسيرفر.", 'ai-message');
                }
            }

            function appendMessage(text, className) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message ' + className;
                msgDiv.innerText = text;
                chatContainer.appendChild(msgDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        </script>
    </body>
    </html>
  `);
});

// مسار معالجة الشات (POST)
app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemPrompt = "أنت SUIMAI، مساعد ذكي ومحترف جداً. ردودك ذكية وباللغة العربية.";
    const messageText = req.body.message || "";
    const result = await model.generateContent(`${systemPrompt}\n\nالمستخدم: ${messageText}`);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: "فشل في معالجة الطلب." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SUIMAI is ready!'));

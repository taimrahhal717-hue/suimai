import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'path';

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// واجهة المستخدم (HTML + CSS)
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>SUIMAI AI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; margin: 0; background: #121212; color: white; }
        #chat { flex: 1; overflow-y: auto; padding: 20px; }
        .msg { margin: 10px 0; padding: 10px; border-radius: 10px; max-width: 80%; }
        .user { background: #007bff; align-self: flex-end; margin-left: auto; }
        .bot { background: #333; }
        #input-area { padding: 20px; display: flex; gap: 10px; background: #1e1e1e; }
        input { flex: 1; padding: 10px; border-radius: 5px; border: none; }
        button { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div id="chat"></div>
    <div id="input-area">
        <input type="text" id="user-input" placeholder="اسأل SUIMAI شيئاً...">
        <button onclick="send()">إرسال</button>
    </div>
    <script>
        async function send() {
            const input = document.getElementById('user-input');
            const chat = document.getElementById('chat');
            if(!input.value) return;
            
            chat.innerHTML += '<div class="msg user">' + input.value + '</div>';
            const userMsg = input.value;
            input.value = '';

            const res = await fetch('/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: userMsg})
            });
            const data = await res.json();
            chat.innerHTML += '<div class="msg bot">' + data.reply + '</div>';
            chat.scrollTop = chat.scrollHeight;
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlContent);
});

app.post('/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(req.body.message);
        res.json({ reply: result.response.text() });
    } catch (e) {
        res.json({ reply: "حدث خطأ، تأكد من الـ API Key" });
    }
});

app.listen(3000, () => console.log('SUIMAI is ready!'));


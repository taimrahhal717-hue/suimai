import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SUIMAI</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --bg-color: #f7f6f0; --ink-color: #314d48; --border-color: #d8dcd1; }
        body { margin: 0; background-color: var(--bg-color); color: var(--ink-color); font-family: 'Inter', sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        header { display: flex; align-items: center; padding: 15px 25px; background: rgba(255, 255, 255, 0.3); border-bottom: 1px solid var(--border-color); backdrop-filter: blur(5px); }
        .logo-area { display: flex; align-items: center; gap: 10px; font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: bold; }
        #chat-window { flex: 1; overflow-y: auto; padding: 20px 30px; display: flex; flex-direction: column; }
        #welcome-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; }
        .sparkle-icon { font-size: 3rem; color: #bdc7c0; background: rgba(255, 255, 255, 0.6); padding: 20px; border-radius: 50%; margin-bottom: 20px; border: 1px solid var(--border-color); }
        .main-title { font-family: 'Playfair Display', serif; font-size: 1.8rem; margin-bottom: 10px; }
        .sub-title { font-family: 'Playfair Display', serif; font-style: italic; color: #768a85; }
        #input-panel { padding: 20px; background: rgba(255, 255, 255, 0.7); border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 15px; }
        .input-wrapper { flex: 1; position: relative; }
        input[type="text"] { width: 100%; padding: 12px 45px 12px 15px; border-radius: 25px; border: 1px solid var(--border-color); outline: none; box-sizing: border-box; }
        .send-btn { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #768a85; cursor: pointer; }
        #image-input { display: none; }
        .attach-btn { cursor: pointer; color: #768a85; font-size: 1.3rem; }
        .message { margin-bottom: 20px; }
        .role { font-weight: bold; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.7; }
        .img-msg { max-width: 200px; border-radius: 10px; margin-top: 5px; border: 1px solid var(--border-color); }
    </style>
</head>
<body>
    <header><div class="logo-area"><i class="fas fa-feather-alt" style="color:#8fa696"></i><span>SUIMAI</span></div></header>
    <div id="chat-window">
        <div id="welcome-screen">
            <div class="sparkle-icon">✦</div>
            <div class="main-title">Begin a new entry</div>
            <div class="sub-title">Take a breath. Gather your thoughts. The ink is waiting.</div>
        </div>
    </div>
    <div id="input-panel">
        <label for="image-input" class="attach-btn"><i class="fas fa-paperclip"></i></label>
        <input type="file" id="image-input" accept="image/*">
        <div class="input-wrapper">
            <input type="text" id="user-input" placeholder="Continue the thought..." autocomplete="off">
            <button class="send-btn" onclick="sendMsg()"><i class="far fa-paper-plane"></i></button>
        </div>
    </div>
    <script>
        const chatWindow = document.getElementById('chat-window');
        const welcomeScreen = document.getElementById('welcome-screen');
        const userInput = document.getElementById('user-input');
        const imageInput = document.getElementById('image-input');
        let currentImage = null;

        window.onload = () => {
            const history = JSON.parse(localStorage.getItem('suimai_local_v1') || '[]');
            if(history.length) { welcomeScreen.style.display='none'; history.forEach(m => appendUI(m.text, m.side, m.img)); }
        };

        imageInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => { currentImage = reader.result; alert("Image attached!"); };
            reader.readAsDataURL(e.target.files[0]);
        };

        async function sendMsg() {
            const text = userInput.value.trim();
            if(!text && !currentImage) return;
            welcomeScreen.style.display = 'none';
            appendUI(text, 'user', currentImage);
            saveToLocal(text, 'user', currentImage);
            const imgToSend = currentImage;
            userInput.value = ''; currentImage = null;

            const res = await fetch('/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ message: text, image: imgToSend })
            });
            const data = await res.json();
            appendUI(data.reply, 'bot');
            saveToLocal(data.reply, 'bot');
        }

        function appendUI(text, side, img="") {
            const div = document.createElement('div');
            div.className = 'message';
            div.innerHTML = \`<div class="role">\${side==='user'?'You':'SUIMAI'}</div>\`;
            if(img) div.innerHTML += \`<img src="\${img}" class="img-msg"><br>\`;
            if(text) div.innerHTML += \`<div>\${text}</div>\`;
            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function saveToLocal(text, side, img="") {
            const history = JSON.parse(localStorage.getItem('suimai_local_v1') || '[]');
            history.push({text, side, img});
            localStorage.setItem('suimai_local_v1', JSON.stringify(history));
        }
        userInput.onkeypress = (e) => { if(e.key==='Enter') sendMsg(); };
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemInstruction = "You are SUIMAI, a thoughtful writing companion. Be warm, eloquent and helpful. ";
    
    let parts: any[] = [{ text: systemInstruction + (req.body.message || "") }];
    if (req.body.image) {
      const base64Data = req.body.image.split(",")[1];
      parts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
    }

    const result = await model.generateContent(parts);
    res.json({ reply: result.response.text() });
  } catch (e) { res.status(500).json({ reply: "I'm having trouble connecting right now." }); }
});

app.listen(3000, () => console.log('SUIMAI Live'));

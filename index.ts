import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json({ limit: '15mb' })); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SUIMAI</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root { --bg: #f7f6f0; --ink: #314d48; --border: #d8dcd1; --accent: #8fa696; }
        body { margin: 0; background: var(--bg); color: var(--ink); font-family: 'Inter', sans-serif; display: flex; height: 100vh; overflow: hidden; }
        
        /* القائمة الجانبية (الأسطر الثلاثة) */
        #sidebar { width: 0; background: #eeede4; border-right: 1px solid var(--border); transition: 0.3s; overflow: hidden; display: flex; flex-direction: column; }
        #sidebar.open { width: 260px; }
        .sidebar-header { padding: 20px; font-weight: bold; border-bottom: 1px solid var(--border); }
        .history-list { flex: 1; overflow-y: auto; padding: 10px; }
        .history-item { padding: 10px; margin-bottom: 5px; background: white; border-radius: 8px; font-size: 0.85rem; cursor: pointer; border: 1px solid transparent; }
        .history-item:hover { border-color: var(--accent); }

        /* المنطقة الرئيسية */
        #main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
        header { padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.2); }
        .menu-btn { font-size: 1.5rem; cursor: pointer; margin-right: 15px; }

        #chat-window { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
        
        /* شاشة الترحيب */
        #welcome { text-align: center; margin: auto; }
        .sparkle { font-size: 3rem; color: var(--accent); margin-bottom: 20px; }

        /* منطقة الإدخال (الكيبورد والصور) */
        #input-container { padding: 20px; background: white; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .input-box { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; padding: 5px 15px; }
        input[type="text"] { flex: 1; border: none; background: transparent; padding: 12px 0; outline: none; font-size: 1rem; color: var(--ink); }
        
        .action-btn { font-size: 1.3rem; color: #768a85; cursor: pointer; padding: 5px; }
        #image-input { display: none; }
        .preview-area { position: absolute; bottom: 90px; left: 20px; display: none; }
        .preview-img { width: 60px; height: 60px; border-radius: 8px; border: 2px solid var(--accent); object-fit: cover; }

        /* فقاعات الكلام */
        .msg { max-width: 85%; line-height: 1.6; }
        .msg.user { align-self: flex-start; }
        .msg.bot { align-self: flex-start; border-left: 2px solid var(--accent); padding-left: 15px; margin-left: 5px; }
        .role-label { font-size: 0.7rem; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; opacity: 0.6; }
        .msg-img { max-width: 100%; border-radius: 12px; margin-top: 8px; }
    </style>
</head>
<body>
    <div id="sidebar">
        <div class="sidebar-header">Recent Entries</div>
        <div class="history-list" id="history-list"></div>
        <button onclick="clearHistory()" style="margin: 10px; padding: 10px; border: none; background: #dcd7c5; border-radius: 5px; cursor: pointer;">Clear All</button>
    </div>

    <div id="main-content">
        <header>
            <i class="fas fa-bars menu-btn" onclick="toggleSidebar()"></i>
            <div style="font-family:'Playfair Display'; font-weight:bold; font-size:1.2rem;">SUIMAI</div>
        </header>

        <div id="chat-window">
            <div id="welcome">
                <div class="sparkle">✦</div>
                <h1 style="font-family:'Playfair Display';">Begin a new entry</h1>
                <p style="font-style:italic; color:#768a85;">Take a breath. Gather your thoughts.</p>
            </div>
        </div>

        <div class="preview-area" id="preview-area">
            <img src="" id="img-preview" class="preview-img">
            <i class="fas fa-times-circle" onclick="cancelImage()" style="position:absolute; top:-5px; right:-5px; cursor:pointer; color:red; background:white; border-radius:50%;"></i>
        </div>

        <div id="input-container">
            <label for="image-input" class="action-btn"><i class="fas fa-paperclip"></i></label>
            <input type="file" id="image-input" accept="image/*">
            
            <div class="input-box">
                <input type="text" id="user-input" placeholder="Continue the thought..." autocomplete="off">
                <i class="far fa-paper-plane action-btn" onclick="send()"></i>
            </div>
        </div>
    </div>

    <script>
        const chatWin = document.getElementById('chat-window');
        const welcome = document.getElementById('welcome');
        const uInput = document.getElementById('user-input');
        const imgInput = document.getElementById('image-input');
        let currentImg = null;

        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

        window.onload = () => {
            loadHistory();
            const lastSession = JSON.parse(localStorage.getItem('suimai_current') || '[]');
            if(lastSession.length) {
                welcome.style.display = 'none';
                lastSession.forEach(m => appendUI(m.text, m.side, m.img));
            }
        };

        imgInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = () => {
                currentImg = reader.result;
                document.getElementById('img-preview').src = currentImg;
                document.getElementById('preview-area').style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        };

        function cancelImage() {
            currentImg = null;
            document.getElementById('preview-area').style.display = 'none';
            imgInput.value = '';
        }

        async function send() {
            const text = uInput.value.trim();
            if(!text && !currentImg) return;

            welcome.style.display = 'none';
            appendUI(text, 'user', currentImg);
            saveMsg(text, 'user', currentImg);

            const imgData = currentImg;
            uInput.value = '';
            cancelImage();

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ message: text, image: imgData })
                });
                const data = await res.json();
                appendUI(data.reply, 'bot');
                saveMsg(data.reply, 'bot');
            } catch (e) { appendUI("Lost connection to the ink...", 'bot'); }
        }

        function appendUI(text, side, img="") {
            const div = document.createElement('div');
            div.className = 'msg ' + side;
            div.innerHTML = \`<div class="role-label">\${side==='user'?'You':'SUIMAI'}</div>\`;
            if(img) div.innerHTML += \`<img src="\${img}" class="msg-img"><br>\`;
            if(text) div.innerHTML += \`<div>\${text}</div>\`;
            chatWin.appendChild(div);
            chatWin.scrollTop = chatWin.scrollHeight;
        }

        function saveMsg(text, side, img="") {
            const current = JSON.parse(localStorage.getItem('suimai_current') || '[]');
            current.push({text, side, img});
            localStorage.setItem('suimai_current', JSON.stringify(current));
            
            // تحديث القائمة الجانبية (History)
            if(side === 'user' && text) {
                const hist = JSON.parse(localStorage.getItem('suimai_history_list') || '[]');
                if(!hist.includes(text.substring(0,30))) {
                    hist.unshift(text.substring(0,30) + "...");
                    localStorage.setItem('suimai_history_list', JSON.stringify(hist.slice(0,10)));
                    loadHistory();
                }
            }
        }

        function loadHistory() {
            const list = document.getElementById('history-list');
            const hist = JSON.parse(localStorage.getItem('suimai_history_list') || '[]');
            list.innerHTML = hist.map(h => \`<div class="history-item"><i class="fas fa-pen-nib"></i> \${h}</div>\`).join('');
        }

        function clearHistory() {
            localStorage.clear();
            location.reload();
        }

        uInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') send(); });
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const system = "You are SUIMAI, a thoughtful writing companion. Be warm and articulate.";
    
    let parts: any[] = [{ text: system + (req.body.message || "") }];
    if (req.body.image) {
      const base64 = req.body.image.split(",")[1];
      parts.push({ inlineData: { data: base64, mimeType: "image/jpeg" } });
    }

    const result = await model.generateContent(parts);
    res.json({ reply: result.response.text() });
  } catch (e) { res.status(500).json({ reply: "Connection failed." }); }
});

app.listen(3000, () => console.log('SUIMAI V2 Live'));

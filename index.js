const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SUIMAI</title>
        <style>
            :root { --bg: #FDFCF9; --text: #3E4E3C; --accent: #A4B4A5; --border: #EAE5D8; }
            body { background: var(--bg); color: var(--text); font-family: serif; margin: 0; display: flex; overflow: hidden; height: 100vh; }
            
            /* القائمة الجانبية - الثلاث خطوط */
            #sidebar { width: 250px; background: #FFF; border-left: 1px solid var(--border); display: none; flex-direction: column; padding: 20px; transition: 0.3s; z-index: 100; }
            #sidebar.active { display: flex; }
            .history-item { padding: 10px; border-bottom: 1px solid var(--border); cursor: pointer; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

            .main-content { flex: 1; display: flex; flex-direction: column; position: relative; }
            header { padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border); background: #FFF; gap: 15px; }
            .menu-btn { cursor: pointer; font-size: 24px; }

            #chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
            .message { padding: 14px 18px; border-radius: 18px; max-width: 85%; font-family: sans-serif; }
            .user { background: var(--border); align-self: flex-start; border-radius: 18px 18px 18px 0; }
            .ai { background: #FFF; align-self: flex-end; border: 1px solid var(--border); border-radius: 18px 18px 0 18px; }
            
            .input-box { padding: 20px; background: var(--bg); }
            .input-wrapper { background: #FFF; border: 1px solid var(--border); border-radius: 15px; display: flex; padding: 10px 15px; gap: 10px; align-items: center; }
            input { flex: 1; border: none; outline: none; font-size: 16px; background: transparent; }
            #preview { display:none; padding:10px; text-align:center; }
            #preview img { max-height: 60px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div id="sidebar">
            <h3 style="font-weight:normal;">المحادثات السابقة</h3>
            <div id="history-list"></div>
            <button onclick="localStorage.clear(); location.reload();" style="margin-top:auto; border:none; background:#eee; padding:10px; cursor:pointer;">مسح الكل</button>
        </div>

        <div class="main-content">
            <header>
                <div class="menu-btn" onclick="document.getElementById('sidebar').classList.toggle('active')">☰</div>
                <div style="font-weight:bold;">✒ SUIMAI</div>
            </header>

            <div id="chat-container">
                <div id="start-msg" style="text-align:center; margin:auto;">
                    <div style="font-size:50px; color:#C2CFC2;">✧</div>
                    <h2 style="font-weight:normal;">ابدأ مدخلة جديدة</h2>
                </div>
            </div>

            <div id="preview"><img id="p-img"></div>

            <div class="input-box">
                <div class="input-wrapper">
                    <input type="text" id="userInput" placeholder="اكتب أفكارك..." onkeypress="if(event.key==='Enter')send()">
                    <span onclick="document.getElementById('file').click()" style="cursor:pointer;">📷</span>
                    <span onclick="send()" style="cursor:pointer; color:var(--accent);">➤</span>
                </div>
                <input type="file" id="file" hidden accept="image/*" onchange="preview(this)">
            </div>
        </div>

        <script>
            let imgData = null;
            const chat = document.getElementById('chat-container');
            const historyList = document.getElementById('history-list');

            window.onload = () => {
                const h = localStorage.getItem('suimai_v2');
                if(h) { 
                    document.getElementById('start-msg').style.display='none'; 
                    chat.innerHTML = h; 
                    updateSidebar();
                }
            };

            function preview(input) {
                const r = new FileReader();
                r.onload = (e) => { imgData = e.target.result; document.getElementById('p-img').src=imgData; document.getElementById('preview').style.display='block'; };
                r.readAsDataURL(input.files[0]);
            }

            async function send() {
                const inp = document.getElementById('userInput');
                const txt = inp.value.trim();
                if(!txt && !imgData) return;
                document.getElementById('start-msg').style.display='none';

                let userH = '<div class="message user">' + txt + (imgData ? '<br><img src="'+imgData+'" style="max-width:100%">' : '') + '</div>';
                chat.innerHTML += userH;
                
                const bTxt = txt; const bImg = imgData;
                inp.value = ''; imgData = null; document.getElementById('preview').style.display='none';
                chat.scrollTop = chat.scrollHeight;

                try {
                    const r = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: bTxt, image: bImg })
                    });
                    const d = await r.json();
                    chat.innerHTML += '<div class="message ai">' + d.reply + '</div>';
                } catch(e) {
                    chat.innerHTML += '<div class="message ai">فشل في الطلب، تأكد من اتصالك.</div>';
                }
                chat.scrollTop = chat.scrollHeight;
                localStorage.setItem('suimai_v2', chat.innerHTML);
                updateSidebar();
            }

            function updateSidebar() {
                historyList.innerHTML = '';
                const msgs = chat.querySelectorAll('.user');
                msgs.forEach((m, i) => {
                    const item = document.createElement('div');
                    item.className = 'history-item';
                    item.innerText = m.innerText.substring(0, 20) + '...';
                    historyList.appendChild(item);
                });
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const { message, image } = req.body;
        let parts = [{ text: "أنت SUIMAI، مساعد راقٍ جداً. أجب بذكاء واختصار.\n\nالمستخدم: " + message }];
        if (image && image.includes(',')) parts.unshift({ inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } });
        
        const result = await model.generateContent({ contents: [{ role: "user", parts }] });
        res.json({ reply: (await result.response).text() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ reply: "حدث خطأ داخلي في السيرفر." });
    }
});

app.listen(process.env.PORT || 3000);

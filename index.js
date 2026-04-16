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
            body { background: var(--bg); color: var(--text); font-family: 'Times New Roman', serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
            header { padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border); background: #FFF; justify-content: space-between;}
            .logo { font-size: 20px; font-weight: bold; display: flex; align-items: center; gap: 8px; }
            
            #chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 700px; margin: 0 auto; }
            .start-screen { text-align: center; margin: auto; }
            .start-icon { font-size: 50px; color: #C2CFC2; margin-bottom: 15px; }
            .start-title { font-size: 26px; margin-bottom: 8px; font-weight: 400; }
            .start-sub { font-size: 15px; color: #8A9A8B; }

            .message { padding: 14px 18px; border-radius: 18px; max-width: 85%; line-height: 1.6; font-family: sans-serif; position: relative; }
            .user { background: var(--border); align-self: flex-start; border-radius: 18px 18px 18px 0; }
            .ai { background: #FFF; align-self: flex-end; border: 1px solid var(--border); border-radius: 18px 18px 0 18px; }
            .message img { max-width: 100%; border-radius: 10px; margin-top: 8px; display: block; }

            .input-box { padding: 20px; width: 100%; max-width: 700px; margin: 0 auto; box-sizing: border-box; }
            .input-wrapper { background: #FFF; border: 1px solid var(--border); border-radius: 15px; display: flex; align-items: center; padding: 10px 15px; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
            input { flex: 1; border: none; outline: none; font-size: 16px; color: var(--text); background: transparent; }
            .btns { display: flex; gap: 12px; color: #8A9A8B; cursor: pointer; font-size: 20px; }
            #preview-area { display: none; padding: 10px; position: relative; text-align: center;}
            #preview-img { max-height: 80px; border-radius: 8px; border: 1px solid var(--border); }
        </style>
    </head>
    <body>
        <header>
            <div class="logo"><span>☰</span> ✒ SUIMAI</div>
            <div id="user-info" style="font-size: 13px; color: #A4B4A5;">مساحة خاصة</div>
        </header>

        <div id="chat-container">
            <div class="start-screen" id="start-screen">
                <div class="start-icon">✧</div>
                <div class="start-title">ابدأ مدخلة جديدة</div>
                <div class="start-sub">خذ نفساً. اجمع أفكارك. الحبر بانتظارك.</div>
            </div>
        </div>

        <div id="preview-area">
            <img id="preview-img">
            <button onclick="cancelImg()" style="background:none; border:none; color:red; cursor:pointer;">حذف</button>
        </div>

        <div class="input-box">
            <div class="input-wrapper">
                <input type="text" id="userInput" placeholder="اكتب أفكارك..." onkeypress="if(event.key === 'Enter') send()">
                <div class="btns">
                    <span onclick="document.getElementById('fileInput').click()">📷</span>
                    <span onclick="send()">➤</span>
                </div>
            </div>
            <input type="file" id="fileInput" hidden accept="image/*" onchange="handleFile(this)">
        </div>

        <script>
            let base64File = null;
            const chat = document.getElementById('chat-container');
            const startScreen = document.getElementById('start-screen');

            // تحميل المحادثة الخاصة بهذا الجهاز فقط
            window.onload = () => {
                const history = localStorage.getItem('suimai_private_chat');
                if(history) {
                    startScreen.style.display = 'none';
                    chat.innerHTML = history;
                    chat.scrollTop = chat.scrollHeight;
                }
            };

            function handleFile(input) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    base64File = e.target.result;
                    document.getElementById('preview-img').src = base64File;
                    document.getElementById('preview-area').style.display = 'block';
                };
                reader.readAsDataURL(input.files[0]);
            }

            function cancelImg() { base64File = null; document.getElementById('preview-area').style.display = 'none'; }

            async function send() {
                const input = document.getElementById('userInput');
                const text = input.value.trim();
                if(!text && !base64File) return;

                startScreen.style.display = 'none';
                
                let userHtml = '<div class="message user">' + text;
                if(base64File) userHtml += '<img src="'+base64File+'">';
                userHtml += '</div>';
                
                chat.innerHTML += userHtml;
                const tempImg = base64File;
                input.value = '';
                cancelImg();
                chat.scrollTop = chat.scrollHeight;

                try {
                    const res = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text, image: tempImg })
                    });
                    const data = await res.json();
                    chat.innerHTML += '<div class="message ai">' + data.reply + '</div>';
                    chat.scrollTop = chat.scrollHeight;
                    
                    // حفظ المحادثة في ذاكرة هذا الجهاز فقط
                    localStorage.setItem('suimai_private_chat', chat.innerHTML);
                } catch (e) {
                    chat.innerHTML += '<div class="message ai">عذراً، حدث خطأ.</div>';
                }
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
    let parts = [{ text: "أنت SUIMAI، مساعد ذكي وراقي جداً. أجب بالعربية بأسلوب أدبي بسيط.\n\nالمستخدم: " + message }];

    if (image && image.includes(',')) {
      parts.unshift({ inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } });
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    res.json({ reply: (await result.response).text() });
  } catch (e) { res.status(500).json({ reply: "فشل في معالجة الطلب." }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SUIMAI Live!'));

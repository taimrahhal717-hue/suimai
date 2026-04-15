import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json({ limit: '10mb' })); // لدعم إرسال الصور

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
        :root {
            --bg-color: #f7f6f0; /* اللون الأوف وايت الهادئ */
            --ink-color: #314d48; /* اللون الأخضر الداكن (الحبر) */
            --panel-bg: rgba(255, 255, 255, 0.7);
            --border-color: #d8dcd1;
        }

        body {
            margin: 0;
            background-color: var(--bg-color);
            color: var(--ink-color);
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        /* الهيدر الأنيق */
        header {
            display: flex;
            align-items: center;
            padding: 15px 25px;
            background: rgba(255, 255, 255, 0.3);
            border-bottom: 1px solid var(--border-color);
            backdrop-filter: blur(5px);
        }

        .menu-icon { font-size: 1.4rem; cursor: pointer; margin-right: 20px; color: var(--ink-color); }
        .logo-area { display: flex; align-items: center; gap: 10px; font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: bold; }
        .logo-icon { color: #8fa696; } /* لون أيقونة اللوجو */

        /* منطقة الشات الرئيسية */
        #chat-window {
            flex: 1;
            overflow-y: auto;
            padding: 20px 30px;
            display: flex;
            flex-direction: column;
        }

        /* الشاشة الافتتاحية "Begin a new entry" */
        #welcome-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            text-align: center;
            padding: 0 40px;
        }

        .sparkle-icon {
            font-size: 4rem;
            color: #bdc7c0;
            background: rgba(255, 255, 255, 0.6);
            padding: 25px;
            border-radius: 50%;
            margin-bottom: 25px;
            border: 1px solid var(--border-color);
        }

        .main-title { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: bold; margin-bottom: 15px; color: var(--ink-color); }
        .sub-title { font-family: 'Playfair Display', serif; font-style: italic; font-size: 1.1rem; line-height: 1.6; color: #768a85; }

        /* منطقة المدخلات السفلية */
        #input-panel {
            padding: 20px 30px;
            background: var(--panel-bg);
            border-top: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 15px;
            backdrop-filter: blur(5px);
        }

        .attach-btn { font-size: 1.5rem; color: #768a85; cursor: pointer; transition: 0.2s; }
        .attach-btn:hover { color: var(--ink-color); }
        #image-input { display: none; }

        .input-wrapper {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
        }

        input[type="text"] {
            width: 100%;
            padding: 15px;
            padding-right: 50px; /* مكان زر الإرسال */
            border-radius: 30px;
            border: 1px solid var(--border-color);
            background: white;
            color: var(--ink-color);
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            outline: none;
            transition: 0.2s;
        }

        input[type="text"]:focus { border-color: #b0c0b8; }

        .send-btn {
            position: absolute;
            right: 15px;
            background: none;
            border: none;
            color: #768a85;
            font-size: 1.3rem;
            cursor: pointer;
            transition: 0.2s;
        }

        .send-btn:hover { color: var(--ink-color); }

        /* تنسيق فقاعات المحادثة */
        .message { margin-bottom: 20px; line-height: 1.6; font-size: 0.95rem; }
        .role { font-weight: bold; margin-bottom: 5px; text-transform: capitalize; }
        .content { white-space: pre-wrap; }
        .img-msg { max-width: 250px; border-radius: 12px; margin-bottom: 10px; border: 1px solid var(--border-color); }

    </style>
</head>
<body>
    <header>
        <i class="fas fa-bars menu-icon"></i>
        <div class="logo-area">
            <i class="fas fa-feather-alt logo-icon"></i>
            <span>SUIMAI</span>
        </div>
    </header>

    <div id="chat-window">
        <div id="welcome-screen">
            <div class="sparkle-icon">✦</div>
            <div class="main-title">Begin a new entry</div>
            <div class="sub-title">Take a breath. Gather your thoughts. The ink is waiting.</div>
        </div>
    </div>

    <div id="input-panel">
        <label for="image-input" class="attach-btn">
            <i class="fas fa-paperclip"></i>
        </label>
        <input type="file" id="image-input" accept="image/*">
        <div class="input-wrapper">
            <input type="text" id="user-input" placeholder="Continue the thought..." autocomplete="off">
            <button class="send-btn" onclick="sendMsg()">
                <i class="far fa-paper-plane"></i>
            </button>
        </div>
    </div>

    <script>
        const chatWindow = document.getElementById('chat-window');
        const welcomeScreen = document.getElementById('welcome-screen');
        const userInput = document.getElementById('user-input');
        const imageInput = document.getElementById('image-input');
        let currentImageBase64 = null;

        // تحميل المحادثة من ذاكرة الجهاز (LocalStorage)
        window.onload = () => {
            const history = JSON.parse(localStorage.getItem('suimai_history_inkwell') || '[]');
            if (history.length > 0) {
                welcomeScreen.style.display = 'none';
                history.forEach(m => appendUI(m.text, m.side, m.img));
            }
        };

        // معالجة اختيار الصورة
        imageInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = () => {
                    currentImageBase64 = reader.result;
                    alert("Image selected and attached. Write your message.");
                    userInput.placeholder = "Image attached. Describe your thoughts...";
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };

        // إرسال الرسالة
        async function sendMsg() {
            const text = userInput.value.trim();
            if (!text && !currentImageBase64) return;

            // إخفاء شاشة الترحيب في أول رسالة
            welcomeScreen.style.display = 'none';

            // إضافة رسالة المستخدم للواجهة وحفظها
            appendUI(text, 'user', currentImageBase64);
            saveToLocal(text, 'user', currentImageBase64);
            
            const imageToSend = currentImageBase64;
            // تصفير المدخلات
            userInput.value = '';
            currentImageBase64 = null;
            userInput.placeholder = "Continue the thought...";
            imageInput.value = ''; // إعادة تعيين مدخل الملف

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, image: imageToSend })
                });
                const data = await res.json();
                
                // إضافة رد البوت
                appendUI(data.reply, 'bot');
                saveToLocal(data.reply, 'bot');
            } catch (e) {
                appendUI("Something went wrong with the connection.", 'bot');
            }
        }

        // إضافة الرسالة للـ UI
        function appendUI(text, side, imgData = null) {
            const div = document.createElement('div');
            div.className = 'message ' + side;
            
            const roleDiv = document.createElement('div');
            roleDiv.className = 'role';
            roleDiv.innerText = side === 'user' ? 'You' : 'SUIMAI';
            div.appendChild(roleDiv);

            if (imgData) {
                const img = document.createElement('img');
                img.src = imgData;
                img.className = 'img-msg';
                div.appendChild(img);
            }

            if (text) {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'content';
                contentDiv.innerText = text;
                div.appendChild(contentDiv);
            }

            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        // حفظ المحادثة في LocalStorage
        function saveToLocal(text, side, img = null) {
            const history = JSON.parse(localStorage.getItem('suimai_history_inkwell') || '[]');
            history.push({ text, side, img });
            localStorage.setItem('suimai_history_inkwell', JSON.stringify(history));
        }

        // إرسال الرسالة عند الضغط على Enter
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendMsg();
        });
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.post('/chat', async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // أفضل موديل للصور والنصوص
        systemInstruction: "You are SUIMAI, a thoughtful writing companion. Be warm, eloquent and helpful. You identify as SUIMAI. Adapt your style to the user's input, offering encouragement and thoughtful insights."
    });

    let parts: any[] = [];
    
    // إذا كان هناك نص، أضفه
    if (req.body.message) {
        parts.push({ text: req.body.message });
    } else if (req.body.image) {
        parts.push({ text: "Analyze this image and share some thoughts." }); // رسالة افتراضية لو أرسل صورة فقط
    }
    
    // إذا كانت هناك صورة، أضفها (Base64)
    if (req.body.image) {
        const base64Data = req.body.image.split(",")[1];
        parts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } }); // Gemini يحتاج Base64 نظيف
    }

    const result = await model.generateContent(parts);
    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "I encountered a technical issue." });
  }
});

app.listen(3000, () => console.log('SUIMAI is ready in Inkwell style!'));



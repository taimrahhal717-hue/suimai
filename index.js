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
        <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
        
        <style>
            :root { --bg: #FDFCF9; --text: #3E4E3C; --accent: #A4B4A5; --border: #EAE5D8; }
            body { background: var(--bg); color: var(--text); font-family: 'Times New Roman', serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
            header { padding: 15px 20px; display: flex; align-items: center; border-bottom: 1px solid var(--border); background: #FFF; justify-content: space-between;}
            #chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 700px; margin: 0 auto; }
            .message { padding: 14px 18px; border-radius: 18px; max-width: 85%; font-family: sans-serif; }
            .user { background: var(--border); align-self: flex-start; border-radius: 18px 18px 18px 0; }
            .ai { background: #FFF; align-self: flex-end; border: 1px solid var(--border); border-radius: 18px 18px 0 18px; }
            .input-box { padding: 20px; width: 100%; max-width: 700px; margin: 0 auto; }
            .input-wrapper { background: #FFF; border: 1px solid var(--border); border-radius: 15px; display: flex; padding: 10px 15px; gap: 10px; }
            input { flex: 1; border: none; outline: none; background: transparent; }
            #login-btn { cursor: pointer; background: #3E4E3C; color: white; border: none; padding: 5px 15px; border-radius: 20px; }
        </style>
    </head>
    <body>
        <header>
            <div style="font-weight:bold;">✒ SUIMAI</div>
            <button id="login-btn" onclick="login()">تسجيل دخول</button>
        </header>

        <div id="chat-container">
            <div id="status">يرجى تسجيل الدخول لحفظ محادثاتك الشخصية.</div>
        </div>

        <div class="input-box">
            <div class="input-wrapper">
                <input type="text" id="userInput" placeholder="اكتب أفكارك...">
                <button onclick="send()" style="border:none; background:none; cursor:pointer;">➤</button>
            </div>
        </div>

        <script>
            // إعدادات Firebase (يجب أن تضع إعداداتك هنا ليعمل 100%)
            const firebaseConfig = {
                apiKey: "YOUR_FIREBASE_API_KEY",
                authDomain: "your-app.firebaseapp.com",
                projectId: "your-app-id",
                storageBucket: "your-app.appspot.com",
                messagingSenderId: "123456",
                appId: "1:123456:web:123"
            };
            firebase.initializeApp(firebaseConfig);
            const auth = firebase.auth();
            const db = firebase.firestore();

            let currentUser = null;

            async function login() {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                currentUser = result.user;
                document.getElementById('login-btn').innerText = currentUser.displayName;
                loadMessages();
            }

            async function loadMessages() {
                if(!currentUser) return;
                const snapshot = await db.collection('chats').doc(currentUser.uid).collection('messages').orderBy('time').get();
                const container = document.getElementById('chat-container');
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    appendMessage(data.text, data.role);
                });
            }

            async function send() {
                const text = document.getElementById('userInput').value;
                if(!text || !currentUser) return;

                appendMessage(text, 'user');
                document.getElementById('userInput').value = '';

                // حفظ في Firebase
                await db.collection('chats').doc(currentUser.uid).collection('messages').add({
                    text: text, role: 'user', time: Date.now()
                });

                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });
                const data = await res.json();
                
                appendMessage(data.reply, 'ai');
                
                await db.collection('chats').doc(currentUser.uid).collection('messages').add({
                    text: data.reply, role: 'ai', time: Date.now()
                });
            }

            function appendMessage(text, role) {
                const msg = document.createElement('div');
                msg.className = 'message ' + (role === 'user' ? 'user' : 'ai');
                msg.innerText = text;
                document.getElementById('chat-container').appendChild(msg);
                document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;
            }
        </script>
    </body>
    </html>
  `);
});

app.post('/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(req.body.message);
        res.json({ reply: (await result.response).text() });
    } catch (e) { res.status(500).send("Error"); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('SUIMAI Ready!'));

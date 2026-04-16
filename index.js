const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// المفتاح الخاص بك
const API_KEY = "AIzaSyBU_P-r_rzIdH8Q2bKpOEN6x1gdmwIEWfA";
const genAI = new GoogleGenerativeAI(API_KEY);

// هنا تضع تصميمك الذي يعجبك
app.get('/', (req, res) => {
  // استبدل النص بين العلامتين ` ` بكود الـ HTML و CSS الخاص بك بالكامل
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SUIMAI</title>
        </head>
    <body>
        

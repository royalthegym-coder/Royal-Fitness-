require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Webhook Endpoint for Supabase Database Triggers
app.post('/webhook/new-admission', async (req, res) => {
    try {
        const { record, type } = req.body;
        
        if (type === 'INSERT') {
            console.log(`New user registered: ${record.name}`);
            
            // 2. Automation Logic: Send WhatsApp Welcome Message
            // e.g., using Baileys or Twilio
            await sendWhatsAppMessage(record.phone, `Welcome to Fitness Future, ${record.name}!`);
            
            // 3. Call Python Backend to Generate Diet Plan
            const fetch = (await import('node-fetch')).default;
            await fetch(`${process.env.PYTHON_BACKEND_URL}/api/generate-diet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: record.id,
                    weight: record.weight,
                    height: record.height,
                    goal: record.goals
                })
            });
        }
        res.status(200).send('Webhook processed');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Mock WhatsApp function
async function sendWhatsAppMessage(phone, message) {
    console.log(`[WhatsApp] To ${phone}: ${message}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node.js Automation Service running on port ${PORT}`);
});

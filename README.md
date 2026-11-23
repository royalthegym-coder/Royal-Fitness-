# Fitness Future Neural OS

Welcome to the fully automated, ₹0 cost Gym Management System.

## Architecture
- **Backend**: NestJS + PostgreSQL
- **AI Engine**: Python + FastAPI + Groq (Llama 3)
- **WhatsApp Bot**: Baileys (Node.js)
- **Churn Prediction**: Python + Scikit-Learn
- **Workflows**: n8n
- **Frontend**: React + Vite

## Prerequisites
- Docker & Docker Compose
- Node.js (for local CLI)
- Python 3.11+

## Getting Started

1. **Environment Variables**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   GROQ_API_KEY=your_groq_api_key
   N8N_API_KEY=your_n8n_api_key
   JWT_SECRET=your_jwt_secret
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=fitness_future
   ```

2. **Install CLI Tool**
   ```bash
   cd cli/fitness-os
   npm install -g .
   ```

3. **Start the System**
   ```bash
   fitness-os up
   ```

4. **Import n8n Workflows**
   ```bash
   cd infra/n8n/workflows
   bash import-all.sh
   ```

5. **Connect WhatsApp**
   Check the logs of the WhatsApp bot to scan the QR code:
   ```bash
   fitness-os logs whatsapp-bot
   ```

6. **Access Services**
   - Frontend: http://localhost:5173 (Run `npm run dev` in `apps/web-client`)
   - Backend API: http://localhost:3001
   - AI Engine: http://localhost:8000
   - n8n: http://localhost:5678
   - Flowise: http://localhost:3002

## Zero Cost Strategy
- **Groq**: Free tier provides 14,400 requests/day.
- **Self-Hosting**: All components (n8n, Flowise, ChromaDB, Postgres) run locally via Docker.
- **WhatsApp**: Unofficial Baileys library bypasses official API costs.

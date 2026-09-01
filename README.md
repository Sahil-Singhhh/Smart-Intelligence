# Smart Revision & Test Planner
LIVE DEMO-https://smart-intelligence-eight.vercel.app/
A production-ready exam preparation tool where the AI directs what, how, and when to study.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **AI Engine**: Custom rule-based logic for spaced repetition and performance analysis.

## Prerequisites
- Node.js
- MongoDB (running locally or cloud URI)

## Installation

1. **Clone/Navigate to project**
   ```bash
   cd smart-revision-planner
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Create .env (already done if using provided code)
   # Run Seed Data (Optional)
   node seed.js
   # Start Server
   npm run dev
   ```
   Server runs on `http://localhost:5000`.

3. **Frontend Setup**
   Open a new terminal.
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`.

## Usage
1. Open Frontend (`http://localhost:5173`).
2. Login with `student@example.com` / `password123` (if seeded) or Register.
3. **Dashboard**: View your daily AI direction.
4. **Add Topic**: Add subjects you are studying.
5. **Take Test**: Log your test attempts.
6. **See Magic**: The AI will update your revision plan based on your scores!

## Project Structure
- `server/ai-engine`: Contains the core logic for Classification, Revision Strategy, and Scheduling.
- `client/src/pages`: React components for UI.

## AI Logic
- **Weak (<50%)**: Revise tomorrow. Focus on concepts.
- **Medium (50-75%)**: Revise in 3 days. Focus on notes.
- **Strong (>75%)**: Revise in 7 days. Quick review.

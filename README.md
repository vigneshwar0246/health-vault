# Health Hub Connect 🏥

Health Hub Connect is a comprehensive, modern digital health records management system. It empowers patients to securely store, manage, and analyze their medical information using AI-driven insights.

## 🌟 Key Features

### 💻 Frontend (Patient Dashboard)
- **Health Dashboard**: Real-time overview of vitals, upcoming appointments, and recent activities.
- **Medical Reports Management**: Securely upload and organize lab results, prescriptions, and scans.
- **AI-Powered Chatbot**: A health assistant integrated with Google Gemini for answering health-related queries.
- **Smart Report Summarization**: Automatically extracts and summarizes critical data from uploaded medical documents.
- **Appointment Tracking**: Keep track of upcoming doctor visits and history.
- **Medication Reminders**: Manage prescriptions and set alerts for medication schedules.
- **Family Profiles**: Manage health records for multiple family members under a single account.
- **Data Export**: Generate comprehensive health summaries and export them as PDFs.
- **Secure Authentication**: Robust login and registration system with profile management.

### ⚙️ Backend (API & Processing)
- **RESTful API**: Built with Node.js and Express for seamless data flow.
- **AI Integration**: Leverages Google Gemini (Vertex AI) for intelligent report analysis and chatbot interactions.
- **OCR & PDF Processing**: High-performance extraction of text from medical PDFs and images.
- **Background Worker**: Dedicated processing of heavy AI tasks to ensure UI responsiveness.
- **Security**: JWT-based authentication and Bcrypt password hashing.
- **Activity Logging**: Detailed tracking of system actions for auditing and history.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router](https://reactrouter.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/))
- **AI/ML**: [Google Generative AI](https://ai.google.dev/) (Gemini)
- **Authentication**: [JWT](https://jwt.io/), Google Auth
- **File Storage**: Multer (Local storage)
- **Parsing**: Tesseract.js (OCR), PDF-Parse, PDF-Lib

## 📁 Project Structure

```text
health-hub/
├── backend/            # Express server and business logic
│   ├── lib/            # Shared utilities and AI wrappers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   ├── uploads/        # Stored medical reports
│   └── server.js       # Entry point
├── src/                # React frontend source
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application views/screens
│   ├── contexts/       # React contexts (Auth, Theme)
│   ├── hooks/          # Custom React hooks
│   └── App.tsx         # Main application component
├── public/             # Static assets
└── package.json        # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally OR a MongoDB Atlas URI.
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) (for AI features).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vigneshwar0246/health-vault.git
   cd health-vault
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory (see [Environment Variables](#environment-variables)).

3. **Setup Frontend:**
   ```bash
   cd ..
   npm install
   ```

### Running the Application

1. **Start Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Console:**
   ```bash
   cd ..
   npm run dev
   ```
   The app will be available at `http://localhost:8080` (or similar Vite port).

## 🔑 Environment Variables

### Backend (`/backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthhub
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_CLIENT_ID=optional_for_google_login
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Created with ❤️ by Vigneshwar

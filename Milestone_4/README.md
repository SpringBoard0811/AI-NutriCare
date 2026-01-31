# AI NutriCare – Milestone 4  
## Frontend & Backend Implementation

This repository contains the **Frontend and Backend implementation** for **Milestone 4** of the **AI NutriCare** project.  
The focus of this milestone is **full-stack integration**, **secure backend APIs**, and a **functional frontend dashboard**.



## 📁 Folder Structure
Milestone_4/
│
├── backend/
│ ├── app/
│ │ └── main.py
│ ├── models/
│ ├── temp_uploads/
│ ├── outputs/
│ ├── requirements.txt
│ └── .gitignore
│
└── frontend/
└── App/
├── src/
│ ├── App.jsx
│ ├── App.css
│ ├── main.jsx
│ └── services/
├── index.html
├── package.json
└── vite.config.js



## 🔹 Backend (FastAPI)

### Description
The backend is developed using **FastAPI** and provides REST APIs for:

- Processing patient medical data  
- Predicting ICU risk using an LSTM model  
- Generating AI-based nutrition plans  
- Managing meal alternatives  
- Generating and downloading PDF reports  

---

### Key Features
- FastAPI-based RESTful APIs  
- PDF upload and medical data extraction  
- Manual patient data handling  
- Secure environment variable usage for API keys  
- CORS enabled for frontend integration  
- PDF report generation using **ReportLab**  

---

### Main Backend File

---

### Environment Variables

Create a `.env` file inside the backend folder:

Add:
```env
GROQ_API_KEY=your_groq_api_key_here
cd Milestone_4/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
http://127.0.0.1:8000

---
```
## 🔹 Frontend (React + Vite)

### Description
The frontend is built using **React (Vite)** and provides an interactive user interface to:

- Upload medical reports
- Enter patient data manually
- View personalized nutrition plans
- Track daily progress
- Manage medication reminders
- Download generated PDF reports 

---

### Key Features
- Modern React UI using Vite
- Dynamic state management
- Backend API integration using Fetch
- Patient dashboard with vitals and diet plan
- Medication reminder management
- Responsive and clean user interface 

---
```
cd Milestone_4/frontend/App
npm install
npm run dev
http://localhost:5173

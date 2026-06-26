# 🚀 RetainIQ – AI-Powered HR Attrition Prediction & Employee Retention Platform

RetainIQ is an intelligent HR analytics platform that helps organizations identify employees at risk of attrition using Machine Learning and enables HR teams to take proactive retention actions through integrated meeting scheduling, analytics, and reporting.

---

## ✨ Features

### 🤖 AI Attrition Prediction

* Predict employee attrition risk using a trained Machine Learning model.
* Real-time probability score with risk categorization.
* Supports individual employee prediction.

### 📊 Interactive Dashboard

* Organization-wide workforce insights.
* Attrition trends and statistics.
* Employee distribution analytics.

### 👥 Employee Management

* Manage employee profiles.
* View complete employee information.
* Department and role management.

### 📈 What-If Simulator

* Simulate changes in employee attributes.
* Observe predicted impact on attrition risk.
* Helps HR evaluate retention strategies before implementation.

### ⚖ Employee Comparison

* Compare multiple employees side-by-side.
* Analyze differences in attrition factors.

### 📅 Smart Meeting Management

* Schedule retention discussions.
* Automatic Google Meet generation.
* Google Calendar integration.
* Gmail invitation support.
* Calendar (.ics) generation.
* Employee PDF report generation.

### 📄 Reports

* Export reports as PDF.
* Export employee data as CSV.
* HR analytics reporting.

### 🔐 Google Workspace Integration

* Google OAuth 2.0 authentication
* Google Calendar API
* Google Meet
* Gmail API

---

# 🛠 Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

## Backend

* FastAPI
* Python
* Scikit-learn
* Pandas
* NumPy

## Database

* Supabase (PostgreSQL)

## Machine Learning

* Random Forest Classifier
* Scikit-learn
* Joblib

## Integrations

* Google OAuth 2.0
* Google Calendar API
* Gmail API
* Google Meet

---

# 📂 Project Structure

```text
RetainIQ
│
├── frontend/        # Next.js frontend
├── backend/         # FastAPI backend
├── database/        # SQL scripts
├── ml/              # ML model & training
├── HR_Attrition.csv
└── README.md
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/karun-16/RetainIQ.git
cd RetainIQ
```

## Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

Backend runs on:

```
http://localhost:8000
```

---

# 🔑 Environment Variables

Create a `.env.local` file inside the `frontend` directory.

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

NEXT_PUBLIC_BASE_URL=http://localhost:3000

COOKIE_SECRET=YOUR_COOKIE_SECRET
```

---

# 📸 Screenshots

> Screenshots will be added after deployment.

---

# 🌐 Live Demo

Coming Soon (Vercel Deployment)

---

# 🎥 Demo Video

Coming Soon

---

# 📌 Future Improvements

* Microsoft Outlook Integration
* Slack Notifications
* AI Retention Recommendations
* Multi-organization Support
* Role-based Access Control
* Predictive Workforce Analytics
* Employee Feedback Analysis

---

# 👨‍💻 Author

**Karunya M**

B.Tech Computer Science Engineering

AI • Machine Learning • Full Stack Development

GitHub: https://github.com/karun-16

LinkedIn: *(Add your LinkedIn profile URL)*

---

# 📄 License

This project is developed for educational and portfolio purposes.

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- Python 3.10+
- Node.js v18+
- npm

---

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Carissa-Umoh/student-performance-system.git
cd student-performance-system
```

### 2. Set up the ML Service
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install flask pandas scikit-learn numpy joblib flask-cors
python train_model.py
```

### 3. Set up the Backend
```bash
cd ../backend
npm install
node index.js
```

### 4. Set up the Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## ▶️ Running the Project

You need **3 terminals** running simultaneously:

**Terminal 1 — ML Service:**
```bash
cd ml-service
venv\Scripts\activate
python app.py
```
Runs on: http://127.0.0.1:5000

**Terminal 2 — Backend:**
```bash
cd backend
node index.js
```
Runs on: http://127.0.0.1:5001

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```
Runs on: http://localhost:5173

---

## 👤 Demo Accounts

All accounts use password: `123456`

| Role | Email |
|------|-------|
| Student | chidera.okonkwo@pau.edu.ng |
| Student | amara.nwosu@pau.edu.ng |
| Student | emeka.eze@pau.edu.ng |
| Lecturer | c.smith@pau.edu.ng |
| Lecturer | a.bello@pau.edu.ng |
| Lecturer | j.obi@pau.edu.ng |
| Admin | admin@pau.edu.ng |

---

## 🧠 ML Model

- **Algorithm:** Random Forest Classifier
- **Accuracy:** 98%
- **Input:** CA Score (0-30), Participation (0-5), Exam Score (0-65)
- **Output:** Distinction / Pass / At Risk / Fail + Grade (A-F)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS, Recharts |
| Backend | Node.js, Express, SQLite |
| ML Service | Python, Flask, Scikit-learn |
| AI Chatbot | Cohere API |
| Version Control | Git, GitHub |

---

## 👩‍💻 Author

**Carissa Umoh**
Computer Science, Pan-Atlantic University
Final Year Project — 2025/2026
const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("students.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    math INTEGER NOT NULL,
    reading INTEGER NOT NULL,
    writing INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    code TEXT
  );

  CREATE TABLE IF NOT EXISTS course_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ca REAL NOT NULL,
    participation REAL NOT NULL,
    exam REAL,
    prediction TEXT,
    grade TEXT,
    total REAL,
    needed REAL,
    update_count INTEGER DEFAULT 0,
    date TEXT NOT NULL
  );
`);

// Seed demo users
const seedUsers = () => {
  const users = [
    // Students
    { name: "Chidera Okonkwo", email: "chidera.okonkwo@pau.edu.ng", password: "123456", role: "student" },
    { name: "Amara Nwosu", email: "amara.nwosu@pau.edu.ng", password: "123456", role: "student" },
    { name: "Emeka Eze", email: "emeka.eze@pau.edu.ng", password: "123456", role: "student" },
    { name: "Fatima Aliyu", email: "fatima.aliyu@pau.edu.ng", password: "123456", role: "student" },
    { name: "Tunde Adeyemi", email: "tunde.adeyemi@pau.edu.ng", password: "123456", role: "student" },
    { name: "Ngozi Okafor", email: "ngozi.okafor@pau.edu.ng", password: "123456", role: "student" },
    { name: "Blessing Uchenna", email: "blessing.uchenna@pau.edu.ng", password: "123456", role: "student" },
    { name: "Seun Fashola", email: "seun.fashola@pau.edu.ng", password: "123456", role: "student" },
    { name: "Kelechi Nnamdi", email: "kelechi.nnamdi@pau.edu.ng", password: "123456", role: "student" },
    { name: "Adaeze Mbah", email: "adaeze.mbah@pau.edu.ng", password: "123456", role: "student" },
    // Lecturers
    { name: "Dr. Chukwuemeka Smith", email: "c.smith@pau.edu.ng", password: "123456", role: "lecturer" },
    { name: "Dr. Aisha Bello", email: "a.bello@pau.edu.ng", password: "123456", role: "lecturer" },
    { name: "Prof. James Obi", email: "j.obi@pau.edu.ng", password: "123456", role: "lecturer" },
    // Admin
    { name: "Admin User", email: "admin@pau.edu.ng", password: "123456", role: "admin" },
  ];

  users.forEach((u) => {
    const exists = db.prepare("SELECT * FROM users WHERE email = ?").get(u.email);
    if (!exists) {
      db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(u.name, u.email, u.password, u.role);
    }
  });
};

const seedCourses = () => {
  const lecturers = {
    "c.smith@pau.edu.ng": [
      { name: "MTH101 — Mathematics I", code: "MTH101" },
      { name: "MTH102 — Mathematics II", code: "MTH102" },
    ],
    "a.bello@pau.edu.ng": [
      { name: "CSC101 — Introduction to Computer Science", code: "CSC101" },
    ],
    "j.obi@pau.edu.ng": [
      { name: "CSC102 — Programming Fundamentals", code: "CSC102" },
    ],
  };

  Object.entries(lecturers).forEach(([email, courses]) => {
    const lecturer = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!lecturer) return;

    courses.forEach((course) => {
      const exists = db.prepare("SELECT * FROM courses WHERE code = ? AND role = 'lecturer'").get(course.code);
      if (!exists) {
        db.prepare("INSERT INTO courses (name, user_id, role, code) VALUES (?, ?, ?, ?)").run(course.name, lecturer.id, "lecturer", course.code);
      }
    });
  });
};

const seedStudentScores = () => {
  const sampleScores = [
    // MTH101
    { studentEmail: "chidera.okonkwo@pau.edu.ng", courseCode: "MTH101", ca: 25, participation: 4 },
    { studentEmail: "amara.nwosu@pau.edu.ng", courseCode: "MTH101", ca: 12, participation: 2 },
    { studentEmail: "emeka.eze@pau.edu.ng", courseCode: "MTH101", ca: 20, participation: 3 },
    { studentEmail: "fatima.aliyu@pau.edu.ng", courseCode: "MTH101", ca: 7, participation: 1 },
    { studentEmail: "tunde.adeyemi@pau.edu.ng", courseCode: "MTH101", ca: 28, participation: 5 },
    // MTH102
    { studentEmail: "ngozi.okafor@pau.edu.ng", courseCode: "MTH102", ca: 18, participation: 3 },
    { studentEmail: "blessing.uchenna@pau.edu.ng", courseCode: "MTH102", ca: 10, participation: 2 },
    { studentEmail: "seun.fashola@pau.edu.ng", courseCode: "MTH102", ca: 22, participation: 4 },
    // CSC101
    { studentEmail: "kelechi.nnamdi@pau.edu.ng", courseCode: "CSC101", ca: 26, participation: 5 },
    { studentEmail: "adaeze.mbah@pau.edu.ng", courseCode: "CSC101", ca: 8, participation: 1 },
    { studentEmail: "chidera.okonkwo@pau.edu.ng", courseCode: "CSC101", ca: 24, participation: 4 },
    // CSC102
    { studentEmail: "tunde.adeyemi@pau.edu.ng", courseCode: "CSC102", ca: 15, participation: 3 },
    { studentEmail: "emeka.eze@pau.edu.ng", courseCode: "CSC102", ca: 9, participation: 2 },
    { studentEmail: "fatima.aliyu@pau.edu.ng", courseCode: "CSC102", ca: 27, participation: 5 },
  ];

  sampleScores.forEach((score) => {
    const student = db.prepare("SELECT * FROM users WHERE email = ?").get(score.studentEmail);
    if (!student) return;

    const lecturerCourse = db.prepare("SELECT * FROM courses WHERE code = ? AND role = 'lecturer'").get(score.courseCode);
    if (!lecturerCourse) return;

    const existingStudentCourse = db.prepare("SELECT * FROM courses WHERE code = ? AND user_id = ? AND role = 'student'").get(score.courseCode, student.id);
    let studentCourseId;

    if (!existingStudentCourse) {
      const result = db.prepare("INSERT INTO courses (name, user_id, role, code) VALUES (?, ?, ?, ?)").run(lecturerCourse.name, student.id, "student", score.courseCode);
      studentCourseId = result.lastInsertRowid;
    } else {
      studentCourseId = existingStudentCourse.id;
    }

    const existingScore = db.prepare("SELECT * FROM course_scores WHERE course_id = ? AND user_id = ?").get(studentCourseId, student.id);
    if (!existingScore) {
      const currentTotal = score.ca + score.participation;

      const getStanding = () => {
        if (currentTotal < 10) return "Fail";
        if (currentTotal < 15) return "At Risk";
        if (currentTotal < 25) return "Pass Possible";
        return "Distinction Possible";
      };

      const date = new Date().toLocaleDateString();
      db.prepare(`INSERT INTO course_scores (course_id, user_id, ca, participation, exam, prediction, grade, total, needed, update_count, date) VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
        .run(studentCourseId, student.id, score.ca, score.participation, 0, getStanding(), "", currentTotal, Math.max(0, 45 - currentTotal), date);
    }
  });
};

seedUsers();
seedCourses();
seedStudentScores();

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } else {
    res.json({ success: false, message: "Invalid email or password" });
  }
});

// Join course by code — MUST be before /courses/:userId
app.post("/courses/join", (req, res) => {
  const { code, user_id } = req.body;
  console.log("Join request received:", code, user_id);
  const course = db.prepare("SELECT * FROM courses WHERE code = ? AND role = 'lecturer'").get(code);
  console.log("Course found:", course);
  if (!course) return res.json({ success: false, message: "Invalid course code" });

  const existing = db.prepare("SELECT * FROM courses WHERE code = ? AND user_id = ? AND role = 'student'").get(code, user_id);
  if (existing) return res.json({ success: false, message: "You have already joined this course" });

  const result = db.prepare("INSERT INTO courses (name, user_id, role, code) VALUES (?, ?, ?, ?)").run(course.name, user_id, "student", code);
  res.json({ success: true, course: { id: result.lastInsertRowid, name: course.name, code } });
});

// Get course by code — MUST be before /courses/:userId
app.get("/courses/code/:code", (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE code = ? AND role = 'lecturer'").get(req.params.code);
  if (!course) return res.json({ success: false });
  res.json({ success: true, course });
});

// Get courses for a user
app.get("/courses/:userId", (req, res) => {
  const courses = db.prepare("SELECT * FROM courses WHERE user_id = ?").all(req.params.userId);
  res.json(courses);
});

// Add a course
app.post("/courses", (req, res) => {
  const { name, user_id, role } = req.body;
  const code = role === "lecturer" ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
  const result = db.prepare("INSERT INTO courses (name, user_id, role, code) VALUES (?, ?, ?, ?)").run(name, user_id, role, code);
  res.json({ id: result.lastInsertRowid, name, user_id, role, code });
});

// Delete a course
app.delete("/courses/:id", (req, res) => {
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
  db.prepare("DELETE FROM course_scores WHERE course_id = ?").run(req.params.id);
  res.json({ message: "Course deleted" });
});

// Save course scores and prediction
app.post("/course-scores", (req, res) => {
  const { course_id, user_id, ca, participation, exam, prediction, grade, total, needed } = req.body;
  const date = new Date().toLocaleDateString();

  const exists = db.prepare("SELECT * FROM course_scores WHERE course_id = ? AND user_id = ?").get(course_id, user_id);
  if (exists) {
    db.prepare(`UPDATE course_scores SET ca=?, participation=?, exam=?, prediction=?, grade=?, total=?, needed=?, update_count=update_count+1, date=? WHERE course_id=? AND user_id=?`)
      .run(ca, participation, exam, prediction, grade, total, needed, date, course_id, user_id);
  } else {
    db.prepare(`INSERT INTO course_scores (course_id, user_id, ca, participation, exam, prediction, grade, total, needed, update_count, date) VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
      .run(course_id, user_id, ca, participation, exam, prediction, grade, total, needed, date);
  }
  res.json({ message: "Scores saved" });
});

// Get scores for a course
app.get("/course-scores/:courseId", (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.courseId);
  if (!course) return res.json([]);
  
  const allCourseIds = db.prepare("SELECT id FROM courses WHERE code = ?").all(course.code).map(c => c.id);
  
  const placeholders = allCourseIds.map(() => "?").join(",");
  const scores = db.prepare(`
    SELECT cs.*, u.name as student_name 
    FROM course_scores cs 
    JOIN users u ON cs.user_id = u.id 
    WHERE cs.course_id IN (${placeholders})
  `).all(...allCourseIds);
  res.json(scores);
});

// Get all scores for a user
app.get("/my-scores/:userId", (req, res) => {
  const scores = db.prepare(`
    SELECT cs.*, c.name as course_name 
    FROM course_scores cs 
    JOIN courses c ON cs.course_id = c.id 
    WHERE cs.user_id = ?
  `).all(req.params.userId);
  res.json(scores);
});

// Get score update count
app.get("/score-updates/:courseId/:userId", (req, res) => {
  const score = db.prepare("SELECT * FROM course_scores WHERE course_id = ? AND user_id = ?").get(req.params.courseId, req.params.userId);
  res.json({ updates: score ? score.update_count || 0 : 0 });
});

// Old students endpoints
app.post("/students", (req, res) => {
  const { name, math, reading, writing, prediction } = req.body;
  const date = new Date().toLocaleDateString();
  const result = db.prepare(`INSERT INTO students (name, math, reading, writing, prediction, date) VALUES (?, ?, ?, ?, ?, ?)`).run(name, math, reading, writing, prediction, date);
  res.json({ message: "Student saved successfully", id: result.lastInsertRowid });
});

app.get("/students", (req, res) => {
  const students = db.prepare("SELECT * FROM students ORDER BY id DESC").all();
  res.json(students);
});

app.delete("/students/:id", (req, res) => {
  db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
  res.json({ message: "Student deleted" });
});

// AI Chatbot route
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    const response = await fetch("https://api.cohere.ai/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer pnQFr6UTP7bEeSKGlmaJ5pBaa88ohfn0hzO7yjmu",
      },
      body: JSON.stringify({
        model: "command-r-plus-08-2024",
        messages: [
          {
            role: "user",
            content: `You are an academic mentor helping students improve their performance. Answer clearly and educationally. Student asks: ${message}`,
          }
        ],
      }),
    });
    const data = await response.json();
    const reply = data.message?.content?.[0]?.text?.trim() || "Sorry, I could not get a response.";
    res.json({ reply });
  } catch (error) {
    console.log("Error:", error.message);
    res.json({ reply: "Error connecting to AI." });
  }
});

// Get all course scores for admin
app.get("/all-course-scores", (req, res) => {
  const scores = db.prepare(`
    SELECT cs.*, u.name as student_name, c.name as course_name
    FROM course_scores cs
    JOIN users u ON cs.user_id = u.id
    JOIN courses c ON cs.course_id = c.id
    WHERE u.role = 'student'
  `).all();
  res.json(scores);
});

// Get all users
app.get("/users", (req, res) => {
  const users = db.prepare("SELECT id, name, email, role FROM users").all();
  res.json(users);
});

app.listen(5001, () => {
  console.log("Backend running on https://saps-backend-qcci.onrender.com");
});
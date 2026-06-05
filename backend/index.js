const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const { PythonShell } = require('python-shell');

const app = express();
app.use(cors());
app.use(express.json());

const isProduction = false;

let pool, db;

if (isProduction) {
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  const Database = require("better-sqlite3");
  db = new Database("students.db");
}

// Helper functions to work with both databases
const query = async (sql, params = []) => {
  if (isProduction) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
    const sqliteSql = sql.replace(/\$\d+/g, "?");
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return db.prepare(sqliteSql).all(...params);
    } else {
      return db.prepare(sqliteSql).run(...params);
    }
  }
};

const queryOne = async (sql, params = []) => {
  if (isProduction) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } else {
    const sqliteSql = sql.replace(/\$\d+/g, "?");
    return db.prepare(sqliteSql).get(...params) || null;
  }
};

const queryInsert = async (sql, params = []) => {
  if (isProduction) {
    const result = await pool.query(sql, params);
    return result.rows[0];
  } else {
    const sqliteSQL = sql
      .replace(/\$\d+/g, "?")
      .replace(" RETURNING id", "")
      .replace(" RETURNING *", "");
    const result = db.prepare(sqliteSQL).run(...params);
    return { id: result.lastInsertRowid, ...params };
  }
};

// Create tables
const initDB = async () => {
  if (isProduction) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        math INTEGER NOT NULL,
        reading INTEGER NOT NULL,
        writing INTEGER NOT NULL,
        prediction TEXT NOT NULL,
        date TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        code TEXT
      );
      CREATE TABLE IF NOT EXISTS course_scores (
        id SERIAL PRIMARY KEY,
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
  } else {
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
  }

  await seedUsers();
  await seedCourses();
  await seedStudentScores();
};

const seedUsers = async () => {
  const users = [
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
    { name: "Dr. Chukwuemeka Smith", email: "c.smith@pau.edu.ng", password: "123456", role: "lecturer" },
    { name: "Dr. Aisha Bello", email: "a.bello@pau.edu.ng", password: "123456", role: "lecturer" },
    { name: "Prof. James Obi", email: "j.obi@pau.edu.ng", password: "123456", role: "lecturer" },
    { name: "Admin User", email: "admin@pau.edu.ng", password: "123456", role: "admin" },
  ];

  for (const u of users) {
    const exists = await queryOne("SELECT * FROM users WHERE email = $1", [u.email]);
    if (!exists) {
      await queryInsert("INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id", [u.name, u.email, u.password, u.role]);
    }
  }
};

const seedCourses = async () => {
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

  for (const [email, courses] of Object.entries(lecturers)) {
    const lecturer = await queryOne("SELECT * FROM users WHERE email = $1", [email]);
    if (!lecturer) continue;

    for (const course of courses) {
      const exists = await queryOne("SELECT * FROM courses WHERE code = $1 AND role = 'lecturer'", [course.code]);
      if (!exists) {
        await queryInsert("INSERT INTO courses (name, user_id, role, code) VALUES ($1, $2, $3, $4) RETURNING id", [course.name, lecturer.id, "lecturer", course.code]);
      }
    }
  }
};

const seedStudentScores = async () => {
  const sampleScores = [
    { studentEmail: "chidera.okonkwo@pau.edu.ng", courseCode: "MTH101", ca: 25, participation: 4 },
    { studentEmail: "amara.nwosu@pau.edu.ng", courseCode: "MTH101", ca: 12, participation: 2 },
    { studentEmail: "emeka.eze@pau.edu.ng", courseCode: "MTH101", ca: 20, participation: 3 },
    { studentEmail: "fatima.aliyu@pau.edu.ng", courseCode: "MTH101", ca: 7, participation: 1 },
    { studentEmail: "tunde.adeyemi@pau.edu.ng", courseCode: "MTH101", ca: 28, participation: 5 },
    { studentEmail: "ngozi.okafor@pau.edu.ng", courseCode: "MTH102", ca: 18, participation: 3 },
    { studentEmail: "blessing.uchenna@pau.edu.ng", courseCode: "MTH102", ca: 10, participation: 2 },
    { studentEmail: "seun.fashola@pau.edu.ng", courseCode: "MTH102", ca: 22, participation: 4 },
    { studentEmail: "kelechi.nnamdi@pau.edu.ng", courseCode: "CSC101", ca: 26, participation: 5 },
    { studentEmail: "adaeze.mbah@pau.edu.ng", courseCode: "CSC101", ca: 8, participation: 1 },
    { studentEmail: "chidera.okonkwo@pau.edu.ng", courseCode: "CSC101", ca: 24, participation: 4 },
    { studentEmail: "tunde.adeyemi@pau.edu.ng", courseCode: "CSC102", ca: 15, participation: 3 },
    { studentEmail: "emeka.eze@pau.edu.ng", courseCode: "CSC102", ca: 9, participation: 2 },
    { studentEmail: "fatima.aliyu@pau.edu.ng", courseCode: "CSC102", ca: 27, participation: 5 },
  ];

  for (const score of sampleScores) {
    const student = await queryOne("SELECT * FROM users WHERE email = $1", [score.studentEmail]);
    if (!student) continue;

    const lecturerCourse = await queryOne("SELECT * FROM courses WHERE code = $1 AND role = 'lecturer'", [score.courseCode]);
    if (!lecturerCourse) continue;

    const existingStudentCourse = await queryOne("SELECT * FROM courses WHERE code = $1 AND user_id = $2 AND role = 'student'", [score.courseCode, student.id]);
    let studentCourseId;

    if (!existingStudentCourse) {
      const result = await queryInsert("INSERT INTO courses (name, user_id, role, code) VALUES ($1, $2, $3, $4) RETURNING id", [lecturerCourse.name, student.id, "student", score.courseCode]);
      studentCourseId = result.id || result.lastInsertRowid;
    } else {
      studentCourseId = existingStudentCourse.id;
    }

    const existingScore = await queryOne("SELECT * FROM course_scores WHERE course_id = $1 AND user_id = $2", [studentCourseId, student.id]);
    if (!existingScore) {
      const currentTotal = score.ca + score.participation;
      const getStanding = () => {
        if (currentTotal < 10) return "Fail";
        if (currentTotal < 15) return "At Risk";
        if (currentTotal < 25) return "Pass Possible";
        return "Distinction Possible";
      };
      const date = new Date().toLocaleDateString();
      await queryInsert(`INSERT INTO course_scores (course_id, user_id, ca, participation, exam, prediction, grade, total, needed, update_count, date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [studentCourseId, student.id, score.ca, score.participation, 0, getStanding(), "", currentTotal, Math.max(0, 45 - currentTotal), 0, date]);
    }
  }
};

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await queryOne("SELECT * FROM users WHERE email = $1 AND password = $2", [email, password]);
  if (user) {
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } else {
    res.json({ success: false, message: "Invalid email or password" });
  }
});

// Search courses
app.get("/courses/search", async (req, res) => {
  const { q } = req.query;
  if (isProduction) {
    const result = await pool.query("SELECT * FROM courses WHERE role = 'lecturer' AND (name ILIKE $1 OR code ILIKE $1)", [`%${q}%`]);
    res.json(result.rows);
  } else {
    const result = db.prepare("SELECT * FROM courses WHERE role = 'lecturer' AND (name LIKE ? OR code LIKE ?)").all(`%${q}%`, `%${q}%`);
    res.json(result);
  }
});

// Join course by code
app.post("/courses/join", async (req, res) => {
  const { code, user_id } = req.body;
  const course = await queryOne("SELECT * FROM courses WHERE code = $1 AND role = 'lecturer'", [code]);
  if (!course) return res.json({ success: false, message: "Invalid course code" });

  const existing = await queryOne("SELECT * FROM courses WHERE code = $1 AND user_id = $2 AND role = 'student'", [code, user_id]);
  if (existing) return res.json({ success: false, message: "You have already joined this course" });

  const result = await queryInsert("INSERT INTO courses (name, user_id, role, code) VALUES ($1, $2, $3, $4) RETURNING id", [course.name, user_id, "student", code]);
  res.json({ success: true, course: { id: result.id || result.lastInsertRowid, name: course.name, code } });
});

// Get course by code
app.get("/courses/code/:code", async (req, res) => {
  const course = await queryOne("SELECT * FROM courses WHERE code = $1 AND role = 'lecturer'", [req.params.code]);
  if (!course) return res.json({ success: false });
  res.json({ success: true, course });
});

// Get courses for a user
app.get("/courses/:userId", async (req, res) => {
  const courses = await query("SELECT * FROM courses WHERE user_id = $1", [req.params.userId]);
  res.json(courses);
});

// Add a course
app.post("/courses", async (req, res) => {
  const { name, user_id, role } = req.body;
  const code = role === "lecturer" ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
  const result = await queryInsert("INSERT INTO courses (name, user_id, role, code) VALUES ($1, $2, $3, $4) RETURNING *", [name, user_id, role, code]);
  res.json({ id: result.id || result.lastInsertRowid, name, user_id, role, code });
});

// Delete a course
app.delete("/courses/:id", async (req, res) => {
  await query("DELETE FROM courses WHERE id = $1", [req.params.id]);
  await query("DELETE FROM course_scores WHERE course_id = $1", [req.params.id]);
  res.json({ message: "Course deleted" });
});

// Save course scores
app.post("/course-scores", async (req, res) => {
  const { course_id, user_id, ca, participation, exam, prediction, grade, total, needed } = req.body;
  const date = new Date().toLocaleDateString();

  const exists = await queryOne("SELECT * FROM course_scores WHERE course_id = $1 AND user_id = $2", [course_id, user_id]);
  if (exists) {
    await query(`UPDATE course_scores SET ca=$1, participation=$2, exam=$3, prediction=$4, grade=$5, total=$6, needed=$7, update_count=update_count+1, date=$8 WHERE course_id=$9 AND user_id=$10`,
      [ca, participation, exam, prediction, grade, total, needed, date, course_id, user_id]);
  } else {
    await queryInsert(`INSERT INTO course_scores (course_id, user_id, ca, participation, exam, prediction, grade, total, needed, update_count, date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [course_id, user_id, ca, participation, exam, prediction, grade, total, needed, 0, date]);
  }
  res.json({ message: "Scores saved" });
});

// Get scores for a course
app.get("/course-scores/:courseId", async (req, res) => {
  const course = await queryOne("SELECT * FROM courses WHERE id = $1", [req.params.courseId]);
  if (!course) return res.json([]);

  let allCourseIds;
  if (isProduction) {
    const result = await pool.query("SELECT id FROM courses WHERE code = $1", [course.code]);
    allCourseIds = result.rows.map(c => c.id);
  } else {
    allCourseIds = db.prepare("SELECT id FROM courses WHERE code = ?").all(course.code).map(c => c.id);
  }

  if (allCourseIds.length === 0) return res.json([]);

  let scores;
  if (isProduction) {
    const placeholders = allCourseIds.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(`SELECT cs.*, u.name as student_name FROM course_scores cs JOIN users u ON cs.user_id = u.id WHERE cs.course_id IN (${placeholders})`, allCourseIds);
    scores = result.rows;
  } else {
    const placeholders = allCourseIds.map(() => "?").join(",");
    scores = db.prepare(`SELECT cs.*, u.name as student_name FROM course_scores cs JOIN users u ON cs.user_id = u.id WHERE cs.course_id IN (${placeholders})`).all(...allCourseIds);
  }
  res.json(scores);
});

// Get all scores for a user
app.get("/my-scores/:userId", async (req, res) => {
  const scores = await query(`SELECT cs.*, c.name as course_name FROM course_scores cs JOIN courses c ON cs.course_id = c.id WHERE cs.user_id = $1`, [req.params.userId]);
  res.json(scores);
});

// Get score update count
app.get("/score-updates/:courseId/:userId", async (req, res) => {
  const score = await queryOne("SELECT * FROM course_scores WHERE course_id = $1 AND user_id = $2", [req.params.courseId, req.params.userId]);
  res.json({ updates: score ? score.update_count || 0 : 0 });
});

// Old students endpoints
app.post("/students", async (req, res) => {
  const { name, math, reading, writing, prediction } = req.body;
  const date = new Date().toLocaleDateString();
  const result = await queryInsert("INSERT INTO students (name, math, reading, writing, prediction, date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [name, math, reading, writing, prediction, date]);
  res.json({ message: "Student saved successfully", id: result.id || result.lastInsertRowid });
});

app.get("/students", async (req, res) => {
  const students = await query("SELECT * FROM students ORDER BY id DESC", []);
  res.json(students);
});

app.delete("/students/:id", async (req, res) => {
  await query("DELETE FROM students WHERE id = $1", [req.params.id]);
  res.json({ message: "Student deleted" });
});

// AI Chatbot
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
        messages: [{ role: "user", content: `You are an academic mentor helping students improve their performance. Answer clearly and educationally. Student asks: ${message}` }],
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
app.get("/all-course-scores", async (req, res) => {
  const scores = await query(`SELECT cs.*, u.name as student_name, c.name as course_name FROM course_scores cs JOIN users u ON cs.user_id = u.id JOIN courses c ON cs.course_id = c.id WHERE u.role = 'student'`, []);
  res.json(scores);
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, role FROM users ORDER BY id");
    res.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.json([]);
  }
});

// ML Prediction endpoint
// ML Prediction endpoint using actual trained model
app.post("/predict", async (req, res) => {
  const { ca, participation, exam } = req.body;
  
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    args: [JSON.stringify({ ca, participation, exam })]
  };
  
  PythonShell.run('ml_predict.py', options).then(messages => {
    // messages is an array of strings printed to stdout
    const result = JSON.parse(messages[0]);
    res.json(result);
  }).catch(err => {
    console.error("Prediction error:", err);
    // Fallback to rule-based if ML fails
    const total = ca + participation + (exam || 0);
    let prediction, grade, needed;
    
    if (total >= 70) {
      prediction = "Distinction";
      grade = "A";
      needed = 0;
    } else if (total >= 60) {
      prediction = "Pass";
      grade = "B";
      needed = Math.ceil(70 - total);
    } else if (total >= 45) {
      prediction = "At Risk";
      grade = "C";
      needed = Math.ceil(60 - total);
    } else if (total >= 40) {
      prediction = "At Risk";
      grade = "D";
      needed = Math.ceil(45 - total);
    } else {
      prediction = "Fail";
      grade = "F";
      needed = Math.ceil(40 - total);
    }
    
    res.json({ prediction, grade, total, needed });
  });
});

initDB().then(() => {
  app.listen(5001, () => {
    console.log("Backend running on http://127.0.0.1:5001");
  });
}).catch(err => {
  console.error("Database connection failed:", err);
});
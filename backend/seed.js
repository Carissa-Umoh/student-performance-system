const Database = require("better-sqlite3");
const db = new Database("students.db");

console.log("Starting seed...");

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

console.log("Tables created");

// Insert users
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

const insertUser = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");

for (const user of users) {
  const result = insertUser.run(user.name, user.email, user.password, user.role);
  console.log(`Inserted ${user.name}: ${result.changes}`);
}

console.log("Seed complete!");

// Verify
const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log(`Total users in database: ${count.count}`);

const allUsers = db.prepare("SELECT * FROM users").all();
console.log("Users:", allUsers);
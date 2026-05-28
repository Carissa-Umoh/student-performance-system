const fetch = require("node-fetch");
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("students.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    math INTEGER NOT NULL,
    reading INTEGER NOT NULL,
    writing INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

app.post("/students", (req, res) => {
  const { name, math, reading, writing, prediction } = req.body;
  const date = new Date().toLocaleDateString();
  const stmt = db.prepare(`INSERT INTO students (name, math, reading, writing, prediction, date) VALUES (?, ?, ?, ?, ?, ?)`);
  const result = stmt.run(name, math, reading, writing, prediction, date);
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
    console.log("Cohere response:", JSON.stringify(data));
    const reply = data.message?.content?.[0]?.text?.trim() || "Sorry, I could not get a response.";
    res.json({ reply });
  } catch (error) {
    console.log("Error:", error.message);
    res.json({ reply: "Error connecting to AI." });
  }
});

app.listen(5001, () => {
  console.log("Backend running on http://127.0.0.1:5001");
});
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import Chatbot from "./Chatbot";
import Login from "./Login";
import Admin from "./Admin";
import Workspace from "./Workspace";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [name, setName] = useState("");
  const [math, setMath] = useState("");
  const [reading, setReading] = useState("");
  const [writing, setWriting] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    const res = await fetch("http://127.0.0.1:5001/students");
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleLogin = (loggedInUser) => setUser(loggedInUser);
  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  const handlePredict = async () => {
    if (!name || !math || !reading || !writing) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          math: Number(math),
          reading: Number(reading),
          writing: Number(writing),
        }),
      });
      const data = await res.json();
      setPrediction(data.prediction);
      await fetch("http://127.0.0.1:5001/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          math: Number(math),
          reading: Number(reading),
          writing: Number(writing),
          prediction: data.prediction,
        }),
      });
      fetchStudents();
    } catch (error) {
      setPrediction("Error connecting to API");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`http://127.0.0.1:5001/students/${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const getResultColor = (result) => {
    if (result === "Excellent") return "bg-green-100 text-green-700 border-green-400";
    if (result === "Average") return "bg-yellow-100 text-yellow-700 border-yellow-400";
    if (result === "At Risk") return "bg-red-100 text-red-700 border-red-400";
    return "bg-gray-100 text-gray-700";
  };

  const getResultBadge = (result) => {
    if (result === "Excellent") return "🟢";
    if (result === "Average") return "🟡";
    if (result === "At Risk") return "🔴";
    return "";
  };

  const getChartData = () => {
    const counts = { Excellent: 0, Average: 0, "At Risk": 0 };
    students.forEach((s) => { counts[s.prediction]++; });
    return [
      { name: "Excellent", value: counts.Excellent },
      { name: "Average", value: counts.Average },
      { name: "At Risk", value: counts["At Risk"] },
    ].filter((d) => d.value > 0);
  };

  const COLORS = ["#4ade80", "#facc15", "#f87171"];

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.role === "admin") return <Admin user={user} onLogout={handleLogout} />;

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-indigo-900 text-white flex flex-col p-6 gap-2">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">🎓 EduPredict</h2>
          <p className="text-indigo-300 text-xs mt-1">AI Performance System</p>
        </div>

        <div className="bg-indigo-800 rounded-xl p-3 mb-4">
          <p className="text-indigo-300 text-xs">Logged in as</p>
          <p className="text-white font-medium text-sm mt-1">{user.email}</p>
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block">Lecturer</span>
        </div>

        <button onClick={() => setPage("dashboard")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "dashboard" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📊</span> Dashboard
        </button>
        <button onClick={() => setPage("chatbot")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "chatbot" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>🤖</span> AI Mentor
        </button>
        <button onClick={() => setPage("workspace")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "workspace" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📚</span> AI Workspace
        </button>

        <div className="mt-auto">
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-800 transition flex items-center gap-3 text-indigo-200 text-sm">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        {page === "chatbot" ? (
          <Chatbot />
          ) : page === "workspace" ? (
          <Workspace />
        ) : (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-500 mt-1">Monitor and predict student performance</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🟢 Excellent</p>
                <p className="text-3xl font-bold text-green-500">{students.filter(s => s.prediction === "Excellent").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🟡 Average</p>
                <p className="text-3xl font-bold text-yellow-400">{students.filter(s => s.prediction === "Average").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🔴 At Risk</p>
                <p className="text-3xl font-bold text-red-400">{students.filter(s => s.prediction === "At Risk").length}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Predict Student Performance</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Student Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter student name" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Math Score</label>
                    <input type="number" value={math} onChange={(e) => setMath(e.target.value)} placeholder="0 - 100" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Reading Score</label>
                    <input type="number" value={reading} onChange={(e) => setReading(e.target.value)} placeholder="0 - 100" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Writing Score</label>
                    <input type="number" value={writing} onChange={(e) => setWriting(e.target.value)} placeholder="0 - 100" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                </div>
                <button onClick={handlePredict} disabled={loading} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200">
                  {loading ? "Predicting..." : "⚡ Predict Performance"}
                </button>
                {prediction && (
                  <div className={`mt-4 p-4 rounded-xl border-2 text-center text-xl font-bold ${getResultColor(prediction)}`}>
                    {getResultBadge(prediction)} {prediction}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Breakdown</h2>
                {students.length === 0 ? (
                  <div className="text-center">
                    <p className="text-4xl mb-2">📊</p>
                    <p className="text-gray-400">Add students to see chart</p>
                  </div>
                ) : (
                  <PieChart width={300} height={300}>
                    <Pie data={getChartData()} cx={145} cy={120} outerRadius={50} dataKey="value" paddingAngle={3}>
                      {getChartData().map((entry, index) => (
                        <Cell key={index} fill={COLORS[["Excellent", "Average", "At Risk"].indexOf(entry.name)]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                    <Legend iconType="circle" />
                  </PieChart>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Student Records</h2>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">👥</p>
                  <p className="text-gray-400">No students yet. Add one above!</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Math</th>
                      <th className="pb-3 font-medium">Reading</th>
                      <th className="pb-3 font-medium">Writing</th>
                      <th className="pb-3 font-medium">Result</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="py-3 text-gray-600">{s.math}</td>
                        <td className="py-3 text-gray-600">{s.reading}</td>
                        <td className="py-3 text-gray-600">{s.writing}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getResultColor(s.prediction)}`}>
                            {getResultBadge(s.prediction)} {s.prediction}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{s.date}</td>
                        <td className="py-3">
                          <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
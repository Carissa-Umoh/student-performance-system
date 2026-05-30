import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import Chatbot from "./Chatbot";
import Admin from "./Admin";
import LecturerDashboard from "./LecturerDashboard";
import Workspace from "./Workspace";
import StudentDashboard from "./StudentDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [name, setName] = useState("");
  const [ca, setCa] = useState("");
  const [participation, setParticipation] = useState("");
  const [exam, setExam] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    const res = await fetch("https://saps-backend-qcci.onrender.com/students");
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleLogin = async () => {
    const res = await fetch("https://saps-backend-qcci.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      setLoginError("");
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  const handlePredict = async () => {
    if (!name || !ca || !participation || !exam) {
      alert("Please fill in all fields");
      return;
    }
    if (Number(ca) > 30) { alert("CA score cannot exceed 30"); return; }
    if (Number(participation) > 5) { alert("Participation cannot exceed 5"); return; }
    if (Number(exam) > 65) { alert("Exam score cannot exceed 65"); return; }

    setLoading(true);
    try {
      const res = await fetch("https://saps-ml.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ca: Number(ca),
          participation: Number(participation),
          exam: Number(exam),
        }),
      });
      const data = await res.json();
      setPrediction(data);

      await fetch("https://saps-backend-qcci.onrender.com/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          math: Number(ca),
          reading: Number(participation),
          writing: Number(exam),
          prediction: data.prediction,
        }),
      });

      fetchStudents();
    } catch (error) {
      setPrediction(null);
      alert("Error connecting to API");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await fetch(`https://saps-backend-qcci.onrender.com/students/${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const getResultColor = (result) => {
    if (result === "Distinction") return "bg-green-100 text-green-700 border-green-400";
    if (result === "Pass") return "bg-blue-100 text-blue-700 border-blue-400";
    if (result === "At Risk") return "bg-yellow-100 text-yellow-700 border-yellow-400";
    if (result === "Fail") return "bg-red-100 text-red-700 border-red-400";
    return "bg-gray-100 text-gray-700";
  };

  const getResultBadge = (result) => {
    if (result === "Distinction") return "🟢";
    if (result === "Pass") return "🔵";
    if (result === "At Risk") return "🟡";
    if (result === "Fail") return "🔴";
    return "";
  };

  const getChartData = () => {
    const counts = { Distinction: 0, Pass: 0, "At Risk": 0, Fail: 0 };
    students.forEach((s) => { if (counts[s.prediction] !== undefined) counts[s.prediction]++; });
    return [
      { name: "Distinction", value: counts.Distinction },
      { name: "Pass", value: counts.Pass },
      { name: "At Risk", value: counts["At Risk"] },
      { name: "Fail", value: counts.Fail },
    ].filter((d) => d.value > 0);
  };

  const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171"];

  // Login page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-blue-500 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-4xl font-bold text-white">EduPredict</h1>
            <p className="text-indigo-200 mt-2">AI-Powered Student Performance System</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">EduPredict Login</h2>
            <p className="text-gray-400 text-sm mb-6">Sign in with your university credentials. Contact your administrator if you need access.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter your email" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Enter your password" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
              </div>
            </div>

            {loginError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-500 text-sm text-center">{loginError}</p>
              </div>
            )}

            <button onClick={handleLogin} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200 text-lg">
              Sign In
            </button>

            
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "student") return <StudentDashboard user={user} onLogout={handleLogout} />;
  if (user.role === "lecturer") return <LecturerDashboard user={user} onLogout={handleLogout} />;
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
                <p className="text-sm text-gray-500 mb-1">🟢 Distinction</p>
                <p className="text-3xl font-bold text-green-500">{students.filter(s => s.prediction === "Distinction").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🔵 Pass</p>
                <p className="text-3xl font-bold text-blue-400">{students.filter(s => s.prediction === "Pass").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🔴 Fail</p>
                <p className="text-3xl font-bold text-red-400">{students.filter(s => s.prediction === "Fail").length}</p>
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">CA Score <span className="text-gray-400">(out of 30)</span></label>
                    <input type="number" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="0 - 30" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Participation <span className="text-gray-400">(out of 5)</span></label>
                    <input type="number" value={participation} onChange={(e) => setParticipation(e.target.value)} placeholder="0 - 5" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Exam Score <span className="text-gray-400">(out of 65)</span></label>
                    <input type="number" value={exam} onChange={(e) => setExam(e.target.value)} placeholder="0 - 65" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                  </div>
                </div>
                <button onClick={handlePredict} disabled={loading} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200">
                  {loading ? "Predicting..." : "⚡ Predict Performance"}
                </button>

                {prediction && (
                  <div className={`mt-4 p-4 rounded-xl border-2 ${getResultColor(prediction.prediction)}`}>
                    <div className="text-center text-xl font-bold mb-3">
                      {getResultBadge(prediction.prediction)} {prediction.prediction} — Grade {prediction.grade}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-gray-500">Total Score</p>
                        <p className="font-bold text-lg">{prediction.total}/100</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-gray-500">To Next Grade</p>
                        <p className="font-bold text-lg">{prediction.needed > 0 ? `+${prediction.needed}` : "Top Grade!"}</p>
                      </div>
                    </div>
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
                    <Pie data={getChartData()} cx={145} cy={120} outerRadius={100} innerRadius={50} dataKey="value" paddingAngle={3}>
                      {getChartData().map((entry, index) => (
                        <Cell key={index} fill={COLORS[["Distinction", "Pass", "At Risk", "Fail"].indexOf(entry.name)]} />
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
                      <th className="pb-3 font-medium">CA</th>
                      <th className="pb-3 font-medium">Participation</th>
                      <th className="pb-3 font-medium">Exam</th>
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
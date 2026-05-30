import sapsLogo from "./assets/saps-logo.png";
import { useState, useEffect } from "react";
import Chatbot from "./Chatbot";
import Workspace from "./Workspace";

function LecturerDashboard({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [activeCourse, setActiveCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [name, setName] = useState("");
  const [ca, setCa] = useState("");
  const [participation, setParticipation] = useState("");
  const [exam, setExam] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    const res = await fetch(`https://saps-backend-qcci.onrender.com/courses/${user.id}`);
    const data = await res.json();
    const coursesWithCounts = await Promise.all(data.map(async (course) => {
      const scoresRes = await fetch(`https://saps-backend-qcci.onrender.com/course-scores/${course.id}`);
      const scores = await scoresRes.json();
      const atRiskCount = scores.filter(s => s.prediction === "At Risk" || s.prediction === "Fail").length;
      return { ...course, atRiskCount };
    }));
    setCourses(coursesWithCounts);
  };

  const fetchCourseStudents = async (courseId) => {
    const res = await fetch(`https://saps-backend-qcci.onrender.com/course-scores/${courseId}`);
    const data = await res.json();
    setCourseStudents(data);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async () => {
    if (!newCourse.trim()) return;
    await fetch("https://saps-backend-qcci.onrender.com/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCourse, user_id: user.id, role: "lecturer" }),
    });
    setNewCourse("");
    fetchCourses();
  };

  const handleDeleteCourse = async (id) => {
    await fetch(`https://saps-backend-qcci.onrender.com/courses/${id}`, { method: "DELETE" });
    fetchCourses();
    if (activeCourse?.id === id) {
      setActiveCourse(null);
      setCourseStudents([]);
    }
  };

  const handleSelectCourse = (course) => {
    setActiveCourse(course);
    fetchCourseStudents(course.id);
    setPrediction(null);
    setName(""); setCa(""); setParticipation(""); setExam("");
  };

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

    } catch (error) {
      alert("Error connecting to API");
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (courseStudents.length === 0) {
      alert("No students to export");
      return;
    }
    const headers = ["Name", "CA", "Participation", "Total", "Standing", "Date"];
    const rows = courseStudents.map(s => [
      s.student_name,
      s.ca,
      s.participation,
      s.total,
      s.prediction,
      s.date
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeCourse?.name || "students"}_report.csv`;
    a.click();
  };

  const getResultColor = (result) => {
    if (result === "Distinction" || result === "Distinction Possible") return "bg-green-100 text-green-700 border-green-400";
    if (result === "Pass" || result === "Pass Possible") return "bg-blue-100 text-blue-700 border-blue-400";
    if (result === "At Risk") return "bg-yellow-100 text-yellow-700 border-yellow-400";
    if (result === "Fail") return "bg-red-100 text-red-700 border-red-400";
    return "bg-gray-100 text-gray-700";
  };

  const getResultBadge = (result) => {
    if (result === "Distinction" || result === "Distinction Possible") return "🟢";
    if (result === "Pass" || result === "Pass Possible") return "🔵";
    if (result === "At Risk") return "🟡";
    if (result === "Fail") return "🔴";
    return "";
  };

  const getDistribution = () => {
    const counts = { "Distinction Possible": 0, "Pass Possible": 0, "At Risk": 0, "Fail": 0 };
    courseStudents.forEach((s) => {
      if (counts[s.prediction] !== undefined) counts[s.prediction]++;
      else counts["At Risk"]++;
    });
    return counts;
  };

  const atRiskStudents = courseStudents.filter(s => s.prediction === "At Risk" || s.prediction === "Fail");

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-indigo-900 text-white flex flex-col p-6 gap-2">
        <div className="mb-6">
          <div className="flex items-center gap-1 mb-0"><img src={sapsLogo} alt="SAPS" className="w-20 h-20 object-contain" /><h2 className="text-2xl font-bold">SAPS</h2></div>
          <p className="text-indigo-300 text-xs mt-1">Student Academic Performance and Prediction System</p>
        </div>

        <div className="bg-indigo-800 rounded-xl p-3 mb-4">
          <p className="text-indigo-300 text-xs">Logged in as</p>
          <p className="text-white font-medium text-sm mt-1">{user.name}</p>
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block">Lecturer</span>
        </div>

        <button onClick={() => setPage("dashboard")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "dashboard" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📊</span> Dashboard
        </button>
        <button onClick={() => setPage("chatbot")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "chatbot" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          AI Mentor
        </button>
        <button onClick={() => setPage("workspace")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "workspace" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📚</span> AI Workspace
        </button>

        <div className="mt-auto">
          <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-800 transition flex items-center gap-3 text-indigo-200 text-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        {page === "chatbot" ? <Chatbot /> : page === "workspace" ? <Workspace /> : (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}! 👋</h1>
              <p className="text-gray-500 mt-1">Manage your courses and monitor student performance</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">My Courses</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    placeholder="Add a course e.g. Mathematics"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCourse()}
                  />
                  <button onClick={handleAddCourse} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
                    Add
                  </button>
                </div>

                <div className="space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No courses yet. Add one above!</p>
                  ) : (
                    courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => handleSelectCourse(course)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${activeCourse?.id === course.id ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">📖 {course.name}</span>
                          <div className="flex items-center gap-2">
                            {course.atRiskCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                ⚠️ {course.atRiskCount}
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        {course.code && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-gray-400">Course Code:</span>
                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{course.code}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {activeCourse ? `📊 ${activeCourse.name} — Student Distribution` : "📊 Student Distribution"}
                </h2>
                {!activeCourse ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-4xl mb-2">👈</p>
                    <p className="text-gray-400">Select a course to see distribution</p>
                  </div>
                ) : courseStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-4xl mb-2">👥</p>
                    <p className="text-gray-400">No students have checked their standing yet</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(getDistribution()).map(([key, value]) => (
                        <div key={key} className={`p-4 rounded-xl border-2 text-center ${getResultColor(key)}`}>
                          <p className="text-2xl font-bold">{value}</p>
                          <p className="text-sm font-medium">{getResultBadge(key)} {key}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <p className="text-sm text-gray-500">Class Average CA Score</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {courseStudents.length > 0 ? (courseStudents.reduce((sum, s) => sum + s.ca, 0) / courseStudents.length).toFixed(1) : 0}/30
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeCourse && atRiskStudents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-red-700">⚠️ Students Needing Attention in {activeCourse.name}</h2>
                  <button
                    onClick={handleExport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition"
                  >
                    📥 Export CSV
                  </button>
                </div>
                <div className="space-y-2">
                  {atRiskStudents.map((s) => (
                    <div key={s.id} className="bg-white rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">{s.student_name}</p>
                        <p className="text-xs text-gray-500">CA: {s.ca}/30 · Participation: {s.participation}/5 · Total: {s.total}/35</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getResultColor(s.prediction)}`}>
                        {getResultBadge(s.prediction)} {s.prediction}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCourse && courseStudents.length > 0 && atRiskStudents.length === 0 && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleExport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition"
                >
                  📥 Export CSV
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ⚡ Manual Prediction {activeCourse ? `— ${activeCourse.name}` : ""}
              </h2>
              {!activeCourse && (
                <p className="text-gray-400 text-sm mb-4">Select a course first to save the prediction to that course</p>
              )}
              <div className="grid grid-cols-2 gap-4">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default LecturerDashboard;
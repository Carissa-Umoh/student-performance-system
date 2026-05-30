import { useState, useEffect } from "react";
import Chatbot from "./Chatbot";

function StudentDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [scores, setScores] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [activeCourse, setActiveCourse] = useState(null);
  const [ca, setCa] = useState("");
  const [participation, setParticipation] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("dashboard");

  const fetchCourses = async () => {
    const res = await fetch(`https://saps-backend-qcci.onrender.com/courses/${user.id}`);
    const data = await res.json();
    setCourses(data);
  };

  const fetchScores = async () => {
    const res = await fetch(`https://saps-backend-qcci.onrender.com/my-scores/${user.id}`);
    const data = await res.json();
    setScores(data);
  };

  useEffect(() => {
    fetchCourses();
    fetchScores();
  }, []);

  const handleAddCourse = async () => {
    if (!newCourse.trim()) return;
    const res = await fetch("https://saps-backend-qcci.onrender.com/courses/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: newCourse.toUpperCase(), user_id: user.id }),
    });
    const data = await res.json();
    if (data.success) {
      setNewCourse("");
      fetchCourses();
    } else {
      alert(data.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    await fetch(`https://saps-backend-qcci.onrender.com/courses/${id}`, { method: "DELETE" });
    fetchCourses();
    fetchScores();
  };

  const handlePredict = async () => {
    if (!ca || !participation) {
      alert("Please enter CA and Participation scores");
      return;
    }
    if (Number(ca) > 30) { alert("CA score cannot exceed 30"); return; }
    if (Number(participation) > 5) { alert("Participation cannot exceed 5"); return; }

    const score = getCourseScore(activeCourse.id);
    if (score && score.update_count >= 1) {
      alert("You have already updated your scores once. Scores are now locked.");
      return;
    }

    if (score && score.update_count === 0) {
      const confirm = window.confirm("Are you sure you want to update your scores? You can only update once.");
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const caNum = Number(ca);
      const partNum = Number(participation);
      const currentTotal = caNum + partNum;
      const maxPossible = currentTotal + 65;

      const getStanding = () => {
        if (currentTotal < 10) return "Fail";
        if (currentTotal < 15) return "At Risk";
        if (currentTotal < 25) return "Pass Possible";
        return "Distinction Possible";
      };

      const neededForE = Math.max(0, 40 - currentTotal);
      const neededForD = Math.max(0, 45 - currentTotal);
      const neededForC = Math.max(0, 50 - currentTotal);
      const neededForB = Math.max(0, 60 - currentTotal);
      const neededForA = Math.max(0, 70 - currentTotal);

      const result = {
        currentTotal,
        maxPossible,
        prediction: getStanding(),
        neededForE: neededForE > 65 ? "Not possible" : neededForE,
        neededForD: neededForD > 65 ? "Not possible" : neededForD,
        neededForC: neededForC > 65 ? "Not possible" : neededForC,
        neededForB: neededForB > 65 ? "Not possible" : neededForB,
        neededForA: neededForA > 65 ? "Not possible" : neededForA,
      };

      setPrediction(result);

      await fetch("https://saps-backend-qcci.onrender.com/course-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: activeCourse.id,
          user_id: user.id,
          ca: caNum,
          participation: partNum,
          exam: 0,
          prediction: getStanding(),
          grade: "",
          total: currentTotal,
          needed: neededForD > 65 ? 0 : neededForD,
        }),
      });

      fetchScores();
    } catch (error) {
      alert("Error connecting to API");
    }
    setLoading(false);
  };

  const getResultColor = (result) => {
    if (result === "Distinction Possible") return "bg-green-100 text-green-700 border-green-400";
    if (result === "Pass Possible") return "bg-blue-100 text-blue-700 border-blue-400";
    if (result === "At Risk") return "bg-yellow-100 text-yellow-700 border-yellow-400";
    if (result === "Fail") return "bg-red-100 text-red-700 border-red-400";
    return "bg-gray-100 text-gray-700";
  };

  const getResultBadge = (result) => {
    if (result === "Distinction Possible") return "🟢";
    if (result === "Pass Possible") return "🔵";
    if (result === "At Risk") return "🟡";
    if (result === "Fail") return "🔴";
    return "";
  };

  const getCourseScore = (courseId) => {
    return scores.find(s => s.course_id === courseId);
  };

  const isLocked = (courseId) => {
    const score = getCourseScore(courseId);
    return score && score.update_count >= 1;
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-indigo-900 text-white flex flex-col p-6 gap-2">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">🎓 EduPredict</h2>
          <p className="text-indigo-300 text-xs mt-1">AI Performance System</p>
        </div>

        <div className="bg-indigo-800 rounded-xl p-3 mb-4">
          <p className="text-indigo-300 text-xs">Logged in as</p>
          <p className="text-white font-medium text-sm mt-1">{user.name}</p>
          <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block">Student</span>
        </div>

        <button onClick={() => setPage("dashboard")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "dashboard" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📊</span> My Dashboard
        </button>
        <button onClick={() => setPage("chatbot")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "chatbot" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>🤖</span> AI Mentor
        </button>

        <div className="mt-auto">
          <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-800 transition flex items-center gap-3 text-indigo-200 text-sm">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50">
        {page === "chatbot" ? <Chatbot /> :
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name} 👋</h1>
            <p className="text-gray-500 mt-1">Track your performance across all your courses</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-indigo-600">{courses.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">🟢 On Track</p>
              <p className="text-3xl font-bold text-green-500">{scores.filter(s => s.prediction === "Distinction Possible" || s.prediction === "Pass Possible").length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">⚠️ Need Attention</p>
              <p className="text-3xl font-bold text-red-400">{scores.filter(s => s.prediction === "At Risk" || s.prediction === "Fail").length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Join a Course</h2>
            <p className="text-gray-400 text-sm mb-3">Enter the course code given to you by your lecturer</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value.toUpperCase())}
                placeholder="Enter course code e.g. AB12CD"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleAddCourse()}
              />
              <button onClick={handleAddCourse} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition">
                Join Course
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">My Courses</h2>
              <div className="space-y-2">
                {courses.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No courses yet. Join one above!</p>
                ) : (
                  courses.map((course) => {
                    const score = getCourseScore(course.id);
                    const locked = isLocked(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => { setActiveCourse(course); setPrediction(null); setCa(""); setParticipation(""); }}
                        className={`p-3 rounded-xl border cursor-pointer transition ${activeCourse?.id === course.id ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:bg-gray-50"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">{course.name}</span>
                          <div className="flex items-center gap-2">
                            {locked && <span className="text-xs text-gray-400">🔒 Locked</span>}
                            {score && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getResultColor(score.prediction)}`}>
                                {getResultBadge(score.prediction)} {score.prediction}
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
                        {score && (
                          <p className="text-xs text-gray-400 mt-1">CA: {score.ca}/30 · Participation: {score.participation}/5 · Current: {score.total}/35</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {activeCourse ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">📚 {activeCourse.name}</h2>
                  <p className="text-gray-400 text-sm mb-4">Enter your scores to see your prediction</p>

                  {isLocked(activeCourse.id) ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-2xl mb-2">🔒</p>
                      <p className="text-gray-600 font-medium">Scores Locked</p>
                      <p className="text-gray-400 text-sm mt-1">You have used your one allowed update. Your scores are now final.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">CA Score <span className="text-gray-400">(out of 30)</span></label>
                        <input type="number" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="0 - 30" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Participation <span className="text-gray-400">(out of 5)</span></label>
                        <input type="number" value={participation} onChange={(e) => setParticipation(e.target.value)} placeholder="0 - 5" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
                      </div>
                      <button onClick={handlePredict} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200">
                        {loading ? "Predicting..." : "⚡ Check My Standing"}
                      </button>
                    </div>
                  )}

                  {prediction && (
                    <div className={`mt-4 p-4 rounded-xl border-2 ${getResultColor(prediction.prediction)}`}>
                      <div className="text-center font-bold text-lg mb-3">
                        {getResultBadge(prediction.prediction)} Current Standing: {prediction.prediction}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1 bg-white rounded-lg p-3">
                        <p className="font-medium text-gray-600 mb-2">📊 You currently have <strong>{prediction.currentTotal}/35</strong> before the exam:</p>
                        <p>🎯 To get an E (40+): <strong>{prediction.neededForE === 0 ? "✅ Already there!" : prediction.neededForE === "Not possible" ? "❌ Not achievable" : `${prediction.neededForE}/65 in exam`}</strong></p>
                        <p>🎯 To get a D (Pass 45+): <strong>{prediction.neededForD === 0 ? "✅ Already there!" : prediction.neededForD === "Not possible" ? "❌ Not achievable" : `${prediction.neededForD}/65 in exam`}</strong></p>
                        <p>📘 To get a C (50+): <strong>{prediction.neededForC === 0 ? "✅ Already there!" : prediction.neededForC === "Not possible" ? "❌ Not achievable" : `${prediction.neededForC}/65 in exam`}</strong></p>
                        <p>📗 To get a B (60+): <strong>{prediction.neededForB === 0 ? "✅ Already there!" : prediction.neededForB === "Not possible" ? "❌ Not achievable" : `${prediction.neededForB}/65 in exam`}</strong></p>
                        <p>🏆 To get an A (70+): <strong>{prediction.neededForA === 0 ? "✅ Already there!" : prediction.neededForA === "Not possible" ? "❌ Not achievable" : `${prediction.neededForA}/65 in exam`}</strong></p>
                      </div>

                      {(prediction.prediction === "At Risk" || prediction.prediction === "Fail") && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
                          <p className="font-semibold text-yellow-700 mb-1">⚠️ Recommendation</p>
                          <p className="text-yellow-600">You may benefit from <strong>peer-to-peer tutoring</strong> sessions. Connect with top-performing classmates or visit the AI Mentor for personalized academic support.</p>
                          <button onClick={() => setPage("chatbot")} className="mt-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition">
                            💬 Ask AI Mentor for Help
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-4xl mb-3">👈</p>
                  <p className="text-gray-400">Select a course to check your standing</p>
                </div>
              )}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default StudentDashboard;
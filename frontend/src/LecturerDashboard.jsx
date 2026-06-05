import sapsLogo from "./assets/saps-logo.png";
import { useState, useEffect } from "react";

function LecturerDashboard({ user, onLogout }) {
  console.log("LECTURER DASHBOARD LOADED");
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState("");
  const [activeCourse, setActiveCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);

  const fetchCourses = async () => {
    const res = await fetch(`http://127.0.0.1:5001/courses/${user.id}`);
    const data = await res.json();
    const coursesWithCounts = await Promise.all(data.map(async (course) => {
      const scoresRes = await fetch(`http://127.0.0.1:5001/course-scores/${course.id}`);
      const scores = await scoresRes.json();
      const atRiskCount = scores.filter(s => s.prediction === "At Risk" || s.prediction === "Fail").length;
      return { ...course, atRiskCount };
    }));
    setCourses(coursesWithCounts);
  };

  const fetchCourseStudents = async (courseId) => {
    const res = await fetch(`http://127.0.0.1:5001/course-scores/${courseId}`);
    const data = await res.json();
    setCourseStudents(data);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddCourse = async () => {
    if (!newCourse.trim()) return;
    await fetch("http://127.0.0.1:5001/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newCourse, 
        user_id: user.id, 
        role: "lecturer"
      }),
    });
    setNewCourse("");
    fetchCourses();
  };

  const handleDeleteCourse = async (id) => {
    await fetch(`http://127.0.0.1:5001/courses/${id}`, { method: "DELETE" });
    fetchCourses();
    if (activeCourse?.id === id) {
      setActiveCourse(null);
      setCourseStudents([]);
    }
  };

  const handleSelectCourse = (course) => {
    setActiveCourse(course);
    fetchCourseStudents(course.id);
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

  const getDistribution = () => {
    const counts = { "Distinction": 0, "Pass": 0, "At Risk": 0, "Fail": 0 };
    courseStudents.forEach((s) => {
      if (counts[s.prediction] !== undefined) counts[s.prediction]++;
      else counts["At Risk"]++;
    });
    return counts;
  };

  const atRiskStudents = courseStudents.filter(s => s.prediction === "At Risk" || s.prediction === "Fail");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Fixed width, no changes needed */}
      <div className="w-64 bg-indigo-900 text-white flex flex-col p-6 gap-2">
        <div className="mb-6">
          <div className="flex items-center gap-1 mb-0">
            <img src={sapsLogo} alt="SAPS" className="w-20 h-20 object-contain" />
            <h2 className="text-2xl font-bold">SAPS</h2>
          </div>
          <p className="text-indigo-300 text-xs mt-1">Student Academic Performance and Prediction System</p>
        </div>

        <div className="bg-indigo-800 rounded-xl p-3 mb-4">
          <p className="text-indigo-300 text-xs">Logged in as</p>
          <p className="text-white font-medium text-sm mt-1">{user.name}</p>
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block">Lecturer</span>
        </div>

        <button className="text-left px-4 py-3 rounded-xl transition flex items-center gap-3 bg-indigo-600 text-white">
          <span>📊</span> Dashboard
        </button>

        <div className="mt-auto">
          <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-800 transition flex items-center gap-3 text-indigo-200 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Main Content - Improved spacing */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 lg:p-8">
          {/* Welcome Section - Compact */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Welcome, {user.name}! 👋</h1>
            <p className="text-gray-500 text-sm">Manage your courses and monitor student performance</p>
          </div>

          {/* Two Column Layout - Better balanced */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* My Courses Section - Improved height usage */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">My Courses</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="Add a course e.g. Mathematics"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddCourse()}
                />
                <button onClick={handleAddCourse} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap">
                  + Add
                </button>
              </div>

              <div className="flex-1 max-h-[400px] overflow-y-auto space-y-2 pr-1">
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-2">📚</p>
                    <p className="text-gray-400 text-sm">No courses yet. Add one above!</p>
                  </div>
                ) : (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${activeCourse?.id === course.id ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 text-sm">{course.name}</span>
                          {course.code && (
                            <div className="mt-1">
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {course.code}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {course.atRiskCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                              ⚠️ {course.atRiskCount}
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Distribution Section - Improved */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {activeCourse ? `${activeCourse.name}` : "Student Distribution"}
              </h2>
              {!activeCourse ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-5xl mb-3">👈</p>
                  <p className="text-gray-400 text-sm">Select a course to see distribution</p>
                </div>
              ) : courseStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-5xl mb-3">👥</p>
                  <p className="text-gray-400 text-sm">No students have checked their standing yet</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {Object.entries(getDistribution()).map(([key, value]) => (
                      <div key={key} className={`p-4 rounded-xl border-2 text-center ${getResultColor(key)}`}>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs font-medium mt-1">{getResultBadge(key)} {key}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Class Average CA Score</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {courseStudents.length > 0 ? (courseStudents.reduce((sum, s) => sum + s.ca, 0) / courseStudents.length).toFixed(1) : 0}/30
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* At Risk Students Section - Full width, improved */}
          {activeCourse && atRiskStudents.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-red-700">⚠️ Students Needing Attention</h2>
                  <p className="text-sm text-red-600 mt-0.5">in {activeCourse.name}</p>
                </div>
                <button
                  onClick={handleExport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition flex items-center gap-2"
                >
                  📥 Export CSV
                </button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {atRiskStudents.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl p-3 flex justify-between items-center hover:shadow-sm transition">
                    <div>
                      <p className="font-medium text-gray-800">{s.student_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        CA: {s.ca}/30 · Participation: {s.participation}/5 · Total: {s.total}/35
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getResultColor(s.prediction)}`}>
                      {getResultBadge(s.prediction)} {s.prediction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Button - Only when needed */}
          {activeCourse && courseStudents.length > 0 && atRiskStudents.length === 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleExport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                📥 Export All Records
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LecturerDashboard;
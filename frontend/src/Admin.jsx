import { useState, useEffect } from "react";

function Admin({ user, onLogout }) {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState("records");

  const fetchStudents = async () => {
    const res = await fetch("http://127.0.0.1:5001/all-course-scores");
    const data = await res.json();
    setStudents(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("http://127.0.0.1:5001/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    await fetch(`http://127.0.0.1:5001/students/${id}`, { method: "DELETE" });
    fetchStudents();
  };

  const handleExport = () => {
    if (students.length === 0) { alert("No records to export"); return; }
    const headers = ["ID", "Name", "CA", "Participation", "Exam", "Result", "Date"];
    const rows = students.map(s => [s.id, s.name, s.math, s.reading, s.writing, s.prediction, s.date]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all_student_records.csv";
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

  const getRoleColor = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-700";
    if (role === "lecturer") return "bg-indigo-100 text-indigo-700";
    return "bg-green-100 text-green-700";
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
          <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
        </div>

        <button onClick={() => setPage("records")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "records" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>📋</span> Student Records
        </button>
        <button onClick={() => setPage("users")} className={`text-left px-4 py-3 rounded-xl transition flex items-center gap-3 ${page === "users" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800"}`}>
          <span>👥</span> Manage Users
        </button>

        <div className="mt-auto">
          <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-800 transition flex items-center gap-3 text-indigo-200 text-sm">
            <span>🚪</span> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 p-8">
        {page === "users" ? (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Manage Users</h1>
              <p className="text-gray-500 mt-1">View all registered users in the system</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-indigo-600">{users.length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">👨‍🎓 Students</p>
                <p className="text-3xl font-bold text-green-500">{users.filter(u => u.role === "student").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">👨‍🏫 Lecturers</p>
                <p className="text-3xl font-bold text-indigo-500">{users.filter(u => u.role === "lecturer").length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">All Users</h2>
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No users found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-3 text-gray-400">#{u.id}</td>
                        <td className="py-3 font-medium text-gray-800">{u.name}</td>
                        <td className="py-3 text-gray-600">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-500 mt-1">View and manage all student prediction records</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🟢 Distinction Possible</p>
                <p className="text-3xl font-bold text-green-500">{students.filter(s => s.prediction === "Distinction Possible").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🔵 Pass Possible</p>
                <p className="text-3xl font-bold text-blue-400">{students.filter(s => s.prediction === "Pass Possible").length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-sm text-gray-500 mb-1">🔴 Fail/At Risk</p>
                <p className="text-3xl font-bold text-red-400">{students.filter(s => s.prediction === "Fail" || s.prediction === "At Risk").length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">All Student Records</h2>
                <button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-xl transition">
                  📥 Export CSV
                </button>
              </div>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">📋</p>
                  <p className="text-gray-400">No records yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">CA</th>
                      <th className="pb-3 font-medium">Participation</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Standing</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-3 font-medium text-gray-800">{s.student_name}</td>
                        <td className="py-3 text-gray-600">{s.course_name}</td>
                        <td className="py-3 text-gray-600">{s.ca}/30</td>
                        <td className="py-3 text-gray-600">{s.participation}/5</td>
                        <td className="py-3 text-gray-600">{s.total}/35</td>
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

export default Admin;
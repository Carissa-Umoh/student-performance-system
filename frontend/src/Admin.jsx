import { useState, useEffect } from "react";

function Admin({ user, onLogout }) {
  const [students, setStudents] = useState([]);

  const fetchStudents = async () => {
    const res = await fetch("http://127.0.0.1:5001/students");
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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

  return (
    <div className="flex min-h-screen">
      <div className="w-56 bg-indigo-700 text-white flex flex-col p-6 gap-4">
        <h2 className="text-xl font-bold mb-6">🎓 EduPredict</h2>
        <p className="text-indigo-200 text-sm">Logged in as:</p>
        <p className="text-white font-medium text-sm">{user.email}</p>
        <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full w-fit">Admin</span>
        <div className="mt-auto">
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-600 transition text-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-700">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Manage all student records</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
              <p className="text-gray-500 text-sm mt-1">Total Students</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <p className="text-3xl font-bold text-green-500">{students.filter(s => s.prediction === "Excellent").length}</p>
              <p className="text-gray-500 text-sm mt-1">Excellent</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <p className="text-3xl font-bold text-red-400">{students.filter(s => s.prediction === "At Risk").length}</p>
              <p className="text-gray-500 text-sm mt-1">At Risk</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">All Student Records</h2>
            {students.length === 0 ? (
              <p className="text-gray-400 text-center">No students yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Math</th>
                    <th className="pb-2">Reading</th>
                    <th className="pb-2">Writing</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 text-gray-400">#{s.id}</td>
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2">{s.math}</td>
                      <td className="py-2">{s.reading}</td>
                      <td className="py-2">{s.writing}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getResultColor(s.prediction)}`}>
                          {s.prediction}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400">{s.date}</td>
                      <td className="py-2">
                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
import { useState } from "react";

function Workspace() {
  const [activeTab, setActiveTab] = useState("summarizer");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("1 week");
  const [studyPlan, setStudyPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);

  const handleSummarize = async () => {
    if (!notes.trim()) {
      alert("Please enter some notes to summarize");
      return;
    }
    setSummaryLoading(true);
    try {
      const res = await fetch("https://saps-backend-qcci.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please summarize the following notes in a clear, concise and structured way with key points:\n\n${notes}`,
        }),
      });
      const data = await res.json();
      setSummary(data.reply);
    } catch (error) {
      setSummary("Error connecting to AI. Please try again.");
    }
    setSummaryLoading(false);
  };

  const handleStudyPlan = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic");
      return;
    }
    setPlanLoading(true);
    try {
      const res = await fetch("https://saps-backend-qcci.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Create a detailed study plan for a student who wants to learn "${topic}" in ${duration}. Include daily goals, resources, and practice tips. Format it clearly with sections.`,
        }),
      });
      const data = await res.json();
      setStudyPlan(data.reply);
    } catch (error) {
      setStudyPlan("Error connecting to AI. Please try again.");
    }
    setPlanLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Educational AI Workspace</h1>
        <p className="text-gray-500 mt-1">AI-powered tools to support student learning</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("summarizer")}
          className={`px-5 py-2.5 rounded-xl font-medium transition ${activeTab === "summarizer" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          📝 Note Summarizer
        </button>
        <button
          onClick={() => setActiveTab("studyplan")}
          className={`px-5 py-2.5 rounded-xl font-medium transition ${activeTab === "studyplan" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          📅 Study Plan Generator
        </button>
      </div>

      {activeTab === "summarizer" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Paste Your Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your lecture notes, textbook content, or any study material here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 h-64 resize-none text-sm"
            />
            <button
              onClick={handleSummarize}
              disabled={summaryLoading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {summaryLoading ? "Summarizing..." : "⚡ Summarize Notes"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">✨ AI Summary</h2>
            {summary ? (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-indigo-50 rounded-xl p-4 h-64 overflow-y-auto">
                {summary}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-4xl mb-3">✨</p>
                <p className="text-gray-400">Your summary will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "studyplan" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Generate Study Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Topic or Subject</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Calculus, Python Programming, World History"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Study Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                >
                  <option>1 week</option>
                  <option>2 weeks</option>
                  <option>1 month</option>
                  <option>3 months</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleStudyPlan}
              disabled={planLoading}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-200"
            >
              {planLoading ? "Generating..." : "📅 Generate Study Plan"}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Your Study Plan</h2>
            {studyPlan ? (
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-indigo-50 rounded-xl p-4 h-64 overflow-y-auto">
                {studyPlan}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-400">Your study plan will appear here</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Workspace;
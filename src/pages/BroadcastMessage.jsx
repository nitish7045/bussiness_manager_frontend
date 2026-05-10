import React, { useState, useEffect } from "react";
import API from "../api/api";

export default function BroadcastMessage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("custom");
  const [selectedWorkers, setSelectedWorkers] = useState("all");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState([]);
  const [preview, setPreview] = useState(false);
  const [sendProgress, setSendProgress] = useState({
    current: 0,
    total: 0,
    status: "idle"
  });
  const [messageHistory, setMessageHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  
  // New states for search and filter
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [uniqueDesignations, setUniqueDesignations] = useState([]);

  // Pre-defined templates
  const templates = {
    attendance: {
      title: "📋 Attendance Reminder",
      message: `🔔 *Attendance Reminder*

Dear {name},

Please mark your attendance for today.

✅ Use the Attendance Management system
⏰ Deadline: End of day

Thank you,
Management`
    },
    salary: {
      title: "💰 Salary Day",
      message: `💰 *Salary Day*

Dear {name},

Your salary has been processed for this month.

📊 Check your salary slip in the employee portal or Send To Your WhatsApp Soon
💵 Amount will be credited to your bank account 

Thank you for your hard work!`
    },
    holiday: {
      title: "🎉 Holiday Announcement",
      message: `🎉 *Holiday Announcement*

Dear {name},

This is to inform you that {date} will be a holiday.

🚨 On the Occasion of  
🏢 Work will remain closed 
📅 Plan your work accordingly

Wishing you a great day!`
    },
    meeting: {
      title: "📢 Meeting Reminder",
      message: `📢 *Meeting Reminder*

Dear {name},

There will be a team meeting today at {time}.

📍 Venue: Conference Room
📝 Agenda: Monthly review

Your presence is mandatory.`
    },
    custom: {
      title: "✏️ Custom Message",
      message: ""
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchMessageHistory();
    fetchStats();
  }, []);

  // Update unique designations when workers change
  useEffect(() => {
    if (workers.length > 0) {
      const designations = [...new Set(workers.map(w => w.designation).filter(Boolean))];
      setUniqueDesignations(designations);
    }
  }, [workers]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await API.get("/employees");
      setWorkers(response.data);
    } catch (error) {
      console.error("Error fetching workers:", error);
      alert("Failed to fetch workers");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await API.get("/broadcast/history?limit=100");
      if (response.data && response.data.data) {
        setMessageHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get("/broadcast/stats");
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleTemplateChange = (type) => {
    setMessageType(type);
    if (type !== "custom") {
      setMessage(templates[type].message);
    } else {
      setMessage("");
    }
  };

  const handleWorkerSelection = (workerId) => {
    if (selectedWorkerIds.includes(workerId)) {
      setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== workerId));
    } else {
      setSelectedWorkerIds([...selectedWorkerIds, workerId]);
    }
  };

  const handleSelectAll = () => {
    const filteredWorkers = getFilteredWorkers();
    if (selectedWorkerIds.length === filteredWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      const allFilteredWorkerIds = filteredWorkers.map(w => w._id);
      setSelectedWorkerIds(allFilteredWorkerIds);
    }
  };

  const handleSelectByDesignation = (designation) => {
    const workersWithDesignation = workers.filter(w => 
      w.status === "active" && w.designation === designation
    );
    const workerIds = workersWithDesignation.map(w => w._id);
    
    // Toggle selection: if all are already selected, deselect them
    const allSelected = workerIds.every(id => selectedWorkerIds.includes(id));
    if (allSelected) {
      setSelectedWorkerIds(selectedWorkerIds.filter(id => !workerIds.includes(id)));
    } else {
      setSelectedWorkerIds([...selectedWorkerIds, ...workerIds]);
    }
  };

  const getFilteredWorkers = () => {
    let filtered = workers.filter(w => w.status === "active");
    
    // Filter by search term
    if (workerSearchTerm) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
        w.phone.includes(workerSearchTerm)
      );
    }
    
    // Filter by designation
    if (selectedDesignation) {
      filtered = filtered.filter(w => w.designation === selectedDesignation);
    }
    
    return filtered;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    let recipients = [];
    if (selectedWorkers === "all") {
      recipients = workers.filter(w => w.status === "active");
    } else if (selectedWorkers === "selected") {
      recipients = workers.filter(w => selectedWorkerIds.includes(w._id));
    }

    if (recipients.length === 0) {
      alert("No workers selected");
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send this message to ${recipients.length} worker(s)?\n\n` +
      `Message preview:\n${message.substring(0, 100)}...`
    );

    if (!confirmSend) return;

    setSending(true);
    setSendProgress({
      current: 0,
      total: recipients.length,
      status: "sending"
    });

    try {
      const response = await API.post("/broadcast/send-bulk", {
        workers: recipients.map(w => ({ _id: w._id, name: w.name, phone: w.phone })),
        message: message,
        messageType: messageType
      });
      
      setSendProgress({
        current: response.data.successCount,
        total: recipients.length,
        status: "completed"
      });
      
      alert(`✅ Message sent!\n\nSuccessful: ${response.data.successCount}\nFailed: ${response.data.failCount}`);
      
      fetchMessageHistory();
      fetchStats();
      
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      alert("Failed to send messages");
    } finally {
      setTimeout(() => {
        setSendProgress({ current: 0, total: 0, status: "idle" });
        setSending(false);
      }, 3000);
    }
  };

  const handleTestMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    const testWorker = workers.find(w => w.status === "active");
    if (!testWorker) {
      alert("No active workers found for test message");
      return;
    }

    const confirmSend = window.confirm(
      `Send test message to ${testWorker.name} (${testWorker.phone})?`
    );

    if (!confirmSend) return;

    setSending(true);
    try {
      const personalizedMessage = message.replace(/{name}/g, testWorker.name);
      await API.post("/broadcast/send-whatsapp", {
        phoneNumber: testWorker.phone,
        message: personalizedMessage,
        workerId: testWorker._id,
        workerName: testWorker.name,
        isTest: true,
        messageType: messageType
      });
      alert(`✅ Test message sent to ${testWorker.name}!`);
      fetchMessageHistory();
    } catch (error) {
      console.error("Error sending test message:", error);
      alert("Failed to send test message");
    } finally {
      setSending(false);
    }
  };

  const handleRetryFailed = async (historyId) => {
    if (!window.confirm("Retry sending this message?")) return;
    
    try {
      await API.post("/broadcast/retry-failed", { historyIds: [historyId] });
      alert("✅ Message retried successfully!");
      fetchMessageHistory();
      fetchStats();
    } catch (error) {
      console.error("Error retrying message:", error);
      alert("Failed to retry message");
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (!window.confirm("Delete this history record? This action cannot be undone.")) return;
    
    try {
      await API.delete(`/broadcast/history/${historyId}`);
      alert("✅ History record deleted!");
      fetchMessageHistory();
      fetchStats();
    } catch (error) {
      console.error("Error deleting history:", error);
      alert("Failed to delete history");
    }
  };

  const handleBulkDeleteHistory = async () => {
    if (selectedHistoryIds.length === 0) {
      alert("Please select records to delete");
      return;
    }
    
    if (!window.confirm(`Delete ${selectedHistoryIds.length} history record(s)? This action cannot be undone.`)) return;
    
    try {
      await API.delete("/broadcast/history", { data: { historyIds: selectedHistoryIds } });
      alert("✅ Records deleted successfully!");
      setSelectedHistoryIds([]);
      setShowBulkDelete(false);
      fetchMessageHistory();
      fetchStats();
    } catch (error) {
      console.error("Error deleting history:", error);
      alert("Failed to delete records");
    }
  };

  const handleSelectHistory = (historyId) => {
    if (selectedHistoryIds.includes(historyId)) {
      setSelectedHistoryIds(selectedHistoryIds.filter(id => id !== historyId));
    } else {
      setSelectedHistoryIds([...selectedHistoryIds, historyId]);
    }
  };

  const getWorkerCount = () => {
    if (selectedWorkers === "all") {
      return workers.filter(w => w.status === "active").length;
    } else if (selectedWorkers === "selected") {
      return selectedWorkerIds.length;
    }
    return 0;
  };

  const filteredHistory = messageHistory.filter(record => {
    if (filterStatus && record.status !== filterStatus) return false;
    if (searchTerm && !record.workerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredWorkers = getFilteredWorkers();
  const selectedCount = selectedWorkerIds.length;
  const filteredCount = filteredWorkers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">📱 Broadcast Message</h1>
          <p className="text-sm text-gray-500 mt-2">Send WhatsApp messages to all workers at once</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.totalSent || 0}</p>
              <p className="text-xs text-gray-500">Total Sent</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.totalFailed || 0}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.last7Days || 0}</p>
              <p className="text-xs text-gray-500">Last 7 Days</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.today || 0}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{workers.filter(w => w.status === "active").length}</p>
              <p className="text-xs text-gray-500">Active Workers</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel - Message Composition */}
          <div className="space-y-6">
            
            {/* Template Selection */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📝</span> Message Template
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTemplateChange("attendance")}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      messageType === "attendance"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📋 Attendance
                  </button>
                  <button
                    onClick={() => handleTemplateChange("salary")}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      messageType === "salary"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    💰 Salary
                  </button>
                  <button
                    onClick={() => handleTemplateChange("holiday")}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      messageType === "holiday"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🎉 Holiday
                  </button>
                  <button
                    onClick={() => handleTemplateChange("meeting")}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      messageType === "meeting"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    📢 Meeting
                  </button>
                  <button
                    onClick={() => handleTemplateChange("custom")}
                    className={`col-span-2 p-3 rounded-xl text-sm font-medium transition-all ${
                      messageType === "custom"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ✏️ Custom Message
                  </button>
                </div>
              </div>
            </div>

            {/* Message Editor */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>💬</span> Your Message
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      💡 <span className="font-semibold">Tip:</span> Use {"{name}"} to automatically insert worker's name
                    </p>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="10"
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Type your message here... Use {name} for worker name"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreview(!preview)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🔍 Preview
                  </button>
                  <button
                    onClick={handleTestMessage}
                    disabled={sending || !message.trim()}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    📱 Send Test
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel - Worker Selection & Preview */}
          <div className="space-y-6">
            
            {/* Worker Selection */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>👥</span> Select Recipients
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedWorkers("all")}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        selectedWorkers === "all"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All Active ({workers.filter(w => w.status === "active").length})
                    </button>
                    <button
                      onClick={() => setSelectedWorkers("selected")}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        selectedWorkers === "selected"
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Select Manually
                    </button>
                  </div>

                  {selectedWorkers === "selected" && (
                    <div className="border rounded-lg overflow-hidden">
                      {/* Search and Filter Bar */}
                      <div className="bg-gray-50 p-3 border-b space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={workerSearchTerm}
                            onChange={(e) => setWorkerSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Designation Filter */}
                        <div className="flex gap-2 flex-wrap items-center">
                          <span className="text-xs text-gray-500">Filter by:</span>
                          <button
                            onClick={() => setSelectedDesignation("")}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              selectedDesignation === ""
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            All
                          </button>
                          {uniqueDesignations.map(des => (
                            <button
                              key={des}
                              onClick={() => setSelectedDesignation(des)}
                              className={`px-2 py-1 rounded text-xs transition-all ${
                                selectedDesignation === des
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {des}
                            </button>
                          ))}
                        </div>
                        
                        {/* Selection Actions */}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSelectAll}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              {selectedCount === filteredCount ? "Deselect All" : "Select All"}
                            </button>
                            {selectedCount > 0 && (
                              <button
                                onClick={() => setSelectedWorkerIds([])}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                Clear ({selectedCount})
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {filteredCount} workers shown
                          </span>
                        </div>
                      </div>
                      
                      {/* Workers List */}
                      <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                          <div className="p-4 text-center">Loading...</div>
                        ) : filteredWorkers.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>No workers found</p>
                            <p className="text-xs mt-1">Try changing your search or filter</p>
                          </div>
                        ) : (
                          filteredWorkers.map(worker => (
                            <label
                              key={worker._id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedWorkerIds.includes(worker._id)}
                                onChange={() => handleWorkerSelection(worker._id)}
                                className="w-4 h-4 text-green-600 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-gray-800">{worker.name}</p>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                    {worker.designation || "No Designation"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">📞 {worker.phone}</p>
                              </div>
                              <div className="text-right">
                                <div className={`w-2 h-2 rounded-full ${worker.status === "active" ? "bg-green-500" : "bg-red-500"}`}></div>
                                <p className="text-xs text-gray-400 mt-1 capitalize">{worker.status}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-800">Selected Recipients:</span>
                      <span className="text-2xl font-bold text-green-600">{getWorkerCount()}</span>
                    </div>
                    {selectedWorkers === "selected" && selectedCount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {selectedCount} worker(s) selected from {filteredCount} filtered
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Preview */}
            {preview && message && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>👁️</span> Preview (Sample)
                  </h2>
                </div>
                <div className="p-6 max-h-96 overflow-y-auto">
                  {getFilteredWorkers().slice(0, 3).map(worker => (
                    <div key={worker._id} className="mb-4 last:mb-0">
                      <p className="text-xs text-gray-500 mb-1">To: {worker.name}</p>
                      <div className="bg-green-50 rounded-lg p-3">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {message.replace(/{name}/g, worker.name)}
                        </pre>
                      </div>
                    </div>
                  ))}
                  {getFilteredWorkers().length > 3 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      +{getFilteredWorkers().length - 3} more recipients
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Send Button & Progress */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                {sendProgress.status === "sending" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Sending messages...</span>
                      <span>{sendProgress.current} / {sendProgress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSendMessage}
                  disabled={sending || getWorkerCount() === 0 || !message.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "📤 Sending..." : `📤 Send to ${getWorkerCount()} Worker(s)`}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Message History Section */}
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full bg-white rounded-xl shadow-md p-4 flex justify-between items-center hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <span className="font-semibold text-gray-800">Message History</span>
              <span className="text-xs text-gray-500">({messageHistory.length} sent)</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedHistoryIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                >
                  Delete Selected ({selectedHistoryIds.length})
                </button>
              )}
              <span className="text-gray-400">{showHistory ? "▲" : "▼"}</span>
            </div>
          </button>
          
          {showHistory && (
            <div className="bg-white rounded-xl shadow-lg mt-2 p-4">
              {/* Filters */}
              <div className="flex gap-3 mb-4 pb-4 border-b">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by worker name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    setFilterStatus("");
                    setSearchTerm("");
                  }}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  Clear
                </button>
              </div>

              {/* History List */}
              <div className="max-h-96 overflow-y-auto space-y-3">
                {historyLoading ? (
                  <div className="text-center py-8">Loading history...</div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No messages sent yet</div>
                ) : (
                  filteredHistory.map((record) => (
                    <div key={record._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedHistoryIds.includes(record._id)}
                            onChange={() => handleSelectHistory(record._id)}
                            className="mt-1 w-4 h-4 text-green-600"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                record.status === "success" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {record.status === "success" ? "✓ Success" : "✗ Failed"}
                              </span>
                              <span className="text-xs text-gray-500">{record.messageType}</span>
                            </div>
                            <p className="font-medium text-gray-800">{record.workerName}</p>
                            <p className="text-xs text-gray-500">{record.phoneNumber}</p>
                            <p className="text-sm text-gray-600 mt-2">{record.message.substring(0, 100)}...</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(record.sentAt).toLocaleString()} • Sent by: {record.sentByName}
                            </p>
                            {record.errorMessage && (
                              <p className="text-xs text-red-500 mt-1">Error: {record.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {record.status === "failed" && (
                            <button
                              onClick={() => handleRetryFailed(record._id)}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              Retry
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteHistory(record._id)}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Bulk Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedHistoryIds.length} history record(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteHistory}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/components/common/WhatsAppBulkSender.jsx
import React, { useState } from "react";
import whatsappService from "../../services/whatsappService";

export default function WhatsAppBulkSender({ 
  items, 
  onClose, 
  onComplete,
  title = "Send WhatsApp Messages"
}) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentItem: "",
    successCount: 0,
    failCount: 0
  });
  const [showConfirm, setShowConfirm] = useState(true);

  const handleSend = async () => {
    setSending(true);
    setShowConfirm(false);
    
    const results = await whatsappService.sendBulkMessages(
      items,
      (update) => {
        setProgress({
          current: update.current,
          total: update.total,
          currentItem: update.currentItem,
          successCount: update.successCount,
          failCount: update.failCount,
          type: update.type
        });
      },
      1000
    );
    
    setSending(false);
    
    if (onComplete) {
      onComplete(results);
    }
    
    if (results.failed === 0) {
      setTimeout(() => onClose(), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {!sending && (
            <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">
              ✕
            </button>
          )}
        </div>
        
        <div className="p-6">
          {showConfirm && !sending && (
            <>
              <div className="text-center mb-6">
                <div className="bg-green-50 rounded-xl p-4 mb-4">
                  <p className="text-3xl font-bold text-green-600">{items.length}</p>
                  <p className="text-sm text-gray-600">Messages to send</p>
                </div>
                <div className="flex justify-center gap-4 text-sm mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">📝 Text: {items.filter(i => i.type === "text").length}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">📄 PDF: {items.filter(i => i.type === "pdf").length}</span>
                </div>
                <p className="text-sm text-gray-600">
                  You are about to send WhatsApp messages to <strong>{items.length}</strong> recipient(s)
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all"
                >
                  📱 Send Now
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          
          {sending && (
            <div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sending {progress.type === "pdf" ? "PDF" : "text"} messages...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">✅ Successful:</span>
                  <span className="font-semibold text-green-600">{progress.successCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">❌ Failed:</span>
                  <span className="font-semibold text-red-600">{progress.failCount}</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Sending to:</p>
                <p className="font-medium text-gray-800">{progress.currentItem}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
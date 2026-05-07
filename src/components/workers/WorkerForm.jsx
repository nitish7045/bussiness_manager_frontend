// src/components/workers/WorkerForm.jsx
import React, { useState, useEffect, useRef } from "react";

export default function WorkerForm({ 
  editingWorker, 
  form, 
  onFormChange, 
  extraFields, 
  onExtraFieldsChange,
  extraFieldSuggestions,
  existingExtraFieldsFromDB,
  onSave,
  onCancel,
  loading 
}) {
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(null);
  const [suggestionType, setSuggestionType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const inputRefs = useRef({});
  const dropdownRef = useRef(null);
  const formContainerRef = useRef(null);

  // Combine predefined suggestions with DB suggestions
  const getAllSuggestions = () => {
    const predefined = extraFieldSuggestions.map(s => ({ 
      ...s, 
      source: "predefined",
      isCustom: false 
    }));
    const fromDB = existingExtraFieldsFromDB.map(field => ({
      key: field.key,
      label: field.label,
      placeholder: field.placeholder || `Enter ${field.label}`,
      suggestions: field.suggestions || [],
      source: "database",
      isCustom: false
    }));

    if (suggestionType === "predefined") return predefined;
    if (suggestionType === "fromDB") return fromDB;
    
    const all = [...predefined, ...fromDB];
    const unique = all.filter((suggestion, index, self) => 
      index === self.findIndex((s) => s.key === suggestion.key)
    );
    
    return unique;
  };

  // Search through suggestions
  const searchSuggestions = (query) => {
    const allSuggestions = getAllSuggestions();
    if (!query.trim()) return allSuggestions;
    
    return allSuggestions.filter(suggestion =>
      suggestion.key.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.label.toLowerCase().includes(query.toLowerCase()) ||
      (suggestion.placeholder && suggestion.placeholder.toLowerCase().includes(query.toLowerCase()))
    );
  };

  // Get suggestions for a specific field (for datalist)
  const getSuggestionsForField = (fieldKey) => {
    const allSuggestions = getAllSuggestions();
    const fieldSuggestion = allSuggestions.find(s => s.key === fieldKey);
    return fieldSuggestion?.suggestions || [];
  };

  // Update dropdown position relative to input
  const updateDropdownPosition = (index) => {
    const inputElement = inputRefs.current[`field-${index}`];
    if (inputElement && dropdownRef.current) {
      const rect = inputElement.getBoundingClientRect();
      const formContainer = formContainerRef.current;
      const containerRect = formContainer?.getBoundingClientRect();
      
      if (formContainer) {
        // Position relative to the form container
        const relativeTop = rect.bottom - containerRect.top;
        const relativeLeft = rect.left - containerRect.left;
        
        dropdownRef.current.style.position = 'absolute';
        dropdownRef.current.style.top = `${relativeTop + 5}px`;
        dropdownRef.current.style.left = `${relativeLeft}px`;
        dropdownRef.current.style.width = `${rect.width}px`;
        dropdownRef.current.style.minWidth = '300px';
        dropdownRef.current.style.maxWidth = '500px';
      }
    }
  };

  const handleExtraFieldKeyChange = (index, value) => {
    const updated = [...extraFields];
    updated[index].key = value;
    onExtraFieldsChange(updated);
    
    setSearchQuery(value);
    
    if (value.trim()) {
      const filtered = searchSuggestions(value);
      setFilteredSuggestions(filtered);
      setCurrentFieldIndex(index);
      setShowSuggestionDropdown(true);
      
      // Update position after state change
      setTimeout(() => updateDropdownPosition(index), 0);
    } else {
      setShowSuggestionDropdown(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    if (currentFieldIndex !== null) {
      const updated = [...extraFields];
      // Check for duplicate
      if (updated.some((f, idx) => idx !== currentFieldIndex && f.key === suggestion.key && f.key !== "")) {
        alert(`${suggestion.label} already added`);
        setShowSuggestionDropdown(false);
        return;
      }
      updated[currentFieldIndex].key = suggestion.key;
      updated[currentFieldIndex].value = "";
      onExtraFieldsChange(updated);
      setShowSuggestionDropdown(false);
      setSearchQuery("");
    }
  };

  const addNewExtraField = () => {
    onExtraFieldsChange([...extraFields, { key: "", value: "" }]);
    setTimeout(() => {
      const newIndex = extraFields.length;
      if (inputRefs.current[`field-${newIndex}`]) {
        inputRefs.current[`field-${newIndex}`].focus();
      }
    }, 100);
  };

  const removeExtraField = (index) => {
    if (extraFields.length > 1) {
      const updated = [...extraFields];
      updated.splice(index, 1);
      onExtraFieldsChange(updated);
    }
  };

  const updateExtraFieldValue = (index, value) => {
    const updated = [...extraFields];
    updated[index].value = value;
    onExtraFieldsChange(updated);
  };

  // Handle scroll - update dropdown position
  const handleScroll = () => {
    if (showSuggestionDropdown && currentFieldIndex !== null) {
      updateDropdownPosition(currentFieldIndex);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        let isInputClick = false;
        for (let i = 0; i < extraFields.length; i++) {
          if (inputRefs.current[`field-${i}`] === event.target) {
            isInputClick = true;
            break;
          }
        }
        if (!isInputClick) {
          setShowSuggestionDropdown(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add scroll listener to form container
    const formContainer = formContainerRef.current;
    if (formContainer) {
      formContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (formContainer) {
        formContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [extraFields.length, showSuggestionDropdown, currentFieldIndex]);

  // Update position when dropdown shows
  useEffect(() => {
    if (showSuggestionDropdown && currentFieldIndex !== null) {
      updateDropdownPosition(currentFieldIndex);
    }
  }, [showSuggestionDropdown, currentFieldIndex]);

  return (
    <div id="worker-form" className="bg-white rounded-xl shadow-lg mb-6 overflow-visible relative">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3 sticky top-0 z-10">
        <h2 className="text-lg font-bold text-white">
          {editingWorker ? "Edit Worker" : "Add New Worker"}
        </h2>
      </div>

      <div 
        ref={formContainerRef}
        className="p-5 max-h-[70vh] overflow-y-auto relative"
        style={{ position: 'relative' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Regular form fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="Enter full name"
              value={form.name}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              name="designation"
              placeholder="e.g., Carpenter"
              value={form.designation}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Monthly Salary <span className="text-red-500">*</span>
            </label>
            <input
              name="monthly"
              type="number"
              placeholder="Enter monthly salary"
              value={form.monthly}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Calculation Days
            </label>
            <input
              name="calculationDays"
              type="number"
              placeholder="30"
              value={form.calculationDays}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              UPI ID
            </label>
            <input
              name="upi"
              placeholder="Enter UPI ID"
              value={form.upi}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bank Account Number
            </label>
            <input
              name="account"
              placeholder="Enter account number"
              value={form.account}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              IFSC Code
            </label>
            <input
              name="ifsc"
              placeholder="Enter IFSC code"
              value={form.ifsc}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Aadhaar Number
            </label>
            <input
              name="aadhaar"
              placeholder="Enter 12-digit Aadhaar number"
              value={form.aadhaar}
              onChange={onFormChange}
              maxLength="12"
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Experience (Years)
            </label>
            <input
              name="experience"
              type="number"
              placeholder="Years"
              value={form.experience}
              onChange={onFormChange}
              className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Extra Fields with Suggestions */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Extra Fields</h3>
            <div className="flex gap-2">
              <select
                value={suggestionType}
                onChange={(e) => {
                  setSuggestionType(e.target.value);
                  if (searchQuery) {
                    const filtered = searchSuggestions(searchQuery);
                    setFilteredSuggestions(filtered);
                  }
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Suggestions</option>
                <option value="predefined">Predefined Fields</option>
                <option value="fromDB">From Database</option>
              </select>
              <button
                onClick={addNewExtraField}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1"
              >
                + Add Field
              </button>
            </div>
          </div>

          {extraFields.map((field, index) => {
            const suggestion = getAllSuggestions().find(s => s.key === field.key);
            const fieldSuggestions = getSuggestionsForField(field.key);
            const isCustomField = field.key && !getAllSuggestions().some(s => s.key === field.key);
            
            return (
              <div key={index} className="extra-field-row flex gap-2 mb-2 relative">
                <div className="flex-1 relative">
                  <input
                    ref={el => inputRefs.current[`field-${index}`] = el}
                    placeholder="Field Name (e.g., shoeSize)"
                    value={field.key}
                    onChange={(e) => handleExtraFieldKeyChange(index, e.target.value)}
                    onFocus={() => {
                      const filtered = searchSuggestions(field.key);
                      setFilteredSuggestions(filtered);
                      setCurrentFieldIndex(index);
                      setSearchQuery(field.key);
                      setShowSuggestionDropdown(true);
                      setTimeout(() => updateDropdownPosition(index), 0);
                    }}
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Custom field indicator */}
                  {isCustomField && field.key && (
                    <div className="absolute right-2 top-2 text-xs text-purple-600">
                      Custom Field
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    placeholder={suggestion?.placeholder || "Value"}
                    value={field.value}
                    onChange={(e) => updateExtraFieldValue(index, e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    list={`values-${index}`}
                  />
                  {fieldSuggestions.length > 0 && (
                    <datalist id={`values-${index}`}>
                      {fieldSuggestions.map(val => (
                        <option key={val} value={val} />
                      ))}
                    </datalist>
                  )}
                  {fieldSuggestions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Suggested values: {fieldSuggestions.slice(0, 5).join(", ")}
                      {fieldSuggestions.length > 5 && "..."}
                    </p>
                  )}
                  {isCustomField && field.key && (
                    <p className="text-xs text-purple-500 mt-1">
                      ✨ Custom field - you can enter any value
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => removeExtraField(index)}
                  className="bg-red-500 text-white px-3 rounded-lg hover:bg-red-600 text-sm"
                  title="Remove field"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-5 sticky bottom-0 bg-white pt-3 border-t">
          <button
            onClick={onSave}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-5 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 text-sm"
          >
            {loading ? "Saving..." : editingWorker ? "Update Worker" : "Add Worker"}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown - Absolute positioned within form container */}
      {showSuggestionDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
          style={{
            position: 'absolute',
            minWidth: '300px',
            maxWidth: '500px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search fields..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const filtered = searchSuggestions(e.target.value);
                  setFilteredSuggestions(filtered);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilteredSuggestions(getAllSuggestions());
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Suggestions List */}
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.key}
                  onClick={() => selectSuggestion(suggestion)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{suggestion.label}</p>
                        {suggestion.source === "database" && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Existing
                          </span>
                        )}
                        {suggestion.source === "predefined" && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            Standard
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Key: {suggestion.key}</p>
                      {suggestion.placeholder && (
                        <p className="text-xs text-gray-400 mt-0.5">Example: {suggestion.placeholder}</p>
                      )}
                      {suggestion.suggestions && suggestion.suggestions.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-blue-600">
                            Quick values: {suggestion.suggestions.slice(0, 5).join(", ")}
                            {suggestion.suggestions.length > 5 && "..."}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 whitespace-nowrap">
                      Select
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm">No matching fields found</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      const updated = [...extraFields];
                      if (currentFieldIndex !== null) {
                        updated[currentFieldIndex].key = searchQuery;
                        updated[currentFieldIndex].value = "";
                        onExtraFieldsChange(updated);
                        setShowSuggestionDropdown(false);
                        setSearchQuery("");
                      }
                    }}
                    className="mt-3 text-sm bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    + Create "{searchQuery}" as new field
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Footer with info */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
            💡 Click on any field to add | Type to search
          </div>
        </div>
      )}
    </div>
  );
}
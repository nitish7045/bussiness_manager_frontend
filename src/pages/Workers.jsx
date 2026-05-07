// src/pages/Workers.jsx
import React, { useEffect, useState } from "react";
import API from "../api/api";
import WorkerHeader from "../components/workers/WorkerHeader";
import WorkerForm from "../components/workers/WorkerForm";
import WorkerFilters from "../components/workers/WorkerFilters";
import WorkerTable from "../components/workers/WorkerTable";
import StatsCards from "../components/workers/StatsCards";
import ProgressModal from "../components/workers/ProgressModal";
import PhotoModal from "../components/workers/PhotoModal";

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalType, setPhotoModalType] = useState("");
  
  // Progress bar states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Count states for filters (from ALL workers, not filtered)
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Existing extra fields from database (for suggestions)
  const [existingExtraFieldsFromDB, setExistingExtraFieldsFromDB] = useState([]);

  // Predefined extra field suggestions
  const [extraFieldSuggestions, setExtraFieldSuggestions] = useState([
    // { key: "shoeSize", label: "Shoe Size", placeholder: "e.g., 7, 8, 9, 10", suggestions: ["6", "7", "8", "9", "10", "11", "12"] },
    { key: "shirtSize", label: "Shirt Size", placeholder: "e.g., S, M, L, XL, 28, 30, 32, 34", suggestions: ["S", "M", "L","28", "30", "32", "34", "36", "XL", "XXL", "3XL"] },
    { key: "pantSize", label: "Pant Size", placeholder: "e.g., 28, 30, 32, 34", suggestions: ["28", "30", "32", "34", "36", "38", "40"] },
    { key: "bloodGroup", label: "Blood Group", placeholder: "e.g., A+, B+, O+", suggestions: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
    { key: "emergencyContact", label: "Emergency Contact", placeholder: "Phone number", suggestions: [] },
    { key: "address", label: "Address", placeholder: "Full address", suggestions: [] },
    { key: "joiningDate", label: "Joining Date", placeholder: "YYYY-MM-DD", suggestions: [] },
    { key: "qualification", label: "Qualification", placeholder: "e.g., ITI, Diploma, Degree", suggestions: ["ITI", "Diploma", "Bachelor's", "Master's"] },
    { key: "previousCompany", label: "Previous Company", placeholder: "Company name", suggestions: [] },
    { key: "skillSet", label: "Skills", placeholder: "e.g., Welding, Fitting", suggestions: ["Welding", "Fitting", "Carpentry", "Painting", "Plumbing", "Electrical"] }
  ]);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    monthly: "",
    phone: "",
    calculationDays: "30",
    upi: "",
    account: "",
    ifsc: "",
    aadhaar: "",
    experience: "",
    status: "active"
  });

  const [extraFields, setExtraFields] = useState([
    { key: "", value: "" }
  ]);

  // Fetch ALL workers for accurate counts (independent of filter)
  const fetchAllWorkersForCounts = async () => {
    try {
      const res = await API.get("/employees");
      const allWorkers = res.data;
      
      // Calculate counts from ALL workers
      const total = allWorkers.length;
      const active = allWorkers.filter(w => w.status === "active").length;
      const inactive = allWorkers.filter(w => w.status === "inactive").length;
      
      setTotalCount(total);
      setActiveCount(active);
      setInactiveCount(inactive);
      
      return allWorkers;
    } catch (err) {
      console.error("Error fetching counts:", err);
      return [];
    }
  };

  // Fetch filtered workers for display based on statusFilter
  const fetchFilteredWorkers = async () => {
    setLoading(true);
    try {
      let url = "/employees";
      if (statusFilter !== "all") {
        url = `/employees/status/${statusFilter}`;
      }
      const res = await API.get(url);
      setWorkers(res.data);
      
      // Collect all extra field keys from existing workers for suggestions
      const existingKeys = new Map();
      res.data.forEach(worker => {
        if (worker.extraFields) {
          Object.keys(worker.extraFields).forEach(key => {
            if (!existingKeys.has(key)) {
              existingKeys.set(key, {
                key: key,
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                placeholder: `Enter ${key}`,
                suggestions: []
              });
            }
          });
        }
      });
      
      const dbFields = Array.from(existingKeys.values());
      setExistingExtraFieldsFromDB(dbFields);
      
      // Update suggestions with DB fields
      const updatedSuggestions = [...extraFieldSuggestions];
      dbFields.forEach(field => {
        if (!updatedSuggestions.some(s => s.key === field.key)) {
          updatedSuggestions.push(field);
        }
      });
      setExtraFieldSuggestions(updatedSuggestions);
    } catch (err) {
      console.error("Error fetching workers:", err);
      alert("Error fetching workers");
    } finally {
      setLoading(false);
    }
  };

  // Fetch both counts and filtered workers
  useEffect(() => {
    fetchAllWorkersForCounts(); // Always fetch counts from all workers
    fetchFilteredWorkers(); // Fetch filtered workers based on statusFilter
  }, [statusFilter]); // Re-run when filter changes

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buildExtraFields = () => {
    const obj = {};
    extraFields.forEach((f) => {
      if (f.key && f.key.trim()) obj[f.key.trim()] = f.value;
    });
    return obj;
  };

  const resetForm = () => {
    setForm({
      name: "",
      designation: "",
      monthly: "",
      phone: "",
      calculationDays: "30",
      upi: "",
      account: "",
      ifsc: "",
      aadhaar: "",
      experience: "",
      status: "active"
    });
    setExtraFields([{ key: "", value: "" }]);
    setEditingWorker(null);
  };

  const scrollToForm = () => {
    setTimeout(() => {
      const formElement = document.getElementById('worker-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const saveWorker = async () => {
    if (!form.name || !form.designation || !form.monthly || !form.phone) {
      alert("Please fill all required fields (*)");
      return;
    }

    const workerData = {
      name: form.name,
      designation: form.designation,
      wages: {
        monthly: Number(form.monthly),
        calculationDays: Number(form.calculationDays) || 30
      },
      phone: form.phone,
      upi: { id: form.upi },
      bank: {
        accountNumber: form.account,
        ifsc: form.ifsc
      },
      aadhaar: form.aadhaar,
      experience: Number(form.experience) || 0,
      extraFields: buildExtraFields(),
      status: form.status
    };

    setLoading(true);
    try {
      if (editingWorker) {
        await API.put(`/employees/${editingWorker._id}`, workerData);
        alert("Worker updated successfully");
      } else {
        await API.post("/employees/add", workerData);
        alert("Worker added successfully");
      }
      
      resetForm();
      setShowForm(false);
      fetchFilteredWorkers(); // Refresh filtered workers
      fetchAllWorkersForCounts(); // Refresh counts
    } catch (err) {
      console.error("Error saving worker:", err);
      alert(err.response?.data?.msg || "Error saving worker");
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const base64String = canvas.toDataURL('image/jpeg', quality);
          resolve(base64String);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadPhoto = async (employeeId, file, type) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only JPG, PNG, or GIF images');
      return;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size should be less than 5MB. Please compress your image.');
      return;
    }
    
    setUploadProgress(0);
    setShowProgress(true);
    setUploadingPhoto(true);
    
    try {
      setUploadProgress(20);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const compressedBase64 = await compressImage(file, 800, 800, 0.7);
      setUploadProgress(50);
      
      const endpoint = type === "profile" 
        ? `/uploads/upload-profile/${employeeId}`
        : `/uploads/upload-aadhaar/${employeeId}`;
      
      await API.post(endpoint, { photo: compressedBase64 });
      
      setUploadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      alert(`${type === "profile" ? "Profile" : "Aadhaar"} photo uploaded successfully`);
      fetchFilteredWorkers(); // Refresh to show new photo
    } catch (err) {
      console.error("Error uploading photo:", err);
      if (err.response?.status === 413) {
        alert("File too large. Please use a smaller image.");
      } else {
        alert("Error uploading photo. Please try again.");
      }
    } finally {
      setShowProgress(false);
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const handlePhotoUpload = (employeeId, type) => {
    if (uploadingPhoto) {
      alert("Please wait, another upload is in progress");
      return;
    }
    
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/gif";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        await uploadPhoto(employeeId, file, type);
      }
    };
    input.click();
  };

  const viewPhoto = (photoUrl, type) => {
    if (photoUrl) {
      setSelectedPhoto(photoUrl);
      setPhotoModalType(type);
      setShowPhotoModal(true);
    }
  };

  const deletePhoto = async (employeeId, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type} photo?`)) {
      try {
        setLoading(true);
        await API.delete(`/uploads/delete-photo/${employeeId}/${type}`);
        alert("Photo deleted successfully");
        fetchFilteredWorkers(); // Refresh to update photo display
      } catch (err) {
        console.error("Error deleting photo:", err);
        alert("Error deleting photo");
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteWorker = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      try {
        await API.delete(`/employees/${id}`);
        alert("Worker deleted successfully");
        fetchFilteredWorkers(); // Refresh filtered workers
        fetchAllWorkersForCounts(); // Refresh counts
      } catch (err) {
        console.error("Error deleting worker:", err);
        alert("Error deleting worker");
      }
    }
  };

  const deactivateWorker = async (id, name) => {
    if (window.confirm(`Deactivate ${name}? They will be marked as inactive and won't appear in active worker lists.`)) {
      try {
        await API.patch(`/employees/${id}/deactivate`);
        alert("Worker deactivated successfully");
        fetchFilteredWorkers(); // Refresh filtered workers
        fetchAllWorkersForCounts(); // Refresh counts
      } catch (err) {
        console.error("Error deactivating worker:", err);
        alert("Error deactivating worker");
      }
    }
  };

  const reactivateWorker = async (id, name) => {
    if (window.confirm(`Reactivate ${name}? They will be available for work again.`)) {
      try {
        await API.patch(`/employees/${id}/reactivate`);
        alert("Worker reactivated successfully");
        fetchFilteredWorkers(); // Refresh filtered workers
        fetchAllWorkersForCounts(); // Refresh counts
      } catch (err) {
        console.error("Error reactivating worker:", err);
        alert("Error reactivating worker");
      }
    }
  };

  const editWorker = (worker) => {
    setEditingWorker(worker);
    setForm({
      name: worker.name || "",
      designation: worker.designation || "",
      monthly: worker.wages?.monthly || "",
      phone: worker.phone || "",
      calculationDays: worker.wages?.calculationDays || "30",
      upi: worker.upi?.id || "",
      account: worker.bank?.accountNumber || "",
      ifsc: worker.bank?.ifsc || "",
      aadhaar: worker.aadhaar || "",
      experience: worker.experience || "",
      status: worker.status || "active"
    });
    
    let extraFieldsArray = [];
    if (worker.extraFields) {
      if (worker.extraFields instanceof Map) {
        extraFieldsArray = Array.from(worker.extraFields.entries()).map(([key, value]) => ({
          key: key,
          value: value
        }));
      } else if (typeof worker.extraFields === 'object') {
        extraFieldsArray = Object.entries(worker.extraFields).map(([key, value]) => ({
          key: key,
          value: value
        }));
      }
    }
    
    setExtraFields(extraFieldsArray.length ? extraFieldsArray : [{ key: "", value: "" }]);
    setShowForm(true);
    scrollToForm();
  };

  const toggleExpand = (workerId) => {
    setExpandedRows(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <ProgressModal show={showProgress} progress={uploadProgress} />
        <PhotoModal 
          show={showPhotoModal} 
          photoUrl={selectedPhoto} 
          photoType={photoModalType} 
          onClose={() => setShowPhotoModal(false)} 
        />
        
        <WorkerHeader 
          showForm={showForm}
          onToggleForm={setShowForm}
          onResetForm={resetForm}
          onScrollToForm={scrollToForm}
        />
        
        {showForm && (
          <WorkerForm
            editingWorker={editingWorker}
            form={form}
            onFormChange={handleFormChange}
            extraFields={extraFields}
            onExtraFieldsChange={setExtraFields}
            extraFieldSuggestions={extraFieldSuggestions}
            existingExtraFieldsFromDB={existingExtraFieldsFromDB}
            onSave={saveWorker}
            onCancel={() => {
              resetForm();
              setShowForm(false);
            }}
            loading={loading}
          />
        )}
        
        <WorkerFilters
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalCount={totalCount}
          activeCount={activeCount}
          inactiveCount={inactiveCount}
        />
        
        <WorkerTable
          workers={filteredWorkers}
          expandedRows={expandedRows}
          onToggleExpand={toggleExpand}
          onEdit={editWorker}
          onDeactivate={deactivateWorker}
          onReactivate={reactivateWorker}
          onDelete={deleteWorker}
          onViewPhoto={viewPhoto}
          onUploadPhoto={handlePhotoUpload}
          onDeletePhoto={deletePhoto}
          onViewAadhaar={viewPhoto}
          onUploadAadhaar={(id) => handlePhotoUpload(id, "aadhaar")}
          onDeleteAadhaar={(id) => deletePhoto(id, "aadhaar")}
          uploadingPhoto={uploadingPhoto}
          extraFieldSuggestions={extraFieldSuggestions}
          loading={loading}
        />
        
        <StatsCards
          workers={workers}
          activeWorkers={workers.filter(w => w.status === "active")}
          inactiveWorkers={workers.filter(w => w.status === "inactive")}
        />
      </div>
    </div>
  );
}
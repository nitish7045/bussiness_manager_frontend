import React, { useState, useEffect, useRef } from "react";
import { billingAPI } from "../../api/api";

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterPriceRange, setFilterPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "NOS",
    price: ""
  });

  // Refs for scrolling
  const formRef = useRef(null);
  const detailsRef = useRef(null);
  const tableRef = useRef(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = [...products];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply unit filter
    if (filterUnit !== "all") {
      result = result.filter(product => product.unit === filterUnit);
    }

    // Apply price range filter
    if (filterPriceRange !== "all") {
      switch (filterPriceRange) {
        case "below100":
          result = result.filter(p => p.unitPrice < 100);
          break;
        case "100to500":
          result = result.filter(p => p.unitPrice >= 100 && p.unitPrice <= 500);
          break;
        case "500to1000":
          result = result.filter(p => p.unitPrice > 500 && p.unitPrice <= 1000);
          break;
        case "1000to5000":
          result = result.filter(p => p.unitPrice > 1000 && p.unitPrice <= 5000);
          break;
        case "above5000":
          result = result.filter(p => p.unitPrice > 5000);
          break;
        default:
          break;
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name?.toLowerCase();
          bVal = b.name?.toLowerCase();
          break;
        case "price":
          aVal = a.unitPrice;
          bVal = b.unitPrice;
          break;
        case "code":
          aVal = a.productCode;
          bVal = b.productCode;
          break;
        case "unit":
          aVal = a.unit;
          bVal = b.unit;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProducts(result);
  }, [products, searchTerm, filterUnit, filterPriceRange, sortBy, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.get("/billing/products");
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      unit: "NOS",
      price: ""
    });
    setIsEditing(false);
    setSelectedProduct(null);
    setShowForm(false);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterUnit("all");
    setFilterPriceRange("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  // Scroll to form when editing
  const scrollToForm = () => {
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Scroll to details when product is selected
  const scrollToDetails = () => {
    setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Please enter product name");
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    setLoading(true);
    
    try {
      if (isEditing && selectedProduct) {
        await billingAPI.put(`/billing/products/${selectedProduct._id}`, {
          name: formData.name.trim(),
          unit: formData.unit,
          unitPrice: parseFloat(formData.price)
        });
        alert("Product updated successfully!");
      } else {
        await billingAPI.post("/billing/products", {
          name: formData.name.trim(),
          unit: formData.unit,
          unitPrice: parseFloat(formData.price)
        });
        alert("Product added successfully!");
      }
      
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      const errorMsg = err.response?.data?.msg || "Error saving product";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit || "NOS",
      price: product.unitPrice
    });
    setIsEditing(true);
    setShowForm(true);
    // Scroll to form after state update
    scrollToForm();
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
    // Scroll to form after state update
    scrollToForm();
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Scroll to details after state update
    scrollToDetails();
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Delete product "${product.name}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await billingAPI.delete(`/billing/products/${product._id}`);
        alert("Product deleted successfully");
        await fetchProducts();
        if (selectedProduct?._id === product._id) {
          resetForm();
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        alert(err.response?.data?.msg || "Error deleting product");
      } finally {
        setLoading(false);
      }
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString('en-IN');
  };

  // Get unique units for filter dropdown
  const uniqueUnits = [...new Set(products.map(p => p.unit).filter(Boolean))];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
        <h2 className="text-xl font-bold text-gray-800">📦 Manage Products</h2>
        {!showForm && (
          <button
            onClick={handleAddNew}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Add Product
          </button>
        )}
      </div>

      {/* Search and Filter Bar - Sticky */}
      <div className="sticky top-16 bg-white z-10 pb-2">
        <div className="mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by product name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 pl-8 focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <span>⚙️</span>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={fetchProducts}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              Refresh
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Unit Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={filterUnit}
                    onChange={(e) => setFilterUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="all">All Units</option>
                    {uniqueUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
                  <select
                    value={filterPriceRange}
                    onChange={(e) => setFilterPriceRange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="all">All Prices</option>
                    <option value="below100">Below ₹100</option>
                    <option value="100to500">₹100 - ₹500</option>
                    <option value="500to1000">₹500 - ₹1,000</option>
                    <option value="1000to5000">₹1,000 - ₹5,000</option>
                    <option value="above5000">Above ₹5,000</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="code">Product Code</option>
                    <option value="unit">Unit</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || filterUnit !== "all" || filterPriceRange !== "all") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Active Filters:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      Search: {searchTerm}
                      <button onClick={() => setSearchTerm("")} className="hover:text-blue-900">✕</button>
                    </span>
                  )}
                  {filterUnit !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      Unit: {filterUnit}
                      <button onClick={() => setFilterUnit("all")} className="hover:text-green-900">✕</button>
                    </span>
                  )}
                  {filterPriceRange !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                      Price: {filterPriceRange === "below100" ? "Below ₹100" :
                               filterPriceRange === "100to500" ? "₹100 - ₹500" :
                               filterPriceRange === "500to1000" ? "₹500 - ₹1,000" :
                               filterPriceRange === "1000to5000" ? "₹1,000 - ₹5,000" : "Above ₹5,000"}
                      <button onClick={() => setFilterPriceRange("all")} className="hover:text-purple-900">✕</button>
                    </span>
                  )}
                  <button
                    onClick={resetFilters}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="text-xs text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>
      </div>

      {/* Product Form (Inline) - with ref for scrolling */}
      {showForm && (
        <div ref={formRef} className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 scroll-mt-20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              {isEditing ? "✏️ Edit Product" : "➕ Add New Product"}
            </h3>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              ✕ Cancel
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit (Optional)
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NOS">NOS (Numbers)</option>
                  <option value="MTR">MTR (Meters)</option>
                  <option value="KG">KG (Kilograms)</option>
                  <option value="LTR">LTR (Liters)</option>
                  <option value="PC">PC (Piece)</option>
                  <option value="BOX">BOX (Box)</option>
                  <option value="PACK">PACK (Pack)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : (isEditing ? "Update Product" : "Save Product")}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table - with max height and scroll */}
      <div className="overflow-x-auto" ref={tableRef}>
        <div className="max-h-[400px] overflow-y-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => setSortBy("code")}>
                  ID {sortBy === "code" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => setSortBy("name")}>
                  Product Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => setSortBy("unit")}>
                  Unit {sortBy === "unit" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => setSortBy("price")}>
                  Price (₹) {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                   </td>
                  </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    {searchTerm || filterUnit !== "all" || filterPriceRange !== "all" 
                      ? "No products match your filters" 
                      : "No products found. Click 'Add Product' to add one."}
                   </td>
                  </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr 
                    key={product._id} 
                    className={`border-t hover:bg-gray-50 cursor-pointer ${
                      selectedProduct?._id === product._id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {product.productCode || product.product_id || `P${index + 1}`}
                     </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {product.name}
                     </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.unit || "NOS"}
                     </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      ₹{formatNumber(product.unitPrice)}
                     </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(product);
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        🗑️
                      </button>
                     </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Product Details - with ref for scrolling */}
      {selectedProduct && !showForm && (
        <div ref={detailsRef} className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 scroll-mt-20">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Product Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Product ID:</span>
                  <span className="ml-2 font-mono">{selectedProduct.productCode || selectedProduct.product_id || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedProduct.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unit:</span>
                  <span className="ml-2">{selectedProduct.unit || "NOS"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-2 font-semibold text-green-600">₹{formatNumber(selectedProduct.unitPrice)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
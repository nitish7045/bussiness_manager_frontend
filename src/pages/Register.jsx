import { useState } from "react";
import API from "../api/api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    try {
      await API.post("/auth/register", form);

      alert("Registered successfully");
      window.location.reload();

    } catch (err) {
      alert("Register failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow w-80">

        <h2 className="text-2xl font-bold mb-5 text-center">Register</h2>

        <input name="name" placeholder="Name" onChange={handleChange} className="w-full border p-2 mb-3 rounded" />
        <input name="email" placeholder="Email" onChange={handleChange} className="w-full border p-2 mb-3 rounded" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full border p-2 mb-3 rounded" />

        <button
          onClick={register}
          className="w-full bg-black text-white p-2 rounded"
        >
          Register
        </button>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

export default function BusinessProfile() {
  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({
    about: "",
    address: "",
    email: "",
    websites: "",
    profile_picture_url: "",
  });

  useEffect(() => {
    fetch("/api/getBusinessProfile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setForm({
          about: data.about || "",
          address: data.address || "",
          email: data.email || "",
          websites: data.websites?.join(", ") || "",
          profile_picture_url: data.profile_picture_url || "",
        });
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  

  const updateProfile = async () => {
    const res = await fetch("/api/updateBusinessProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.id) {
      alert("Profile updated successfully!");
      setProfile(form);
    } else {
      alert("Error updating profile.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">Business Profile</h2>

        {/* Profile Picture */}
        <div className="flex flex-col items-center mt-4">
          <img
            src={form.profile_picture_url || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-gray-300"
          />
          <input
            type="text"
            name="profile_picture_url"
            placeholder="Profile Picture URL"
            className="border rounded p-2 w-full mt-2 text-center"
            value={form.profile_picture_url}
            onChange={handleChange}
          />
        </div>

        {/* Form Fields */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">About</label>
          <textarea
            name="about"
            rows={4}
            className="border rounded p-2 w-full"
            value={form.about}
            onChange={handleChange}
          />

          <label className="block text-sm font-medium text-gray-700 mt-3">Address</label>
          <input
            type="text"
            name="address"
            className="border rounded p-2 w-full"
            value={form.address}
            onChange={handleChange}
          />

          <label className="block text-sm font-medium text-gray-700 mt-3">Email</label>
          <input
            type="email"
            name="email"
            className="border rounded p-2 w-full"
            value={form.email}
            onChange={handleChange}
          />

          <label className="block text-sm font-medium text-gray-700 mt-3">Websites</label>
          <input
            type="text"
            name="websites"
            className="border rounded p-2 w-full"
            placeholder="Separate multiple websites with commas"
            value={form.websites}
            onChange={handleChange}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-6">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition duration-200"
            onClick={updateProfile}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

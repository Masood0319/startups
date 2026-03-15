"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

export default function Page() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    role: "",
    status: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiRequest("users", { method: "GET" });
        const userData = res?.data?.user || null;
        if (!userData) return;
        setUser(userData);
        setFormData({
          full_name: userData.full_name || "",
          email: userData.email || "",
          bio: userData.bio || "",
          role: userData.role || "",
          status: userData.status || "",
        });
      } catch (err) {
        console.log("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const res = await apiRequest(`users/${user.id || user._id}`, {
        method: "PUT",
        data: formData,
      });
      setUser({ ...user, ...(res?.data?.user || formData) });
      setEditMode(false);
    } catch (err) {
      console.log("Error updating user:", err);
    }
  };

  if (!user)
    return <p className="text-center mt-20 text-gray-500">Loading profile...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b pb-6 mb-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500 font-semibold">
            {user.full_name ? user.full_name[0].toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {user.full_name}
            </h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="mt-2 text-sm text-blue-600 font-medium capitalize">
              {user.role}
            </p>
            <p className="text-sm text-green-600 font-medium capitalize">
              {user.status}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        {!editMode ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                About
              </h2>
              <p className="text-gray-700">
                {user.bio || "No bio added yet."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-sm text-gray-700">Role</p>
                <p className="font-medium text-gray-400">{user.role}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-sm text-gray-700">Status</p>
                <p className="font-medium text-gray-400 capitalize">{user.status}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-sm text-gray-700">Created At</p>
                <p className="font-medium text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border">
                <p className="text-sm text-gray-700">Updated At</p>
                <p className="font-medium text-gray-400">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="mt-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Edit Profile
            </h2>
          
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-3 border rounded-lg text-gray-400"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full p-3 border rounded-lg text-gray-400"
            />
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write about yourself..."
              className="w-full p-3 border rounded-lg text-gray-400"
              rows={3}
            />
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Role"
              className="w-full p-3 border rounded-lg text-gray-400"
            />
            <input
              type="text"
              name="status"
              value={formData.status}
              onChange={handleChange}
              placeholder="Status"
              className="w-full p-3 border rounded-lg text-gray-400"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUpdate}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-5 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
} from "@material-tailwind/react";
import {
  PersonCircle,
  EnvelopeFill,
  AwardFill,
  ClockFill,
  BoxArrowRight,
  PencilSquare,
  CameraFill,
  TrashFill,
  PersonBadgeFill,
} from "react-bootstrap-icons";
import { getAuth, clearAuth, getAuthHeaders, isAdmin } from "../utils/auth";
import StudentIDCard from "../components/StudentIDCard";
import StudentCourses from "../components/StudentCourses";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const scale = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoTimestamp, setPhotoTimestamp] = useState(Date.now());

  const fetchFreshStudent = useCallback(async (id, fallback) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/${id}`,
        getAuthHeaders()
      );
      setStudent(res.data);
      // Keep local session updated
      const current = getAuth();
      if (current && current.role === "STUDENT") {
        localStorage.setItem(
          "authUser",
          JSON.stringify({ ...current, ...res.data })
        );
      }
    } catch {
      setStudent(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate("/login", {
        state: {
          message: "Please log in to view your student profile.",
          tab: "student",
        },
      });
      return;
    }

    // If an Admin views /profile without a student session, redirect to Directory
    if (auth.role === "ADMIN") {
      navigate("/");
      return;
    }

    setStudent(auth);
    fetchFreshStudent(auth.id, auth);
  }, [navigate, fetchFreshStudent]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, JPEG, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Maximum file size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setUploadingPhoto(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/student/${student.id}/photo`,
        formData,
        {
          headers: {
            ...getAuthHeaders().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updated = { ...student, profilePicture: res.data.fileName };
      setStudent(updated);
      setPhotoTimestamp(Date.now());

      const currentAuth = getAuth();
      if (currentAuth) {
        localStorage.setItem(
          "authUser",
          JSON.stringify({ ...currentAuth, ...updated })
        );
      }
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      alert(
        "Failed to upload photo: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?"))
      return;

    try {
      await axios.delete(
        `${API_BASE_URL}/student/${student.id}/photo`,
        getAuthHeaders()
      );
      const updated = { ...student, profilePicture: null };
      setStudent(updated);
      const currentAuth = getAuth();
      if (currentAuth) {
        localStorage.setItem(
          "authUser",
          JSON.stringify({ ...currentAuth, ...updated })
        );
      }
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      alert(
        "Failed to remove photo: " + (err.response?.data?.message || err.message)
      );
    }
  };

  if (loading && !student) {
    return (
      <div className="flex justify-center items-center py-10">
        <Typography variant="h4" color="white">
          Loading student details...
        </Typography>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const width = scale(student.weight || 50, 10, 150, 60, 160);
  const height = scale(student.height || 160, 100, 220, 60, 160);
  const hairColorClean = (student.hairColor || "gray").trim();
  const boxStyle = {
    width: `${width}px`,
    height: `${height}px`,
    border: `3px solid ${hairColorClean}`,
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "12px auto",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  };

  const formattedDate = student.creationTimestamp
    ? new Date(student.creationTimestamp).toLocaleString()
    : "Recently Added";

  const photoUrl = student.profilePicture
    ? `${API_BASE_URL}/student/${student.id}/photo?t=${photoTimestamp}`
    : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotoUpload}
      />

      <Card className="shadow-2xl overflow-hidden border border-gray-200">
        <CardHeader
          variant="gradient"
          color="red"
          className="m-0 p-6 rounded-none flex flex-col md:flex-row items-center justify-between gap-4"
        >
          {/* Student Profile Picture & Details Header */}
          <div className="flex items-center gap-4 text-white">
            {/* Avatar with Upload Badge */}
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full overflow-hidden bg-white/20 border-3 shadow-lg flex items-center justify-center cursor-pointer relative"
                style={{ borderColor: hairColorClean }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={student.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <PersonCircle size={76} className="text-white/90" />
                )}

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                  <CameraFill size={18} />
                  <span>Change</span>
                </div>
              </div>

              {/* Uploading Spinner */}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ...
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Typography variant="h3" color="white" className="m-0">
                  {student.name}
                </Typography>
                {student.profilePicture && (
                  <button
                    onClick={handlePhotoDelete}
                    title="Remove profile picture"
                    className="text-white/70 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                  >
                    <TrashFill size={14} />
                  </button>
                )}
              </div>
              <Typography
                variant="small"
                color="white"
                className="opacity-90 flex items-center gap-2 mt-1"
              >
                <EnvelopeFill size={14} /> {student.email}
              </Typography>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-white/90 hover:text-white underline text-xs mt-1 bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1 font-semibold"
              >
                <CameraFill size={12} />{" "}
                {student.profilePicture ? "Change Profile Photo" : "Upload Profile Photo"}
              </button>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              color="white"
              className="bg-amber-400 text-slate-900 font-bold flex items-center gap-2 shadow"
              onClick={() => setShowIdCard(true)}
            >
              <PersonBadgeFill size={16} /> Student ID Card
            </Button>
            <Button
              size="sm"
              color="white"
              variant="outlined"
              className="flex items-center gap-2 text-white border-white"
              onClick={() => navigate(`/edituser/${student.id}`)}
            >
              <PencilSquare size={16} /> Edit Profile
            </Button>
            <Button
              size="sm"
              color="white"
              className="text-red-700 bg-white flex items-center gap-2 font-bold"
              onClick={handleLogout}
            >
              <BoxArrowRight size={16} /> Logout
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic & Personal Information */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <Typography
                variant="h5"
                color="blue-gray"
                className="border-b pb-2 flex items-center gap-2"
              >
                <AwardFill color="#d97706" /> Academic & Account Info
              </Typography>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Student ID:</span>
                  <p className="text-gray-900 font-bold text-base">
                    STU-2026-{String(student.id).padStart(4, "0")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">GPA:</span>
                  <p className="text-gray-900 font-bold text-base">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      {student.gpa} / 4.50
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium">Email:</span>
                  <p className="text-gray-900 font-semibold">{student.email}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <ClockFill size={12} /> Registered On:
                  </span>
                  <p className="text-gray-700 font-medium">{formattedDate}</p>
                </div>
              </div>

              {/* ID Card Quick CTA */}
              <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-amber-900 block">
                    Official Student Credential
                  </strong>
                  <span className="text-[11px] text-amber-700">
                    Print or save your digital ID Card
                  </span>
                </div>
                <Button
                  size="sm"
                  color="amber"
                  variant="filled"
                  className="text-xs py-1.5 px-3"
                  onClick={() => setShowIdCard(true)}
                >
                  View ID
                </Button>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <Typography
                variant="h5"
                color="blue-gray"
                className="border-b pb-2"
              >
                Physical Profile
              </Typography>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500 block">Height</span>
                  <strong className="text-gray-900 text-base">
                    {student.height} cm
                  </strong>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500 block">Weight</span>
                  <strong className="text-gray-900 text-base">
                    {student.weight} kg
                  </strong>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500 block">Hair Color</span>
                  <strong
                    className="text-base uppercase"
                    style={{ color: hairColorClean }}
                  >
                    {student.hairColor}
                  </strong>
                </div>
              </div>

              <div className="mt-2 text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Dynamic Proportion Visualization (Border: Hair Color)
                </p>
                <div style={boxStyle}>
                  <span className="text-xs font-semibold text-gray-700">
                    {student.weight}kg × {student.height}cm
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
            {isAdmin() ? (
              <Button
                variant="outlined"
                color="blue-gray"
                size="sm"
                onClick={() => navigate("/")}
              >
                ← Back to Admin Directory
              </Button>
            ) : (
              <span className="text-xs text-gray-500 italic">
                🔒 You are viewing your private student record.
              </span>
            )}
            <Button
              variant="gradient"
              color="red"
              size="sm"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Academic Courses & Grades System */}
      <StudentCourses
        studentId={student.id}
        onGpaUpdated={() => fetchFreshStudent(student.id, student)}
      />

      {/* Student ID Card Modal */}
      <StudentIDCard
        student={student}
        show={showIdCard}
        onHide={() => setShowIdCard(false)}
      />
    </div>
  );
};

export default StudentProfile;

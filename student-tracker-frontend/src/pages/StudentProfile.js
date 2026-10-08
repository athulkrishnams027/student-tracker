import React, { useEffect, useState, useCallback } from "react";
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
} from "react-bootstrap-icons";
import { getAuth, clearAuth, getAuthHeaders, isAdmin } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const scale = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

const StudentProfile = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

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

    // If an Admin views /profile without a student session, they can view Directory
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card className="shadow-2xl overflow-hidden border border-gray-200">
        <CardHeader
          variant="gradient"
          color="red"
          className="m-0 p-6 rounded-none flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-white">
            <PersonCircle size={56} />
            <div>
              <Typography variant="h3" color="white">
                {student.name}
              </Typography>
              <Typography
                variant="small"
                color="white"
                className="opacity-90 flex items-center gap-2"
              >
                <EnvelopeFill size={14} /> {student.email}
              </Typography>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              color="white"
              variant="outlined"
              className="flex items-center gap-2"
              onClick={() => navigate(`/edituser/${student.id}`)}
            >
              <PencilSquare size={16} /> Edit My Profile
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
                    #{student.id}
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
    </div>
  );
};

export default StudentProfile;

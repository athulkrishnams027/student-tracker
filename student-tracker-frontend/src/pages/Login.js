import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import {
  EyeFill,
  EyeSlashFill,
  PersonBadgeFill,
  ShieldLockFill,
  MortarboardFill,
} from "react-bootstrap-icons";
import { setAuth } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab: 'student', 'teacher', or 'admin'
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === "admin"
      ? "admin"
      : location.state?.tab === "teacher"
      ? "teacher"
      : "student"
  );

  // Student form state
  const [studentCreds, setStudentCreds] = useState({
    email: "",
    password: "",
  });

  // Teacher form state
  const [teacherCreds, setTeacherCreds] = useState({
    email: "",
    password: "",
  });

  // Admin form state
  const [adminCreds, setAdminCreds] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  const onStudentChange = (e) => {
    setStudentCreds({ ...studentCreds, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const onTeacherChange = (e) => {
    setTeacherCreds({ ...teacherCreds, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const onAdminChange = (e) => {
    setAdminCreds({ ...adminCreds, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const onStudentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/student/login`,
        studentCreds
      );
      setAuth(response.data);
      navigate("/profile");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid student email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onTeacherSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/teacher/login`,
        teacherCreds
      );
      setAuth(response.data);
      navigate("/teacher/dashboard");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid faculty email or password. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/login`,
        adminCreds
      );
      setAuth(response.data);
      navigate("/");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid admin credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getHeaderColor = () => {
    if (activeTab === "admin") return "blue-gray";
    if (activeTab === "teacher") return "teal";
    return "red";
  };

  const getHeaderTitle = () => {
    if (activeTab === "admin") return "Admin Portal";
    if (activeTab === "teacher") return "Faculty Portal";
    return "Student Portal";
  };

  const getHeaderSubtitle = () => {
    if (activeTab === "admin") return "Administrator access to manage all student & faculty records";
    if (activeTab === "teacher") return "Faculty access to manage internal marks & grades for assigned subjects";
    return "Login to view your courses, internal marks, and student details";
  };

  return (
    <div className="flex justify-center items-center py-5">
      <Card className="w-11/12 md:w-1/2 lg:w-5/12 shadow-2xl bg-white">
        <CardHeader
          variant="gradient"
          color={getHeaderColor()}
          className="mb-4 p-4 text-center"
        >
          <Typography variant="h3" color="white">
            {getHeaderTitle()}
          </Typography>
          <Typography variant="small" color="white" className="opacity-90 mt-1">
            {getHeaderSubtitle()}
          </Typography>

          {/* Toggle Tabs */}
          <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveTab("student");
                setError("");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "student"
                  ? "bg-white text-gray-900 shadow"
                  : "bg-black/20 text-white hover:bg-black/30"
              }`}
            >
              <PersonBadgeFill size={14} /> Student
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("teacher");
                setError("");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "teacher"
                  ? "bg-white text-gray-900 shadow"
                  : "bg-black/20 text-white hover:bg-black/30"
              }`}
            >
              <MortarboardFill size={14} /> Faculty / Teacher
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError("");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-white text-gray-900 shadow"
                  : "bg-black/20 text-white hover:bg-black/30"
              }`}
            >
              <ShieldLockFill size={14} /> Admin
            </button>
          </div>
        </CardHeader>

        {error && (
          <div className="px-6 pt-2">
            <div
              className="bg-red-50 border border-red-300 text-red-700 px-4 py-2.5 rounded text-center text-sm font-medium"
              role="alert"
            >
              {error}
            </div>
          </div>
        )}

        {/* 1. STUDENT LOGIN FORM */}
        {activeTab === "student" && (
          <form onSubmit={onStudentSubmit}>
            <CardBody className="flex flex-col gap-4 pt-2">
              <Input
                color="red"
                type="email"
                label="Student Email"
                size="lg"
                value={studentCreds.email}
                name="email"
                required
                onChange={onStudentChange}
              />

              <div style={{ display: "flex", alignItems: "center" }}>
                <Input
                  color="red"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  size="lg"
                  value={studentCreds.password}
                  name="password"
                  required
                  onChange={onStudentChange}
                  style={{ flex: 1 }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer", marginLeft: "-40px", zIndex: 1 }}
                >
                  {showPassword ? (
                    <EyeSlashFill color="gray" size="20" />
                  ) : (
                    <EyeFill color="gray" size="20" />
                  )}
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-lg text-xs text-red-900 border border-red-100">
                🔒 <strong>Student Privacy:</strong> Students can only view their
                own profile, registered subjects, internal marks, and grades.
              </div>
            </CardBody>

            <CardFooter className="pt-0 flex flex-col gap-2">
              <Button
                variant="gradient"
                color="red"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login as Student"}
              </Button>

              <div className="text-center mt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("teacher");
                    setError("");
                  }}
                  className="text-teal-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Faculty Login
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin");
                    setError("");
                  }}
                  className="text-blue-gray-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Admin Login
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {/* 2. TEACHER LOGIN FORM */}
        {activeTab === "teacher" && (
          <form onSubmit={onTeacherSubmit}>
            <CardBody className="flex flex-col gap-4 pt-2">
              <Input
                color="teal"
                type="email"
                label="Faculty Email"
                size="lg"
                value={teacherCreds.email}
                name="email"
                placeholder="knuth@university.edu"
                required
                onChange={onTeacherChange}
              />

              <div style={{ display: "flex", alignItems: "center" }}>
                <Input
                  color="teal"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                  size="lg"
                  value={teacherCreds.password}
                  name="password"
                  required
                  onChange={onTeacherChange}
                  style={{ flex: 1 }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer", marginLeft: "-40px", zIndex: 1 }}
                >
                  {showPassword ? (
                    <EyeSlashFill color="gray" size="20" />
                  ) : (
                    <EyeFill color="gray" size="20" />
                  )}
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg text-xs text-teal-900 border border-teal-100">
                👩‍🏫 <strong>Subject Authorization Rule:</strong>
                <br />
                Each teacher is restricted to their assigned subjects. You can only enter internal marks, exam scores, and grades for your courses.
                <div className="mt-1 font-mono text-[11px] text-teal-800">
                  Demo Faculty: <span className="font-bold">knuth@university.edu</span> / <span className="font-bold">teacher123</span> (CS101)
                </div>
              </div>
            </CardBody>

            <CardFooter className="pt-0 flex flex-col gap-2">
              <Button
                variant="gradient"
                color="teal"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? "Authenticating Faculty..." : "Login as Faculty"}
              </Button>

              <div className="text-center mt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("student");
                    setError("");
                  }}
                  className="text-red-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Student Login
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin");
                    setError("");
                  }}
                  className="text-blue-gray-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Admin Login
                </button>
              </div>
            </CardFooter>
          </form>
        )}

        {/* 3. ADMIN LOGIN FORM */}
        {activeTab === "admin" && (
          <form onSubmit={onAdminSubmit}>
            <CardBody className="flex flex-col gap-4 pt-2">
              <Input
                color="blue-gray"
                type="text"
                label="Admin Username"
                size="lg"
                value={adminCreds.username}
                name="username"
                placeholder="admin"
                required
                onChange={onAdminChange}
              />

              <div style={{ display: "flex", alignItems: "center" }}>
                <Input
                  color="blue-gray"
                  type={showPassword ? "text" : "password"}
                  label="Admin Password"
                  size="lg"
                  value={adminCreds.password}
                  name="password"
                  required
                  onChange={onAdminChange}
                  style={{ flex: 1 }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer", marginLeft: "-40px", zIndex: 1 }}
                >
                  {showPassword ? (
                    <EyeSlashFill color="gray" size="20" />
                  ) : (
                    <EyeFill color="gray" size="20" />
                  )}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-100">
                🔑 <strong>Default Admin Credentials:</strong>
                <br />
                Username: <code className="font-bold">admin</code> | Password: <code className="font-bold">admin123</code>
              </div>
            </CardBody>

            <CardFooter className="pt-0 flex flex-col gap-2">
              <Button
                variant="gradient"
                color="blue-gray"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login as Admin"}
              </Button>

              <div className="text-center mt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("student");
                    setError("");
                  }}
                  className="text-red-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Student Login
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("teacher");
                    setError("");
                  }}
                  className="text-teal-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                >
                  Faculty Login
                </button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;

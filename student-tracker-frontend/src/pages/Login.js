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
} from "react-bootstrap-icons";
import { setAuth } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab: 'student' or 'admin'
  const [activeTab, setActiveTab] = useState(
    location.state?.tab === "admin" ? "admin" : "student"
  );

  // Student form state
  const [studentCreds, setStudentCreds] = useState({
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
        setError("Invalid email or password. Please try again.");
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

  return (
    <div className="flex justify-center items-center py-5">
      <Card className="w-11/12 md:w-1/2 lg:w-1/3 shadow-2xl bg-white">
        <CardHeader
          variant="gradient"
          color={activeTab === "admin" ? "blue-gray" : "red"}
          className="mb-4 p-4 text-center"
        >
          <Typography variant="h3" color="white">
            {activeTab === "admin" ? "Admin Portal" : "Student Portal"}
          </Typography>
          <Typography variant="small" color="white" className="opacity-90">
            {activeTab === "admin"
              ? "Administrator access to manage all student records"
              : "Login to view your individual student details"}
          </Typography>

          {/* Toggle Tabs */}
          <div className="flex justify-center gap-2 mt-4">
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
              <PersonBadgeFill size={14} /> Student Login
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
              <ShieldLockFill size={14} /> Admin Login
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

        {activeTab === "student" ? (
          /* STUDENT LOGIN FORM */
          <form onSubmit={onStudentSubmit}>
            <CardBody className="flex flex-col gap-4 pt-2">
              <Input
                color="teal"
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
                  color="teal"
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

              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100">
                🔒 <strong>Student Privacy:</strong> Students can only view their
                own profile and academic records.
              </div>
            </CardBody>

            <CardFooter className="pt-0 flex flex-col gap-2">
              <Button
                variant="gradient"
                color="amber"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login as Student"}
              </Button>

              <div className="text-center mt-2">
                <Typography variant="small" className="text-gray-600">
                  Are you an administrator?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("admin");
                      setError("");
                    }}
                    className="text-red-500 font-semibold underline bg-transparent border-0 cursor-pointer p-0"
                  >
                    Switch to Admin Login
                  </button>
                </Typography>
              </div>
            </CardFooter>
          </form>
        ) : (
          /* ADMIN LOGIN FORM */
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
                Username: <code className="font-bold">admin</code>
                <br />
                Password: <code className="font-bold">admin123</code>
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

              <div className="text-center mt-2">
                <Typography variant="small" className="text-gray-600">
                  Are you a student?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("student");
                      setError("");
                    }}
                    className="text-blue-600 font-semibold underline bg-transparent border-0 cursor-pointer p-0"
                  >
                    Switch to Student Login
                  </button>
                </Typography>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Login;

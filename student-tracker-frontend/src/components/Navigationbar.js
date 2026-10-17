import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Navbar } from "@material-tailwind/react";
import { ShieldLockFill, PersonFill, MortarboardFill } from "react-bootstrap-icons";
import { getAuth, clearAuth, isAdmin, isStudent, isTeacher } from "../utils/auth";

const Navigationbar = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getAuth());

  const checkAuth = () => {
    setCurrentUser(getAuth());
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
    navigate("/login");
  };

  const handleBrandClick = (e) => {
    e.preventDefault();
    if (isTeacher()) {
      navigate("/teacher/dashboard");
    } else if (isStudent()) {
      navigate("/profile");
    } else if (isAdmin()) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div>
      <Navbar className="navbar mx-auto my-4 py-2 px-4 lg:px-8 lg:py-4 bg-white shadow-md">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2">
            <Typography
              variant="h4"
              color="blue-gray"
              as="a"
              href="#"
              onClick={handleBrandClick}
              className="mr-2 cursor-pointer py-1.5 font-bold no-underline flex items-center gap-2"
            >
              🎓 Student Tracker App
            </Typography>
            {isAdmin() && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <ShieldLockFill size={12} /> Admin
              </span>
            )}
            {isTeacher() && (
              <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <MortarboardFill size={12} /> Faculty
              </span>
            )}
            {isStudent() && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1">
                <PersonFill size={12} /> Student
              </span>
            )}
          </div>

          {/* Action buttons based on role */}
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <>
                <Button
                  variant="outlined"
                  size="sm"
                  color="blue-gray"
                  onClick={() => navigate("/")}
                >
                  All Students
                </Button>
                <Button
                  variant="outlined"
                  size="sm"
                  color="teal"
                  onClick={() => navigate("/teachers")}
                >
                  Faculty & Subjects
                </Button>
                <Button
                  variant="filled"
                  size="sm"
                  color="red"
                  onClick={() => navigate("/addstudent")}
                >
                  + ADD STUDENT
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  color="red"
                  onClick={handleLogout}
                >
                  Logout (Admin)
                </Button>
              </>
            )}

            {isTeacher() && (
              <>
                <Button
                  variant="filled"
                  size="sm"
                  color="teal"
                  onClick={() => navigate("/teacher/dashboard")}
                  className="font-bold flex items-center gap-1 shadow"
                >
                  <MortarboardFill size={14} /> My Gradebook ({currentUser?.name ? currentUser.name.split(" ")[0] : "Faculty"})
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  color="red"
                  onClick={handleLogout}
                >
                  Logout (Faculty)
                </Button>
              </>
            )}

            {isStudent() && (
              <>
                <Button
                  variant="outlined"
                  size="sm"
                  color="amber"
                  onClick={() => navigate("/profile")}
                >
                  My Profile ({currentUser?.name ? currentUser.name.split(" ")[0] : "Student"})
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            )}

            {!currentUser && (
              <Button
                variant="gradient"
                size="sm"
                color="red"
                onClick={() => navigate("/login")}
              >
                LOGIN
              </Button>
            )}
          </div>
        </div>
      </Navbar>
    </div>
  );
};

export default Navigationbar;

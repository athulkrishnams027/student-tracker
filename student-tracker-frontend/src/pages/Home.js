import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ViewUser from "../components/users/ViewUser";
import { Button, Typography } from "@material-tailwind/react";
import { EyeFill, EyeSlashFill, ShieldLockFill } from "react-bootstrap-icons";
import { getAuth, isAdmin, isStudent, getAuthHeaders } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const Home = () => {
  const [displayUser, setDisplayUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const loadStudent = useCallback(async () => {
    try {
      const result = await axios.get(
        `${API_BASE_URL}/students`,
        getAuthHeaders()
      );
      const studentsData = result.data
        .sort((a, b) => a.id - b.id)
        .map((student) => ({
          ...student,
          showPassword: false,
        }));
      setStudents(studentsData);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setErrorMessage(
          "Access denied. Only administrators have permission to view the student list."
        );
      } else {
        setErrorMessage("Failed to load students. Please verify server connection.");
      }
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      // Not logged in -> redirect to login page with admin prompt
      navigate("/login", {
        state: {
          message: "Please log in as an administrator to view the student directory.",
          tab: "admin",
        },
      });
      return;
    }

    if (isStudent()) {
      // Logged in as student -> redirect to their own profile
      navigate("/profile");
      return;
    }

    if (isAdmin()) {
      loadStudent();
    }
  }, [navigate, loadStudent]);

  const handleView = (student) => {
    setDisplayUser(student);
  };

  const handleClose = () => {
    setDisplayUser(null);
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this student record?")) {
      try {
        await axios.delete(`${API_BASE_URL}/student/${id}`, getAuthHeaders());
        loadStudent();
      } catch (err) {
        alert("Failed to delete student record: " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="container">
      <div className="py-4">
        {/* Admin Header Banner */}
        <div className="bg-slate-800 text-white p-4 rounded-t-lg shadow flex flex-col md:flex-row justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldLockFill size={24} className="text-amber-400" />
            <div>
              <Typography variant="h5" color="white" className="m-0 font-bold">
                Admin Directory — All Students
              </Typography>
              <Typography variant="small" className="text-gray-300">
                Restricted to administrators only. Confidential records.
              </Typography>
            </div>
          </div>
          <span className="bg-amber-500 text-gray-900 font-bold px-3 py-1 rounded-full text-xs">
            Total Students: {students.length}
          </span>
        </div>

        {errorMessage && (
          <div className="alert alert-danger text-center" role="alert">
            {errorMessage}
          </div>
        )}

        <table className="table table-hover table-bordered shadow rounded-table">
          <thead className="table-dark">
            <tr>
              <th scope="col" className="text-center">
                #
              </th>
              <th scope="col" className="text-center">
                Name
              </th>
              <th scope="col" className="text-center">
                Email
              </th>
              <th scope="col" className="text-center">
                Password
              </th>
              <th scope="col" className="text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No students found in the database.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id || index}>
                  <th scope="row" className="text-center align-middle">
                    {index + 1}
                  </th>
                  <td className="text-center align-middle">{student.name}</td>
                  <td className="text-center align-middle">{student.email}</td>
                  <td className="text-center align-middle">
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span>
                        {student.showPassword
                          ? student.password
                          : "*".repeat((student.password || "").length)}
                      </span>
                      <span
                        onClick={() => {
                          const updatedStudents = students.map((s) => {
                            if (s.id === student.id) {
                              return { ...s, showPassword: !s.showPassword };
                            }
                            return s;
                          });
                          setStudents(updatedStudents);
                        }}
                        style={{ cursor: "pointer", marginLeft: "10px" }}
                      >
                        {student.showPassword ? (
                          <EyeSlashFill color="gray" size="20" />
                        ) : (
                          <EyeFill color="gray" size="20" />
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="d-flex justify-content-center">
                    <Button
                      className="mx-1"
                      fullWidth
                      color="amber"
                      size="sm"
                      onClick={() => handleView(student)}
                    >
                      View
                    </Button>
                    <Button
                      className="mx-1"
                      fullWidth
                      onClick={() => navigate(`/edituser/${student.id}`)}
                      color="amber"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      className="mx-1"
                      fullWidth
                      color="red"
                      size="sm"
                      onClick={() => {
                        deleteUser(student.id);
                      }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
            <ViewUser user={displayUser} handleClose={handleClose} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;

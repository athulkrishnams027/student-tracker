import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Input,
} from "@material-tailwind/react";
import {
  MortarboardFill,
  PersonPlusFill,
  TrashFill,
  BookFill,
  ShieldCheck,
  Building,
  EnvelopeFill,
  TelephoneFill,
} from "react-bootstrap-icons";
import { getAuth, isAdmin, getAuthHeaders } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const TeacherManagement = () => {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // New teacher form state
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    password: "",
    department: "Computer Science",
    designation: "Assistant Professor",
    phone: "",
  });

  // Assign subject state
  const [assignmentData, setAssignmentData] = useState({
    courseId: "",
    teacherId: "",
  });

  // Verify Admin Login
  useEffect(() => {
    const auth = getAuth();
    if (!auth || !isAdmin()) {
      navigate("/login", {
        state: {
          message: "Please log in as an administrator to manage faculty and subjects.",
          tab: "admin",
        },
      });
    }
  }, [navigate]);

  // Load teachers and courses
  const loadData = useCallback(async () => {
    setLoading(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const [tRes, cRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/teachers`, getAuthHeaders()),
        axios.get(`${API_BASE_URL}/courses`, getAuthHeaders()),
      ]);
      setTeachers(tRes.data || []);
      setCourses(cRes.data || []);
      if (cRes.data && cRes.data.length > 0 && tRes.data && tRes.data.length > 0) {
        setAssignmentData({
          courseId: String(cRes.data[0].id),
          teacherId: String(tRes.data[0].id),
        });
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load faculty and courses.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    try {
      await axios.post(`${API_BASE_URL}/teacher`, newTeacher, getAuthHeaders());
      setStatusMessage({
        type: "success",
        text: `Faculty member "${newTeacher.name}" created successfully! They can now log in.`,
      });
      setShowAddModal(false);
      setNewTeacher({
        name: "",
        email: "",
        password: "",
        department: "Computer Science",
        designation: "Assistant Professor",
        phone: "",
      });
      loadData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create faculty member.",
      });
    }
  };

  // Assign teacher to course
  const handleAssignCourse = async (e) => {
    e.preventDefault();
    if (!assignmentData.courseId || !assignmentData.teacherId) return;
    setStatusMessage({ type: "", text: "" });

    try {
      await axios.put(
        `${API_BASE_URL}/course/${assignmentData.courseId}/assign-teacher/${assignmentData.teacherId}`,
        {},
        getAuthHeaders()
      );
      setStatusMessage({
        type: "success",
        text: "Faculty member assigned to subject successfully!",
      });
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to assign faculty member to course.",
      });
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove faculty member "${name}"? Courses taught by them will be unassigned.`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/teacher/${id}`, getAuthHeaders());
      setStatusMessage({
        type: "success",
        text: `Faculty member "${name}" removed.`,
      });
      loadData();
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to remove faculty member.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Page Header */}
      <Card className="bg-gradient-to-r from-blue-gray-800 to-blue-gray-900 text-white shadow-xl mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={13} /> Administrator Portal
                </span>
              </div>
              <Typography variant="h3" color="white" className="font-bold flex items-center gap-2">
                <MortarboardFill /> Faculty & Subject Allocation
              </Typography>
              <Typography variant="small" className="text-gray-300 mt-1">
                Create faculty accounts and assign them to specific subjects. Teachers are restricted to entering marks only for their allocated courses.
              </Typography>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="filled"
                size="sm"
                color="teal"
                onClick={() => setShowAddModal(true)}
                className="font-bold flex items-center gap-1 shadow"
              >
                <PersonPlusFill size={15} /> + ADD FACULTY
              </Button>
              <Button
                variant="outlined"
                size="sm"
                color="white"
                onClick={() => setShowAssignModal(true)}
                className="font-bold flex items-center gap-1 border-white"
              >
                <BookFill size={14} /> Assign Subject
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Alert Banner */}
      {statusMessage.text && (
        <div className="mb-4">
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between shadow ${
              statusMessage.type === "success"
                ? "bg-green-100 border border-green-300 text-green-900"
                : "bg-red-100 border border-red-300 text-red-900"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="text-gray-500 hover:text-black font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Faculty List */}
      <Card className="shadow-lg bg-white border border-gray-100">
        <CardHeader
          variant="gradient"
          color="blue-gray"
          className="p-4 flex justify-between items-center"
        >
          <Typography variant="h5" color="white" className="font-bold flex items-center gap-2">
            <MortarboardFill /> Faculty Members ({teachers.length})
          </Typography>
          <Typography variant="small" color="white" className="text-xs opacity-90">
            Total Courses: {courses.length}
          </Typography>
        </CardHeader>

        <CardBody className="p-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500 text-sm">Loading faculty data...</div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl">
              <Typography variant="h6" color="gray">
                No faculty members registered yet.
              </Typography>
              <Button
                variant="filled"
                size="sm"
                color="teal"
                onClick={() => setShowAddModal(true)}
                className="mt-3"
              >
                Add First Faculty Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] table-auto text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Faculty Member</th>
                    <th className="py-3 px-3">Department & Role</th>
                    <th className="py-3 px-3">Login Credentials</th>
                    <th className="py-3 px-3">Allocated Subject(s)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {teachers.map((t) => {
                    // Find courses assigned to this teacher
                    const assignedCourses = courses.filter(
                      (c) => c.teacher && c.teacher.id === t.id
                    );

                    return (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition">
                        {/* Name & Contact */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                          <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <TelephoneFill size={10} /> {t.phone || "N/A"}
                          </div>
                        </td>

                        {/* Department & Designation */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-800">{t.designation || "Faculty"}</div>
                          <div className="text-gray-500 text-[11px] flex items-center gap-1">
                            <Building size={10} /> {t.department}
                          </div>
                        </td>

                        {/* Credentials */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-gray-700">
                            <EnvelopeFill size={11} className="text-gray-400" />
                            <span className="font-mono text-xs">{t.email}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Password: <span className="font-semibold">{t.password}</span>
                          </div>
                        </td>

                        {/* Allocated Subjects */}
                        <td className="py-3 px-3">
                          {assignedCourses.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">
                              No subject assigned
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedCourses.map((c) => (
                                <span
                                  key={c.id}
                                  className="bg-teal-50 border border-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded text-[11px]"
                                >
                                  {c.courseCode}: {c.title}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition"
                            title="Remove Faculty Member"
                          >
                            <TrashFill size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* MODAL 1: ADD NEW TEACHER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader variant="gradient" color="teal" className="p-4 text-center">
              <Typography variant="h5" color="white" className="font-bold flex items-center justify-center gap-2">
                <PersonPlusFill /> Add New Faculty Member
              </Typography>
            </CardHeader>
            <form onSubmit={handleAddTeacher}>
              <CardBody className="p-4 flex flex-col gap-3">
                <Input
                  color="teal"
                  label="Full Name (e.g., Prof. John Doe)"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  required
                />
                <Input
                  color="teal"
                  type="email"
                  label="Email (Login Username)"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  required
                />
                <Input
                  color="teal"
                  type="password"
                  label="Password"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  required
                />
                <Input
                  color="teal"
                  label="Department (e.g. Computer Science)"
                  value={newTeacher.department}
                  onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
                  required
                />
                <Input
                  color="teal"
                  label="Designation (e.g. Professor, Assistant Professor)"
                  value={newTeacher.designation}
                  onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                  required
                />
                <Input
                  color="teal"
                  label="Phone Number"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                />
              </CardBody>
              <div className="p-4 pt-0 flex justify-end gap-2">
                <Button
                  variant="text"
                  color="gray"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="gradient" color="teal" size="sm" type="submit">
                  Save Faculty
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: ASSIGN SUBJECT TO TEACHER */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader variant="gradient" color="blue-gray" className="p-4 text-center">
              <Typography variant="h5" color="white" className="font-bold flex items-center justify-center gap-2">
                <BookFill /> Allocate Subject to Faculty
              </Typography>
            </CardHeader>
            <form onSubmit={handleAssignCourse}>
              <CardBody className="p-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Select Subject / Course:
                  </label>
                  <select
                    value={assignmentData.courseId}
                    onChange={(e) =>
                      setAssignmentData({ ...assignmentData, courseId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500 bg-white"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} - {c.title} ({c.credits} cr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Assign Faculty Member:
                  </label>
                  <select
                    value={assignmentData.teacherId}
                    onChange={(e) =>
                      setAssignmentData({ ...assignmentData, teacherId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-teal-500 bg-white"
                    required
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department} - {t.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-blue-50 text-blue-900 rounded text-[11px]">
                  ℹ️ Once assigned, this teacher will have exclusive permission to enter continuous assessment (internal) marks, exam scores, and grades for this subject.
                </div>
              </CardBody>
              <div className="p-4 pt-0 flex justify-end gap-2">
                <Button
                  variant="text"
                  color="gray"
                  size="sm"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="gradient" color="blue-gray" size="sm" type="submit">
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

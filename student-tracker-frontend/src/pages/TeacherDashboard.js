import React, { useState, useEffect, useCallback } from "react";
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
  MortarboardFill,
  BookFill,
  ShieldCheck,
  Search,
  Building,
  EnvelopeFill,
  Check2,
} from "react-bootstrap-icons";
import { getAuth, isTeacher, getAuthHeaders } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const currentFaculty = getAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]); // Array of enrollments with local editable state
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingId, setSavingId] = useState(null); // enrollment id being saved
  const [saveSuccessMap, setSaveSuccessMap] = useState({}); // { [enrollmentId]: true }
  const [savingAll, setSavingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // 1. Verify faculty login
  useEffect(() => {
    if (!currentFaculty || !isTeacher()) {
      navigate("/login", {
        state: {
          message: "Please log in with your faculty credentials to access the Teacher Portal.",
          tab: "teacher",
        },
      });
    }
  }, [currentFaculty, navigate]);

  // 2. Load assigned courses for this teacher
  const loadAssignedCourses = useCallback(async () => {
    if (!currentFaculty || !currentFaculty.id) return;
    setLoadingCourses(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const res = await axios.get(
        `${API_BASE_URL}/teacher/${currentFaculty.id}/courses`,
        getAuthHeaders()
      );
      setCourses(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedCourse(res.data[0]);
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load assigned subjects. Please verify server connection.",
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [currentFaculty]);

  useEffect(() => {
    loadAssignedCourses();
  }, [loadAssignedCourses]);

  // 3. Load students enrolled in the selected course
  const loadCourseStudents = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoadingStudents(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const res = await axios.get(
        `${API_BASE_URL}/teacher/course/${courseId}/students`,
        getAuthHeaders()
      );

      // Initialize local editable state
      const mapped = (res.data || []).map((en) => ({
        ...en,
        localInternalMarks: en.internalMarks !== null && en.internalMarks !== undefined ? en.internalMarks : "",
        localExamMarks: en.examMarks !== null && en.examMarks !== undefined ? en.examMarks : "",
        localGrade: en.grade || "IN_PROGRESS",
        localAttendance: en.attendance !== null && en.attendance !== undefined ? en.attendance : 100,
        localRemarks: en.remarks || "",
      }));

      setStudents(mapped);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to load course roster. You may not have permission for this course.",
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseStudents(selectedCourse.id);
    }
  }, [selectedCourse, loadCourseStudents]);

  // Helper: auto compute suggested grade from total marks
  const computeSuggestedGrade = (total) => {
    if (total === null || total === undefined || total === "") return "IN_PROGRESS";
    const num = parseFloat(total);
    if (isNaN(num)) return "IN_PROGRESS";
    if (num >= 93) return "A+";
    if (num >= 85) return "A";
    if (num >= 80) return "A-";
    if (num >= 75) return "B+";
    if (num >= 70) return "B";
    if (num >= 65) return "B-";
    if (num >= 60) return "C+";
    if (num >= 55) return "C";
    if (num >= 50) return "C-";
    if (num >= 40) return "D";
    return "F";
  };

  // Field change handler
  const handleStudentFieldChange = (enrollmentId, field, val) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== enrollmentId) return s;

        const updated = { ...s, [field]: val };

        // If internal or exam marks change, recalculate total and optionally suggest grade
        if (field === "localInternalMarks" || field === "localExamMarks") {
          const internalVal = field === "localInternalMarks" ? val : s.localInternalMarks;
          const examVal = field === "localExamMarks" ? val : s.localExamMarks;

          const numInternal = parseFloat(internalVal) || 0;
          const numExam = parseFloat(examVal) || 0;

          if (internalVal !== "" || examVal !== "") {
            const total = numInternal + numExam;
            updated.localTotalMarks = total;
            // If grade was IN_PROGRESS or empty, auto-populate suggested grade
            if (!s.localGrade || s.localGrade === "IN_PROGRESS") {
              updated.localGrade = computeSuggestedGrade(total);
            }
          }
        }

        return updated;
      })
    );
  };

  // 4. Save marks for a single student
  const handleSaveStudent = async (studentItem) => {
    setSavingId(studentItem.id);
    setStatusMessage({ type: "", text: "" });

    try {
      const payload = {
        internalMarks: studentItem.localInternalMarks !== "" ? parseFloat(studentItem.localInternalMarks) : null,
        examMarks: studentItem.localExamMarks !== "" ? parseFloat(studentItem.localExamMarks) : null,
        grade: studentItem.localGrade,
        attendance: parseInt(studentItem.localAttendance, 10) || 0,
        remarks: studentItem.localRemarks,
      };

      const res = await axios.put(
        `${API_BASE_URL}/teacher/enrollment/${studentItem.id}/marks`,
        payload,
        getAuthHeaders()
      );

      // Flash success mark
      setSaveSuccessMap((prev) => ({ ...prev, [studentItem.id]: true }));
      setTimeout(() => {
        setSaveSuccessMap((prev) => ({ ...prev, [studentItem.id]: false }));
      }, 3000);

      setStatusMessage({
        type: "success",
        text: `Marks and Grade successfully saved for ${studentItem.student?.name}! Student GPA updated to ${res.data?.updatedGpa || "N/A"}.`,
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update marks. Access denied or server error.",
      });
    } finally {
      setSavingId(null);
    }
  };

  // 5. Batch Save All students in current subject
  const handleSaveAll = async () => {
    if (!students || students.length === 0) return;
    setSavingAll(true);
    setStatusMessage({ type: "", text: "" });
    let successCount = 0;
    let failedCount = 0;

    for (const studentItem of students) {
      try {
        const payload = {
          internalMarks: studentItem.localInternalMarks !== "" ? parseFloat(studentItem.localInternalMarks) : null,
          examMarks: studentItem.localExamMarks !== "" ? parseFloat(studentItem.localExamMarks) : null,
          grade: studentItem.localGrade,
          attendance: parseInt(studentItem.localAttendance, 10) || 0,
          remarks: studentItem.localRemarks,
        };

        await axios.put(
          `${API_BASE_URL}/teacher/enrollment/${studentItem.id}/marks`,
          payload,
          getAuthHeaders()
        );
        successCount++;
      } catch (err) {
        failedCount++;
      }
    }

    setSavingAll(false);
    if (failedCount === 0) {
      setStatusMessage({
        type: "success",
        text: `All ${successCount} student records updated successfully and GPA recalculated!`,
      });
    } else {
      setStatusMessage({
        type: "warning",
        text: `Saved ${successCount} records. ${failedCount} failed to save.`,
      });
    }
  };

  // Filter students based on search input
  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const name = s.student?.name?.toLowerCase() || "";
    const email = s.student?.email?.toLowerCase() || "";
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 1. Faculty Profile Header Card */}
      <Card className="bg-gradient-to-r from-teal-800 to-teal-900 text-white shadow-xl mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-teal-700/80 text-white text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={13} /> Authorized Faculty Portal
                </span>
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {currentFaculty?.designation || "Faculty Member"}
                </span>
              </div>
              <Typography variant="h3" color="white" className="font-bold flex items-center gap-2">
                <MortarboardFill /> {currentFaculty?.name || "Professor"}
              </Typography>
              <div className="flex flex-wrap items-center gap-4 text-xs text-teal-100 mt-2">
                <span className="flex items-center gap-1">
                  <Building size={12} /> {currentFaculty?.department || "Department"}
                </span>
                <span className="flex items-center gap-1">
                  <EnvelopeFill size={12} /> {currentFaculty?.email}
                </span>
                <span className="flex items-center gap-1">
                  <BookFill size={12} /> {courses.length} Subject(s) Assigned
                </span>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 text-center min-w-[200px]">
              <Typography variant="small" className="text-teal-200 uppercase font-semibold text-[11px]">
                Gradebook Scope
              </Typography>
              <Typography variant="h4" color="white" className="font-bold mt-1">
                {selectedCourse ? selectedCourse.courseCode : "---"}
              </Typography>
              <Typography variant="small" className="text-xs text-teal-100">
                {students.length} Enrolled Students
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status Alert Banner */}
      {statusMessage.text && (
        <div className="mb-4">
          <div
            className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between shadow ${
              statusMessage.type === "success"
                ? "bg-green-100 border border-green-300 text-green-900"
                : statusMessage.type === "warning"
                ? "bg-amber-100 border border-amber-300 text-amber-900"
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

      {/* 2. Assigned Subjects Tab Switcher */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Typography variant="h5" color="blue-gray" className="font-bold flex items-center gap-2">
            <BookFill className="text-teal-700" /> My Assigned Subjects
          </Typography>
          <Typography variant="small" className="text-gray-600 text-xs">
            Subject-restricted: You can only view and grade courses assigned to you
          </Typography>
        </div>

        {loadingCourses ? (
          <div className="text-center py-6 text-gray-500 text-sm">Loading your assigned subjects...</div>
        ) : courses.length === 0 ? (
          <Card className="bg-amber-50 border border-amber-200 p-6 text-center">
            <Typography variant="h6" color="amber" className="font-bold">
              No Subjects Currently Assigned
            </Typography>
            <Typography variant="small" className="text-gray-600 mt-1 max-w-lg mx-auto">
              You do not have any courses linked to your faculty account yet. Please contact the university administrator to allocate courses to you.
            </Typography>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((c) => {
              const isSelected = selectedCourse && selectedCourse.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/70 shadow-md transform -translate-y-0.5"
                      : "border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-teal-700 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {c.courseCode}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">
                      {c.credits} Credits
                    </span>
                  </div>
                  <Typography
                    variant="h6"
                    className={`mt-2 font-bold ${
                      isSelected ? "text-teal-900" : "text-gray-800"
                    }`}
                  >
                    {c.title}
                  </Typography>
                  <Typography variant="small" className="text-xs text-gray-500 mt-1">
                    {c.department}
                  </Typography>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Subject Gradebook & Enrolled Students Roster */}
      {selectedCourse && (
        <Card className="shadow-lg bg-white border border-gray-100">
          <CardHeader
            variant="gradient"
            color="teal"
            className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded">
                  {selectedCourse.courseCode}
                </span>
                <Typography variant="h5" color="white" className="font-bold">
                  {selectedCourse.title}
                </Typography>
              </div>
              <Typography variant="small" color="white" className="opacity-90 text-xs mt-1">
                Enter continuous assessment (internals), semester exam marks, letter grade, and attendance percentage.
              </Typography>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="filled"
                size="sm"
                color="white"
                className="text-teal-900 font-bold flex items-center gap-1 shadow"
                onClick={handleSaveAll}
                disabled={savingAll || students.length === 0}
              >
                {savingAll ? "Saving Roster..." : "Save All Marks"}
              </Button>
            </div>
          </CardHeader>

          <CardBody className="p-4">
            {/* Search & Statistics Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search enrolled students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400" size={13} />
              </div>

              <div className="text-xs text-gray-600 flex items-center gap-3">
                <span>
                  Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students
                </span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span className="text-teal-700 font-semibold hidden sm:inline">
                  Auto GPA Recalculation Enabled
                </span>
              </div>
            </div>

            {/* Students Table */}
            {loadingStudents ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Loading students for {selectedCourse.courseCode}...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                <Typography variant="h6" color="gray" className="font-medium">
                  {students.length === 0
                    ? `No students have enrolled in ${selectedCourse.courseCode} yet.`
                    : "No students match your search criteria."}
                </Typography>
                <Typography variant="small" className="text-xs text-gray-500 mt-1">
                  Students can self-enroll from their student course portal.
                </Typography>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] table-auto text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-3">Student</th>
                      <th className="py-3 px-2 w-24">Internal (/50)</th>
                      <th className="py-3 px-2 w-24">Exam (/50)</th>
                      <th className="py-3 px-2 w-20">Total (/100)</th>
                      <th className="py-3 px-2 w-28">Grade</th>
                      <th className="py-3 px-2 w-24">Attendance (%)</th>
                      <th className="py-3 px-3">Faculty Remarks</th>
                      <th className="py-3 px-2 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredStudents.map((en) => {
                      const student = en.student || {};
                      const isSaving = savingId === en.id;
                      const isSaved = saveSuccessMap[en.id];

                      // Compute total for live preview
                      const numInt = parseFloat(en.localInternalMarks) || 0;
                      const numEx = parseFloat(en.localExamMarks) || 0;
                      const liveTotal = (en.localInternalMarks !== "" || en.localExamMarks !== "")
                        ? (numInt + numEx).toFixed(1)
                        : (en.totalMarks !== null && en.totalMarks !== undefined ? en.totalMarks : "---");

                      return (
                        <tr key={en.id} className="hover:bg-teal-50/40 transition">
                          {/* Student Info */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {student.profilePicture ? (
                                <img
                                  src={`${API_BASE_URL}/student/${student.id}/photo`}
                                  alt={student.name}
                                  className="w-9 h-9 rounded-full object-cover border border-teal-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                                  {student.name ? student.name.charAt(0) : "S"}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-gray-900">{student.name}</div>
                                <div className="text-[11px] text-gray-500">{student.email}</div>
                                <div className="text-[10px] text-teal-700 font-medium">
                                  Current GPA: {student.gpa !== null && student.gpa !== undefined ? student.gpa : "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Internal Marks (0-50) */}
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="50"
                              placeholder="0-50"
                              value={en.localInternalMarks}
                              onChange={(e) =>
                                handleStudentFieldChange(en.id, "localInternalMarks", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Exam Marks (0-50) */}
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="50"
                              placeholder="0-50"
                              value={en.localExamMarks}
                              onChange={(e) =>
                                handleStudentFieldChange(en.id, "localExamMarks", e.target.value)
                              }
                              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Total Score Display */}
                          <td className="py-3 px-2">
                            <span className="font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded text-xs">
                              {liveTotal}
                            </span>
                          </td>

                          {/* Grade Selection */}
                          <td className="py-3 px-2">
                            <select
                              value={en.localGrade}
                              onChange={(e) =>
                                handleStudentFieldChange(en.id, "localGrade", e.target.value)
                              }
                              className="w-24 px-1.5 py-1.5 border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:border-teal-500 bg-white"
                            >
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="A+">A+ (4.3)</option>
                              <option value="A">A (4.0)</option>
                              <option value="A-">A- (3.7)</option>
                              <option value="B+">B+ (3.3)</option>
                              <option value="B">B (3.0)</option>
                              <option value="B-">B- (2.7)</option>
                              <option value="C+">C+ (2.3)</option>
                              <option value="C">C (2.0)</option>
                              <option value="C-">C- (1.7)</option>
                              <option value="D">D (1.0)</option>
                              <option value="F">F (0.0)</option>
                            </select>
                          </td>

                          {/* Attendance */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={en.localAttendance}
                                onChange={(e) =>
                                  handleStudentFieldChange(en.id, "localAttendance", e.target.value)
                                }
                                className="w-16 px-2 py-1.5 border border-gray-300 rounded text-xs font-semibold focus:outline-none focus:border-teal-500"
                              />
                              <span className="text-gray-500 text-[11px]">%</span>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              placeholder="Feedback, comments..."
                              value={en.localRemarks}
                              onChange={(e) =>
                                handleStudentFieldChange(en.id, "localRemarks", e.target.value)
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-teal-500"
                            />
                          </td>

                          {/* Save Button */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveStudent(en)}
                              disabled={isSaving}
                              className={`px-3 py-1.5 rounded font-bold text-xs transition flex items-center justify-center gap-1 mx-auto ${
                                isSaved
                                  ? "bg-green-600 text-white"
                                  : "bg-teal-700 hover:bg-teal-800 text-white"
                              }`}
                            >
                              {isSaving ? (
                                "..."
                              ) : isSaved ? (
                                <>
                                  <Check2 size={14} /> Saved
                                </>
                              ) : (
                                "Save"
                              )}
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
      )}
    </div>
  );
};

export default TeacherDashboard;

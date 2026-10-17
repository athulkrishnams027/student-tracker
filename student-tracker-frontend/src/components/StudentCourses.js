import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Modal, Button, Table, Badge, ProgressBar } from "react-bootstrap";
import {
  BookFill,
  PlusCircleFill,
  Trash3Fill,
  AwardFill,
  CalendarCheckFill,
  MortarboardFill,
  CheckCircleFill,
} from "react-bootstrap-icons";
import { getAuthHeaders } from "../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const StudentCourses = ({ studentId, onGpaUpdated }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("Fall 2026");
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);

  const fetchStudentCourses = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/${studentId}/courses`,
        getAuthHeaders()
      );
      setEnrollments(res.data);
    } catch (err) {
      console.error("Failed to fetch student courses", err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const fetchAvailableCourses = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/courses`);
      setAvailableCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch catalogue", err);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchStudentCourses();
      fetchAvailableCourses();
    }
  }, [studentId, fetchStudentCourses, fetchAvailableCourses]);

  const handleEnroll = async (courseId) => {
    setEnrollingCourseId(courseId);
    try {
      await axios.post(
        `${API_BASE_URL}/student/${studentId}/enroll/${courseId}?semester=${encodeURIComponent(
          selectedSemester
        )}`,
        {},
        getAuthHeaders()
      );
      await fetchStudentCourses();
      setShowEnrollModal(false);
    } catch (err) {
      alert(
        "Failed to enroll: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleDrop = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to drop "${courseTitle}"?`))
      return;
    try {
      await axios.delete(
        `${API_BASE_URL}/student/${studentId}/enroll/${courseId}`,
        getAuthHeaders()
      );
      await fetchStudentCourses();
      if (onGpaUpdated) onGpaUpdated();
    } catch (err) {
      alert("Failed to drop course: " + (err.response?.data?.message || err.message));
    }
  };

  // Enrolled course IDs set for quick lookup
  const enrolledCourseIds = new Set(
    enrollments.map((en) => en.course?.id).filter(Boolean)
  );

  // Statistics calculation
  const totalCredits = enrollments.reduce(
    (sum, en) => sum + (en.course?.credits || 0),
    0
  );
  const avgAttendance =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, en) => sum + (en.attendance || 100), 0) /
            enrollments.length
        )
      : 100;

  const getGradeBadge = (grade, gradePoint) => {
    if (!grade || grade === "IN_PROGRESS") {
      return <Badge bg="secondary">In Progress</Badge>;
    }
    if (grade.startsWith("A")) {
      return (
        <Badge bg="success" className="px-2 py-1">
          {grade} ({gradePoint?.toFixed(2)})
        </Badge>
      );
    }
    if (grade.startsWith("B")) {
      return (
        <Badge bg="primary" className="px-2 py-1">
          {grade} ({gradePoint?.toFixed(2)})
        </Badge>
      );
    }
    if (grade.startsWith("C")) {
      return (
        <Badge bg="warning" text="dark" className="px-2 py-1">
          {grade} ({gradePoint?.toFixed(2)})
        </Badge>
      );
    }
    return <Badge bg="danger">{grade}</Badge>;
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 m-0 flex items-center gap-2">
            <BookFill className="text-amber-500" /> Enrolled Courses & Academic Grades
          </h4>
          <span className="text-xs text-slate-500">
            Semester subject registrations, credit points, and attendance records
          </span>
        </div>
        <Button
          variant="danger"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
          onClick={() => setShowEnrollModal(true)}
        >
          <PlusCircleFill size={14} /> Enroll in Courses
        </Button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
            <MortarboardFill size={20} />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">
              Registered Courses
            </span>
            <strong className="text-base text-slate-900">
              {enrollments.length} Subjects
            </strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800">
            <AwardFill size={20} />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">
              Total Credits
            </span>
            <strong className="text-base text-slate-900">
              {totalCredits} Credits
            </strong>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-3">
          <div
            className={`p-2.5 rounded-lg ${
              avgAttendance >= 75
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <CalendarCheckFill size={20} />
          </div>
          <div className="flex-1">
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">
              Avg. Attendance
            </span>
            <div className="flex items-center gap-2">
              <strong className="text-base text-slate-900">
                {avgAttendance}%
              </strong>
              <ProgressBar
                now={avgAttendance}
                variant={avgAttendance >= 75 ? "success" : "danger"}
                style={{ height: "6px", flex: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      {loading ? (
        <div className="text-center py-4 text-xs text-slate-500">
          Loading courses...
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <BookFill size={36} className="text-slate-300 mx-auto mb-2" />
          <h5 className="text-sm font-bold text-slate-700">No Courses Enrolled Yet</h5>
          <p className="text-xs text-slate-500 mb-3">
            Enroll in available semester subjects to track your grades and credits.
          </p>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowEnrollModal(true)}
            className="font-bold text-xs"
          >
            Browse Catalogue & Enroll
          </Button>
        </div>
      ) : (
        <div className="table-responsive">
          <Table hover className="align-middle text-xs mb-0">
            <thead className="table-light text-slate-600">
              <tr>
                <th>Code</th>
                <th>Course Title</th>
                <th>Instructor & Dept</th>
                <th className="text-center">Credits</th>
                <th className="text-center">Semester</th>
                <th className="text-center">Attendance</th>
                <th className="text-center">Grade</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((en) => (
                <tr key={en.id}>
                  <td>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {en.course?.courseCode}
                    </span>
                  </td>
                  <td>
                    <strong className="text-slate-900 block">
                      {en.course?.title}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      {en.course?.description}
                    </span>
                  </td>
                  <td>
                    <span className="text-slate-700 block font-medium">
                      {en.course?.instructor || "Department Faculty"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {en.course?.department}
                    </span>
                  </td>
                  <td className="text-center font-bold text-slate-800">
                    {en.course?.credits}
                  </td>
                  <td className="text-center text-slate-600">
                    {en.semester || "Fall 2026"}
                  </td>
                  <td className="text-center" style={{ minWidth: "110px" }}>
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="font-bold text-slate-800">
                        {en.attendance || 100}%
                      </span>
                    </div>
                    <ProgressBar
                      now={en.attendance || 100}
                      variant={(en.attendance || 100) >= 75 ? "success" : "danger"}
                      style={{ height: "4px" }}
                      className="mt-1"
                    />
                  </td>
                  <td className="text-center">
                    {getGradeBadge(en.grade, en.gradePoint)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => handleDrop(en.course?.id, en.course?.title)}
                      className="text-red-500 hover:text-red-700 p-1 border-0 bg-transparent cursor-pointer"
                      title="Drop course"
                    >
                      <Trash3Fill size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Enrollment Catalogue Modal */}
      <Modal
        show={showEnrollModal}
        onHide={() => setShowEnrollModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-slate-900 text-white">
          <Modal.Title className="text-base font-bold flex items-center gap-2">
            <BookFill className="text-amber-400" /> Course Catalogue & Enrollment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Choose subjects to enroll in for the current academic session:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Semester:</span>
              <select
                className="form-select form-select-sm text-xs py-1"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2027">Spring 2027</option>
                <option value="Summer 2027">Summer 2027</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {availableCourses.map((c) => {
              const isEnrolled = enrolledCourseIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-100 text-amber-900 font-mono font-bold text-xs px-2 py-0.5 rounded">
                        {c.courseCode}
                      </span>
                      <strong className="text-sm text-slate-900">
                        {c.title}
                      </strong>
                      <span className="bg-blue-50 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {c.credits} Credits
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">
                      {c.description}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Instructor: <strong className="text-slate-600">{c.instructor}</strong> | Dept: {c.department}
                    </span>
                  </div>

                  <div>
                    {isEnrolled ? (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-green-200">
                        <CheckCircleFill size={14} /> Enrolled
                      </span>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1"
                        disabled={enrollingCourseId === c.id}
                        onClick={() => handleEnroll(c.id)}
                      >
                        {enrollingCourseId === c.id ? "Enrolling..." : "+ Enroll"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-slate-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEnrollModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentCourses;

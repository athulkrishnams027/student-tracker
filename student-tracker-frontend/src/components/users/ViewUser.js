import React, { Fragment, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@material-tailwind/react";
import { Card, Modal, Table, Badge } from "react-bootstrap";
import {
  PersonBadgeFill,
  PersonCircle,
  BookFill,
  CheckCircleFill,
  PencilSquare,
} from "react-bootstrap-icons";
import StudentIDCard from "../StudentIDCard";
import { getAuthHeaders } from "../../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const scale = (num, in_min, in_max, out_min, out_max) => {
  return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

const ViewUser = ({ user, handleClose }) => {
  const [showIdCard, setShowIdCard] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'academics'
  const [enrollments, setEnrollments] = useState([]);
  const [editingGradeEnId, setEditingGradeEnId] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("A");
  const [inputAttendance, setInputAttendance] = useState(100);

  const fetchStudentCourses = useCallback(async (userId) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student/${userId}/courses`,
        getAuthHeaders()
      );
      setEnrollments(res.data);
    } catch {
      setEnrollments([]);
    }
  }, []);

  useEffect(() => {
    if (user && user.id) {
      fetchStudentCourses(user.id);
    }
  }, [user, fetchStudentCourses]);

  let boxStyle = {};
  if (user) {
    const width = scale(user.weight || 50, 10, 150, 50, 150);
    const height = scale(user.height || 160, 100, 220, 50, 150);
    boxStyle = {
      width: `${width}px`,
      height: `${height}px`,
      border: `3px solid ${(user.hairColor || "gray").trim()}`,
      margin: "10px auto",
      borderRadius: "6px",
      backgroundColor: "#f8fafc",
    };
  }

  const photoUrl = user && user.profilePicture
    ? `${API_BASE_URL}/student/${user.id}/photo?t=${Date.now()}`
    : null;

  const handleSaveGrade = async (enrollmentId) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/enrollment/${enrollmentId}/grade`,
        {
          grade: selectedGrade,
          attendance: parseInt(inputAttendance, 10) || 100,
        },
        getAuthHeaders()
      );
      alert(`Grade updated! Student GPA is now: ${res.data.updatedGpa}`);
      setEditingGradeEnId(null);
      if (user && user.id) {
        fetchStudentCourses(user.id);
      }
    } catch (err) {
      alert("Failed to update grade: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <Modal show={user != null} onHide={handleClose} centered size="lg">
        <Card className="shadow-sm">
          <Card.Header className="bg-slate-900 text-white flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-2">
              <h4 className="m-0 text-white font-bold text-base">
                {user ? `${user.name}` : ""}
              </h4>
              <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">
                STU-2026-{user ? String(user.id).padStart(4, "0") : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1 rounded text-xs font-bold border-0 cursor-pointer transition ${
                  activeTab === "profile"
                    ? "bg-white text-slate-900 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Profile & Metrics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("academics")}
                className={`px-3 py-1 rounded text-xs font-bold border-0 cursor-pointer transition flex items-center gap-1 ${
                  activeTab === "academics"
                    ? "bg-amber-400 text-slate-950 shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <BookFill size={12} /> Grades & Courses ({enrollments.length})
              </button>
              <button
                type="button"
                onClick={() => setShowIdCard(true)}
                className="bg-red-600 text-white font-bold px-3 py-1 rounded text-xs flex items-center gap-1 border-0 cursor-pointer shadow hover:bg-red-700 transition"
              >
                <PersonBadgeFill size={14} /> ID Card
              </button>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            {user && activeTab === "profile" && (
              <Fragment>
                {/* Photo and Identity */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 flex items-center justify-center shrink-0 shadow-sm"
                    style={{ borderColor: (user.hairColor || "gray").trim() }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <PersonCircle size={56} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 mb-0">{user.name}</h5>
                    <span className="text-xs text-slate-500 font-mono">
                      {user.email}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        GPA: {user.gpa} / 4.5
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Hair: {user.hairColor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold text-xs block uppercase">Height</span>
                    <strong className="text-slate-800 text-base">{user.height} cm</strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-bold text-xs block uppercase">Weight</span>
                    <strong className="text-slate-800 text-base">{user.weight} kg</strong>
                  </div>
                </div>

                <p className="text-center my-2 text-dark font-medium text-xs">
                  Physical Characteristics Proportion Display
                </p>
                <div style={boxStyle} className="user-box flex items-center justify-center shadow-inner">
                  <div className="text-center text-xs font-bold text-slate-700">
                    w:{user.weight} × h:{user.height}
                  </div>
                </div>
              </Fragment>
            )}

            {user && activeTab === "academics" && (
              <Fragment>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 m-0">
                      Academic Enrolled Subjects & Grade Assignment
                    </h5>
                    <span className="text-xs text-slate-500">
                      As an admin, you can assign official grades (A+, A, B, C...) which automatically update the student's cumulative GPA.
                    </span>
                  </div>
                </div>

                {enrollments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 border border-dashed rounded-lg bg-slate-50">
                    This student is not enrolled in any courses yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="text-xs align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Course</th>
                          <th className="text-center">Credits</th>
                          <th className="text-center">Attendance</th>
                          <th className="text-center">Grade</th>
                          <th className="text-center">Admin Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((en) => {
                          const isEditing = editingGradeEnId === en.id;
                          return (
                            <tr key={en.id}>
                              <td>
                                <strong className="font-mono text-amber-700 block">
                                  {en.course?.courseCode}
                                </strong>
                                <span className="font-semibold text-slate-800">
                                  {en.course?.title}
                                </span>
                              </td>
                              <td className="text-center font-bold">
                                {en.course?.credits} cr
                              </td>
                              <td className="text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="form-control form-control-sm text-center py-0"
                                    style={{ width: "70px", margin: "0 auto" }}
                                    value={inputAttendance}
                                    onChange={(e) => setInputAttendance(e.target.value)}
                                  />
                                ) : (
                                  <span className="font-bold">
                                    {en.attendance || 100}%
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                {isEditing ? (
                                  <select
                                    className="form-select form-select-sm text-xs py-0"
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                  >
                                    <option value="A+">A+ (4.30)</option>
                                    <option value="A">A (4.00)</option>
                                    <option value="A-">A- (3.70)</option>
                                    <option value="B+">B+ (3.30)</option>
                                    <option value="B">B (3.00)</option>
                                    <option value="B-">B- (2.70)</option>
                                    <option value="C+">C+ (2.30)</option>
                                    <option value="C">C (2.00)</option>
                                    <option value="F">F (0.00)</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                  </select>
                                ) : (
                                  <Badge
                                    bg={
                                      en.grade?.startsWith("A")
                                        ? "success"
                                        : en.grade?.startsWith("B")
                                        ? "primary"
                                        : en.grade?.startsWith("C")
                                        ? "warning"
                                        : "secondary"
                                    }
                                  >
                                    {en.grade || "In Progress"}
                                  </Badge>
                                )}
                              </td>
                              <td className="text-center">
                                {isEditing ? (
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm py-0 px-2 text-xs font-bold"
                                      onClick={() => handleSaveGrade(en.id)}
                                    >
                                      <CheckCircleFill size={12} /> Save
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm py-0 px-1 text-xs"
                                      onClick={() => setEditingGradeEnId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm py-0 px-2 text-xs flex items-center gap-1 mx-auto"
                                    onClick={() => {
                                      setEditingGradeEnId(en.id);
                                      setSelectedGrade(en.grade || "A");
                                      setInputAttendance(en.attendance || 100);
                                    }}
                                  >
                                    <PencilSquare size={12} /> Edit Grade
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Fragment>
            )}
          </Card.Body>

          <Card.Footer className="flex justify-between items-center bg-slate-50 py-3">
            <Button
              variant="gradient"
              color="amber"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={() => setShowIdCard(true)}
            >
              <PersonBadgeFill size={16} /> Print Official ID Card
            </Button>
            <Button
              variant="gradient"
              color="red"
              size="sm"
              onClick={handleClose}
            >
              Close
            </Button>
          </Card.Footer>
        </Card>
      </Modal>

      {/* ID Card Modal */}
      {user && (
        <StudentIDCard
          student={user}
          show={showIdCard}
          onHide={() => setShowIdCard(false)}
        />
      )}
    </>
  );
};

export default ViewUser;

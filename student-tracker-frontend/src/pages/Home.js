import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ViewUser from "../components/users/ViewUser";
import { Button } from "@material-tailwind/react";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";

const API_BASE_URL = process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const Home = () => {
  const [displayUser, setDisplayUser] = useState(null);
  const [students, setStudents] = React.useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadStudent();
  }, []);

  const handleView = (students) => {
    setDisplayUser(students);
  };

  const handleClose = () => {
    setDisplayUser(null);
  };

  const loadStudent = async () => {
    const result = await axios.get(`${API_BASE_URL}/students`);
    const studentsData = result.data
      .sort((a, b) => a.id - b.id)
      .map((student) => ({
        ...student,
        showPassword: false,
      }));
    setStudents(studentsData);
  };

  const deleteUser = async (id) => {
    await axios.delete(`${API_BASE_URL}/student/${id}`);
    loadStudent();
  };

  return (
    <div className="container">
      <div className="py-4">
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
            {students.map((student, index) => (
              <tr key={index}>
                <th scope="row" className="text-center">
                  {index + 1}
                </th>
                <td className="text-center">{student.name}</td>
                <td className="text-center">{student.email}</td>
                <td className="text-center">
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
                        : "*".repeat(student.password.length)}
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
                    size="md"
                    onClick={() => handleView(student)}
                  >
                    View
                  </Button>
                  <Button
                    className="mx-1"
                    fullWidth
                    onClick={() => navigate(`/edituser/${student.id}`)}
                    color="amber"
                    size="md"
                  >
                    Edit
                  </Button>
                  <Button
                    className="mx-1"
                    fullWidth
                    color="red"
                    size="md"
                    onClick={() => {
                      deleteUser(student.id);
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            <ViewUser user={displayUser} handleClose={handleClose} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;

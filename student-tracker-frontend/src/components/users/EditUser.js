import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { EyeFill, EyeSlashFill, CameraFill, PersonCircle } from "react-bootstrap-icons";
import { getAuth, isStudent, getAuthHeaders } from "../../utils/auth";

const API_BASE_URL =
  process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [gpaError, setGpaError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [student, setStudent] = useState({
    name: "",
    email: "",
    password: "",
    hairColor: "",
    height: "",
    weight: "",
    gpa: "",
  });

  const { name, email, password, hairColor, height, weight, gpa } = student;

  const loadUser = useCallback(async () => {
    try {
      const result = await axios.get(
        `${API_BASE_URL}/student/${id}`,
        getAuthHeaders()
      );
      setStudent(result.data);
      if (result.data.profilePicture) {
        setPhotoPreview(`${API_BASE_URL}/student/${id}/photo?t=${Date.now()}`);
      }
    } catch (err) {
      alert(
        "Failed to load student: " +
          (err.response?.data?.message || err.message)
      );
      if (isStudent()) navigate("/profile");
      else navigate("/");
    }
  }, [id, navigate]);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      navigate("/login", {
        state: { message: "Please log in to edit student details." },
      });
      return;
    }

    // A student is only allowed to edit their OWN record
    if (auth.role === "STUDENT" && String(auth.id) !== String(id)) {
      alert("Access denied: You cannot edit another student's record.");
      navigate("/profile");
      return;
    }

    loadUser();
  }, [id, navigate, loadUser]);

  const onInputChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const onGpaChange = (e) => {
    const value = e.target.value;
    if (value < 0.0 || value > 4.5) {
      setGpaError("Please enter a value between 0 and 4.50");
    } else {
      setGpaError("");
    }
    setStudent({ ...student, gpa: value });
  };

  const onPhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!gpaError) {
      try {
        await axios.put(
          `${API_BASE_URL}/student/${id}`,
          student,
          getAuthHeaders()
        );

        if (photoFile) {
          const formData = new FormData();
          formData.append("photo", photoFile);
          await axios.post(`${API_BASE_URL}/student/${id}/photo`, formData, {
            headers: {
              ...getAuthHeaders().headers,
              "Content-Type": "multipart/form-data",
            },
          });
        }

        // Update local session if student edited their own record
        const auth = getAuth();
        if (auth && auth.role === "STUDENT") {
          localStorage.setItem(
            "authUser",
            JSON.stringify({ ...auth, ...student })
          );
          window.dispatchEvent(new Event("authChange"));
        }

        if (isStudent()) {
          navigate("/profile");
        } else {
          navigate("/");
        }
      } catch (err) {
        alert(
          "Failed to update student: " +
            (err.response?.data?.message || err.message)
        );
      }
    }
  };

  const handleCancel = () => {
    if (isStudent()) {
      navigate("/profile");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex justify-center items-center py-5">
      <Card className="w-1/2 shadow">
        <form onSubmit={onSubmit}>
          <CardHeader
            variant="gradient"
            color="red"
            className="mb-4 grid h-28 place-items-center"
          >
            <Typography variant="h3" color="white">
              {isStudent() ? "Edit Your Profile" : "Change Student Information"}
            </Typography>
          </CardHeader>
          <CardBody color="teal" className="flex flex-col gap-4">
            {/* Student Photo Section */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div
                className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: (hairColor || "gray").trim() }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <PersonCircle size={56} className="text-slate-400" />
                )}
              </div>
              <div className="flex-1 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  Profile Photo
                </span>
                <label className="bg-slate-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer hover:bg-slate-800 transition inline-flex items-center gap-1">
                  <CameraFill size={12} /> Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoSelect}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            <Input
              color="teal"
              label="Name"
              size="md"
              value={name}
              name="name"
              required
              onChange={onInputChange}
            />
            <Input
              color="teal"
              type="email"
              label="Email"
              size="lg"
              value={email}
              name="email"
              required
              onChange={onInputChange}
            />
            <div style={{ display: "flex", alignItems: "center" }}>
              <Input
                color="teal"
                type={showPassword ? "text" : "password"}
                label="Password"
                size="lg"
                value={password}
                name="password"
                required
                onChange={onInputChange}
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
            <Input
              color="teal"
              label="Hair Color"
              size="lg"
              value={hairColor}
              name="hairColor"
              required
              onChange={onInputChange}
            />
            <Input
              color="teal"
              type="number"
              min="0"
              max="300"
              label="Height (rounded to the nearest Cm)"
              size="lg"
              value={height}
              name="height"
              required
              onChange={onInputChange}
            />
            <Input
              color="teal"
              type="number"
              min="0"
              max="600"
              label="Weight (rounded to the nearest Kg)"
              size="lg"
              value={weight}
              name="weight"
              required
              onChange={onInputChange}
            />
            <Input
              color="teal"
              type="number"
              step="0.01"
              min="0.00"
              max="4.50"
              label="GPA"
              size="lg"
              value={gpa}
              name="gpa"
              required
              onChange={onGpaChange}
              error={gpaError}
            />
          </CardBody>
          <CardFooter className="pt-0">
            <Button variant="gradient" color="amber" type="submit" fullWidth>
              Save Changes
            </Button>
            <Button
              variant="gradient"
              color="red"
              fullWidth
              className="my-2"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditUser;

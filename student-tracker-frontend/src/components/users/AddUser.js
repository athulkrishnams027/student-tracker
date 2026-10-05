import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";

const API_BASE_URL = process.env.REACT_APP_PRODUCTION_API || "http://localhost:8080";

const AddUser = () => {
  const navigate = useNavigate();
  const [gpaError, setGpaError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!gpaError) {
      await axios.post(`${API_BASE_URL}/student`, student);
      navigate("/");
    }
  };

  return (
    <div className="flex justify-center items-center py-5">
      <Card className="w-1/2 shadow">
        <form onSubmit={(e) => onSubmit(e)}>
          <CardHeader
            variant="gradient"
            color="red"
            className="mb-4 grid h-28 place-items-center"
          >
            <Typography variant="h3" color="white">
              Fill in the Student Information
            </Typography>
          </CardHeader>
          <CardBody color="teal" className="flex flex-col gap-4">
            <Input
              color="teal"
              label="Name"
              size="md"
              value={name}
              name="name"
              required
              onChange={(e) => onInputChange(e)}
            />
            <Input
              color="teal"
              type="email"
              label="Email"
              size="lg"
              value={email}
              name="email"
              required
              onChange={(e) => onInputChange(e)}
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
                onChange={(e) => onInputChange(e)}
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
              onChange={(e) => onInputChange(e)}
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
              onChange={(e) => onInputChange(e)}
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
              onChange={(e) => onInputChange(e)}
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
              onChange={(e) => onGpaChange(e)}
              error={gpaError}
            />
          </CardBody>
          <CardFooter className="pt-0">
            <Button variant="gradient" color="amber" type="submit" fullWidth>
              Add
            </Button>
            <Button
              variant="gradient"
              color="red"
              fullWidth
              className="my-2"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddUser;

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigationbar from "./components/Navigationbar";
import Home from "./pages/Home";
import AddUser from "./components/users/AddUser";
import EditUser from "./components/users/EditUser";

function App() {
  return (
    // Div with a defined background color, a minimum height of the full viewport, absolute positioning and full width
    <div
      style={{
        backgroundColor: "#808188",
        minHeight: "100vh",
        position: "absolute",
        width: "100%",
      }}
    >
      {/* Router component from react-router-dom for handling routing */}
      <Router>
        {/* Navigationbar component which renders the navigation bar */}
        <Navigationbar />
         {/* Routes component from react-router-dom for defining the application's routes */}
        <Routes>
           {/* Route for the home page, which renders the Home component */}
          <Route exact path="/" element={<Home />} />

          {/* Route for the Add Student page, which renders the AddUser component */}
          <Route exact path="/addstudent" element={<AddUser />} />

           {/* Route for the Edit User page, which renders the EditUser component */}
          {/* This route uses a URL parameter (id) to identify which user to edit */}
          <Route exact path="/edituser/:id" element={<EditUser />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

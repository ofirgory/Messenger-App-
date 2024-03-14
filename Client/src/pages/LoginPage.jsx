import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { loginUserAsync } from "../redux/features/userSlice";
import { useNavigate } from "react-router-dom";
import "../css/loginPage.css";

function LoginPage() {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUserAsync({ userName, password }))
      .unwrap() // Unwrap the promise to handle outcomes correctly
      .then((response) => {
        console.log("Login successful:", response);
        navigate("/main");
      })
      .catch((error) => {
        console.error("Login failed:", error);
        // Handle login failure (e.g., show error message)
      });
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div>
          <label htmlFor="username">Username:</label>
          <input
            className="login-formUser input"
            type="text"
            id="username"
            value={userName}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="login-formPass input">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Login</button>
        <button onClick={() => navigate("/createUser")}>Create User</button>
      </form>
    </div>
  );
}

export default LoginPage;

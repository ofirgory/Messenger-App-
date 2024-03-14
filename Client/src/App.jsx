// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { WebSocketProvider } from "./WebSocketContext";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import CreateUserPage from "./pages/CreateUserPage";
import GroupsPage from "./pages/GroupsPage";
import GroupCreationPage from "./pages/GroupCreationPage";
import ConversationHistory from "./pages/ConversationHistory";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./css/app.css";

function App() {
  return (
    <Router>
      <WebSocketProvider>
        {" "}
        {/* Wrap your routes with WebSocketProvider */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/createUser" element={<CreateUserPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route
            path="/conversationHistory/:userId"
            element={<ConversationHistory />}
          />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groupCreation" element={<GroupCreationPage />} />
          <Route path="/" element={<Navigate replace to="/login" />} />
        </Routes>
      </WebSocketProvider>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createUser, resetCreateUserState } from "../redux/features/userSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function CreateUserPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { createUserLoading, createUserSuccess, createUserError } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (createUserSuccess) {
      toast.success(createUserSuccess);
      dispatch(resetCreateUserState()); // Reset state to clear the success message
      navigate("/login");
    } else if (createUserError) {
      toast.error(createUserError);
    }

    // Component cleanup function to reset createUser state
    return () => {
      dispatch(resetCreateUserState());
    };
  }, [createUserSuccess, createUserError, dispatch, navigate]);

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleFullNameChange = (e) => setFullName(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createUser({ userName, password, fullName }));
  };

  return (
    <div>
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <label>
          User Name:
          <input type="text" value={userName} onChange={handleUsernameChange} />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </label>
        <br />
        <label>
          Full Name:
          <input type="text" value={fullName} onChange={handleFullNameChange} />
        </label>
        <br />
        <button type="submit" disabled={createUserLoading}>
          Create
        </button>
      </form>
    </div>
  );
}

export default CreateUserPage;

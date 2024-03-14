import React from "react";
import { Link } from "react-router-dom";

function MainPageButton() {
  return (
    <Link to="/main">
      <button>Main Page</button>
    </Link>
  );
}

export default MainPageButton;

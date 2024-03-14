const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect("mongodb://localhost:27017/MessangerApp")
    .then(() => console.log("Connected to MessangerApp"))
    .catch((error) => console.log(error));
};

module.exports = { connectDB };

const express = require("express");
const path = require("node:path");
const morgan = require("morgan");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const eventRouter = require("./routes/eventRoutes");
const authController = require("./controllers/authController");

const app = express();

const apiPath = process.env.API_PATH || "/api/v1/";

// logs incoming request info
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use(cors({ origin: `http://127.0.0.1:${process.env.PORT}` }));
}

// middleware that only parses json and only looks at requests where the Content-Type header matches the type option
app.use(express.json());

app.post(path.posix.join(apiPath, "register"), authController.register);
app.post(path.posix.join(apiPath, "login"), authController.login); //I dont think "login" belongs in "users" route
app.post(
  path.posix.join(apiPath, "logout"),
  authController.authorizeUser,
  authController.logout
);

app.use(path.posix.join(apiPath, "users"), userRouter);
app.use(path.posix.join(apiPath, "events"), eventRouter);

module.exports = app;

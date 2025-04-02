const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "config.env" });
const app = require("./app");

// connection string includes path to database
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING.replace(
  "<db_username>",
  process.env.DB_USERNAME
).replace("<db_password>", process.env.DB_PASSWORD);

// connection gets established when this whole backend app instance starts running;
// for a more robust behavior, could make a mechanism for reconnecting if it breaks during runtime (like middleware on request?);
// or alternatively, move this to a separate microservice that can be restarted without interrupting the app process;
mongoose
  .connect(DB_CONNECTION_STRING)
  .then(() => {
    console.log("DB connection established");
  })
  .catch(() => {
    console.error("Failed to establish DB connection");
    console.log("Continuing in offline mode");
  });
// try {
// 	await mongoose.connect(DB_CONNECTION_STRING);
// 	console.log("DB connection established");
// } catch (error) {
// 	console.error("Failed to establish DB connection");
// 	console.log("Continuing in offline mode");
// }

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`app running on ${port} in ${process.env.NODE_ENV} mode`);
});

//bonus challenge: prevent the process from crashing (at least on predictable exceptions)

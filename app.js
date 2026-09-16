const express = require("express");
const path = require("path");
const db = require("./database/db");

const app = express();
/*const courseRoutes = require("./public/js/course_form");*/

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
/*app.use("/courses", courseRoutes);*/

app.get("/", (req, res) => {
  res.render("index");
});


app.get("/overview", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks").all();
  

  res.render("overview", { tasks });
});

app.get("/calendar", (req, res) => {
  res.render("calendar");
});

app.get("/tasks", (req, res) => {
  res.render("tasks");
});

app.get("/register", (req, res) => {
  res.render("login-register");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




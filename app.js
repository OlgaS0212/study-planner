const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const courseRoutes = require("./routes/course_form");

// Session configuration
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/courses", courseRoutes);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/overview", (req, res) => {
  res.render("overview");
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

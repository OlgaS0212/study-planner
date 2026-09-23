const express = require("express");
const path = require("path");
const crypto = require("crypto");
const session = require("express-session");
const db = require("./database/db");

const app = express();

// Import routes
const courseRoutes = require("./routes/course_form");

// Session configuration
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false
  })
);

app.set("view engine", "ejs");

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Parse form data
app.use(express.urlencoded({ extended: false }));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

// Protect pages that require login
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  next();
}

// Public start page
app.get("/", (req, res) => {
  res.render("index");
});

// Login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || "";

  const user = email
    ? db.prepare("SELECT * FROM users WHERE email = ?").get(email)
    : null;

  if (!user || !passwordMatches(password, user.password)) {
    return res.status(401).render("login", {
      error: "Fel e-postadress eller lösenord."
    });
  }

  req.session.userId = user.id;

  res.redirect("/overview");
});

// Register
app.get("/register", (req, res) => {
  res.render("login-register", { error: null });
});

app.post("/register", (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password || "";
  const confirmPassword = req.body.confirmPassword || "";

  if (!email || !password || password !== confirmPassword) {
    return res.status(400).render("login-register", {
      error: "Fyll i alla fält och kontrollera att lösenorden matchar."
    });
  }

  if (password.length < 8) {
    return res.status(400).render("login-register", {
      error: "Lösenordet måste vara minst 8 tecken."
    });
  }

  try {
    db.prepare(
      "INSERT INTO users (email, password) VALUES (?, ?)"
    ).run(email, hashPassword(password));
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).render("login-register", {
        error: "Det finns redan ett konto med den e-postadressen."
      });
    }

    throw error;
  }

  res.redirect("/login");
});

// Overview
app.get("/overview", requireLogin, (req, res) => {
  const tasks = db.prepare(`
    SELECT
      tasks.*,
      courses.name AS course_name
    FROM tasks
    JOIN courses ON tasks.course_id = courses.id
    WHERE tasks.completed = 0
  `).all();

  const courses = db
    .prepare("SELECT * FROM courses")
    .all();

  res.render("overview", { tasks, courses });
});

// Calendar
app.get("/calendar", requireLogin, (req, res) => {

    const tasks = db.prepare(`
        SELECT tasks.*, courses.name AS course_name
        FROM tasks
        LEFT JOIN courses ON tasks.course_id = courses.id
        ORDER BY deadline ASC
    `).all();

    res.render("calendar", { tasks });
});

// Tasks
app.get("/tasks", requireLogin, (req, res) => {
  const tasks = db.prepare(`
    SELECT
      tasks.*,
      courses.name AS course_name
    FROM tasks
    JOIN courses ON tasks.course_id = courses.id
    WHERE tasks.completed = 0
  `).all();

  const courses = db.prepare("SELECT * FROM courses").all();

  console.log("COURSES:", courses);

  res.render("tasks", {
    tasks: tasks,
    courses: courses
  });
});

// Add task
app.post("/tasks", requireLogin, (req, res) => {
  const title = req.body.title?.trim();
  const deadline = req.body.deadline?.trim().replace("T", " ");
  const courseId = req.body.course_id;

  if (!title || !courseId) {
    return res.redirect("/tasks");
  }

  db.prepare(`
    INSERT INTO tasks (
      title,
      deadline,
      completed,
      course_id
    )
    VALUES (?, ?, 0, ?)
  `).run(
    title,
    deadline || null,
    courseId
  );

  res.redirect("/tasks");
});

// Complete task
app.post("/tasks/:id/complete", requireLogin, (req, res) => {
  const taskId = req.params.id;

  db.prepare(`
    UPDATE tasks
    SET completed = 1
    WHERE id = ?
  `).run(taskId);

  res.redirect("/tasks");
});

// Delete task
app.post("/tasks/:id/delete", requireLogin, (req, res) => {
  const taskId = req.params.id;
  const from = req.body.from;

  db.prepare(`
    DELETE FROM tasks
    WHERE id = ?
  `).run(taskId);

  if (from === "overview") {
    return res.redirect("/overview");
  }

  res.redirect("/tasks");
});

app.get("/tasks/:id/edit", requireLogin, (req, res) => {
  const taskId = req.params.id;

  const task = db.prepare(`
    SELECT * FROM tasks
    WHERE id = ?
  `).get(taskId);

  const courses = db.prepare(`
    SELECT * FROM courses
  `).all();

  res.render("edit-task", {
    task,
    courses
  });
});


app.post("/tasks/:id/edit", requireLogin, (req, res) => {
  const taskId = req.params.id;
  const title = req.body.title?.trim();
  const deadline = req.body.deadline?.trim().replace("T", " ");
  const courseId = req.body.course_id;

  if (!title || !courseId) {
    return res.redirect(`/tasks/${taskId}/edit`);
  }

  db.prepare(`
    UPDATE tasks
    SET title = ?, deadline = ?, course_id = ?
    WHERE id = ?
  `).run(
    title,
    deadline || null,
    courseId,
    taskId
  );

  res.redirect("/tasks");
});

// Protected course routes
app.use("/courses", requireLogin, courseRoutes);

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});




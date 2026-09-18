const express = require("express");
const path = require("path");
const crypto = require("crypto");
const db = require("./database/db");

const app = express();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
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
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE completed = 0")
    .all();

  res.render("tasks", { tasks });
});

app.post("/tasks", (req, res) => {
  const title = req.body.title?.trim();
  const deadline = req.body.deadline?.trim();

  if (!title) {
    return res.redirect("/tasks");
  }

  db.prepare(`
    INSERT INTO tasks (title, deadline, completed, course_id)
    VALUES (?, ?, 0, 1)
  `).run(title, deadline || null);

  res.redirect("/tasks");
});

app.post("/tasks/:id/complete", (req, res) => {
  const taskId = req.params.id;

  db.prepare(`
    UPDATE tasks
    SET completed = 1
    WHERE id = ?
  `).run(taskId);

  res.redirect("/tasks");
});

app.post("/tasks/:id/delete", (req, res) => {
  const taskId = req.params.id;

  db.prepare(`
    DELETE FROM tasks
    WHERE id = ?
  `).run(taskId);

  res.redirect("/tasks");
});

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

  res.redirect("/overview");
});

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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});






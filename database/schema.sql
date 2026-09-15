CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  course_code TEXT,
  level TEXT,
  teaching_form TEXT,
  study_pace TEXT,
  grading_scale TEXT,
  c_image TEXT,
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  deadline TEXT,
  completed INTEGER DEFAULT 0,
  course_id INTEGER NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

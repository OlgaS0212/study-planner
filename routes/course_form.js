const express = require('express');
const multer = require('multer');
const path = require('path');

const db = require("../database/db");
const router = express.Router();

// Default user ID
const DEFAULT_USER_ID = 1;

// Upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) =>
      cb(null, 'public/images/courses'),

    filename: (_, file, cb) =>
      cb(
        null,
        Date.now() + path.extname(file.originalname)
      )
  })
});

// GET /courses
router.get('/', (req, res) => {
  const courses = db
    .prepare('SELECT * FROM courses')
    .all();

  res.render('courses', {
    title: 'Kurser',
    courses
  });
});

// GET /courses/new
router.get('/new', (req, res) => {
  res.render('course_form', {
    title: 'Lägg till kurs',
    type: 'course'
  });
});

// POST /courses/new
router.post('/new', upload.single('c_image'), (req, res) => {
  const {
    name,
    description,
    course_code,
    level,
    teaching_form,
    study_pace,
    grading_scale
  } = req.body;

  const imageFilename = req.file?.filename ?? null;

  // Use logged-in user if available, otherwise use default user
  const userId = req.session?.userId ?? DEFAULT_USER_ID;

  try {
    db.prepare(`
      INSERT INTO courses (
        name,
        description,
        c_image,
        course_code,
        level,
        teaching_form,
        study_pace,
        grading_scale,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      imageFilename,
      course_code,
      level,
      teaching_form,
      study_pace,
      grading_scale,
      userId
    );

    res.redirect('/courses');

  } catch (error) {
    console.error(error);

    res.render('course_form', {
      title: 'Lägg till kurs',
      type: 'course',
      error: 'Kursen finns redan eller kunde inte sparas.'
    });
  }
});

module.exports = router;

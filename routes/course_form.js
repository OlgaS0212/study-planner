const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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


// Delete course button handler
router.post('/:id/delete', (req, res) => {
    const courseId = req.params.id;

    // Get course first so we know its image filename
    const course = db
        .prepare('SELECT c_image FROM courses WHERE id = ?')
        .get(courseId);

    if (!course) {
        return res.json({
            success: false,
            message: 'Kursen kunde inte hittas.'
        });
    }

    const taskCount = db
        .prepare(
            'SELECT COUNT(*) AS taskCount FROM tasks WHERE course_id = ?'
        )
        .get(courseId).taskCount;

    // Course has tasks
    if (taskCount > 0) {

        // User has not confirmed deleting tasks
        if (req.query.deleteTasks !== 'true') {
            return res.json({
                success: false,
                hasTasks: true,
                taskCount
            });
        }

        const deleteTasks = db.prepare(
            'DELETE FROM tasks WHERE course_id = ?'
        );

        const deleteCourse = db.prepare(
            'DELETE FROM courses WHERE id = ?'
        );

        const transaction = db.transaction(() => {
            const tasksDeleted = deleteTasks.run(courseId);

            console.log('Tasks deleted:', tasksDeleted.changes);

            const courseDeleted = deleteCourse.run(courseId);

            console.log('Course deleted:', courseDeleted.changes);

            return courseDeleted;
        });

        const result = transaction();

        // Delete image after successful database deletion
        if (result.changes > 0 && course.c_image) {
            const imagePath = path.join(
                __dirname,
                '..',
                'public',
                'images',
                'courses',
                course.c_image
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Course image deleted:', imagePath);
            }
        }

        return res.json({
            success: result.changes > 0,
            message: result.changes > 0
                ? 'Kursen och dess uppgifter har tagits bort.'
                : 'Kursen kunde inte tas bort.'
        });
    }

    // No tasks → delete course directly
    const result = db
        .prepare('DELETE FROM courses WHERE id = ?')
        .run(courseId);

    // Delete image after successful database deletion
    if (result.changes > 0 && course.c_image) {
        const imagePath = path.join(
            __dirname,
            '..',
            'public',
            'images',
            'courses',
            course.c_image
        );

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Course image deleted:', imagePath);
        }
    }

    return res.json({
        success: result.changes > 0,
        message: result.changes > 0
            ? 'Kursen har tagits bort.'
            : 'Kursen kunde inte tas bort.'
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

const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById } = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:id')
    .get(protect, getProjectById);

module.exports = router;

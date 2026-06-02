const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, uploadProjectInvoice } = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, updateProject);

router.route('/:id/invoices')
    .post(protect, uploadProjectInvoice);

module.exports = router;

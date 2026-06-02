const projectService = require('../services/projectService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createProject = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new project... 🏗️`);
    const payload = { ...req.body, userId: req.user.id };
    const project = await projectService.createProject(payload);
    logger.info(`🎉 Successfully created project: ${project.projectName} 📊 ✅`);
    res.status(201).json({ success: true, data: project });
});

const getProjects = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching projects for user ${req.user.id}... 🔍`);
    const projects = await projectService.getProjectsByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${projects.length} projects! 🚀`);
    res.status(200).json({ success: true, data: projects });
});

const getProjectById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching project details for ID: ${req.params.id}... 🔎`);
    const project = await projectService.getProjectById(req.params.id);
    
    if (project.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for project ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this project', 403);
    }

    logger.info(`✅ Successfully fetched project details for ${project.projectName} 📈`);
    res.status(200).json({ success: true, data: project });
});

const updateProject = asyncHandler(async (req, res, next) => {
    logger.info(`📝 Updating project ID: ${req.params.id}...`);
    const project = await projectService.updateProject(req.params.id, req.body, req.user.id);
    logger.info(`✅ Successfully updated project: ${project.projectName}`);
    res.status(200).json({ success: true, data: project });
});

const uploadProjectInvoice = asyncHandler(async (req, res, next) => {
    logger.info(`📤 Uploading invoice for project ID: ${req.params.id}...`);
    const project = await projectService.uploadProjectInvoice(req.params.id, req.body, req.user.id);
    logger.info(`✅ Successfully uploaded invoice for project: ${project.projectName}`);
    res.status(200).json({ success: true, data: project });
});

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    uploadProjectInvoice
};

const projectService = require('../services/projectService');
const logger = require('../utils/logger');

const createProject = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new project... 🏗️`);
        const payload = { ...req.body, userId: req.user.id };
        const project = await projectService.createProject(payload);
        logger.info(`🎉 Successfully created project: ${project.projectName} 📊 ✅`);
        res.status(201).json({ success: true, data: project });
    } catch (error) {
        logger.error(`❌ Failed to create project: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getProjects = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching projects for user ${req.user.id}... 🔍`);
        const projects = await projectService.getProjectsByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${projects.length} projects! 🚀`);
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        logger.error(`❌ Error fetching projects: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getProjectById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching project details for ID: ${req.params.id}... 🔎`);
        const project = await projectService.getProjectById(req.params.id);
        
        if (project.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for project ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
        }

        logger.info(`✅ Successfully fetched project details for ${project.projectName} 📈`);
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        logger.error(`❌ Project not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById
};

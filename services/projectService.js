const ProjectModel = require('../models/projectModel');

const createProject = async (data) => {
    if (!data.projectName || !data.customerId || data.budget === undefined || !data.dueDate || !data.userId) {
        throw new Error('Project Name, Client, Budget, Due Date, and User ID are required');
    }
    
    // Parse budget
    const budget = parseFloat(data.budget);
    if (isNaN(budget)) {
        throw new Error('Budget must be a valid number');
    }

    // Convert dueDate
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid Due Date format');
    }

    const { vendorIds, ...projectData } = data;

    const prismaCreateData = {
        ...projectData,
        budget,
        dueDate,
        // Map vendorIds array into ProjectVendor join table
        vendors: vendorIds && vendorIds.length > 0 ? {
            create: vendorIds.map(vId => ({ vendorId: vId }))
        } : undefined
    };

    return await ProjectModel.createProject(prismaCreateData);
};

const getProjectsByUser = async (userId) => {
    return await ProjectModel.findAllProjects(userId);
};

const getProjectById = async (id) => {
    const project = await ProjectModel.findProjectById(id);
    if (!project) throw new Error('Project not found');
    return project;
};

module.exports = {
    createProject,
    getProjectsByUser,
    getProjectById
};

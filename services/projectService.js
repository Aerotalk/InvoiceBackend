const ProjectModel = require('../models/projectModel');

const createProject = async (data) => {
    const projectName = data.projectName || data.name;
    const customerId = data.customerId || data.clientId;
    
    if (!projectName || !customerId || data.budget === undefined || !data.dueDate || !data.userId) {
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

    // Map vendorIds array from either raw IDs or array of objects
    let vendorIdsToConnect = [];
    if (data.vendors && Array.isArray(data.vendors)) {
        vendorIdsToConnect = data.vendors.map(v => typeof v === 'string' ? v : v.id).filter(Boolean);
    } else if (data.vendorIds && Array.isArray(data.vendorIds)) {
        vendorIdsToConnect = data.vendorIds;
    }

    const prismaCreateData = {
        projectName,
        description: data.description || null,
        status: data.status || 'planning',
        customerId,
        budget,
        currency: data.currency || 'INR',
        dueDate,
        userId: data.userId,
        
        // Map vendorIds array into ProjectVendor join table
        vendors: vendorIdsToConnect.length > 0 ? {
            create: vendorIdsToConnect.map(vId => ({ vendorId: vId }))
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

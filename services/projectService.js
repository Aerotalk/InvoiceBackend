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

const updateProject = async (id, data, userId) => {
    const project = await ProjectModel.findProjectById(id);
    if (!project) throw new Error('Project not found');
    if (project.userId !== userId) throw new Error('Not authorized to update this project');

    const updateData = {};
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.entities !== undefined) updateData.entities = data.entities;

    return await ProjectModel.updateProject(id, updateData);
};

const uploadProjectInvoice = async (id, invoiceData, userId) => {
    const project = await ProjectModel.findProjectById(id);
    if (!project) throw new Error('Project not found');
    if (project.userId !== userId) throw new Error('Not authorized to update this project');

    let currentInvoices = [];
    if (project.invoices) {
        if (typeof project.invoices === 'string') {
            try { currentInvoices = JSON.parse(project.invoices); } catch (e) {}
        } else if (Array.isArray(project.invoices)) {
            currentInvoices = project.invoices;
        }
    }

    currentInvoices.push(invoiceData);
    
    return await ProjectModel.updateProject(id, { invoices: currentInvoices });
};

module.exports = {
    createProject,
    getProjectsByUser,
    getProjectById,
    updateProject,
    uploadProjectInvoice
};

const prisma = require('./index');

const ProjectModel = {
    async createProject(data) {
        return prisma.project.create({ 
            data
        });
    },
    async findProjectById(id) {
        return prisma.project.findUnique({ 
            where: { id },
            include: {
                customer: true,
                vendors: {
                    include: { vendor: true }
                }
            }
        });
    },
    async findAllProjects(userId) {
        const whereClause = userId ? { userId } : {};
        return prisma.project.findMany({ 
            where: whereClause,
            include: {
                customer: true,
                vendors: {
                    include: { vendor: true }
                }
            }
        });
    }
};

module.exports = ProjectModel;

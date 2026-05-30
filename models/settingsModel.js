const prisma = require('./index');

const SettingsModel = {
    async getSettingsByUserId(userId) {
        return prisma.userSettings.findUnique({
            where: { userId }
        });
    },
    async upsertSettings(userId, data) {
        return prisma.userSettings.upsert({
            where: { userId },
            update: data,
            create: {
                ...data,
                userId
            }
        });
    }
};

module.exports = SettingsModel;

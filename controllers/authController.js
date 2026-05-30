const authService = require('../services/authService');
const logger = require('../utils/logger');

const registerUser = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    logger.info(`New user registered: ${result.email}`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.warn(`Registration failed: ${error.message}`);
    res.status(400).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);
    logger.info(`User logged in: ${result.email}`);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.warn(`Login failed: ${error.message}`);
    res.status(401).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error(`Get user failed: ${error.message}`);
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

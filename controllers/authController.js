const authService = require('../services/authService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

const registerUser = asyncHandler(async (req, res, next) => {
  const result = await authService.registerUser(req.body);
  logger.info(`New user registered: ${result.email}`);
  res.status(201).json({ success: true, data: result });
});

const loginUser = asyncHandler(async (req, res, next) => {
  const result = await authService.loginUser(req.body.email, req.body.password);
  logger.info(`User logged in: ${result.email}`);
  res.status(200).json({ success: true, data: result });
});

const getMe = asyncHandler(async (req, res, next) => {
  const user = await authService.getUserById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

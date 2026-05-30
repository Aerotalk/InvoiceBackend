const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (data) => {
    const { 
      accountType, fullName, companyName, 
      phoneCode, phoneNumber, email, password, 
      country, state, city 
    } = data;

    if (!accountType || !email || !password || !phoneCode || !phoneNumber || !country || !state || !city) {
      throw new AppError('Please provide all required fields', 400);
    }

    if (accountType === 'INDIVIDUAL' && !fullName) {
        throw new AppError('Full name is required for Individual accounts', 400);
    }

    if (accountType === 'BUSINESS' && !companyName) {
        throw new AppError('Company name is required for Business accounts', 400);
    }

    const userExists = await UserModel.findUserByEmail(email);

    if (userExists) {
      throw new AppError('User already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.createUser({
        accountType,
        fullName: accountType === 'INDIVIDUAL' ? fullName : null,
        companyName: accountType === 'BUSINESS' ? companyName : null,
        phoneCode,
        phoneNumber,
        email,
        password: hashedPassword,
        country,
        state,
        city,
    });

    return {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        token: generateToken(user.id),
    };
};

const loginUser = async (email, password) => {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await UserModel.findUserByEmail(email);

    if (!user) {
      throw new AppError('User does not exist', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      return {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        token: generateToken(user.id),
      };
    } else {
      throw new AppError('Incorrect password', 401);
    }
};

const getUserById = async (id) => {
    const user = await UserModel.findUserById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};

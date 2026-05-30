const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
      throw new Error('Please provide all required fields');
    }

    if (accountType === 'INDIVIDUAL' && !fullName) {
        throw new Error('Full name is required for Individual accounts');
    }

    if (accountType === 'BUSINESS' && !companyName) {
        throw new Error('Company name is required for Business accounts');
    }

    const userExists = await UserModel.findUserByEmail(email);

    if (userExists) {
      throw new Error('User already exists');
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
      throw new Error('Please provide email and password');
    }

    const user = await UserModel.findUserByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        token: generateToken(user.id),
      };
    } else {
      throw new Error('Invalid email or password');
    }
};

const getUserById = async (id) => {
    const user = await UserModel.findUserById(id);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};

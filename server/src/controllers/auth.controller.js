import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await authService.registerUser({
      ...req.body,
      ipAddress,
    });
    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await authService.loginUser({
      ...req.body,
      ipAddress,
    });
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const result = await authService.logoutUser({
      tokenJti: req.tokenJti,
      userId: req.user.id,
      ipAddress,
    });
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const updated = await authService.updateUserProfile(req.user.id, req.body, ipAddress);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

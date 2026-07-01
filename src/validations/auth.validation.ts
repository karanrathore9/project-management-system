import Joi from 'joi';

export const register = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'member').optional(),
});

export const login = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

export const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

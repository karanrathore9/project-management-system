import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const create = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).allow('').optional(),
});

export const update = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  status: Joi.string().valid('active', 'archived').optional(),
}).min(1);

export const addMember = Joi.object({
  userId: objectId.required(),
  role: Joi.string().valid('manager', 'member').default('member'),
});

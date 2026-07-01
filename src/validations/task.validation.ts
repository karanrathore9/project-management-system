import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const create = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  assignee: objectId.allow(null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
});

export const update = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  assignee: objectId.allow(null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
}).min(1);

export const updateStatus = Joi.object({
  status: Joi.string().valid('todo', 'in-progress', 'done').required(),
  order: Joi.number().integer().min(0).optional(),
});

// validator/routeValidator.js
import Joi from 'joi';

export const createRouteSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  agentId: Joi.number().integer().required(),
  startTime: Joi.date().optional(),
  endTime: Joi.date().optional()
});

export const updateRouteSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  agentId: Joi.number().integer(),
  startTime: Joi.date(),
  endTime: Joi.date()
});

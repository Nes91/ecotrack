// validator/containerValidator.js
import Joi from 'joi';

export const createContainerSchema = Joi.object({
  type: Joi.string().min(2).max(50).required(),
  capacity: Joi.number().optional(),
  fillLevel: Joi.number().optional(),
  status: Joi.string().valid('PLEIN', 'VIDE').optional(),
  zone: Joi.string().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional()
});

export const updateContainerSchema = Joi.object({
  type: Joi.string().min(2).max(50),
  capacity: Joi.number(),
  fillLevel: Joi.number(),
  status: Joi.string().valid('PLEIN', 'VIDE'),
  zone: Joi.string(),
  latitude: Joi.number(),
  longitude: Joi.number()
});

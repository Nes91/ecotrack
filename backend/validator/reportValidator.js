// validator/reportValidator.js
import Joi from 'joi';

export const createReportSchema = Joi.object({
  type: Joi.string().min(2).max(100).required(),
  comment: Joi.string().allow('', null),
  containerId: Joi.number().integer().optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

export const updateReportSchema = Joi.object({
  type: Joi.string().min(2).max(100),
  comment: Joi.string().allow('', null),
  containerId: Joi.number().integer().optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

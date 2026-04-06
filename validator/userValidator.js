// validator/userValidator.js
import Joi from 'joi';

export const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName:  Joi.string().min(2).max(50).required(),
  email:     Joi.string().email().optional(),       // ✅ optionnel
  password:  Joi.string().min(6).optional(),        // ✅ optionnel
  role:      Joi.string().valid('CITIZEN','AGENT','MANAGER','ADMIN'),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('CITIZEN','AGENT','MANAGER','ADMIN')
});

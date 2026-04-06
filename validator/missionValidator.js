import Joi from 'joi';

export const createMissionSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  agentId: Joi.number().integer().required(),
  timeline: Joi.array().items(
    Joi.object({
      step: Joi.number().integer().required(),
      label: Joi.string().required(),
      done: Joi.boolean().required()
    })
  ).required()
});

export const updateMissionSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  agentId: Joi.number().integer(),
  timeline: Joi.array().items(
    Joi.object({
      step: Joi.number().integer(),
      label: Joi.string(),
      done: Joi.boolean()
    })
  )
});
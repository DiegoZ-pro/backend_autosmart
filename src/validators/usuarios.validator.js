// ============================================================================
// VALIDADORES DE USUARIOS
// ============================================================================

const Joi = require('joi');
const { validationError } = require('../utils/responses');

/**
 * Validar creación de usuario
 */
const validateCreateUser = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El email debe ser válido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'La contraseña debe tener al menos 6 caracteres',
      'any.required': 'La contraseña es requerida'
    }),
    nombreCompleto: Joi.string().min(3).max(150).required().messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no debe exceder 150 caracteres',
      'any.required': 'El nombre completo es requerido'
    }),
    telefono: Joi.string().min(7).max(20).allow(null, '').messages({
      'string.min': 'El teléfono debe tener al menos 7 caracteres',
      'string.max': 'El teléfono no debe exceder 20 caracteres'
    }),
    rol_id: Joi.number().integer().min(1).max(3).required().messages({
      'number.base': 'El rol debe ser un número',
      'number.min': 'El rol debe ser entre 1 y 3',
      'number.max': 'El rol debe ser entre 1 y 3',
      'any.required': 'El rol es requerido'
    })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    return validationError(res, errors);
  }

  next();
};

/**
 * Validar actualización de usuario
 */
const validateUpdateUser = (req, res, next) => {
  const schema = Joi.object({
    nombreCompleto: Joi.string().min(3).max(150).messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no debe exceder 150 caracteres'
    }),
    telefono: Joi.string().min(7).max(20).allow(null, '').messages({
      'string.min': 'El teléfono debe tener al menos 7 caracteres',
      'string.max': 'El teléfono no debe exceder 20 caracteres'
    }),
    rol_id: Joi.number().integer().min(1).max(3).messages({
      'number.base': 'El rol debe ser un número',
      'number.min': 'El rol debe ser entre 1 y 3',
      'number.max': 'El rol debe ser entre 1 y 3'
    }),
    estado_id: Joi.number().integer().min(1).max(3).messages({
      'number.base': 'El estado debe ser un número',
      'number.min': 'El estado debe ser entre 1 y 3',
      'number.max': 'El estado debe ser entre 1 y 3'
    }),
    avatar_url: Joi.string().uri().allow(null, '').messages({
      'string.uri': 'La URL del avatar debe ser válida'
    })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    return validationError(res, errors);
  }

  next();
};

/**
 * Validar cambio de estado
 */
const validateChangeStatus = (req, res, next) => {
  const schema = Joi.object({
    estado_id: Joi.number().integer().min(1).max(3).required().messages({
      'number.base': 'El estado debe ser un número',
      'number.min': 'El estado debe ser entre 1 y 3',
      'number.max': 'El estado debe ser entre 1 y 3',
      'any.required': 'El estado es requerido'
    })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    return validationError(res, errors);
  }

  next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateChangeStatus
};
// ============================================================================
// VALIDADORES DE AUTENTICACIÓN
// ============================================================================

const Joi = require('joi');
const { validationError } = require('../utils/responses');

/**
 * Validar registro de usuario
 */
const validateRegister = (req, res, next) => {
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
    telefono: Joi.string().min(7).max(20).required().messages({
      'string.min': 'El teléfono debe tener al menos 7 caracteres',
      'string.max': 'El teléfono no debe exceder 20 caracteres',
      'any.required': 'El teléfono es requerido'
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
 * Validar login
 */
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'El email debe ser válido',
      'any.required': 'El email es requerido'
    }),
    password: Joi.string().required().messages({
      'any.required': 'La contraseña es requerida'
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
 * Validar refresh token
 */
const validateRefreshToken = (req, res, next) => {
  const schema = Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'El refresh token es requerido'
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
 * Validar cambio de contraseña
 */
const validateChangePassword = (req, res, next) => {
  const schema = Joi.object({
    oldPassword: Joi.string().required().messages({
      'any.required': 'La contraseña actual es requerida'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'La nueva contraseña debe tener al menos 6 caracteres',
      'any.required': 'La nueva contraseña es requerida'
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
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateChangePassword
};
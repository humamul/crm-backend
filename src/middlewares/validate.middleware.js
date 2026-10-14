/**
 * Middleware factory to validate request body using a RequestDTO class
 * @param {Class} DtoClass 
 */
function validateBody(DtoClass) {
  return (req, res, next) => {
    try {
      const validatedDto = DtoClass.validate(req.body);
      req.dto = validatedDto;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to validate request parameters using a RequestDTO class
 * @param {Class} DtoClass 
 */
function validateParams(DtoClass) {
  return (req, res, next) => {
    try {
      const validatedDto = DtoClass.validate(req.params);
      req.paramsDto = validatedDto;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  validateBody,
  validateParams,
};

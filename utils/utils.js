const { Error: MongooseError } = require("mongoose");
const { msgCodes } = require("../constants/msgCodes");

exports.isTruthy = (val) => {
  return ["1", "true", "yes", "y"].includes(
    (val ?? "false").toString().toLowerCase()
  );
};

//#region REST response utilities

/**
 * performs res.json(content), but with injecting token and password expiration warning to the response body
 * @param {object} res node express response object that may have newToken and passwordExpiresAt properties attached to it
 * @param {*} content content to be set to JSON response body
 */
exports.sendJsonWithToken = (res, content) => {
  const responseBody = content;
  if (res.newToken) {
    responseBody.token = res.newToken;
  }
  // if (res.passwordExpiresAt) {
  // 	responseBody.passwordExpiresAt = res.passwordExpiresAt;
  // }
  res.json(responseBody);
};

/**
 * sends the response with (hopefully) appropriate status code depending on the type of error
 * @param {*} res node express response object
 * @param {*} error
 * @returns
 */
exports.sendJsonWithError = (res, error) => {
  //TODO: this could be improved by studying https://mongoosejs.com/docs/validation.html

  if (error?.errors) {
    let validationErrors = {};
    for (val of Object.values(error.errors)) {
      if (["ValidatorError", "CastError"].includes(val?.name)) {
        validationErrors[val?.path] = val?.message;
      }
    }

    if (Object.keys(validationErrors).length) {
      res.status(400).json({
        msgCode: msgCodes.VALIDATION_FAIL,
        message: "Validation failed",
        details: validationErrors,
      });
      return;
    }
  }

  if (
    error instanceof MongooseError.ValidatorError ||
    error instanceof MongooseError.CastError
  ) {
    res.status(400).json({
      msgCode: msgCodes.VALIDATION_FAIL,
      message: "Validation failed",
      details: error?.path,
    });
    return;
  }

  if (error?.errorResponse?.code === 11000) {
    res.status(422).json({
      msgCode: msgCodes.VALIDATION_DUP_KEY,
      message: "Duplicate key error",
      details: error?.errorResponse?.keyValue,
    });
    return;
  }

  // last resort fallback
  console.error(error);
  res
    .status(500)
    .json({
      msgCode: msgCodes.SERVER_ERROR,
      message: "Unexpected server error",
    });
};

//#endregion

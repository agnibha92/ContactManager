'use strict';

const httpStatusCodes = require('http-status-codes');

const log       = require('./Logger')("Utils"),
      CONSTANTS = require('../constants');

const ErrorResponse = require('../responses/ErrorResponse');

class Utils {
    static sendError(error, response) {
        if (error instanceof ErrorResponse) {
            return response.status(error.statusCode).json(error);
        } else {
            log.error(`Error Occurred => ${error} | ${error.stack ? error.stack : ""}`);
            return response.status(httpStatusCodes.INTERNAL_SERVER_ERROR).send(new ErrorResponse(httpStatusCodes.INTERNAL_SERVER_ERROR, CONSTANTS.GENERIC_ERROR_MESSAGE));
        }
    };
}

module.exports = Utils;

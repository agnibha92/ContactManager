'use strict';

/**
 * Container To Send Error Response.
 */
class ErrorResponse {

    constructor(statusCode, message) {
        this.status = "error";
        this.statusCode = statusCode;
        this.message = message;
    }
}

module.exports = ErrorResponse;

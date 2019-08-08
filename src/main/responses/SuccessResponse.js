'use strict';

class SuccessResponse {
    constructor(message) {
        this.status = "success";
        this.message = message;
    }
}

module.exports = SuccessResponse;
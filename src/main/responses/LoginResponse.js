'use strict';

class LoginResponse {
    constructor(authToken) {
        this.status = "success";
        this.authToken = authToken;
    }
}

module.exports = LoginResponse;

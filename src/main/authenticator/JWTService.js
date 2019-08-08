'use strict';

const jwt = require('jsonwebtoken');

class JWTService {
    createToken(payload = "") {
        return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "1d"});
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return null;
        }
    }
}

module.exports = new JWTService();
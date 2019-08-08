'use strict';

const db = require("../db");

/**
 * Class To Check Dependent Services.
 */
class ApplicationServices {
    checkStartupServices() {
        return db.ping();
    }
}

module.exports = new ApplicationServices();


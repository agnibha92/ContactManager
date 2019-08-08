'use strict';
const mysql = require('mysql'),
      log   = require('../utils/Logger')("MySQLDataManager");

/**
 *
 */
class Index {
    constructor() {
        log.info(
            `Connecting To MYSQL HOST => ${process.env.MYSQL_HOST}, User => ${
                process.env.MYSQL_USER
            }, Database => ${process.env.MYSQL_DB}`
        );
        this._connectionPool = mysql.createPool({
                                                    host           : process.env.MYSQL_HOST,
                                                    user           : process.env.MYSQL_USER,
                                                    password       : process.env.MYSQL_PASSWD,
                                                    database       : process.env.MYSQL_DB,
                                                    connectionLimit: Number(process.env.MYSQL_MAX_CONNECTION)
                                                });
    }


    getConnection() {
        return new Promise(((resolve, reject) => {
            this._connectionPool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    log.error(`Unable To Get Connection From Pool | Error ${connectionError}`);
                    return reject(connectionError);
                }
                return resolve(connection);
            });
        }));
    }

    ping() {
        return new Promise((resolve, reject) => {
            this._connectionPool.getConnection((err, connection) => {
                if (err) return reject(err);
                connection.ping(error => {
                    connection.release();
                    if (error) {
                        return reject(error);
                    }
                    return resolve(true);
                });
            });
        });
    }
}

module.exports = new Index();
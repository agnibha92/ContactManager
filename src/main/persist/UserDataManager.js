'use strict';

const log  = require('../utils/Logger')('UserDataManager'),
      User = require('../models/User');


class UserDataManager {
    getByName(connection, userName) {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM USERS WHERE USER_NAME = ?", userName, (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Query Error For Fetching User | ${queryError}`);
                    return reject(queryError);
                }
                if (results.length === 0) {
                    return reject(null);
                } else {
                    return resolve(buildUserFromResultSet(results[0]));
                }
            });
        });
    }

    create(connection, user) {
        return new Promise(((resolve, reject) => {
            let query = connection.query("INSERT INTO USERS (USER_NAME, PASSWORD) VALUES (?,?)", [user.userName, user.password], (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Unable To Create User, Reason | ${queryError}`);
                    return reject(queryError);
                }
                return resolve(results.insertId);
            });
            log.error(query.sql);
        }));
    }

    getById(connection, userId) {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM USERS WHERE USER_ID = ?", userId, (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Query Error For Fetching User | ${queryError}`);
                    return reject(queryError);
                }
                if (results.length === 0) {
                    return reject(null);
                } else {
                    return resolve(buildUserFromResultSet(results[0]));
                }
            });
        });
    }

    update(connection, user) {
        return new Promise((resolve, reject) => {
            connection.query("UPDATE USERS  SET PASSWORD = ? WHERE USER_ID = ?", [user.password, user.id], (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Query Error For Fetching User | ${queryError}`);
                    return reject(queryError);
                }
                return resolve(user);
            });
        });
    }

    delete(connection, user) {
        return new Promise((resolve, reject) => {
            connection.query("DELETE FROM USERS WHERE USER_ID = ?", [user.id], (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Query Error For Fetching User | ${queryError}`);
                    return reject(queryError);
                }
                return resolve(user);
            });
        });
    }
}

const buildUserFromResultSet = (resultSet) => {
    let user = new User(resultSet["USER_NAME"], resultSet["PASSWORD"]);
    user.id = resultSet["USER_ID"];
    user.createdAt = resultSet["CREATED_TS"].getTime();
    user.updatedAt = resultSet["UPDATED_TS"].getTime();
    return user;
};

module.exports = new UserDataManager();
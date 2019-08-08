'use strict';

const db             = require("../db"),
      userData       = require('../persist/UserDataManager'),
      jwt            = require("../authenticator/JWTService"),
      httpStatusCode = require('http-status-codes'),
      crypto         = require('crypto');

const User          = require('../models/User'),
      ErrorResponse = require('../responses/ErrorResponse');

class UserService {
    createUser(userName, password) {
        return new Promise(((resolve, reject) => {
            db.getConnection().then(connection => {
                connection.beginTransaction((transactionAcquisitionError) => {

                    if (transactionAcquisitionError) {
                        return reject(transactionAcquisitionError);
                    }

                    userData.getByName(connection, userName).then(user => {
                        return reject(generateErrorResponse(httpStatusCode.BAD_REQUEST, "User Name Already Taken!"));
                    }).catch(() => {
                        let user = new User(userName, hashPassword(password));
                        return userData.create(connection, user);
                    }).then((user) => {
                        connection.commit(() => {
                            connection.release();
                            return resolve();
                        })
                    }).catch((error) => {
                        connection.rollback(() => {
                            connection.release();
                            return reject(error);
                        });
                    });
                });
            }).catch(reject);
        }));
    }

    loginUser(username, password) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return userData.getByName(connection, username).then(user => {
                    if (user.password !== hashPassword(password)) {
                        return reject(generateErrorResponse(httpStatusCode.BAD_REQUEST, `Either UserName Or Password Invalid`));
                    }
                    connection.release();
                    return resolve(jwt.createToken(user.getJWTPayload()));
                }).catch(error => {
                    connection.release();
                    throw error;
                });
            }).catch((error) => {
                if (error) {
                    return reject(generateErrorResponse(httpStatusCode.INTERNAL_SERVER_ERROR, error.message));
                } else {
                    return reject(generateErrorResponse(httpStatusCode.NOT_FOUND, `Unable To Find User With UserName ${username}`));
                }
            });
        });
    }

    getUserById(userId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return userData.getById(connection, userId).then(user => {
                    connection.release();
                    return resolve(user.safeObject());
                }).catch(error => {
                    connection.release();
                    throw error;
                })
            }).catch(error => {
                if (error) {
                    return reject(generateErrorResponse(httpStatusCode.INTERNAL_SERVER_ERROR, error.message));
                } else {
                    return reject(generateErrorResponse(httpStatusCode.NOT_FOUND, `Unable To Find User With Id ${userId}`));
                }
            });
        });
    }

    updatePassword(userId, password) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                connection.beginTransaction((transactionAcquisitionError) => {

                    if (transactionAcquisitionError) {
                        return reject(transactionAcquisitionError);
                    }

                    userData.getById(connection, userId).then(user => {
                        user.password = hashPassword(password);
                        user.updatedAt = new Date().getTime();
                        return userData.update(connection, user);
                    }).then((user) => {
                        connection.commit(() => {
                            connection.release();
                            return resolve(user.safeObject());
                        })
                    }).catch((error) => {
                        connection.rollback(() => {
                            connection.release();
                            if (error) {
                                return reject(error);
                            } else {
                                return reject(generateErrorResponse(httpStatusCode.NOT_FOUND, `Unable To Find User With Id ${userId}`));
                            }
                        });
                    });

                });
            }).catch(reject);
        });
    }

    deleteUser(userId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                connection.beginTransaction((transactionAcquisitionError) => {

                    if (transactionAcquisitionError) {
                        return reject(transactionAcquisitionError);
                    }

                    userData.getById(connection, userId).then(user => {
                        return userData.delete(connection, user);
                    }).then((user) => {
                        connection.commit(() => {
                            connection.release();
                            return resolve(user.safeObject());
                        })
                    }).catch((error) => {
                        connection.rollback(() => {
                            connection.release();
                            if (!error) {
                                return reject(error);
                            } else {
                                return reject(generateErrorResponse(httpStatusCode.NOT_FOUND, `Unable To Find User With Id ${userId}`));
                            }
                        });
                    });
                });
            }).catch(reject);
        });
    }
}

const generateErrorResponse = (statusCode, message) => {
    return new ErrorResponse(statusCode, message);
};

const hashPassword = (plainTextPassword) => {
    return crypto.createHash('md5').update(plainTextPassword).digest('hex');
};

module.exports = new UserService();
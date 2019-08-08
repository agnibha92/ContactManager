'use strict';

const httpStatusCodes    = require('http-status-codes'),
      log                = require('../utils/Logger')("ContactService"),
      db                 = require('../db'),
      fs                 = require('fs'),
      path               = require('path'),
      emailValidator     = require('email-validator'),
      PhoneNumberType    = require('google-libphonenumber').PhoneNumberType,
      phoneUtil          = require('google-libphonenumber').PhoneNumberUtil.getInstance(),
      contactDataManager = require('../persist/ContactDataManager');

const ErrorResponse = require('../responses/ErrorResponse'),
      Contact       = require('../models/Contact');

class ContactService {
    createNewContact(userId, file, body) {
        return new Promise(((resolve, reject) => {
            let firstName = body.firstName;
            let lastName = body.lastName;

            if (!firstName || !lastName) {
                return reject(new ErrorResponse(httpStatusCodes.BAD_REQUEST, "First Name and Last Name Required"));
            }

            let validationResult = validateUserProperties(body);
            if (validationResult) {
                return reject(validationResult);
            }

            db.getConnection().then(connection => {
                connection.beginTransaction((transactionAcquisitionError) => {
                    if (transactionAcquisitionError) {
                        return reject(transactionAcquisitionError);
                    }

                    let contact = generateContactFromBody(body, userId);
                    contactDataManager.createContact(connection, contact).then(contact => {
                        if (file) {
                            moveFileSync(file, userId, contact);
                        }
                        return contact;
                    }).then(contact => {
                        connection.commit(() => {
                            connection.release();
                            return resolve(contact);
                        })
                    }).catch(error => {
                        connection.rollback(() => {
                            connection.release();
                            return reject(error);
                        })
                    });
                });
            }).catch(reject);
        }))
    }

    updateContact(userId, contactId, file, body) {
        return new Promise(((resolve, reject) => {
            db.getConnection().then(connection => {
                connection.beginTransaction(() => {
                    contactDataManager.getContact(connection, userId, contactId).then(previousContact => {

                        let validationResult = validateUserProperties(body);
                        if (validationResult) {
                            return reject(validationResult);
                        }

                        let updatedContact = generateContactFromBody(body, userId);
                        previousContact.copyFrom(updatedContact);
                        return previousContact;
                    }).then(updatedContact => {
                        return contactDataManager.updateContact(connection, updatedContact);
                    }).then((updatedContact) => {
                        connection.commit(() => {
                            connection.release();
                            return resolve(updatedContact);
                        });
                    }).catch(error => {
                        connection.rollback(() => {
                            connection.release();
                            if (!error) {
                                return reject(new ErrorResponse(httpStatusCodes.NOT_FOUND, "Unable To Find Contact To Update"));
                            } else {
                                return reject(error);
                            }
                        });
                    });
                });
            }).catch(reject);
        }));
    }

    getContact(userId, contactId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return contactDataManager.getContact(connection, userId, contactId).then(contact => {
                    connection.release();
                    return contact;
                });
            }).then(resolve).catch(error => {
                if (error) {
                    return reject(error);
                }
                return reject(new ErrorResponse(httpStatusCodes.NOT_FOUND, `User Not Found For Id ${contactId} for User ${userId}`));

            });
        });
    }

    listContacts(userId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return contactDataManager.listContacts(connection, userId).then(listContacts => {
                    connection.release();
                    return listContacts;
                });
            }).then(resolve).catch(reject);
        });
    }

    deleteContact(contactId, userId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                connection.beginTransaction(() => {
                    contactDataManager.getContact(connection, userId, contactId).then(contact => {
                        return contactDataManager.deleteContact(connection, userId, contactId).then(() => contact);
                    }).then((deletedContact) => {
                        connection.commit(() => {
                            connection.release();
                            return resolve(deletedContact);
                        });
                    }).catch(error => {
                        connection.rollback(() => {
                            connection.release();
                            return reject(error);
                        });
                    });
                });
            }).catch(reject);
        })
    }

    registerView(userId, contactId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return contactDataManager.registerView(connection, contactId, userId).then(() => {
                    connection.release();
                });
            }).then(resolve).catch(reject);
        });
    }

    getAnalytics(userId, contactId) {
        return new Promise((resolve, reject) => {
            db.getConnection().then(connection => {
                return contactDataManager.getAnalytics(connection, contactId).then((analytics) => {
                    connection.release();
                    return analytics;
                });
            }).then(resolve).catch(reject);
        })
    }
}

const generateProfilePhotoLocation = (userId, contactId) => {
    return path.join(process.env.FILE_UPLOAD_PATH, userId, String(contactId));
};

const moveFileSync = (file, userId, contact) => {
    let uploadedFilePath = file.path;
    let profileImagePath = generateProfilePhotoLocation(userId, contact.id);
    if (!fs.existsSync(profileImagePath)) {
        fs.mkdirSync(profileImagePath, {recursive: true});
    }
    fs.copyFileSync(uploadedFilePath, path.join(profileImagePath, file.originalname));
    removeFolder(path.dirname(uploadedFilePath));
};

const generateContactFromBody = (body, userId) => {
    let contact = new Contact(body.firstName, body.lastName);
    contact.middleName = body.middleName || "";
    contact.email = body.email || "";
    contact.mobileNumber = body.mobileNumber || "";
    contact.landLineNumber = body.landLineNumber || "";
    contact.notes = body.notes || "";
    contact.ofUser = userId;
    return contact;
};

const removeFolder = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            let curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                removeFolder(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
};

const validateUserProperties = (requestBody) => {
    if (requestBody.email) {
        if (!emailValidator.validate(requestBody.email)) {
            return new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Please Provide a Valid Email Address");
        }
    }

    if (requestBody.mobileNumber) {
        try {
            let parsedNumber = phoneUtil.parse(requestBody.mobileNumber, '');
            let numberType = phoneUtil.getNumberType(parsedNumber);
            if (!phoneUtil.isValidNumber(parsedNumber) && (numberType !== PhoneNumberType.MOBILE || numberType !== PhoneNumberType.FIXED_LINE_OR_MOBILE)) {
                return new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Please Provide a Valid Mobile Number");
            }
        } catch (e) {
            return new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Please Provide a Valid Mobile Number");
        }
    }

    if (requestBody.landLineNumber) {
        try {
            let parsedNumber = phoneUtil.parse(requestBody.landLineNumber, '');
            let numberType = phoneUtil.getNumberType(parsedNumber);
            if (!phoneUtil.isValidNumber(parsedNumber) && (numberType !== PhoneNumberType.FIXED_LINE || numberType !== PhoneNumberType.FIXED_LINE_OR_MOBILE)) {
                return new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Please Provide a Valid Mobile Number");
            }
        } catch (e) {
            return new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Please Provide a Valid LandLine Number");
        }
    }
    return null;
};


module.exports = new ContactService();

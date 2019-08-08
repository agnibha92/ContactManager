'use strict';

const log = require('../utils/Logger')('UserDataManager');

const Contact = require('../models/Contact');

class ContactDataManager {
    createContact(connection, contact) {
        return new Promise(((resolve, reject) => {
            connection.query("INSERT INTO CONTACTS (" +
                             "FIRST_NAME, MIDDLE_NAME, LAST_NAME, EMAIL, MOBILE_NUMBER, LANDLINE_NUMBER, NOTE, USER_ID" +
                             ") VALUES (?,?,?,?,?,?,?,?)",
                             [contact.firstName, contact.middleName, contact.lastName, contact.email,
                              contact.mobileNumber, contact.landLineNumber, contact.notes, contact.ofUser],
                             (queryError, results, fields) => {
                                 if (queryError) {
                                     log.error(`Unable To Create User, Reason | ${queryError}`);
                                     return reject(queryError);
                                 }
                                 contact.id = results.insertId;
                                 return resolve(contact);
                             });
        }));
    }

    getContact(connection, userId, contactId) {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM CONTACTS WHERE CONTACT_ID = ? AND USER_ID = ?", [contactId, userId], (queryError, results, fields) => {

                if (queryError) {
                    return reject(queryError);
                }

                if (results.length === 0) {
                    return reject(null);
                }

                return resolve(getContactFromResultSet(results[0]));
            });
        });
    }

    updateContact(connection, updatedContact) {
        return new Promise((resolve, reject) => {
            connection.query("UPDATE CONTACTS SET " +
                             "FIRST_NAME = ?," +
                             "LAST_NAME = ?," +
                             "EMAIL = ?," +
                             "MOBILE_NUMBER = ?," +
                             "LANDLINE_NUMBER = ?," +
                             "NOTE = ? " +
                             "WHERE CONTACT_ID = ? AND USER_ID = ?",
                             [updatedContact.firstName,
                              updatedContact.lastName,
                              updatedContact.email,
                              updatedContact.mobileNumber,
                              updatedContact.landLineNumber,
                              updatedContact.notes,
                              updatedContact.id, updatedContact.ofUser], (queryError, results, fields) => {
                    if (queryError) {
                        log.error(`Query Error For Updating Contact | ${queryError}`);
                        return reject(queryError);
                    }
                    return resolve(updatedContact);
                });
        });
    }

    listContacts(connection, userId) {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM CONTACTS WHERE USER_ID = ?", userId, (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Query Error While Getting Contact List | ${queryError}`);
                    return reject(queryError);
                }

                let listOfContacts = [];
                for (let result of results) {
                    listOfContacts.push(getContactFromResultSet(result));
                }
                return resolve(listOfContacts);
            });
        });
    }

    deleteContact(connection, userId, contactId) {
        return new Promise((resolve, reject) => {
            connection.query("DELETE FROM CONTACTS WHERE CONTACT_ID = ? and USER_ID = ?", [contactId, userId], (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Error While Deleting Contact ${queryError}`);
                    return reject(queryError);
                }
                return resolve();
            });
        });
    }

    registerView(connection, contactId) {
        return new Promise((resolve, reject) => {
            let currentTime = new Date().getTime();
            connection.query("INSERT INTO USER_VIEWS VALUES (?,?)", [contactId, currentTime], (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Error While Inserting User Views ${queryError}`);
                    return reject(queryError);
                }
                resolve();
            });
        })
    }

    getAnalytics(connection, contactId) {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM AGGREGATED_USER_VIEWS WHERE CONTACT_ID = ? AND AGG_DATE BETWEEN (CURDATE() - INTERVAL 7 DAY) AND CURDATE()", contactId, (queryError, results, fields) => {
                if (queryError) {
                    log.error(`Error While Getting Analytics ${queryError}`);
                    return reject(queryError);
                }

                let dailyAnalytics = [];
                let total = 0;
                for (let result of results) {
                    let analyticBO = {};
                    analyticBO.onDate = result["AGG_DATE"].getTime();
                    analyticBO.count = result["COUNT"];
                    dailyAnalytics.push(analyticBO);
                    total += result["COUNT"];
                }

                return resolve({
                                   total,
                                   dailyAnalytics
                               });
            });
        });
    }
}

const getContactFromResultSet = (resultSet) => {
    let contact = new Contact(resultSet["FIRST_NAME"], resultSet["LAST_NAME"]);
    contact.id = resultSet["CONTACT_ID"];
    contact.middleName = resultSet["MIDDLE_NAME"];
    contact.email = resultSet["EMAIL"];
    contact.mobileNumber = resultSet["MOBILE_NUMBER"];
    contact.landLineNumber = resultSet["LANDLINE_NUMBER"];
    contact.notes = resultSet["NOTE"];
    contact.createdAt = resultSet["CREATED_TS"].getTime();
    contact.updatedAt = resultSet["UPDATED_TS"].getTime();
    contact.ofUser = resultSet["USER_ID"];
    return contact;
};

module.exports = new ContactDataManager();
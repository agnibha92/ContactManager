'use strict';

/**
 * Contacts are internal entity. Every User can have zero or more contact within his profile.
 */
class Contact {
    constructor(firstName, lastName) {
        this._firstName = firstName;
        this._lastName = lastName;
    }

    get firstName() {
        return this._firstName;
    }

    get lastName() {
        return this._lastName;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get middleName() {
        return this._middleName;
    }

    set middleName(value) {
        this._middleName = value;
    }

    get email() {
        return this._email;
    }

    set email(value) {
        this._email = value;
    }

    get mobileNumber() {
        return this._mobileNumber;
    }

    set mobileNumber(value) {
        this._mobileNumber = value;
    }

    get landLineNumber() {
        return this._landLineNumber;
    }

    set landLineNumber(value) {
        this._landLineNumber = value;
    }

    get notes() {
        return this._notes;
    }

    set notes(value) {
        this._notes = value;
    }

    get ofUser() {
        return this._ofUser;
    }

    set ofUser(value) {
        this._ofUser = value;
    }

    get createdAt() {
        return this._createdAt;
    }

    set createdAt(value) {
        this._createdAt = value;
    }

    get updatedAt() {
        return this._updatedAt;
    }

    set updatedAt(value) {
        this._updatedAt = value;
    }

    copyFrom(secondContact) {
        if (secondContact instanceof Contact) {
            Object.keys(secondContact).forEach(key => {
                if (secondContact[key]) {
                    this[key] = secondContact[key];
                }
            })
        } else {
            throw new Error('MisMatch Type, Object is not Type of Contact');
        }
    }
}

module.exports = Contact;
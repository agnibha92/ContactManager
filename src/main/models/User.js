'use strict';

/**
 * User is the base entity.
 */
class User {
    constructor(userName, password) {
        this._userName = userName;
        this._password = password;
    }

    get userName() {
        return this._userName;
    }

    get password() {
        return this._password;
    }

    set password(value) {
        this._password = value;
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
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

    getJWTPayload() {
        return {userId: this._id};
    }

    safeObject() {
        let clone = Object.assign({}, this);
        delete clone._password;
        return clone;
    }
}

module.exports = User;
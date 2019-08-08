'use strict';

const express         = require('express'),
      httpStatusCodes = require('http-status-codes');

const log           = require('../utils/Logger')("UserRoute"),
      userService   = require('../service/UserService'),
      contactsRoute = require('./ContactRoute'),
      jwt           = require('../authenticator/JWTService'),
      CONSTANTS     = require("../constants");

const LoginResponse   = require('../responses/LoginResponse'),
      SuccessResponse = require('../responses/SuccessResponse'),
      ErrorResponse   = require('../responses/ErrorResponse'),
      Utils           = require('../utils/Utils');

const router = express.Router({mergeParams: true});

/**
 * Route Containing All The User Related Operations
 */
class UserRouteHandlers {
    static login(request, response) {

        let userName = request.body.userName;
        let password = request.body.password;

        log.info(`User Attempted Login For UserName ${userName}`);

        userService.loginUser(userName, password).then(authToken => {
            let loginResponse = new LoginResponse(authToken);
            response.status(httpStatusCodes.OK).json(loginResponse);
        }).catch(error => {
            return Utils.sendError(error, response);
        });
    }

    static signup(request, response) {
        let userName = request.body.userName;
        let password = request.body.password;

        if (!userName || !password) {
            return Utils.sendError(new ErrorResponse(httpStatusCodes.BAD_REQUEST, "UserName and Password Both are Required"), response);
        }

        log.info(`New User Sign-Up Request For UserName => ${userName}`);

        userService.createUser(userName, password).then(() => {
            let successResponse = new SuccessResponse("User Created Successfully");
            return response.status(httpStatusCodes.OK).json(successResponse);
        }).catch(error => {
            return Utils.sendError(error, response);
        });
    }

    static getUser(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        return userService.getUserById(userId).then(user => {
            return response.status(httpStatusCodes.OK).json(user);
        }).catch(error => Utils.sendError(error, response));
    }

    static updateUser(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let password = request.body.password;
        if (!password) {
            Utils.sendError(new ErrorResponse(httpStatusCodes.BAD_REQUEST, "Password Is Required To Update"), response);
        }
        userService.updatePassword(userId, password).then(user => {
            return response.status(httpStatusCodes.OK).json(user);
        }).catch(error => Utils.sendError(error, response));
    }

    static deleteUser(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        userService.deleteUser(userId).then(user => {
            return response.status(httpStatusCodes.OK).json(user);
        }).catch(error => Utils.sendError(error, response));
    }

    static validateToken(request, response, next) {
        let authToken = request.header(CONSTANTS.HeaderPropertyKeys.AUTHORIZATION);

        if (authToken) {
            let jwtPayload = jwt.verifyToken(authToken);

            if (jwtPayload) {

                if (Number(request.params[CONSTANTS.PathParameterKeys.USER_ID]) === jwtPayload.userId) {
                    return next();
                }
            }
        }

        return Utils.sendError(new ErrorResponse(httpStatusCodes.UNAUTHORIZED, "Authorization Required"), response);
    }
}

const mapInternalRoutes = (() => {
    log.info("Mapping User Routes...");

    router.post("/login", UserRouteHandlers.login);
    router.post("/signup", UserRouteHandlers.signup);

    router.route(`/:${CONSTANTS.PathParameterKeys.USER_ID}`)
          .get(UserRouteHandlers.validateToken, UserRouteHandlers.getUser)
          .put(UserRouteHandlers.validateToken, UserRouteHandlers.updateUser)
          .delete(UserRouteHandlers.validateToken, UserRouteHandlers.deleteUser);

    router.use(`/:${CONSTANTS.PathParameterKeys.USER_ID}/contacts/`, UserRouteHandlers.validateToken, contactsRoute);
})();

module.exports = router;
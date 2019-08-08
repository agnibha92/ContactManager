'use strict';

const express         = require('express'),
      multer          = require('multer'),
      path            = require('path'),
      httpStatusCodes = require('http-status-codes'),
      fs              = require('fs'),
      mimeType        = require('mime-types'),
      router          = express.Router({mergeParams: true});

const log            = require('../utils/Logger')("ContactRoute"),
      db             = require('../db'),
      CONSTANTS      = require("../constants"),
      contactService = require("../service/ContactService");

const Utils           = require("../utils/Utils"),
      ErrorResponse   = require("../responses/ErrorResponse"),
      SuccessResponse = require('../responses/SuccessResponse');

/**
 * Route Containing all the Contact Related Operations.
 */
class ContactRouteHandlers {
    static create(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        contactService.createNewContact(userId, request.file, request.body).then(contact => {
            return response.status(httpStatusCodes.OK).json(contact);
        }).catch(error => Utils.sendError(error, response));
    }

    static update(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        contactService.updateContact(userId, contactId, request.file, request.body).then(contact => {
            return response.status(httpStatusCodes.OK).json(contact);
        }).catch(error => Utils.sendError(error, response));
    }

    static delete(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        contactService.deleteContact(userId, contactId).then(deletedContact => {
            return response.status(httpStatusCodes.OK).json(deletedContact);
        }).catch(error => Utils.sendError(error, response));
    }

    static list(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        contactService.listContacts(userId).then(contactList => {
            return response.status(httpStatusCodes.OK).json(contactList);
        }).catch(error => Utils.sendError(error, response));
    }

    static get(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        contactService.getContact(userId, contactId).then(contact => {
            return response.status(httpStatusCodes.OK).json(contact);
        }).catch(error => Utils.sendError(error, response));
    }

    static getProfilePhoto(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];

        if (!userId || !contactId) {
            return Utils.sendError(new ErrorResponse(httpStatusCodes.BAD_REQUEST, "User and Contact Id Both Required"), response);
        }

        let profilePhotoLocation = path.resolve(process.env.FILE_UPLOAD_PATH, userId, contactId);
        try {
            fs.readdirSync(profilePhotoLocation).forEach((file, index) => {
                let profileImagePath = path.resolve(profilePhotoLocation, file);
                if (fs.existsSync(profilePhotoLocation) && !fs.lstatSync(profileImagePath).isDirectory()) {
                    response.status(httpStatusCodes.OK).sendFile(profileImagePath);
                } else {
                    response.status(httpStatusCodes.NOT_FOUND).send(new ErrorResponse(httpStatusCodes.NOT_FOUND, "Profile Image Not Found"));
                }
            });
        } catch (e) {
            response.status(httpStatusCodes.NOT_FOUND).send(new ErrorResponse(httpStatusCodes.NOT_FOUND, "Profile Image Not Found"));
        }
    }

    static registerView(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        contactService.registerView(userId, contactId).then(() => {
            return response.status(httpStatusCodes.OK).json(new SuccessResponse("View Registered Successfully"));
        }).catch(error => Utils.sendError(error, response));
    }

    static analytics(request, response) {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        contactService.getAnalytics(userId, contactId).then((analytics) => {
            return response.status(httpStatusCodes.OK).json(analytics);
        }).catch(error => Utils.sendError(error, response));
    }
}


const cleanDirectory = (uploadLocation) => {
    fs.readdirSync(uploadLocation).forEach((file, index) => {
        let curPath = path.join(uploadLocation, file);
        fs.unlinkSync(curPath);
    });
};


const uploadMiddleware = () => {
    let fileNameModifier = (request, file, callback) => {
        return callback(null, file.fieldname + '-' + Date.now() + '.' + mimeType.extension(file.mimetype));
    };

    let destinationModifier = (request, file, callback) => {
        let userId = request.params[CONSTANTS.PathParameterKeys.USER_ID];
        let contactId = request.params[CONSTANTS.PathParameterKeys.CONTACT_ID];
        if (!userId) {
            return callback(new Error("Unable To Find User Id"));
        } else if (!contactId) {
            contactId = String(new Date().getTime());
        }
        let uploadLocation = path.join(process.env.FILE_UPLOAD_PATH, userId, contactId);

        if (!fs.existsSync(uploadLocation)) {
            fs.mkdirSync(uploadLocation, {recursive: true});
        } else {
            cleanDirectory(uploadLocation);
        }

        return callback(null, uploadLocation);
    };

    let storage = multer.diskStorage({destination: destinationModifier, filename: fileNameModifier});

    return multer({storage: storage, limits: {fileSize: Number(process.env.MAX_FILE_SIZE_BYTES)}});
};

const mapRoutes = (() => {
    log.info("Mapping Contact Routes...");

    let uploadFileMiddleWare = uploadMiddleware();

    let profilePhotoHandler = uploadFileMiddleWare.single("profilePhoto");


    /*
     This is to fix the multer where the express error handler is not called in case filesize error.
     */
    let modifiedProfilePhotoHandler = (request, response, next) => {
        profilePhotoHandler(request, response, (error) => {
            if (error) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return response.status(httpStatusCodes.REQUEST_TOO_LONG).json(new ErrorResponse(httpStatusCodes.REQUEST_TOO_LONG, "Image Size Too Long. Maximum 500KB is Allowed."));
                } else {
                    next(error);
                }
            }
            next();
        });
    };
    router.route(CONSTANTS.Routes.BASE)
          .get(ContactRouteHandlers.list)
          .post(modifiedProfilePhotoHandler, ContactRouteHandlers.create);

    router.route(`/:${CONSTANTS.PathParameterKeys.CONTACT_ID}`)
          .get(ContactRouteHandlers.get)
          .put(modifiedProfilePhotoHandler, ContactRouteHandlers.update)
          .delete(ContactRouteHandlers.delete);

    router.get(`/:${CONSTANTS.PathParameterKeys.CONTACT_ID}/photo`, ContactRouteHandlers.getProfilePhoto);
    router.post(`/:${CONSTANTS.PathParameterKeys.CONTACT_ID}/view`, ContactRouteHandlers.registerView);
    router.get(`/:${CONSTANTS.PathParameterKeys.CONTACT_ID}/analytics`, ContactRouteHandlers.analytics);
})();


module.exports = router;

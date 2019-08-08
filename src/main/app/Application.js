'use strict';
/**
 * Base File For Creating The Service. Applications are initialized.
 *
 */

const express             = require('express'),
      bodyParser          = require('body-parser'),
      path                = require('path'),
      applicationServices = require('./ApplicationServices'),
      log                 = require('../utils/Logger')("Application"),
      userRoute           = require("../routes/UserRoute"),
      CONSTANTS           = require('../constants'),
      app                 = express();

const ErrorResponse = require('../responses/ErrorResponse');

/**
 * Mapping The Base User Route. As User is the base entity.
 */
const configureRoutes = () => {
    return new Promise((resolve, reject) => {
        app.use("/user/", userRoute);
        resolve();
    });
};

const startServer = () => {
    return new Promise(((resolve, reject) => {
        app.listen(process.env.PORT, resolve);
    }))
};

const genericErrorHandler = (error, request, response, next) => {
    log.error(error);
    return response.status(500).json(new ErrorResponse("Something Went Wrong. Please try again later."));
};

const addMiddleWares = () => {
    return new Promise((resolve, reject) => {
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());
        app.use((error, request, response, next) => {
            log.error(error);
            return response.status(500).json(new ErrorResponse("Something Went Wrong. Please try again later."));
        });
        /*
         * Redirecting the / to the login page.
         */
        app.get(CONSTANTS.Routes.BASE, (request, response) => {
            return response.redirect('/views/login.html');
        });
        resolve();
    });
};

const addStaticFiles = () => {
    app.use("/images", express.static(path.join(process.cwd(), 'src', 'resources', 'images')));
    app.use("/css", express.static(path.join(process.cwd(), 'src', 'resources', 'css')));
    app.use("/js", express.static(path.join(process.cwd(), 'src', 'resources', 'js')));
    app.use("/views", express.static(path.join(process.cwd(), 'src', 'resources', 'views')));
    return Promise.resolve();
};


applicationServices.checkStartupServices()
                   .then(addMiddleWares)
                   .then(addStaticFiles)
                   .then(configureRoutes)
                   .then(startServer).then(() => {
    log.info(`Process Started at Port ${process.env.PORT}`);
}).catch((error => {
    if (error) {
        log.error(`Failed While Starting Application ${error.stack}`);
    } else {
        log.error('Something bad happened while starting the server.');
    }
}));


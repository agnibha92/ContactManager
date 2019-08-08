'use strict';

const log4js    = require('log4js'),
      path      = require('path'),
      CONSTANTS = require('../constants');

log4js.configure({
                     appenders        : {
                         everything: {
                             type     : 'multiFile',
                             base     : path.join(process.cwd(), 'logs'),
                             property : 'fileName',
                             extension: '.log'
                         },
                         stdout    : {
                             type: 'console'
                         }
                     },
                     categories       : {
                         default: {
                             appenders: ['everything', 'stdout'],
                             level    : (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug')
                         }
                     },
                     pm2              : true,
                     pm2InstanceVar   : 'INSTANCE_ID',
                     disableClustering: true
                 });

module.exports = (fileName) => {
    return log4js.getLogger(fileName);
};


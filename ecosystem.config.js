module.exports = {
    apps: [{
        name  : 'API',
        script: './src/main/app/Application.js',

        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        instances         : 1,
        autorestart       : true,
        watch             : false,
        max_memory_restart: '1G',
        env               : {
            PORT        : 8692,
            ignore_watch: ['[/\\]./', 'node_modules'],
        },
        env_dev           : {
            NODE_ENV            : 'development',
            MYSQL_HOST          : '',
            MYSQL_USER          : '',
            MYSQL_PASSWD        : '',
            MYSQL_DB            : '',
            MYSQL_MAX_CONNECTION: 10,
            JWT_SECRET          : "JWT_SECRET_!@#",
            MAX_FILE_SIZE_BYTES : 500000,
            FILE_UPLOAD_PATH    : ""
        }
    }]
};

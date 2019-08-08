# ContactManager

To Start The Application Via PM2

1. Edit the `ecosystem.config.js` and add Necessary Environment Variables.
2. Execute the Scripts in `db_scripts/db_script_v1.sql`
3. `pm2 start ecosystem.config.js --envdev`

To start The Application Via Node.
1. `KEY=VALUE node src/main/app/Application.js`
2. Environment Variables to set NODE_ENV;MYSQL_HOST;MYSQL_USER;MYSQL_PASSWD;MYSQL_DB;MYSQL_MAX_CONNECTION;PORT;JWT_SECRET;MAX_FILE_SIZE_BYTES;FILE_UPLOAD_PATH

After Starting the Application. Navigate to `http://locahost:8692/`

Postman Collection Link: https://www.getpostman.com/collections/22addde7fae493658b07
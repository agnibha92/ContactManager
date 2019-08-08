CREATE DATABASE contactmanager;

CREATE TABLE USERS
(
    USER_ID    INT          NOT NULL AUTO_INCREMENT,
    USER_NAME  VARCHAR(255) NOT NULL UNIQUE,
    PASSWORD   VARCHAR(255) NOT NULL,
    CREATED_TS TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_TS TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (USER_ID),
    INDEX idx_user_name (USER_NAME)
);

CREATE TABLE CONTACTS
(
    CONTACT_ID      INT          NOT NULL AUTO_INCREMENT,
    FIRST_NAME      VARCHAR(255) NOT NULL,
    MIDDLE_NAME     VARCHAR(255),
    LAST_NAME       VARCHAR(255) NOT NULL,
    EMAIL           VARCHAR(255),
    MOBILE_NUMBER   VARCHAR(255),
    LANDLINE_NUMBER VARCHAR(255),
    NOTE            VARCHAR(1000),
    CREATED_TS      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UPDATED_TS      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    USER_ID         INT          NOT NULL,
    PRIMARY KEY (CONTACT_ID),
    INDEX idx_user_id (USER_ID),
    CONSTRAINT fk_user_id FOREIGN KEY (USER_ID)
        REFERENCES USERS (USER_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE USER_VIEWS
(
    CONTACT_ID INT    NOT NULL,
    EVENT_TS   BIGINT NOT NULL DEFAULT -1,
    CONSTRAINT fk_contact_id FOREIGN KEY (CONTACT_ID)
        REFERENCES CONTACTS (CONTACT_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE AGGREGATED_USER_VIEWS
(
    CONTACT_ID INT  NOT NULL,
    AGG_DATE   DATE NOT NULL,
    COUNT      INT  NOT NULL DEFAULT 0,
    CONSTRAINT fk_ag_us_view_contact_id FOREIGN KEY (CONTACT_ID)
        REFERENCES CONTACTS (CONTACT_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

/**
  This Helps to Start The Event Scheduler in MySQL
 */

SET GLOBAL event_scheduler = ON;


/**
  Event To Aggregate All User's View Every 15 Seconds and 7 Days Prior. These two task can be
  separated in two different events if needed. This event also cleans up the Event_View ledger Table.
  Our Strategy is to aggregate data every 15 second and update the aggregated view table.
 */
DROP EVENT IF EXISTS CRON_15;
delimiter |
CREATE EVENT CRON_15 ON SCHEDULE EVERY 15 SECOND DO
    BEGIN
        SET @start = ROUND(
                    UNIX_TIMESTAMP(
                            CURTIME(4) - INTERVAL 15 SECOND
                        ) * 1000
            );
        SET @finish = ROUND(
                    UNIX_TIMESTAMP(
                            CURTIME(4)
                        ) * 1000
            );

        call updateViewCount(@start, @finish);
        DELETE FROM USER_VIEWS WHERE EVENT_TS BETWEEN @start and @finish;
        DELETE FROM AGGREGATED_USER_VIEWS WHERE AGG_DATE < CURDATE() - INTERVAL 7 DAY;

    END |
delimiter ;


/**
    Procedure to update the view count. This will check if view exists for today then it will update or insert
    into the table.
 */
delimiter |
CREATE PROCEDURE updateViewCount(IN v_startTime BIGINT, IN v_endTime BIGINT)
BEGIN
    DECLARE v_contact_id int;
    DECLARE v_count int;

    DECLARE cur1 CURSOR FOR SELECT CONTACT_ID, COUNT(*) AS count
                            FROM USER_VIEWS
                            WHERE EVENT_TS BETWEEN v_startTime and v_endTime
                            GROUP BY CONTACT_ID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET @done = 1;

    SET @done = 0;
    set @time = CURDATE();
    OPEN cur1;
    countLoop:
        loop
            FETCH cur1 INTO v_contact_id, v_count;
            IF @done = 1 THEN leave countLoop; END IF;
            IF exists(SELECT 1
                      FROM AGGREGATED_USER_VIEWS
                      where CONTACT_ID = v_contact_id
                        and AGG_DATE = @time) THEN

                SELECT @currentCount := COUNT
                FROM AGGREGATED_USER_VIEWS
                WHERE CONTACT_ID = v_contact_id
                  and AGG_DATE = @time;

                set @newCount = v_count + @currentCount;

                SET @updateStatement =
                        concat('UPDATE AGGREGATED_USER_VIEWS SET COUNT = ', @newCount,
                               ' WHERE CONTACT_ID = ? AND AGG_DATE = ?');
                SELECT @updateStatement;
                SET @contactId = v_contact_id;
                PREPARE stmt1 FROM @updateStatement;
                EXECUTE stmt1 USING @contactId, @time;
                DEALLOCATE PREPARE stmt1;
            ELSE
                SET @insertStatement =
                        concat('INSERT INTO AGGREGATED_USER_VIEWS (CONTACT_ID,AGG_DATE,COUNT) values(',
                               v_contact_id, ',', quote(@time), ',', v_count, ')');
                SELECT @insertStatement;
                PREPARE stmt1 FROM @insertStatement;
                EXECUTE stmt1;
                DEALLOCATE PREPARE stmt1;
            END IF;
        END loop countLoop;
    CLOSE cur1;
END |
delimiter ;

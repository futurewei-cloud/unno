import mysql.connector
from configuration.config import SQLConfig


def connect(host, port, database, user, password):
    try:
        connection = mysql.connector.connect(host=host,
                                             port=port,
                                             database=database,
                                             user=user,
                                             password=password)

        cursor = connection.cursor(
            prepared=False,
            buffered=True,
            dictionary=True)

        if not connection or not cursor:
            raise ValueError(
                "Connection to MySQL cannot be established! Connection = {} and cursor = {}".format(
                    connection, cursor))

        return connection, cursor

    except mysql.connector.Error as error:
        print("Connection failed {}".format(error))
        return None, None


def close(connection, cursor):
    # closing database connection.
    if connection and connection.is_connected():
        cursor.close()
        connection.close()
        print("MySQL connection is closed")
    else:
        print("Connection is not existing")


def run_single_query(sql_query):
    try:
        connection, cursor = connect(
            SQLConfig.host, SQLConfig.port, SQLConfig.db, SQLConfig.username, SQLConfig.pw)
    except ValueError:
        return None

    try:
        print(sql_query)
        cursor.execute(sql_query)
        connection.commit()
        return cursor.lastrowid
    except mysql.connector.Error as error:
        connection.rollback()  # rollback if any exception occured
        print("Failed getting job {}".format(error))
        return None
    finally:
        close(connection, cursor)


def run_all_query(sql_query):
    try:
        connection, cursor = connect(
            SQLConfig.host, SQLConfig.port, SQLConfig.db, SQLConfig.username, SQLConfig.pw)
    except ValueError:
        return None

    try:
        print(sql_query)
        cursor.execute(sql_query)
        row = cursor.fetchone()
        rst = []
        while row is not None:
            rst.append(row)
            row = cursor.fetchone()
    except mysql.connector.Error as error:
        connection.rollback()  # rollback if any exception occured
        print("Failed getting job {}".format(error))
        return None
    finally:
        close(connection, cursor)

    return rst


def update_query(db, sets, conditions):
    # update_query('waitlist', [('processing_time','CURRENT_TIMESTAMP'),('status','running')], [('job_num',job[0])])

    sql_set_query = ""
    if len(sets) == 0:
        return None
    else:
        sql_set_query += " SET "
        if str(sets[0][1]) == 'CURRENT_TIMESTAMP':
            sql_set_query += str(sets[0][0]) + "=" + str(sets[0][1])
        else:
            sql_set_query += str(sets[0][0]) + "='" + str(sets[0][1]) + "'"
        for s in sets[1:]:
            if str(s[1]) == 'CURRENT_TIMESTAMP':
                sql_set_query += ", " + str(s[0]) + "=" + str(s[1])
            else:
                sql_set_query += ", " + str(s[0]) + "='" + str(s[1]) + "'"

    sql_condition_query = ""

    if len(conditions) > 0:
        sql_condition_query += " WHERE "
        sql_condition_query += str(conditions[0][0]) + \
            "='" + str(conditions[0][1]) + "'"
        for condition in conditions[1:]:
            sql_condition_query += " and " + \
                str(condition[0]) + "='" + str(condition[1]) + "'"

    sql_update_query = "UPDATE " + db + sql_set_query + sql_condition_query
    return run_single_query(sql_update_query)

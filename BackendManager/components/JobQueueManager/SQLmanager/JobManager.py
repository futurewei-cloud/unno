import mysql.connector


def get_job(sql_query, connection, cursor):
    try:
        print(sql_query)
        cursor.execute(sql_query)
        row = cursor.fetchone()
        jobs = []
        while row is not None:
            jobs.append(row)
            row = cursor.fetchone()

        return jobs

    except mysql.connector.Error as error:
        connection.rollback()  # rollback if any exception occured
        print("Failed getting job {}".format(error))
        return None


def del_job(sql_query, connection, cursor):
    try:
        print(sql_query)
        cursor.execute(sql_query)
        connection.commit()

    except mysql.connector.Error as error:
        connection.rollback()  # rollback if any exception occured
        print("Failed getting job {}".format(error))
        return None


def update_job(connection, cursor, db, sets, conditions):

    sql_set_query = ""
    if len(sets) == 0:
        return
    else:
        sql_set_query += " SET "
        if str(sets[0][1]) == 'CURRENT_TIMESTAMP':
            sql_set_query += str(sets[0][0]) + "=" + str(sets[0][1])
        else:
            sql_set_query += str(sets[0][0]) + "='" + str(sets[0][1]) + "'"
        for set in sets[1:]:
            if str(set[1]) == 'CURRENT_TIMESTAMP':
                sql_set_query += ", " + str(set[0]) + "=" + str(set[1])
            else:
                sql_set_query += ", " + str(set[0]) + "='" + str(set[1]) + "'"

    sql_condition_query = ""
    if len(conditions) > 0:
        sql_condition_query += " WHERE "
        sql_condition_query += str(conditions[0][0]) + \
            "=" + str(conditions[0][1])
        for condition in conditions[1:]:
            sql_condition_query += " and " + \
                str(condition[0]) + "=" + str(condition[1])

    sql_update_query = "UPDATE " + db + sql_set_query + sql_condition_query
    print(sql_update_query)

    try:
        cursor.execute(sql_update_query)
        connection.commit()

    except mysql.connector.Error as error:
        connection.rollback()  # rollback if any exception occured
        print("Failed updating server {}".format(error))

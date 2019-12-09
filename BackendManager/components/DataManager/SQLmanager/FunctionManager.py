from DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from util import check_input_manager


def get_server(server):
    check_input_manager('server', server, ['server_id'])
    query = "SELECT * FROM function WHERE server_id='%s'" % \
            (server['server_id'])
    print("server %s is fetched!" % server['server_id'])
    return run_all_query(query)


def add_server(server):
    check_input_manager('server', server, ['endpoint', 'status'])

    key_query = "(endpoint"
    value_query = "('%s'" % server['endpoint']

    for k, v in server.items():
        if k in ('status', 'desc'):
            key_query += "," + k
            value_query += ",'%s'" % server[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO function %s VALUES %s" % (key_query, value_query)
    print("server %s is added!" % server['endpoint'])
    return run_single_query(query)


def del_server(server):
    check_input_manager('server', server, ['server_id'])
    query = "DELETE FROM function WHERE server_id=%s" % \
            (server['server_id'])
    print("server %s is deleted!" % server['server_id'])
    return run_single_query(query)


def update_server(server):
    check_input_manager('server', server, ['server_id'])
    changes = []
    for k, v in server.items():
        if k != 'server_id':
            changes.append((k, v))

    conditions = [('server_id', server['server_id'])]
    print("server %s is updated!" % server['server_id'])
    return update_query('function', changes, conditions)

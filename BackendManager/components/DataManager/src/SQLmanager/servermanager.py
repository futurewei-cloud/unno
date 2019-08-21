from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..util import check_input_manager


def get_server(server):
    check_input_manager('server', server, ['server_id'])
    query = "SELECT * FROM server WHERE server_id='%s'" % \
            (server['server_id'])
    print("server %s is fetched!" % server['server_id'])
    return run_all_query(query)


def get_servers(server):
    check_input_manager('server', server, ['username'])
    query = "SELECT * FROM server WHERE username='%s'" % (server['username'])
    print("server from user %s are fetched!" % server['username'])
    return run_all_query(query)


def add_server(server):
    check_input_manager('server', server, ['username', 'job_name', 'video_id'])

    server['s3_location'] = server['username'] + '/' + server['job_name']
    if 'status' not in server:
        server['status'] = 'pending'

    key_query = "(username"
    value_query = "('%s'" % server['username']

    for k, v in server.items():
        if k in ("job_name", "video_name", "s3_location", "status"):
            key_query += "," + k
            value_query += ",'%s'" % server[k]
        elif k in ("length", "num_frames"):
            key_query += "," + k
            value_query += ",%s" % server[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO server %s VALUES %s" % (key_query, value_query)
    print("server %s is added!" % server['job_name'])
    return run_single_query(query)


def del_server(server):
    check_input_manager('server', server, ['server_id'])
    query = "DELETE FROM server WHERE server_id=%s" % \
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
    return update_query('server', changes, conditions)


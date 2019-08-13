from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..DBconnectors.MINIOconnector import make_bucket, remove_bucket
from ..util import check_input_manager


def get_user(user):
    check_input_manager('user', user, ['username'])
    query = "SELECT * FROM user WHERE username='%s'" % user['username']
    print("User %s is fetched!" % user['username'])
    return run_all_query(query)


def add_user(user):
    check_input_manager('user', user, ['username', 'password', 'role'])
    check_user = make_bucket(user['username'])

    if check_user is None:
        print("Create bucket failed!")
        return
    elif not check_user:
        print("Username existed!")
        return

    key_query = "(username"
    value_query = "('%s'" % user['username']

    for k, v in user.items():
        if k in ("password", "role"):
            key_query += "," + k
            value_query += ",'%s'" % user[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO user %s VALUES %s" % (key_query, value_query)
    print("User %s is added!" % user['username'])
    return run_single_query(query)


def del_user(user):
    check_input_manager('user', user, ['username'])
    remove_status = remove_bucket(user['username'])
    if remove_status is None:
        print("Remove user failed!")
        return
    query = "DELETE FROM user WHERE username='%s'" % user['username']
    print("User %s is deleted!" % user['username'])
    return run_single_query(query)


def update_user(user):
    check_input_manager('user', user, ['username'])
    changes = []
    for k, v in user.items():
        if k != 'username':
            changes.append((k, v))

    conditions = [('username', user['username'])]
    return update_query('user', changes, conditions)


if __name__ == "__main__":
    new_user = {'username': 'Fan', 'password': 'Fan123', 'role': 'admin'}
    add_user(new_user)
    print(get_user(new_user))
    new_user = {'username': 'Fan', 'password': 'Fan123', 'role': 'user'}
    update_user(new_user)
    print(get_user(new_user))
    del_user(new_user)
    print(get_user(new_user))

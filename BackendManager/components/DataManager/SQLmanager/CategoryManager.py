from DBconnectors.SQLconnector import run_single_query, run_all_query, update_query


def get_category(cat_id):
    query = "SELECT *  FROM category WHERE cat_id='%s'" % cat_id
    print("cat_id %s is fetched!" % cat_id)
    return run_all_query(query)


def get_categoris(sup_cat=None):
    query = "SELECT * FROM category"

    if sup_cat is not None:
        query += " WHERE sup_cat_name='%s'" % sup_cat

    print("categories are fetched!")
    return run_all_query(query)


def add_category(cat):

    if 'name' not in cat:
        print("Invalid category information to add")
        return None

    key_query = "(name"
    value_query = "('%s'" % cat['name']

    for k, v in cat.items():
        if k == "sup_cat_name":
            key_query += "," + k
            value_query += ",'%s'" % cat[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO category %s VALUES %s" % (key_query, value_query)
    cat_id = run_single_query(query)
    print("category %s is added!" % cat_id)
    return cat_id


def del_category(cat):
    if 'cat_id' in cat:
        query = "DELETE FROM category WHERE cat_id='%s'" % cat['cat_id']
        print("cat_id %s is deleted!" % cat['cat_id'])
    elif 'name' in cat:
        query = "DELETE FROM category WHERE name='%s'" % cat['name']
        print("name %s is deleted!" % cat['name'])
    elif 'sup_cat_name' in cat:
        query = "DELETE FROM category WHERE sup_cat_name='%s'" % cat['sup_cat_name']
        print("categories under %s are deleted!" % cat['sup_cat_name'])

    return run_single_query(query)


def update_category(cat):
    if 'cat_id' not in cat:
        print("Invalid category info to update")
        return None

    changes = []
    for k, v in cat.items():
        if k != 'cat_id':
            changes.append((k, v))

    conditions = [('cat_id', cat['cat_id'])]
    print("category %s is updated!" % cat['cat_id'])

    return update_query('category', changes, conditions)


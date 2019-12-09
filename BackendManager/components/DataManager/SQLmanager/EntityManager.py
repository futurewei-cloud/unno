from DBconnectors.SQLconnector import run_single_query, run_all_query, update_query


def get_entities(video_id):
    query = "SELECT *  FROM entity WHERE video_id='%s'" % video_id
    print("entities in video %s are fetched!" % video_id)
    return run_all_query(query)


def get_entity(entity_id):
    query = "SELECT * FROM entity WHERE entity_id='%s'" % entity_id
    print("entity is fetched!" % entity_id)
    return run_all_query(query)


def add_entity(video_id):
    query = "INSERT INTO entity (video_id) VALUES (%s)" % video_id
    entity_id = run_single_query(query)
    print("entity %s is added!" % entity_id)
    return entity_id


# TODO: set ON DELETE/UPDATE in annotation table to CASCADE to
# automatically changes annotations when entity changes
def del_entity(entity):
    if 'entity_id' in entity:
        query = "DELETE FROM entity WHERE entity_id='%s'" % entity['entity_id']
        print("entity %s is deleted!" % entity['entity_id'])
    elif 'video_id' in entity:
        query = "DELETE FROM entity WHERE video_id='%s'" % entity['video_id']
        print("entities in video %s are deleted!" % entity['video_id'])

    return run_single_query(query)


def update_entity(entity):
    if 'entity_id' not in entity:
        print("Invalid entity info to update")
        return None

    changes = []
    for k, v in entity.items():
        if k != 'entity_id':
            changes.append((k, v))

    conditions = [('entity_id', entity['entity_id'])]
    print("entity %s is updated!" % entity['entity_id'])

    return update_query('entity', changes, conditions)

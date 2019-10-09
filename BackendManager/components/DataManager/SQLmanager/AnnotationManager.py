from DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from JobManager import update_job
from FunctionManager import update_server
from util import check_input_manager


def get_annotations(anno):
    if 'annotation_id' in anno:
        query = "SELECT *  FROM annotation WHERE annotation_id='%s'" % (anno['annotation_id'])
        print("annotation_id %s is fetched!" % anno['annotation_id'])
    else:
        check_input_manager('annotation', anno, ['video_id'])
        query = "SELECT * FROM annotation WHERE video_id='%s'" % (anno['video_id'])

        if 'job_id' in anno:
            query += " AND job_id='%s'" % anno['job_id']
        if 'username' in anno:
            query += " AND username='%s'" % anno['username']
        if 'entity_id' in anno:
            query += " AND entity_id='%s'" % anno['entity_id']
        if 'frame_num' in anno:
            query += " AND frame_num='%s'" % anno['frame_num']
        if 'cat_id' in anno:
            query += "AND cat_id='%s'" % anno['cat_id']

        print("annotations from video %s are fetched!" % anno['video_id'])
    return run_all_query(query)


def add_annotation(anno):
    check_input_manager('annotation', anno, ['video_id', 'frame_num', 'entity_id', 'username', 'status', 'bbox'])

    if 'job_id' not in anno:
        anno['job_id'] = 'null'

    key_query = "(job_id"
    value_query = "(%s" % anno['job_id']

    for k, v in anno.items():
        if k in ('username', 'status', 'bbox', 'entity_desc'):
            key_query += "," + k
            value_query += ",'%s'" % anno[k]
        elif k in ('video_id', 'frame_num', 'entity_id', 'cat_id'):
            key_query += "," + k
            value_query += ",%s" % anno[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO annotation %s VALUES %s" % (key_query, value_query)
    annotation_id = run_single_query(query)
    print("annotation %s is added!" % annotation_id)
    return annotation_id


def add_annotations(results):
    check_input_manager('results', results, ['job_id', 'video_id', 'entity_id', 'username', 'tracking_results', 'server_id'])

    anno_meta = {'video_id': results['video_id'], 'entity_id': results['entity_id'], 'username': results['username']}

    for k, v in results['tracking_results'].items():
        anno_info = {'frame_num': k}
        anno_info.update(anno_meta)

        # check if existing related annotation
        existing_anno = get_annotations(anno_info)
        if existing_anno is not None and len(existing_anno) > 0:
            existing_id = existing_anno[0]['annotation_id']
            if existing_anno[0]['status'] == 'auto':
                # update by overriding with latest annotation
                anno = {'bbox': v, 'job_id': results['job_id'], 'status': 'auto', 'annotation_id': existing_id}
                anno.update(anno_info)
                update_annotation(anno)
            else:
                # skip, not to override human generated annotation
                continue
        else:
            # add new annotation
            anno = {'bbox': v, 'job_id': results['job_id'], 'status': 'auto'}
            anno.update(anno_info)
            add_annotation(anno)

    job = {'job_id': results['job_id'], 'status': 'done'}
    update_job(job)
    # update function server state
    server = {'server_id': results['server_id'], 'status': 0}
    update_server(server)
    return True


def del_annotation(anno):
    if 'annotation_id' in anno:
        query = "DELETE FROM annotation WHERE annotation_id='%s'" % (anno['annotation_id'])
        print("annotation_id %s is deleted!" % anno['annotation_id'])
    else:
        check_input_manager('annotation', anno, ['video_id'])
        query = "DELETE FROM annotation WHERE video_id='%s'" % (anno['video_id'])

        if 'job_id' in anno:
            query += " AND job_id='%s'" % anno['job_id']
        elif 'entity_id' in anno:
            query += " AND entity_id='%s'" % anno['entity_id']
        elif 'frame_num' in anno:
            query += " AND frame_num='%s'" % anno['frame_num']
        elif 'cat_id' in anno:
            query += " AND cat_id='%s'" % anno['cat_id']

        print("annotations from video %s are deleted!" % anno['video_id'])

    return run_single_query(query)


def update_annotation(anno):
    check_input_manager('annotation', anno, ['annotation_id'])
    changes = []
    for k, v in anno.items():
        if k != 'annotation_id':
            changes.append((k, v))

    conditions = [('annotation_id', anno['annotation_id'])]
    print("annotation %s is updated!" % anno['annotation_id'])
    return update_query('annotation', changes, conditions)


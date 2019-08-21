from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from .annotationmanager import update_annotation
from .servermanager import update_server
from ..util import check_input_manager
import os


def get_results(result):
    if 'result_id' in result:
        query = "SELECT *  FROM result WHERE result_id='%s'" % (result['result_id'])
        print("result_id %s are fetched!" % result['result_id'])
    else:
        check_input_manager('result', result, ['video_id'])
        query = "SELECT * FROM result WHERE video_id='%s'" % (result['video_id'])

        if 'job_id' in result:
            query += " AND job_id='%s'" % result['job_id']
        if 'username' in result:
            query += " AND username='%s'" % result['username']
        if 'entity_id' in result:
            query += " AND entity_id='%s'" % result['entity_id']
        if 'frame_num' in result:
            query += " AND frame_num='%s'" % result['frame_num']

        print("result from video %s are fetched!" % result['video_id'])
    return run_all_query(query)


def add_result(result):
    check_input_manager('result', result, ['video_id', 'frame_num',
                                           'entity_id', 'username', 'status', 'bbox'])

    if 'job_id' not in result:
        result['job_id'] = 'null'

    key_query = "(job_id"
    value_query = "(%s" % result['job_id']

    for k, v in result.items():
        if k in ("username", "status", "bbox"):
            key_query += "," + k
            value_query += ",'%s'" % result[k]
        elif k in ("video_id", "frame_num", "entity_id"):
            key_query += "," + k
            value_query += ",%s" % result[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO result %s VALUES %s" % (key_query, value_query)
    result_id = run_single_query(query)
    print("result %s is added!" % result_id)
    return result_id


def add_results(results):
    check_input_manager('results', results, ['job_id', 'video_id', 'entity_id',
                                             'username', 'tracking_results', 'server_id'])

    result_meta = {'video_id': results['video_id'], 'entity_id': results['entity_id'], 'username': results['username']}

    for k, v in results['tracking_results'].items():
        result_info = {'frame_num': k}
        result_info.update(result_meta)

        # check if existing related result
        existing_result = get_results(result_info)
        if existing_result is not None and len(existing_result) > 0:
            existing_id = existing_result[0]['result_id']
            if existing_result[0]['status'] == 'auto':
                # update by overriding with latest result
                result = {'bbox': v, 'job_id': results['job_id'], 'status': 'auto', 'result_id': existing_id}
                result.update(result_info)
                update_result(result)
            else:
                # skip, not to override human generated result
                continue
        else:
            # add new result
            result = {'bbox': v, 'job_id': results['job_id'], 'status': 'auto'}
            result.update(result_info)
            add_result(result)

    annotation = {'job_id': results['job_id'], 'status': 'done'}
    update_annotation(annotation)
    # update server
    server = {'server_id': results['server_id'], 'status': 0}
    update_server(server)
    return True


def del_result(result):
    if 'result_id' in result:
        query = "DELETE FROM result WHERE result_id='%s'" % (result['result_id'])
        print("result_id %s are deleted!" % result['result_id'])
    else:
        check_input_manager('result', result, ['video_id'])
        query = "DELETE FROM result WHERE video_id='%s'" % (result['video_id'])

        if 'job_id' in result:
            query += " AND job_id='%s'" % result['job_id']
        elif 'entity_id' in result:
            query += " AND entity_id='%s'" % result['entity_id']
        elif 'frame_num' in result:
            query += " AND frame_num='%s'" % result['frame_num']

        print("result from video %s are deleted!" % result['video_id'])

    return run_single_query(query)


def update_result(result):
    check_input_manager('result', result, ['result_id'])
    changes = []
    for k, v in result.items():
        if k != 'result_id':
            changes.append((k, v))

    conditions = [('result_id', result['result_id'])]
    print("result %s is updated!" % result['result_id'])
    return update_query('result', changes, conditions)


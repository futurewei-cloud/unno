from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..DBconnectors.MINIOconnector import make_bucket, uploader, remove_object
from ..util import check_input_manager
import os


def get_annotation(annotation):
    check_input_manager('annotation', annotation, ['job_id'])
    query = "SELECT * FROM annotation WHERE job_id='%s'" % \
            (str(annotation['job_id']))
    print("Annotation %s is fetched!" % annotation['job_id'])
    return run_all_query(query)


def get_annotations(annotation):
    check_input_manager('annotation', annotation, ['video_id'])
    query = "SELECT * FROM annotation WHERE video_id='%s'" % (str(annotation['video_id']))
    print("Annotation from user %s are fetched!" % annotation['video_id'])
    return run_all_query(query)


def add_annotation(annotation):
    check_input_manager('annotation', annotation, ['username', 'entity_id', 'video_id',
                                                   'bbox', 'start_frame', 'end_frame'])

    if 'status' not in annotation:
        annotation['status'] = 'new'

    key_query = "(username"
    value_query = "('%s'" % annotation['username']

    for k, v in annotation.items():
        if k in ("job_name", "s3_location", "status", "bbox", "entity_name"):
            key_query += "," + k
            value_query += ",'%s'" % annotation[k]
        elif k in ("video_id", "entity_id", "start_frame", "end_frame"):
            key_query += "," + k
            value_query += ",%s" % annotation[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO annotation %s VALUES %s" % (key_query, value_query)
    print("Annotation %s is added!" % annotation['job_name'])
    return run_single_query(query)


def del_annotation(annotation):
    check_input_manager('annotation', annotation, ['job_id'])
    query = "DELETE FROM annotation WHERE job_id=%s" % \
            (str(annotation['job_id']))
    print("Annotation %s is deleted!" % annotation['job_id'])
    return run_single_query(query)


def update_annotation(annotation):
    check_input_manager('annotation', annotation, ['job_id'])
    changes = []
    for k, v in annotation.items():
        if k != 'job_id':
            changes.append((k, v))

    conditions = [('job_id', annotation['job_id'])]
    print("Annotation %s is updated!" % annotation['job_id'])
    return update_query('annotation', changes, conditions)


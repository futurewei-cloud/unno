from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..DBconnectors.MINIOconnector import make_bucket, uploader, remove_object
from ..util import check_input_manager
import os


def get_annotation(annotation):
    check_input_manager('annotation', annotation, ['job_id'])
    query = "SELECT * FROM annotation WHERE job_id='%s'" % \
            (annotation['job_id'])
    print("Annotation %s is fetched!" % annotation['job_id'])
    return run_all_query(query)


def get_annotations(annotation):
    check_input_manager('annotation', annotation, ['username'])
    query = "SELECT * FROM annotation WHERE username='%s'" % (annotation['username'])
    print("Annotation from user %s are fetched!" % annotation['username'])
    return run_all_query(query)


def add_annotation(annotation):
    check_input_manager('annotation', annotation, ['username', 'job_name', 'video_id'])

    annotation['s3_location'] = annotation['username'] + '/' + annotation['job_name']
    if 'status' not in annotation:
        annotation['status'] = 'pending'

    key_query = "(username"
    value_query = "('%s'" % annotation['username']

    for k, v in annotation.items():
        if k in ("job_name", "video_name", "s3_location", "status"):
            key_query += "," + k
            value_query += ",'%s'" % annotation[k]
        elif k in ("length", "num_frames"):
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
            (annotation['job_id'])
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


if __name__ == "__main__":
    new_annotation = {'job_name': 'abcd_job1', 'username': 'abcd', 'video_name': 'test123.avi'}

from DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from util import check_input_manager


def get_job(job):
    check_input_manager('job', job, ['job_id'])
    query = "SELECT * FROM job WHERE job_id='%s'" % \
            (str(job['job_id']))
    print("Job %s is fetched!" % job['job_id'])
    return run_all_query(query)


def get_jobs(job):
    check_input_manager('job', job, ['video_id'])
    query = "SELECT * FROM job WHERE video_id='%s'" % (str(job['video_id']))
    print("Jobs from user %s are fetched!" % job['video_id'])
    return run_all_query(query)


def add_job(job):
    check_input_manager('job',
                        job,
                        ['username',
                         'entity_id',
                         'video_id',
                         'bbox',
                         'start_frame',
                         'end_frame'])

    if 'status' not in job:
        job['status'] = 'new'

    key_query = "(username"
    value_query = "('%s'" % job['username']

    for k, v in job.items():
        if k in ("job_name", "status", "bbox"):
            key_query += "," + k
            value_query += ",'%s'" % job[k]
        elif k in ("video_id", "entity_id", "start_frame", "end_frame"):
            key_query += "," + k
            value_query += ",%s" % job[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO job %s VALUES %s" % (key_query, value_query)
    print("Job %s is added! Entity: {}, Start: {}, End: {}".format(
        job['entity_id'], job['start_frame'], job['end_frame']))
    return run_single_query(query)


def del_job(job):
    check_input_manager('job', job, ['job_id'])
    query = "DELETE FROM job WHERE job_id=%s" % \
            (str(job['job_id']))
    print("Job %s is deleted!" % job['job_id'])
    return run_single_query(query)


def update_job(job):
    check_input_manager('job', job, ['job_id'])
    changes = []
    for k, v in job.items():
        if k != 'job_id':
            changes.append((k, v))

    conditions = [('job_id', job['job_id'])]
    print("Job %s is updated!" % job['job_id'])
    return update_query('job', changes, conditions)

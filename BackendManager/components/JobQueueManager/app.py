from __future__ import print_function
from __future__ import division

from configuration.config import SQLConfig, ServiceConfig
from SQLmanager.JobManager import get_job, update_job
from DBconnectors.SQLconnector import connect, close
from DBconnectors.MINIOconnector import downloader_multiple
import time
import requests
import json


def forward_job(url, job):
    headers = {'content-type': 'application/json'}
    print ('request: ', url, job)
    response = requests.post(url, data=json.dumps(job), headers=headers)
    print (response, response.content)
    # TODO: clean up if API call failed with code other than 200
    return response


def main():

    while True:
        connection, cursor = connect(SQLConfig.host, SQLConfig.port, SQLConfig.db, SQLConfig.username, SQLConfig.pw)

        sql_query = "SELECT * FROM job WHERE status='new'"
        jobs = get_job(sql_query, connection, cursor)

        if jobs is None or len(jobs) == 0:
            print('waiting for jobs')
            time.sleep(3)
            continue
        print ('Found new jobs: ', jobs)

        sql_query = "SELECT * FROM function WHERE status=0"
        servers = get_job(sql_query, connection, cursor)

        if servers is None or len(servers) == 0:
            print('waiting for available server')
            time.sleep(3)
            continue
        print ('Found available servers: ', servers)

        if len(jobs) >= len(servers):
            jobs = jobs[:len(servers)]
        else:
            servers = servers[:len(jobs)]

        print ('*********  Start running jobs ************')
        for job, server in zip(jobs, servers):
            print('job %s is running on server %s' % (job, server))
            video_id = 'video-' + str(job['video_id'])
            downloader_multiple(video_id, video_id)

            sets = [('status', 'pending')]
            conditions = [('job_id', job['job_id'])]
            update_job(connection, cursor, 'job', sets, conditions)

            sets = [('status', 1)]
            conditions = [('server_id', server['server_id'])]
            update_job(connection, cursor, 'function', sets, conditions)

            job['server_id'] = server['server_id']
            job['result_api'] = ServiceConfig.result_api
            forward_job(server['endpoint'], job)
        print ('********** Done ***********')

        close(connection, cursor)


if __name__ == '__main__':
    main()

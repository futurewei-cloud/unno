from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..DBconnectors.MINIOconnector import make_bucket, uploader, downloader, remove_object, remove_bucket, save_frames
from ..util import check_input_manager
import os
import sys
import re
import mimetypes
from flask import request, send_file, Response


def get_video(video):
    check_input_manager('video', video, ['video_id'])
    query = "SELECT * FROM video WHERE video_id='%s'" % (video['video_id'])
    print("Video %s is fetched!" % video['video_id'])
    return run_all_query(query)


def get_videos(video):
    check_input_manager('video', video, ['username'])
    #query = "SELECT * FROM video WHERE username='%s'" % (video['username'])
    query = "SELECT video.*, COUNT(DISTINCT result.entity_id) AS entity_num FROM video LEFT OUTER JOIN result on" \
            " video.video_id=result.video_id AND video.username='%s' GROUP BY video.video_id" % (video['username'])
    print("Videos from user %s are fetched!" % video['username'])
    return run_all_query(query)


def add_video(video, file_location):
    check_input_manager('video', video, ['username', 'video_name', 'format'])
    # video['s3_location'] = video['username'] + '/' + video['video_name']
    key_query = "(username"
    value_query = "('%s'" % video['username']

    for k, v in video.items():
        if k in ("video_name", "format", "s3_location"):
            key_query += "," + k
            value_query += ",'%s'" % video[k]
        elif k in ("fps", "num_frames"):
            key_query += "," + k
            value_query += ",%s" % video[k]

    key_query += ")"
    value_query += ")"
    query = "INSERT INTO video %s VALUES %s" % (key_query, value_query)
    print("Video %s is added!" % video['video_name'])
    video_num = run_single_query(query)
    video_id = 'video-' + str(video_num)

    bucket_name = 'videos'
    if make_bucket(bucket_name) is None:
        print("Creating bucket failed!")
        video = {'video_id': video_id}
        del_video(video)
        return

    if not uploader(bucket_name, video_id, os.path.join('/data/tmp', file_location)):
        print("Upload video failed!")
        video = {'video_id': video_id}
        del_video(video)
        return

    num_frames, fps = save_frames(video_id, file_location)
    if num_frames > 0:
        video = {'video_id': video_num, 'fps': fps, 'num_frames': num_frames}
        update_video(video)
    else:
        print("Upload frames failed!")
        video = {'video_id': video_num}
        del_video(video)
        return

    return video_id


def del_video(video):
    check_input_manager('video', video, ['video_id'])
    video_id = 'video-' + str(video['video_id'])
    remove_object('videos', video_id)
    remove_bucket(video_id)
    query = "DELETE FROM video WHERE video_id=%s" % (video['video_id'])
    print("Video %s is deleted!" % video['video_id'])
    return run_single_query(query)


def update_video(video):
    check_input_manager('video', video, ['video_id'])
    changes = []
    for k, v in video.items():
        if k != 'video_id':
            changes.append((k, v))

    conditions = [('video_id', video['video_id'])]
    print("Video %s is updated!" % video['video_id'])
    return update_query('video', changes, conditions)


def generate_video(video, request_headers):
    # prepare video file
    video_file = downloader('videos', video['video_id'])

    # parse query
    q_start, q_end = get_range(request_headers)
    if q_start is None:
        # querying whole file, send all bytes back
        response = Response(open(video_file, "rb"),
                            direct_passthrough=True)
    else:
        # querying range, send partial bytes back
        response = partial_response(video_file, q_start, q_end)

    return response


KB = 1024
MB = 1024 * KB
GB = 1024 * MB
BUFF_SIZE = 64 * KB


def partial_response(video_file, start, end=None):
    file_size = os.path.getsize(video_file)
    print('video {0} total size: {1}'.format(video_file, file_size))

    # get partial chunk offsets
    if end is None:
        end = start + BUFF_SIZE - 1
    end = min(end, file_size - 1)
    end = min(end, start + BUFF_SIZE - 1)
    chunk_length = end - start + 1
    print('sending data from bytes {} to {}'.format(start, end))

    # get chunk of data from file
    with open(video_file, 'rb') as vf_in:
        vf_in.seek(start)
        bytes_data = vf_in.read(chunk_length)
    assert len(bytes_data) == chunk_length

    response = Response(
        bytes_data,
        206,
        mimetype=mimetypes.guess_type(video_file)[0],
        direct_passthrough=True,
    )
    response.headers.add(
        'Content-Range', 'bytes {0}-{1}/{2}'.format(
            start, end, file_size,
        ),
    )
    response.headers.add(
        'Accept-Ranges', 'bytes'
    )
    return response


def get_range(request_headers):
    query_range = request_headers.get('Range', None)
    if query_range is None:
        return None, None

    print('Requested range: %s', query_range)
    m = re.match('bytes=(?P<start>\d+)-(?P<end>\d+)?', query_range)
    if m:
        start = m.group('start')
        end = m.group('end')
        start = int(start)
        if end is not None:
            end = int(end)
        return start, end
    else:
        return 0, None

def send_file_partial(file, filename):
    """
    Simple wrapper around send_file which handles HTTP 206 Partial Content
    :param file - io.BytesIO object
    :param filename
    :return - flask response object
    """
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_file(file, attachment_filename=filename, conditional=True)

    size = sys.getsizeof(file)
    byte1, byte2 = 0, None

    m = re.search('(\d+)-(\d*)', range_header)
    g = m.groups()

    if g[0]:
        byte1 = int(g[0])
    if g[1]:
        byte2 = int(g[1])

    length = size - byte1
    if byte2 is not None:
        length = byte2 - byte1 + 1

    file.seek(byte1)
    data = file.read(length)

    rv = Response(data,
                  206,
                  mimetype=mimetypes.guess_type(filename)[0],
                  direct_passthrough=True)  # "video/mp4",
    rv.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(byte1, byte1 + length - 1, size))
    rv.headers.add('Accept-Ranges', 'bytes')
    return rv

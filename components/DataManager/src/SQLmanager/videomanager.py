from ..DBconnectors.SQLconnector import run_single_query, run_all_query, update_query
from ..DBconnectors.MINIOconnector import make_bucket, uploader, downloader, remove_object, remove_bucket, save_frames
from ..util import check_input_manager
import os


def get_video(video):
    check_input_manager('video', video, ['video_id'])
    query = "SELECT * FROM video WHERE video_id='%s'" % (video['video_id'])
    print("Video %s is fetched!" % video['video_id'])
    return run_all_query(query)


def get_videos(video):
    check_input_manager('video', video, ['username'])
    query = "SELECT * FROM video WHERE username='%s'" % (video['username'])
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


def generate_video(video):
    downloader('videos', video['video_id'])
    with open(os.path.join('/data/tmp', video['video_id']), "rb") as f:
        for i in f:
            chunk = i
            yield chunk


if __name__ == "__main__":
    new_video = {'video_name': 'test123.avi', 'username': 'abcd', 'format': 'avi', 'fps': 0, 'num_frames': 0}
    add_video(new_video, os.path.join('/data/tmp', 'test.avi'))
    print(get_video(new_video))
    new_video = {'video_name': 'test123.avi', 'username': 'abcd', 'format': 'avi', 'fps': 10, 'num_frames': 5}
    update_video(new_video)
    print(get_video(new_video))
    del_video(new_video)
    print(get_video(new_video))

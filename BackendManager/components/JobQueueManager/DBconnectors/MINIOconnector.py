from minio import Minio
from minio.error import ResponseError
from configuration.config import MinioConfig
import os
import cv2
import datetime


def get_minio_client(api, access_key, secret_key):
    client = Minio(api, access_key=access_key, secret_key=secret_key, secure=False)
    return client


minio_client = get_minio_client(MinioConfig.host, MinioConfig.username, MinioConfig.pw)


def make_bucket(bucket_name):
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name, location="us-eastcv-1")
            return True
        else:
            return False
    except ResponseError as err:
        print(err)
        return None


def remove_bucket(bucket):
    objects = minio_client.list_objects(bucket, recursive=True)
    for obj in objects:
        name = obj.object_name.encode('utf-8')
        print(name)

        # Remove an object.
        try:
            minio_client.remove_object(bucket, name)
        except ResponseError as err:
            print(err)

    try:
        minio_client.remove_bucket(bucket)
        return True
    except ResponseError as err:
        print(err)
        return None


def get_objects(bucket_name):
    objects = minio_client.list_objects(bucket_name, recursive=True)
    return objects


def remove_object(bucket_name, object_name):
    # Remove an object.
    try:
        minio_client.remove_object(bucket_name, object_name)
    except ResponseError as err:
        print(err)


def uploader(bucket_name, name, local):
    try:
        make_bucket(bucket_name)
        minio_client.fput_object(bucket_name, name, local)
        print(name + ' is saved to minio')
        return True
    except ResponseError as err:
        print(err)
        return None


def downloader(bucket_name, local_full_filename):
    try:
        filename = os.path.basename(local_full_filename)
        minio_client.fget_object(bucket_name, filename, local_full_filename)
        return local_full_filename
    except ResponseError as err:
        print(err)
        return None


def downloader_multiple(bucket_name, local_name):

    objects = get_objects(bucket_name)
    # List all object paths in bucket that begin with given prefix.
    for obj in objects:
        name = obj.object_name.encode('utf-8')
        try:
            minio_client.fget_object(obj.bucket_name, name, '/tmp/' + local_name + '/' + name)
        except ResponseError as err:
            print(err)


def save_frames(bucket_name, fullpath_filename):
    make_bucket(bucket_name)

    vid = cv2.VideoCapture(fullpath_filename)
    fps = vid.get(cv2.CAP_PROP_FPS)

    success, image = vid.read()
    v_width = 0
    v_height = 0
    if image is not None:
        v_height, v_width, _ = image.shape
    count = 0
    tmp_folder = os.path.join('/tmp', 'tmpdata_'+datetime.datetime.now().isoformat())
    os.mkdir(tmp_folder)
    while success:
        img_name = "frame%d.jpg" % count
        local = os.path.join(tmp_folder, img_name)
        cv2.imwrite(local, image)  # save frame as JPEG file
        success, image = vid.read()
        count += 1
        try:
            minio_client.fput_object(bucket_name, img_name, local)
        except ResponseError as err:
            print(err)
            return None
    os.removedirs(tmp_folder)  # clean up frames

    return count, fps, v_width, v_height


if __name__ == "__main__":
    minio_client = get_minio_client(MinioConfig.host, MinioConfig.username, MinioConfig.pw)
    remove_bucket('job-1')


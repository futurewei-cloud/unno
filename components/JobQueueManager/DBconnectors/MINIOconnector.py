import glob
from minio import Minio
from minio.error import ResponseError
from configuration.config import MinioConfig, LocalConfig
import os
import json
import cv2


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


def uploader_multiple(bucket_name, local, file_type='.jpg'):
    path_to_test_images_dir = LocalConfig.dataset_dir + local

    if os.path.isdir(path_to_test_images_dir):
        test_image_paths = glob.glob(path_to_test_images_dir + '/*' + file_type)
    else:
        test_image_paths = [path_to_test_images_dir]

    test_image_paths.sort()

    for image_path in test_image_paths:

        name = image_path.split('/')[-1]
        print(name + ' is saved to minio')

        try:
            make_bucket(bucket_name)
            minio_client.fput_object(bucket_name, name, image_path)
        except ResponseError as err:
            print(err)


def downloader(bucket_name, file_name):
    try:
        minio_client.fget_object(bucket_name, file_name, os.path.join('/data/tmp', file_name))
    except ResponseError as err:
        print(err)


def downloader_multiple(bucket_name, local_name):

    objects = get_objects(bucket_name)
    # List all object paths in bucket that begin with my-prefixname.
    for obj in objects:
        # print(obj.bucket_name, obj.object_name.encode('utf-8'), obj.last_modified,
        # obj.etag, obj.size, obj.content_type)
        # Get a full object and prints the original object stat information.
        obj_name = obj.object_name.encode('utf-8')
        try:
            minio_client.fget_object(obj.bucket_name, obj_name,
                                     os.path.join('/data/tmp/frames', local_name, obj.object_name))
        except ResponseError as err:
            print(err)


def get_dataset(ds_num):
    path = LocalConfig.dataset_dir + 'tmp/' + ds_num
    if not os.path.exists(path):
        os.makedirs(path)
        downloader_multiple(ds_num, ds_num)


def save_results(bucket_name, file_name, results):
    bucket_name = 'job-' + bucket_name
    path = 'tmp/results/'
    if not os.path.exists(LocalConfig.dataset_dir + path + bucket_name):
        os.makedirs(LocalConfig.dataset_dir + path + bucket_name)
    file = path + bucket_name + '/' + file_name + '.json'
    print(LocalConfig.dataset_dir + file)
    with open(LocalConfig.dataset_dir + file, 'w') as fp:
        json.dump(results, fp)

    uploader(minio_client, bucket_name, file)


def save_frames(bucket_name, file_name):
    make_bucket(bucket_name)

    vid = cv2.VideoCapture(os.path.join('/data/tmp', file_name))
    success, image = vid.read()
    count = 0
    while success:
        img_name = "frame%d.jpg" % count
        local = os.path.join('/data/tmp', img_name)
        cv2.imwrite(local, image)  # save frame as JPEG file
        success, image = vid.read()
        count += 1
        try:
            minio_client.fput_object(bucket_name, img_name, local)
        except ResponseError as err:
            print(err)
            return None

    return True


if __name__ == "__main__":
    minio_client = get_minio_client(MinioConfig.host, MinioConfig.username, MinioConfig.pw)
    remove_bucket('job-1')
    # make_bucket(minioClient)
    # uploader(minioClient, '1-10', 'val2017')
    # downloader(minioClient)

from flask import Flask, stream_with_context, Response, request, redirect, url_for, render_template, jsonify
from .SQLmanager.videomanager import add_video, generate_video, get_videos, del_video, update_video
from .SQLmanager.annotationmanager import add_annotation, get_annotation, get_annotations, \
    del_annotation, update_annotation
from .SQLmanager.resultmanager import add_result, add_results, get_results, del_result, update_result
from .SQLmanager.usermanager import add_user, get_user, del_user, update_user
import os
import json
from flask_cors import CORS


ALLOWED_EXTENSIONS = {'avi', 'mp4'}
app = Flask(__name__)
app.secret_key = "super secret key"
CORS(app)


@app.after_request
def after_request(response):
    response.headers.add('Accept-Ranges', 'bytes')
    return response


@app.route("/api/v1/upload")
def upload():
    return render_template('upload.html')


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def check_input_api(d, lst):
    for l in lst:
        if l not in d:
            response = app.response_class(
                response="%s is needed" % l,
                status=500,
            )
            return response

    return None


@app.route('/api/v1/video', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def video_call():
    if request.method == 'POST':
        if 'file' not in request.files:
            print('No file part')
            return redirect(request.url)
        file = request.files['file']
        file_name = file.filename
        if file_name == '':
            print('No selected file')
            return redirect(request.url)
        if file and allowed_file(file_name):
            file.save(os.path.join('/data/tmp', file_name))
            username = request.form['user']
            video_format = file_name.split('.')[-1]
            video_id = request.form['video'] + '.' + video_format if len(request.form['video']) > 0 else file_name
            video = {'video_name': video_id, 'username': username,
                     'format': video_format, 'length': 0, 'num_frames': 0}
            add_video(video, file_name)

            response = app.response_class(
                response="Video was uploaded successfully",
                status=200,
            )
            return response
        print('Not a file or file name not allowed.')
        return redirect(url_for('upload'))

    elif request.method == 'PATCH':
        if not request.args or check_input_api(request.args, ['video_id']) is not None:
            response = app.response_class(
                response="Modify videos unsuccessfully",
                status=500,
            )
            return response
        video = {}
        for k, v in request.args.items():
            video[k] = v
        update_video(video)
        response = app.response_class(
            response="Video was modified successfully",
            status=200,
        )
        return response

    elif request.method == 'GET':
        if not request.args:
            response = app.response_class(
                response="Get videos unsuccessfully",
                status=500,
            )
            return response

        if 'video_id' in request.args:
            video_id = 'video-' + str(request.args['video_id'])
            video = {'video_id': video_id}
            return Response(stream_with_context(generate_video(video)), mimetype="video/mp4")
        elif 'username' in request.args:
            video = {'username': request.args['username']}
            return json.dumps(get_videos(video), indent=4, sort_keys=True, default=str)
        else:
            response = app.response_class(
                response="Get videos unsuccessfully",
                status=500,
            )
            return response

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['video_id']) is not None:
            response = app.response_class(
                response="Video was deleted unsuccessfully",
                status=500,
            )
            return response

        video_id = request.args['video_id']
        video = {'video_id': video_id}
        del_video(video)
        response = app.response_class(
            response="Video was deleted successfully",
            status=200,
        )
        return response


@app.route('/api/v1/job', methods=['GET', 'POST', 'DELETE'])
def job_call():
    if request.method == 'POST':
        annotation = json.loads(request.data)
        if not annotation or check_input_api(annotation, ['username', 'entity_id', 'video_id',
                                                          'bbox', 'start_frame', 'end_frame']) is not None:
            response = app.response_class(
                response="Insert job failed!",
                status=500,
            )
            return response

        if add_annotation(annotation):
            response = app.response_class(
                response="Job is queued successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Insert job failed!",
                status=500,
            )
        return response

    elif request.method == 'PATCH':
        if not request.args or check_input_api(request.args, ['job_id']) is not None:
            response = app.response_class(
                response="Modify videos unsuccessfully",
                status=500,
            )
            return response
        job = {}
        for k, v in request.args.items():
            job[k] = v
        update_annotation(job)
        response = app.response_class(
            response="Video was modified successfully",
            status=200,
        )
        return response

    elif request.method == 'GET':
        if not request.args or check_input_api(request.args, ['username']) is not None \
                or check_input_api(request.args, ['job_id']) is not None:
            response = app.response_class(
                response="Get jobs unsuccessfully",
                status=500,
            )
            return response

        if 'username' in request.args:
            job = {'username': request.args['username']}
            return jsonify({'jobs': get_annotations(job)})
        elif 'job_id' in request.args:
            job = {'job_id': request.args['job_id']}
            return jsonify({'jobs': get_annotation(job)})

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['username', 'job_name']) is not None:
            response = app.response_class(
                response="Job was deleted unsuccessfully",
                status=500,
            )
            return response

        job_name = request.args['job_name']
        if len(job_name) > 0:
            job = {'job_name': job_name, 'username': request.args['username']}
            del_annotation(job)
            response = app.response_class(
                response="Job was deleted successfully",
                status=200,
            )
            return response

        response = app.response_class(
            response="Job was deleted unsuccessfully",
            status=500,
        )
        return response


@app.route('/api/v1/user', methods=['GET', 'POST', 'DELETE'])
def user_call():
    if request.method == 'POST':
        user = json.loads(request.data)
        if not user or check_input_api(user, ['username', 'password', 'role']) is not None:
            response = app.response_class(
                response="Adding user failed!",
                status=500,
            )
            return response

        if add_user(user):
            response = app.response_class(
                response="Adding user successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Adding user failed!",
                status=500,
            )
        return response

    elif request.method == 'GET':
        if not request.args or check_input_api(request.args, ['username']) is not None:
            response = app.response_class(
                response="Get jobs unsuccessfully",
                status=500,
            )
            return response

        user = {'username': request.args['username']}
        return jsonify({'jobs': get_user(user)})

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['username']) is not None:
            response = app.response_class(
                response="Job was deleted unsuccessfully",
                status=500,
            )
            return response

        user_name = request.args['username']
        if len(user_name) > 0:
            user = {'username': user_name}
            del_user(user)
            response = app.response_class(
                response="User was deleted successfully",
                status=200,
            )
            return response

        response = app.response_class(
            response="User was deleted unsuccessfully",
            status=500,
        )
        return response


@app.route('/api/v1/result', methods=['GET', 'POST', 'DELETE'])
def result_call():
    if request.method == 'POST':
        print(request.data)
        results = request.json
        if not results or check_input_api(results, ['job_id', 'video_id',
                                                    'entity_id', 'username']) is not None:
            response = app.response_class(
                response="Insert result failed!",
                status=500,
            )
            return response

        if 'tracking_results' in results and add_results(results):
            response = app.response_class(
                response="Add results successfully",
                status=200,
            )
        elif 'frame_num' in results and 'status' in results and add_result(results):
            response = app.response_class(
                response="add result successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Insert result failed!",
                status=500,
            )
        return response

    elif request.method == 'GET':
        r = request.args
        if not r or (check_input_api(r, ['result_id']) is not None and check_input_api(r, ['video_id']) is not None):
            response = app.response_class(
                response="Get jobs unsuccessfully",
                status=500,
            )
            return response

        result = {}
        if 'result_id' in r:
            result['result_id'] = r['result_id']
        if 'video_id' in r:
            result['video_id'] = r['video_id']
        if 'job_id' in r:
            result['job_id'] = r['job_id']
        if 'entity_id' in r:
            result['entity_id'] = r['entity_id']
        if 'frame_num' in r:
            result['frame_num'] = r['frame_num']

        return jsonify({'results': get_results(result)})

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['result_id']) is not None \
                or check_input_api(request.args, ['video_id']) is not None:
            response = app.response_class(
                response="Job was deleted unsuccessfully",
                status=500,
            )
            return response

        result = request.args
        if del_result(result):
            response = app.response_class(
                response="User was deleted successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="User was deleted unsuccessfully",
                status=500,
            )

        return response


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5011, debug=True)

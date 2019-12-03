from flask import Flask, stream_with_context, Response, request, redirect, url_for, render_template, jsonify
from SQLmanager.VideoManager import add_video, generate_video, get_videos, del_video, update_video
from SQLmanager.JobManager import add_job, get_job, get_jobs, del_job, update_job
from SQLmanager.AnnotationManager import add_annotation, add_annotations, get_annotations, del_annotation, update_annotation
from SQLmanager.CategoryManager import add_category, get_category, get_categoris, del_category, update_category
from SQLmanager.UserManager import add_user, get_user, del_user, update_user
from SQLmanager.EntityManager import add_entity, get_entities, get_entity, del_entity, update_entity
import os
import json
from flask_cors import CORS


ALLOWED_EXTENSIONS = {'avi', 'mp4'}
app = Flask(__name__)
app.secret_key = "super secret key"
CORS(app)


@app.route('/')
def index():
    return "Hello from Data Manager!"


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
        video_file = request.files['file']
        file_name = video_file.filename
        if file_name == '':
            print('No selected file')
            return redirect(request.url)
        if video_file and allowed_file(file_name):
            local_tmp_file = os.path.join('/tmp', file_name)
            video_file.save(local_tmp_file)
            username = request.form['user']
            video_format = file_name.splitext()[-1]
            video_id = request.form['video'] + '.' + video_format if len(request.form['video']) > 0 else file_name
            video = {'video_name': video_id, 'username': username,
                     'format': video_format, 'length': 0, 'num_frames': 0}
            tmp_id = add_video(video, local_tmp_file)
            os.remove(local_tmp_file)  # clean up uploaded file

            response = app.response_class(
                json.dumps({'video_id': tmp_id}),
                status=200,
            )
            return response
        print('Not a file or file name not allowed.')
        return redirect(url_for('upload'))

    elif request.method == 'PATCH':
        if not request.args or check_input_api(request.args, ['video_id']) is not None:
            response = app.response_class(
                response="Modify videos failed",
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
                response="Get videos failed",
                status=500,
            )
            return response

        if 'video_id' in request.args:
            video_id = 'video-' + str(request.args['video_id'])
            video = {'video_id': video_id}
            return generate_video(video, request.headers)
        elif 'username' in request.args:
            video = {'username': request.args['username']}
            return json.dumps(get_videos(video), indent=4, sort_keys=True, default=str)
        else:
            response = app.response_class(
                response="Get videos failed",
                status=500,
            )
            return response

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['video_id']) is not None:
            response = app.response_class(
                response="Delete video failed",
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


#@app.route('/api/v1/job', methods=['GET', 'POST', 'DELETE'])
@app.route('/api/v1/job', methods=['GET', 'POST'])  # disable delete at this time
def job_call():
    if request.method == 'POST':
        job = request.json
        if not job or check_input_api(job, ['start_frame', 'end_frame', 'annotation_id']) is not None:
            response = app.response_class(
                response="Insert job query is not valid!",
                status=500,
            )
            return response

        # get annotation details to generate job
        annotation = {'annotation_id': job.pop('annotation_id')}
        annotation = get_annotations(annotation)[0]
        job['username'] = annotation['username']
        job['entity_id'] = annotation['entity_id']
        job['video_id'] = annotation['video_id']
        job['bbox'] = annotation['bbox']

        # create new job
        job_id = add_job(job)
        if job_id:
            response = app.response_class(
                json.dumps({'job_id': job_id}),
                status=200,
            )
            # update job_id in corresponding annotation info
            annotation_update = {'job_id': job_id, 'annotation_id': annotation['annotation_id']}
            if update_annotation(annotation_update) is not None:
                return response

        response = app.response_class(
            response="Insert job failed!",
            status=500,
        )
        return response

    elif request.method == 'PATCH':
        if not request.args or check_input_api(request.args, ['job_id']) is not None:
            response = app.response_class(
                response="Modify job failed",
                status=500,
            )
            return response
        job = {}
        for k, v in request.args.items():
            job[k] = v
        update_job(job)
        response = app.response_class(
            response="Job was modified successfully",
            status=200,
        )
        return response

    elif request.method == 'GET':
        if not request.args or (check_input_api(request.args, ['video_id']) is not None
                                and check_input_api(request.args, ['job_id']) is not None):
            response = app.response_class(
                response="Get jobs failed",
                status=500,
            )
            return response

        if 'video_id' in request.args:
            job = {'video_id': request.args['video_id']}
            return jsonify({'jobs': get_jobs(job)})
        elif 'job_id' in request.args:
            job = {'job_id': request.args['job_id']}
            return jsonify({'jobs': get_job(job)})

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['username', 'job_id']) is not None:
            response = app.response_class(
                response="Delete job query is not valid",
                status=500,
            )
            return response

        job_id = int(request.args['job_id'])
        if job_id >= 0:
            job = {'job_id': job_id, 'username': request.args['username']}
            del_job(job)
            response = app.response_class(
                response="Job was deleted successfully",
                status=200,
            )
            return response

        response = app.response_class(
            response="Delete job failed",
            status=500,
        )
        return response


@app.route('/api/v1/user', methods=['GET', 'POST', 'DELETE'])
def user_call():
    if request.method == 'POST':
        user = request.json
        if not user or check_input_api(user, ['username', 'password', 'role']) is not None:
            response = app.response_class(
                response="Add user failed!",
                status=500,
            )
            return response

        user_id = add_user(user)
        if user_id:
            response = app.response_class(
                json.dumps({'user_id': user_id}),
                status=200,
            )
        else:
            response = app.response_class(
                response="Add user failed!",
                status=500,
            )
        return response

    elif request.method == 'GET':
        if not request.args or check_input_api(request.args, ['username']) is not None:
            response = app.response_class(
                response="Get user failed",
                status=500,
            )
            return response

        user = {'username': request.args['username']}
        return jsonify({'jobs': get_user(user)})

    elif request.method == 'DELETE':
        if not request.args or check_input_api(request.args, ['username']) is not None:
            response = app.response_class(
                response="Delete user query is not valid",
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
            response="Delete user failed",
            status=500,
        )
        return response


@app.route('/api/v1/annotation', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def annotation_call():
    if request.method == 'POST':
        print(request.data)
        annotations = request.json
        if not annotations or check_input_api(annotations, ['video_id', 'entity_id', 'username']) is not None:
            response = app.response_class(
                response="Insert annotation failed!",
                status=500,
            )
            return response

        if 'tracking_results' in annotations and add_annotations(annotations):
            response = app.response_class(
                response="Add annotations successfully",
                status=200,
            )
            return response
        elif 'frame_num' in annotations and 'status' in annotations:
            anno_id = add_annotation(annotations)
            if anno_id:
                response = app.response_class(
                    json.dumps({'annotation_id': anno_id}),
                    status=200,
                )
                return response
        response = app.response_class(
            response="Insert annotation failed!",
            status=500,
        )
        return response

    elif request.method == 'GET':
        annotation = request.args
        if not annotation or (check_input_api(annotation, ['annotation_id']) is not None and
                              check_input_api(annotation, ['video_id']) is not None):
            response = app.response_class(
                response="Get annotation failed",
                status=500,
            )
            return response

        annotation_meta = {}
        if 'annotation_id' in annotation:
            annotation_meta['annotation_id'] = annotation['annotation_id']
        if 'video_id' in annotation:
            annotation_meta['video_id'] = annotation['video_id']
        if 'job_id' in annotation:
            annotation_meta['job_id'] = annotation['job_id']
        if 'entity_id' in annotation:
            annotation_meta['entity_id'] = annotation['entity_id']
        if 'frame_num' in annotation:
            annotation_meta['frame_num'] = annotation['frame_num']
        if 'cat_id' in annotation:
            annotation_meta['cat_id'] = annotation['cat_id']

        return jsonify({'annotations': get_annotations(annotation_meta)})

    elif request.method == 'PATCH':
        if not request.args or check_input_api(request.args, ['annotation_id']) is not None:
            response = app.response_class(
                response="Modify annotation query is not valid",
                status=500,
            )
            return response
        annotation = {}
        for k, v in request.args.items():
            annotation[k] = v

        # assure correct job_id for user generated annotation
        if 'status' in annotation and annotation['status'] == 'user':
            if 'job_id' not in annotation:
                annotation['job_id'] = None

        if update_annotation(annotation) is not None:
            response = app.response_class(
                response="Annotation was modified successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Modify annotation failed",
                status=500,
            )
        return response

    elif request.method == 'DELETE':
        if not request.args or (check_input_api(request.args, ['annotation_id']) is not None
                                and check_input_api(request.args, ['video_id']) is not None):
            response = app.response_class(
                response="Delete annotation query is not valid",
                status=500,
            )
            return response

        annotation = request.args
        if del_annotation(annotation) is not None:
            response = app.response_class(
                response="Annotation was deleted successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Delete annotation failed",
                status=500,
            )

        return response


@app.route('/api/v1/category', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def category_call():
    if request.method == 'POST':
        cat = request.json
        if not cat or check_input_api(cat, ['name']) is not None:
            response = app.response_class(
                response="Insert category failed!",
                status=500,
            )
            return response

        cat_id = add_category(cat)
        if cat_id:
            response = app.response_class(
                json.dumps({'cat_id': cat_id}),
                status=200,
            )
            return response
        else:
            response = app.response_class(
                response="Insert category failed!",
                status=500,
            )
        return response

    elif request.method == 'GET':
        r = request.args
        if not r:
            return jsonify({'category': get_categoris()})
        if check_input_api(r, ['cat_id']) is None:
            return jsonify({'category': get_category(r['cat_id'])})
        if check_input_api(r, ['sup_cat_name']) is None:
            return jsonify({'category': get_categoris(sup_cat=r['sup_cat_name'])})

        response = app.response_class(
            response="Get category failed!",
            status=500,
        )
        return response

    elif request.method == 'PATCH':
        cat = request.json
        if not cat or check_input_api(cat, ['cat_id']) is not None:
            response = app.response_class(
                response="Modify category query is not valid",
                status=500,
            )
            return response

        if update_category(cat) is not None:
            response = app.response_class(
                response="Category was modified successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Modify category failed",
                status=500,
            )
        return response

    elif request.method == 'DELETE':
        if not request.args or (check_input_api(request.args, ['cat_id']) is not None
                                and check_input_api(request.args, ['name']) is not None
                                and check_input_api(request.args, ['sup_cat_name']) is not None):
            response = app.response_class(
                response="Category DELETE query is not valid",
                status=500,
            )
            return response

        cat = request.args
        if del_category(cat) is not None:
            response = app.response_class(
                response="Category was deleted successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Delete category failed",
                status=500,
            )

        return response


@app.route('/api/v1/entity', methods=['GET', 'POST', 'DELETE', 'PATCH'])
def entity_call():
    if request.method == 'POST':
        entity = request.json
        if not entity or check_input_api(entity, ['video_id']) is not None:
            response = app.response_class(
                response="New entity generation failed! video_id not provided",
                status=500,
            )
            return response

        entity_id = add_entity(entity['video_id'])
        if entity_id:
            response = app.response_class(
                json.dumps({'entity_id': entity_id}),
                status=200,
            )
            return response
        else:
            response = app.response_class(
                response="New entity generation failed! Internal error",
                status=500,
            )
        return response

    elif request.method == 'GET':
        r = request.args
        if not r or check_input_api(r, ['video_id']) is not None:
            response = app.response_class(
                response="Get entity failed! video_id not provided",
                status=500,
            )
            return response
        else:
            return jsonify({'entity': get_entities(r['video_id'])})

    elif request.method == 'PATCH':
        entity = request.json
        if not entity or check_input_api(entity, ['entity_id']) is not None:
            response = app.response_class(
                response="Modify entity query is not valid",
                status=500,
            )
            return response

        if update_entity(entity) is not None:
            response = app.response_class(
                response="Entity was modified successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Modify entity failed",
                status=500,
            )
        return response

    elif request.method == 'DELETE':
        if not request.args or (check_input_api(request.args, ['entity_id']) is not None
                                and check_input_api(request.args, ['video_id']) is not None):
            response = app.response_class(
                response="Entity DELETE query is not valid",
                status=500,
            )
            return response

        entity = request.args
        if del_entity(entity) is not None:
            response = app.response_class(
                response="Entity was deleted successfully",
                status=200,
            )
        else:
            response = app.response_class(
                response="Delete entity failed",
                status=500,
            )

        return response


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5011, debug=True)

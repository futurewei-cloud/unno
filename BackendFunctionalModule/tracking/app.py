#!/usr/bin/python
from os import path as osp
from flask import Flask, jsonify, request, abort
from tracker import SOTTracker
import requests
import json

# init the server
app = Flask('tracking')


# function module configuration
data_root = '/data'
service_port = 8899
TIMEOUT_SEC = 2  # time-out in seconds for sending out results
RETRY = 3  # re-try times for sending out results

# tracker parameters
config_file = '/app/pysot/experiments/siamrpn_mobilev2_l234_dwxcorr/config.yaml'
model_file = '/app/pysot/experiments/siamrpn_mobilev2_l234_dwxcorr/model.pth'
tracker = SOTTracker(config_file, model_file)


@app.route('/')
def index():
    return "Hello from Tracking Module!"


@app.route('/mirror', methods=['POST'])
def mirror():
    """ simple returns what sent in request for testing.

    :return: request.json
    """
    return jsonify(request.json), 200


@app.route('/tracking/api/sot', methods=['POST'])
def sot_tracking():
    """ the core API for tracking

    input query json format:
    {
        'job_id': int, 
        'video_id': int, 
        'entity_id': int, 
        'bbox': '0.645833333333,0.388888888889,0.25,0.333333333333',
        'start_frame': int, 
        'end_frame': int, 
        'result_api': END_POINT
    }
    note: img_file should be relative path to data_root

    :return: tracking results in single json blob with format of
    {
        'job_id': int, 
        'video_id': int, 
        'entity_id': int, 
        'tracking_results': 
        {
            'frame_id': '0.645833333333, 0.388888888889, 0.25, 0.333333333333',...
        }
    },
    and POST the results to result endpoint for saving.
    """

    try:
        # parse query info
        video_id = request.json['video_id']
        save_result_api = request.json['result_api']

        data_path = osp.join(data_root, 'video-' + str(video_id))
        init_img = osp.join(data_path, 'frame' + str(request.json['start_frame']) +'.jpg')
        init_bbox = [float(_) for _ in request.json['bbox'].split(',')]
        imglist_to_track = [osp.join(data_path, 'frame' + str(_) + '.jpg') 
                            for _ in range(request.json['start_frame'] + 1, 
                                request.json['end_frame'])]
    except KeyError:
        abort(400)

    # check data validity
    for img_file in imglist_to_track:
        if not osp.exists(img_file):
            abort(400, 'image to track not available')
    if not osp.exists(init_img):
        abort(400, 'init image not available')

    results = tracker.tracking(init_img, init_bbox, imglist_to_track)

    # generate response json
    response = request.json.copy()  # keep all query info in the response
    tracking_results = {osp.basename(k).split('frame')[1].split('.')[0]: ','.join(map(str, v['bbox']))
                        for k, v in results.items()}
    response['tracking_results'] = tracking_results

    # post result to saving api
    retry_num = RETRY
    headers = {'content-type': 'application/json'}
    r = None
    while retry_num > 0:
        try:
            r = requests.post(url=save_result_api, data=json.dumps(response), headers=headers, timeout=TIMEOUT_SEC)
        except requests.Timeout:
            # sending results timeout, re-try
            retry_num -= 1
            continue
        except requests.ConnectionError:
            # target api is down, re-try
            retry_num -= 1
            continue
        if r.status_code != requests.codes.ok:
            # sending results failed, re-try
            retry_num -= 1
            continue
        else:
            break

    if r is None:
        return 'saving tracking result failed, saving service is not responding...'
    elif r.status_code != requests.codes.ok:
        return 'saving tracking result failed', r.status_code

    return jsonify(response), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=service_port, debug=False)

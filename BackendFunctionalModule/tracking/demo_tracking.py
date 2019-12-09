from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import os
import argparse
import json

from tracker import SOTTracker

# torch.set_num_threads(1)


if __name__ == '__main__':
    # tracker parameters
    config_file = './experiments/siamrpn_mobilev2_l234_dwxcorr/config.yaml'
    model_file = './experiments/siamrpn_mobilev2_l234_dwxcorr/model.pth'

    tracker = SOTTracker(config_file, model_file)

    init_img = './demo/bag/0001.jpg'
    init_roi = [310, 140, 120, 120]
    tracking_imgs = ['./demo/bag/0050.jpg', './demo/bag/0100.jpg']

    query_json = json.dumps({'init_img': init_img,
                             'init_bbox': init_roi,
                             'imglist_to_track': tracking_imgs})

    results = tracker.tracking(init_img, init_roi, tracking_imgs)
    print(SOTTracker.result2json(results))

    results = tracker.tracking_json_query(query_json)
    print(SOTTracker.result2json(results))

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

import cv2
import torch
import json
import numpy as np

from pysot.core.config import cfg
from pysot.models.model_builder import ModelBuilder
from pysot.tracker.tracker_builder import build_tracker


class SOTTracker:

    def __init__(self, config_file, model_file):
        self.config_file = config_file
        self.model_file = model_file

        # load config
        cfg.merge_from_file(self.config_file)
        cfg.CUDA = torch.cuda.is_available()
        self.device = torch.device('cuda' if cfg.CUDA else 'cpu')

        # load model
        self.model = ModelBuilder()
        self.model.load_state_dict(torch.load(model_file, map_location=lambda storage, loc: storage.cpu()))
        self.model.eval().to(self.device)

        # build tracker
        self.tracker = build_tracker(self.model)

    def tracking(self, init_img, init_bbox, imglist_to_track):
        # init tracker
        init_frame = cv2.imread(init_img)
        height, width, channels = init_frame.shape
        # convert bbox from relative coordinates to actual values
        init_bbox_coord = [int(init_bbox[0] * width), int(init_bbox[1] * height),
                           int(init_bbox[2] * width), int(init_bbox[3] * height)]
        self.tracker.init(init_frame, init_bbox_coord)

        # do tracking
        results = {_: {'polygon': None, 'mask': None, 'bbox': None} for _ in imglist_to_track}
        for img in imglist_to_track:
            frame = cv2.imread(img)
            outputs = self.tracker.track(frame)
            if 'polygon' in outputs:
                polygon = np.array(outputs['polygon']).astype(np.int32)
                results[img]['polygon'] = [polygon.reshape((-1, 1, 2))]
                results[img]['mask'] = outputs['mask']

            if 'bbox' in outputs:
                bbox = list(map(float, outputs['bbox']))
                results[img]['bbox'] = [bbox[0] / width, bbox[1] / height,
                                        bbox[2] / width, bbox[3] / height]
        return results

    def tracking_json_query(self, query_json):
        query = json.loads(query_json)
        try:
            init_img = query['init_img']
            init_bbox = [int(_) for _ in query['init_bbox']]
            imglist_to_track = query['imglist_to_track']
            assert len(imglist_to_track) > 0
            return self.tracking(init_img, init_bbox, imglist_to_track)
        except KeyError:
            print('invalid query json')
            return None

    @staticmethod
    def result2json(results):
        json_string = json.dumps(results)
        return json_string

    @staticmethod
    def vis_tracking_result(img_file, result):
        vis_frame = cv2.imread(img_file)
        height, width, channels = vis_frame.shape
        if result['polygon'] is not None:
            cv2.polylines(vis_frame, result['polygon'], True, (0, 255, 0), 3)
            mask = ((result['mask'] > cfg.TRACK.MASK_THERSHOLD) * 255)
            mask = mask.astype(np.uint8)
            mask = np.stack([mask, mask * 255, mask]).transpose(1, 2, 0)
            vis_frame = cv2.addWeighted(vis_frame, 0.77, mask, 0.23, -1)
        elif result['bbox'] is not None:
            bbox = result['bbox']
            cv2.rectangle(vis_frame, (int(bbox[0] * width), int(bbox[1] * height)),
                          (int((bbox[0] + bbox[2]) * width), int((bbox[1] + bbox[3]) * height)),
                          (0, 255, 0), 3)
        return vis_frame

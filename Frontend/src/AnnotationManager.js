import { throttle } from 'async-agent';
import { softDelete } from 'hafgufa';
import { Collection, List } from 'hord';
import { pull } from 'object-agent';
import { applySettings, method, Point } from 'type-enforcer';
import api from './api';

const JOB_CHECK_DELAY = 2000;

const boundsFromBbox = (bbox) => {
	bbox = bbox.split(',').map(parseFloat);

	return [new Point(bbox[0], bbox[1]), new Point(bbox[0] + bbox[2], bbox[1] + bbox[3])];
};

const bboxFromBounds = (bounds) => {
	return [bounds[0].x, bounds[0].y, bounds[1].x - bounds[0].x, bounds[1].y - bounds[0].y].join(',');
};

const ANNOTATIONS = Symbol();
const JOBS = Symbol();

const checkJobs = Symbol();
const getAnnotations = Symbol();
const logEntitiesChange = Symbol();

export default class AnnotationManager {
	constructor(settings) {
		const self = this;

		self[ANNOTATIONS] = new Collection();
		self[JOBS] = [];

		applySettings(self, settings);
	}

	[getAnnotations]() {
		const self = this;

		return api.getAnnotations(self.videoId())
			.then((results) => {
				self[ANNOTATIONS] = results;
				self.onLoad()();
				self.onChange()();
			});
	}

	[logEntitiesChange]() {
		const self = this;

		self.onChange()();
		self.onEntitiesChange()(new List(pull(self[ANNOTATIONS], 'entityId')).unique().length);
	}

	add(frame, bounds, id) {
		const self = this;
		const annotation = {
			frame: frame,
			bbox: bboxFromBounds(bounds),
			entityId: Math.round(Math.random() * 10000),
			localId: id,
			jobId: null
		};

		self[ANNOTATIONS].push(annotation);
		self[logEntitiesChange]();

		if (self.videoId()) {
			api.addAnnotation(self.videoId(), annotation.frame, annotation.entityId, annotation.bbox)
				.then((resultId) => {
					annotation.resultId = resultId;
					self.onChange()();
				});
		}
	}

	changeBounds(id, bounds) {
		const self = this;

		self[ANNOTATIONS].some((annotation) => {
			if (annotation.resultId === parseInt(id) || annotation.localId === id) {
				annotation.bbox = bboxFromBounds(bounds);

				if (annotation.resultId) {
					api.patchAnnotation(self.videoId(), annotation.resultId, annotation.bbox);
				}

				return true;
			}
		});
	}

	getAnnotationsForFrame(frame) {
		return this[ANNOTATIONS]
			.filter((annotation) => annotation.frame === frame)
			.map((annotation) => {
				return {
					...annotation,
					id: annotation.resultId ? annotation.resultId.toString() : annotation.localId,
					bounds: boundsFromBbox(annotation.bbox)
				};
			});
	}

	delete(resultId) {
		const self = this;

		softDelete({
			title: 'Annotation deleted',
			value: self[ANNOTATIONS].find({resultId: resultId}),
			onDo() {
				self[ANNOTATIONS] = self[ANNOTATIONS].filter({resultId: {$ne: resultId}});
				self[logEntitiesChange]();
			},
			onUndo(value) {
				self[ANNOTATIONS].push(value);
				self[logEntitiesChange]();
			},
			onCommit() {
				api.deleteAnnotation(resultId);
			}
		});
	}

	deleteAll() {
		const self = this;

		softDelete({
			title: 'All annotations deleted',
			value: self[ANNOTATIONS],
			onDo() {
				self[ANNOTATIONS].length = 0;
				self[logEntitiesChange]();
			},
			onUndo(value) {
				self[ANNOTATIONS] = value;
				self[logEntitiesChange]();
			},
			onCommit() {
				api.deleteAnnotations(self.videoId());
			}
		});
	}

	predict(annotation) {
		const self = this;

		api.addAnnotationJob(annotation.frame, annotation.frame + 60, annotation.resultId)
			.then((jobId) => {
				if (jobId) {
					self[JOBS].push({
						id: jobId,
						status: 'new'
					});

					self[checkJobs]();
				}
			});
	}
}

Object.assign(AnnotationManager.prototype, {
	[checkJobs]: throttle(function() {
		const self = this;

		self[JOBS].forEach((job) => {
			api.getAnnotationJob(job.id)
				.then((results) => {
					results = results[0];

					if (results.status !== job.status) {
						job.status = results.status;
					}

					if (results.status === 'done') {
						self[getAnnotations]();

						self[JOBS] = self[JOBS].filter((item) => {
							item.id !== job.id;
						});
					}

					self[checkJobs]();
				});
		});
	}, JOB_CHECK_DELAY, {
		leading: false
	}),
	videoId: method.string({
		set(videoId) {
			const self = this;

			self[ANNOTATIONS].length = 0;
			self.onChange()();

			self[getAnnotations]()
				.then(() => {
					return api.getAnnotationJobs(videoId);
				})
				.then((results) => {
					self[JOBS] = results.filter((job) => job.status !== 'done');
					self[checkJobs]();
				});
		}
	}),
	onLoad: method.function(),
	onChange: method.function(),
	onEntitiesChange: method.function()
});

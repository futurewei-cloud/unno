import { throttle } from 'async-agent';
import FileSaver from 'file-saver';
import { softDelete } from 'hafgufa';
import { Collection, compare } from 'hord';
import { forOwn } from 'object-agent';
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
const CATEGORIES = Symbol();
const ENTITIES = Symbol();
const JOBS = Symbol();

const getAnnotation = Symbol();
const getEntity = Symbol();
const checkJobs = Symbol();
const getAnnotations = Symbol();
const logEntitiesChange = Symbol();
const cleanEntities = Symbol();

export default class AnnotationManager {
	constructor(settings) {
		const self = this;

		self[ANNOTATIONS] = new Collection()
			.model({
				id: {
					type: String,
					index: true
				},
				localId: {
					type: String,
					index: true
				},
				entityId: {
					type: String,
					index: true
				},
				'*': '*'
			});
		self[ENTITIES] = new Collection()
			.model({
				id: {
					type: String,
					index: true
				},
				category: {
					type: [String, null],
					index: true
				},
				name: [String, null],
				videoId: String
			});
		self[JOBS] = [];

		applySettings(self, settings);
	}

	[getAnnotations]() {
		const self = this;

		return api.getAnnotations(self.videoId())
			.then((results) => {
				self[ANNOTATIONS].length = 0;
				self[ANNOTATIONS] = self[ANNOTATIONS].concat(results);
				self.onLoad().trigger();
				self.onChange().trigger();
			});
	}

	[getAnnotation](id) {
		return this[ANNOTATIONS].find({id: id}) || this[ANNOTATIONS].find({localId: id});
	}

	[getEntity](id) {
		return this[ENTITIES].find({id: id});
	}

	[logEntitiesChange]() {
		const self = this;

		self.onChange().trigger();
		self.onEntitiesChange().trigger(null, [self[ENTITIES]]);
	}

	[cleanEntities]() {
		const self = this;
		const abandonedEntities = [];

		self[ENTITIES].forEach((entity) => {
			if (!self[ANNOTATIONS].find({entityId: entity.id})) {
				abandonedEntities.push(entity.id);
			}
		});

		abandonedEntities.forEach((id) => {
			api.deleteEntity(id);
			self[ENTITIES].splice(self[ENTITIES].indexOf({id: id}), 1);
		});
	}

	add(frame, bounds, id) {
		const self = this;
		let annotation;

		if (self.videoId()) {
			api.addEntity(self.videoId())
				.then((entityId) => {
					self[ENTITIES].push({
						id: entityId,
						videoId: self.videoId(),
						name: null,
						category: '0'
					});
					self[ENTITIES].sort(compare('name', 'id'));

					annotation = {
						frame: frame,
						bbox: bboxFromBounds(bounds),
						entityId: entityId,
						localId: id,
						jobId: null
					};

					self[ANNOTATIONS].push(annotation);
					self[logEntitiesChange]();

					return api.addAnnotation(self.videoId(), frame, entityId, annotation.bbox);
				})
				.then((id) => {
					annotation.id = id;
					self.onChange().trigger();
				});
		}
	}

	changeBounds(id, bounds) {
		const self = this;

		self.updateAnnotation({
			id: id,
			bbox: bboxFromBounds(bounds),
			jobId: null
		});
	}

	updateAnnotation(updateObject) {
		const self = this;
		let annotation = self[getAnnotation](updateObject.id);

		if (annotation) {
			forOwn(updateObject, (value, key) => {
				annotation[key] = value;
			});

			if (annotation.id) {
				api.patchAnnotation(self.videoId(), annotation.id, annotation.bbox, annotation.entityId);

				self.onUpdate().trigger(null, [annotation]);
				self[cleanEntities]();
			}
		}
	}

	updateEntity(updateObject) {
		const self = this;
		let entity = self[getEntity](updateObject.id);

		if (entity) {
			forOwn(updateObject, (value, key) => {
				entity[key] = value;
			});

			api.patchEntity(entity);
			self.onEntitiesChange().trigger(null, [self[ENTITIES]]);
		}
	}

	getAnnotationsForFrame(frame) {
		return this[ANNOTATIONS]
			.filter((annotation) => annotation.frame === frame)
			.map((annotation) => {
				return {
					...annotation,
					id: annotation.id || annotation.localId,
					bounds: boundsFromBbox(annotation.bbox)
				};
			});
	}

	delete(id) {
		const self = this;

		softDelete({
			title: 'Annotation deleted',
			value: self[ANNOTATIONS].find({id: id}),
			onDo() {
				self[ANNOTATIONS] = self[ANNOTATIONS].filter((item) => item.id !== id);
				self[logEntitiesChange]();
			},
			onUndo(value) {
				self[ANNOTATIONS].push(value);
				self[logEntitiesChange]();
			},
			onCommit() {
				api.deleteAnnotation(id);
				self[cleanEntities]();
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
				self[cleanEntities]();
			}
		});
	}

	predict(id) {
		const self = this;
		const annotation = self[getAnnotation](id);

		if (annotation) {
			api.addAnnotationJob(annotation.frame, annotation.frame + 60, annotation.id)
				.then((jobId) => {
					if (jobId) {
						self[JOBS].push({
							id: jobId,
							status: 'new'
						});

						annotation.jobId = jobId;
						self.onUpdate().trigger(null, [annotation]);
						self.onJobChange().trigger(null, [jobId, 'new']);

						self[checkJobs]();
					}
				});
		}
	}

	jobStatus(jobId) {
		const self = this;
		const job = self[JOBS].find((job) => job.id === jobId);

		return job ? job.status : '';
	}

	categories() {
		return this[CATEGORIES];
	}

	entities() {
		return this[ENTITIES];
	}

	export(videoData) {
		const self = this;

		const blob = new Blob([JSON.stringify({
			...videoData,
			entities: self[ENTITIES].map((item) => {
				return {
					id: parseInt(item.id),
					name: item.name,
					category: parseInt(item.category)
				};
			}),
			annotations: self[ANNOTATIONS].map((item) => {
				return {
					id: parseInt(item.id),
					entityId: parseInt(item.entityId),
					frame: item.frame,
					bbox: item.bbox,
					status: item.status
				};
			}),
			categories: self[CATEGORIES].map((item) => {
				return {
					id: parseInt(item.id),
					name: item.name,
					parent: item.parent
				};
			})
		})], {
			encoding: 'UTF-8',
			type: 'application/json;charset=UTF-8'
		});
		FileSaver.saveAs(blob, `${videoData.title}-unno-export.json`);
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
						self.onJobChange().trigger(null, [job.id, job.status]);
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
			self.onChange().trigger();

			api.getCategories()
				.then((categories) => {
					self[CATEGORIES] = categories.filter((category) => Boolean(category.name)).sort(compare('name'));
					self.onCategoriesChange().trigger(null, [self[CATEGORIES]]);

					return api.getEntities(videoId);
				})
				.then((entities) => {
					self[ENTITIES].length = 0;
					self[ENTITIES] = self[ENTITIES].concat(entities.sort(compare('name', 'id')));
					self.onEntitiesChange().trigger(null, [self[ENTITIES]]);

					return self[getAnnotations]();
				})
				.then(() => {
					return api.getAnnotationJobs(videoId);
				})
				.then((results) => {
					self[JOBS] = results.filter((job) => job.status !== 'done');
					self[checkJobs]();
				});
		}
	}),
	onLoad: method.queue(),
	onChange: method.queue(),
	onUpdate: method.queue(),
	onCategoriesChange: method.queue(),
	onEntitiesChange: method.queue(),
	onJobChange: method.queue()
});

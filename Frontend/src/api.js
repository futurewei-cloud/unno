import axios from 'axios';
import { ajax, toast } from 'hafgufa';
import { clone } from 'object-agent';
import { isArray, method } from 'type-enforcer-ui';

let username = 'abcd';
const BASE_URL = 'http://10.145.83.34:5011/api/v1';
const VIDEO = '/video';
const ANNOTATIONS = '/annotation';
const ANNOTATION_JOBS = '/job';
const CATEGORIES = '/category';
const ENTITY = '/entity';

const idIn = (id) => id !== null ? id + '' : id;
const idOut = (id) => (id || id === 0) ? parseInt(id) : undefined;

const callAjax = (settings) => (...args) => {
	return new Promise((resolve) => {
		let result;

		settings.call(...args)
			.then((output) => {
				if (settings.resultKey) {
					output = output[settings.resultKey];
				}

				if (settings.map) {
					if (isArray(output)) {
						result = output.map(settings.map);
					}
					else {
						result = settings.map(output);
					}
				}
				else {
					result = output;
				}
			})
			.catch((error) => {
				toast.error({
					title: settings.errorTitle || '',
					subTitle: error + ' (at ' + BASE_URL + ')'
				});
			})
			.finally(() => {
				if (settings.triggerChange) {
					api.onChange().trigger();
				}
				resolve(result || clone(settings.default));
			});
	});
};

const api = {
	onChange: method.queue(),

	// ********** VIDEO

	getVideoLink(id) {
		return BASE_URL + VIDEO + '?video_id=' + id;
	},

	getVideos: callAjax({
		call() {
			return ajax.get(BASE_URL + VIDEO, {
				withCredentials: false,
				params: {
					username: username
				}
			});
		},
		default: [],
		errorTitle: 'Error loading videos',
		map(video) {
			const sep = video.video_name.lastIndexOf('.');

			return {
				id: idIn(video.video_id),
				name: sep === -1 ? video.video_name : video.video_name.substring(0, sep),
				ext: sep === -1 ? '-' : video.video_name.substring(sep + 1),
				entities: video.entity_num || 0,
				format: video.format,
				height: video.height,
				width: video.width,
				fps: video.fps,
				duration: Math.round((video.num_frames / video.fps) * 1000)
			};
		}
	}),

	patchVideo: callAjax({
		call(id, title) {
			return axios.patch(BASE_URL + VIDEO, {}, {
				withCredentials: false,
				params: {
					video_id: idOut(id),
					video_name: title
				}
			});
		},
		errorTitle: 'Error saving video data',
		triggerChange: true
	}),

	deleteVideo: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + VIDEO, {
				withCredentials: false,
				params: {
					video_id: idOut(id)
				}
			});
		},
		errorTitle: 'Error deleting video',
		triggerChange: true
	}),

	uploadVideo: callAjax({
		call(data, onUploadProgress) {
			return new Promise((resolve) => {
				const formData = new FormData();
				formData.append('file', data.file);
				formData.append('user', username);
				formData.append('video', data.name);

				axios.post(BASE_URL + VIDEO, formData, {
						withCredentials: false,
						headers: {
							'Content-Type': 'multipart/form-data'
						},
						onUploadProgress(progressEvent) {
							onUploadProgress(progressEvent);
						}
					})
					.then(resolve);
			});
		},
		errorTitle: 'Error uploading video',
		triggerChange: true
	}),

	// ********** ANNOTATIONS

	getAnnotations: callAjax({
		call(videoId) {
			return ajax.get(BASE_URL + ANNOTATIONS, {
				withCredentials: false,
				params: {
					video_id: idOut(videoId)
				}
			});
		},
		default: [],
		errorTitle: 'Error loading annotations',
		resultKey: 'annotations',
		map(annotation) {
			return {
				bbox: annotation.bbox,
				entityId: idIn(annotation.entity_id),
				frame: annotation.frame_num,
				jobId: idIn(annotation.job_id),
				id: idIn(annotation.annotation_id),
				status: annotation.status
			};
		}
	}),

	addAnnotation: callAjax({
		call(videoId, frameNum, entityId, bbox) {
			return ajax.post(BASE_URL + ANNOTATIONS, {
				username: username,
				video_id: idOut(videoId),
				entity_id: idOut(entityId),
				frame_num: frameNum,
				bbox: bbox,
				status: 'user'
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error adding annotation',
		map(result) {
			return idIn(result.annotation_id);
		}
	}),

	patchAnnotation: callAjax({
		call(videoId, id, bbox, entityId) {
			return axios.patch(BASE_URL + ANNOTATIONS, {}, {
				withCredentials: false,
				params: {
					username: username,
					video_id: idOut(videoId),
					annotation_id: idOut(id),
					entity_id: idOut(entityId),
					bbox: bbox,
					status: 'user'
				}
			});
		},
		errorTitle: 'Error patching annotation'
	}),

	deleteAnnotation: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + ANNOTATIONS, {
				withCredentials: false,
				params: {
					annotation_id: idOut(id)
				}
			});
		},
		errorTitle: 'Error deleting annotation'
	}),

	deleteAnnotations: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + ANNOTATIONS, {
				withCredentials: false,
				params: {
					video_id: idOut(id)
				}
			});
		},
		errorTitle: 'Error deleting annotations'
	}),

	// ********** JOBS

	getAnnotationJobs: callAjax({
		call(videoId) {
			return ajax.get(BASE_URL + ANNOTATION_JOBS, {
				withCredentials: false,
				params: {
					video_id: idOut(videoId)
				}
			});
		},
		default: [],
		errorTitle: 'Error loading jobs for video',
		resultKey: 'jobs',
		map(job) {
			return {
				id: idIn(job.job_id),
				status: job.status
			};
		}
	}),

	getAnnotationJob: callAjax({
		call(id) {
			return ajax.get(BASE_URL + ANNOTATION_JOBS, {
				withCredentials: false,
				params: {
					job_id: idOut(id)
				}
			});
		},
		default: [],
		errorTitle: 'Error loading job',
		resultKey: 'jobs',
		map(job) {
			return {
				id: idIn(job.job_id),
				status: job.status
			};
		}
	}),

	addAnnotationJob: callAjax({
		call(startFrame, endFrame, annotationId) {
			return ajax.post(BASE_URL + ANNOTATION_JOBS, {
				start_frame: startFrame,
				end_frame: endFrame,
				annotation_id: annotationId
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error adding prediction job',
		map(result) {
			return idIn(result.job_id);
		}
	}),

	deleteAnnotationJob: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + ANNOTATION_JOBS, {
				withCredentials: false,
				params: {
					username: username,
					job_id: idOut(id)
				}
			});
		},
		errorTitle: 'Error deleting annotation job',
		triggerChange: true
	}),

	// ********** CATEGORIES

	getCategories: callAjax({
		call(videoId) {
			return ajax.get(BASE_URL + CATEGORIES, {
				withCredentials: false,
				params: {
					video_id: idOut(videoId)
				}
			});
		},
		default: [],
		errorTitle: 'Error loading categories',
		resultKey: 'category',
		map(category) {
			return {
				id: idIn(category.cat_id),
				name: category.name,
				parent: category.sup_cat_name
			};
		}
	}),

	// ********** Entities

	getEntities: callAjax({
		call(videoId) {
			return ajax.get(BASE_URL + ENTITY, {
				withCredentials: false,
				params: {
					video_id: videoId
				}
			});
		},
		default: [],
		errorTitle: 'Error loading entities',
		resultKey: 'entity',
		map(entity) {
			return {
				id: idIn(entity.entity_id),
				videoId: idIn(entity.video_id),
				name: entity.name,
				category: idIn(entity.cat_id)
			};
		}
	}),

	addEntity: callAjax({
		call(videoId) {
			return ajax.post(BASE_URL + ENTITY, {
				video_id: idOut(videoId)
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error adding entity',
		map(result) {
			return idIn(result.entity_id);
		}
	}),

	patchEntity: callAjax({
		call(entity) {
			return axios.patch(BASE_URL + ENTITY, {
				entity_id: idOut(entity.id),
				video_id: idOut(entity.videoId),
				name: entity.name,
				cat_id: idOut(entity.category)
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error patching entity'
	}),

	deleteEntity: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + ENTITY, {
				withCredentials: false,
				params: {
					entity_id: idOut(id)
				}
			});
		},
		errorTitle: 'Error deleting entity'
	})

};

export default api;

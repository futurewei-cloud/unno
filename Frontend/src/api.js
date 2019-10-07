import axios from 'axios';
import { ajax, toast } from 'hafgufa';
import { clone } from 'object-agent';
import { isArray, method } from 'type-enforcer';

let username = 'abcd';
const BASE_URL = 'http://10.175.20.126:5011/api/v1';
const VIDEO = '/video';
const ANNOTATIONS = '/result';
const ANNOTATION_JOBS = '/job';
const CATEGORIES = '/category';

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
					subTitle: error + ''
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
				id: video.video_id,
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
					video_id: id,
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
					video_id: id
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

	// ********** RESULTS

	getAnnotations: callAjax({
		call(videoId) {
			return ajax.get(BASE_URL + ANNOTATIONS, {
				withCredentials: false,
				params: {
					video_id: videoId
				}
			});
		},
		default: [],
		errorTitle: 'Error loading annotations',
		resultKey: 'results',
		map(annotation) {
			return {
				bbox: annotation.bbox,
				category: annotation.cat_id,
				entityId: annotation.entity_id,
				frame: annotation.frame_num,
				jobId: annotation.job_id,
				resultId: annotation.result_id,
				status: annotation.status
			};
		}
	}),

	addAnnotation: callAjax({
		call(videoId, frameNum, entityId, bbox) {
			return ajax.post(BASE_URL + ANNOTATIONS, {
				username: username,
				video_id: videoId,
				entity_id: entityId,
				frame_num: frameNum,
				bbox: bbox,
				status: 'user'
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error adding annotation',
		map(result) {
			return result.result_id;
		}
	}),

	patchAnnotation: callAjax({
		call(videoId, resultId, bbox) {
			return axios.patch(BASE_URL + ANNOTATIONS, {}, {
				withCredentials: false,
				params: {
					username: username,
					video_id: videoId,
					result_id: resultId,
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
					result_id: id
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
					video_id: id
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
					video_id: videoId
				}
			});
		},
		default: [],
		errorTitle: 'Error loading jobs for video',
		resultKey: 'jobs',
		map(job) {
			return {
				id: job.job_id,
				status: job.status
			};
		}
	}),

	getAnnotationJob: callAjax({
		call(id) {
			return ajax.get(BASE_URL + ANNOTATION_JOBS, {
				withCredentials: false,
				params: {
					job_id: id
				}
			});
		},
		default: [],
		errorTitle: 'Error loading job',
		resultKey: 'jobs',
		map(job) {
			return {
				id: job.job_id,
				status: job.status
			};
		}
	}),

	addAnnotationJob: callAjax({
		call(startFrame, endFrame, resultId) {
			return ajax.post(BASE_URL + ANNOTATION_JOBS, {
				start_frame: startFrame,
				end_frame: endFrame,
				result_id: resultId
			}, {
				withCredentials: false
			});
		},
		errorTitle: 'Error adding prediction job',
		map(result) {
			return result.job_id;
		}
	}),

	deleteAnnotationJob: callAjax({
		call(id) {
			return ajax.delete(BASE_URL + ANNOTATION_JOBS, {
				withCredentials: false,
				params: {
					username: username,
					job_id: id
				}
			});
		},
		errorTitle: 'Error deleting annotation job',
		triggerChange: true
	}),

	// ********** CATEGORIES

	getCategories: callAjax({
		call() {
			return ajax.get(BASE_URL + CATEGORIES, {
				withCredentials: false
			});
		},
		default: [],
		errorTitle: 'Error loading categories',
		resultKey: 'category',
		map(category) {
			return {
				id: category.cat_id,
				name: category.name,
				parent: category.sup_cat_name
			};
		}
	})

};

export default api;

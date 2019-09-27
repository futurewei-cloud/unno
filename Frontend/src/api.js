import axios from 'axios';
import { ajax, toast } from 'hafgufa';
import { clone } from 'object-agent';
import { method } from 'type-enforcer';

let username = 'abcd';
const BASE_URL = 'http://10.145.83.34:5011/api/v1';
const VIDEO = '/video';
const ANNOTATIONS = '/result';
const ANNOTATION_JOBS = '/job';

const callAjax = (callback, defaultValue, errorTitle = '', triggerChange = false) => (...args) => {
	return new Promise((resolve) => {
		let result;

		callback(...args)
			.then((output) => {
				result = output;
			})
			.catch((error) => {
				toast.error({
					title: errorTitle,
					subTitle: error + ''
				});
			})
			.finally(() => {
				if (triggerChange) {
					api.onChange().trigger();
				}
				resolve(result || clone(defaultValue));
			});
	});
};

const api = {
	// ********** VIDEO

	getVideos: callAjax(() => ajax.get(BASE_URL + VIDEO, {
		withCredentials: false,
		params: {
			username: username
		}
	}), [], 'Error loading videos'),

	getVideoLink(id) {
		return BASE_URL + VIDEO + '?video_id=' + id;
	},

	patchVideo: callAjax((id, title) => axios.patch(BASE_URL + VIDEO, {}, {
		withCredentials: false,
		params: {
			video_id: id,
			video_name: title
		}
	}), undefined, 'Error saving video data', true),

	deleteVideo: callAjax((id) => ajax.delete(BASE_URL + VIDEO, {
		withCredentials: false,
		params: {
			video_id: id
		}
	}), undefined, 'Error deleting video', true),

	uploadVideo: callAjax((data, onUploadProgress) => new Promise((resolve) => {
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
	}), undefined, 'Error uploading video', true),

	onChange: method.queue(),

	// ********** RESULTS

	getAnnotations: callAjax((videoId) => ajax.get(BASE_URL + ANNOTATIONS, {
		withCredentials: false,
		params: {
			video_id: videoId
		}
	}), [], 'Error loading annotations'),

	addAnnotation: callAjax((videoId, frameNum, entityId, bbox) => ajax.post(BASE_URL + ANNOTATIONS, {
		username: username,
		video_id: videoId,
		entity_id: entityId,
		frame_num: frameNum,
		bbox: bbox,
		status: 'user'
	}, {
		withCredentials: false
	}), undefined, 'Error adding annotation'),

	patchAnnotation: callAjax((videoId, resultId, bbox) => axios.patch(BASE_URL + ANNOTATIONS, {}, {
		withCredentials: false,
		params: {
			username: username,
			video_id: videoId,
			result_id: resultId,
			bbox: bbox,
			status: 'user'
		}
	}), undefined, 'Error patching annotation'),

	deleteAnnotation: callAjax((id) => ajax.delete(BASE_URL + ANNOTATIONS, {
		withCredentials: false,
		params: {
			result_id: id
		}
	}), undefined, 'Error deleting annotation'),

	deleteAnnotations: callAjax((id) => ajax.delete(BASE_URL + ANNOTATIONS, {
		withCredentials: false,
		params: {
			video_id: id
		}
	}), undefined, 'Error deleting annotations'),

	// ********** JOBS

	getAnnotationJobs: callAjax((videoId) => ajax.get(BASE_URL + ANNOTATION_JOBS, {
		withCredentials: false,
		params: {
			video_id: videoId
		}
	}), [], 'Error loading jobs for video'),

	getAnnotationJob: callAjax((jobId) => ajax.get(BASE_URL + ANNOTATION_JOBS, {
		withCredentials: false,
		params: {
			job_id: jobId
		}
	}), [], 'Error loading job'),

	addAnnotationJob: callAjax((startFrame, endFrame, resultId) => ajax.post(BASE_URL + ANNOTATION_JOBS, {
		start_frame: startFrame,
		end_frame: endFrame,
		result_id: resultId
	}, {
		withCredentials: false
	}), undefined, 'Error adding prediction job'),

	deleteAnnotationJob: callAjax((id) => ajax.delete(BASE_URL + ANNOTATION_JOBS, {
		withCredentials: false,
		params: {
			username: username,
			job_id: id
		}
	}), undefined, 'Error deleting annotation job', true)
};

export default api;

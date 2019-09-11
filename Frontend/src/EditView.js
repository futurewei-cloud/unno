import { clear, throttle } from 'async-agent';
import { BLOCK, Container, INLINE_BLOCK, Slider, softDelete, SplitView, Timeline, toast, Video } from 'hafgufa';
import moment from 'moment';
import { HUNDRED_PERCENT, method, PIXELS } from 'type-enforcer';
import Annotator from './Annotator';
import api from './api';
import './EditView.less';
import VideoControls from './VideoControls';

const INTERVAL_ID = Symbol();
const ANNOTATIONS = Symbol();
const ONE_FRAME = Symbol();
const VIDEO_PLAYER = Symbol();
const VIDEO_WRAPPER = Symbol();
const VIDEO = Symbol();
const VIDEO_CONTROLS = Symbol();
const VIDEO_CONTROLS_HEIGHT = Symbol();
const VIDEO_PROPORTIONS = Symbol();
const ANNOTATOR = Symbol();
const SLIDER = Symbol();
const TIMELINE = Symbol();
const JOBS = Symbol();
const AVAILABLE_VIDEO_HEIGHT = Symbol();
const AVAILABLE_VIDEO_WIDTH = Symbol();

const layoutVideo = Symbol();
const checkJobs = Symbol();
const buildVideo = Symbol();
const buildTimeline = Symbol();
const runPrediction = Symbol();
const updateAnnotationDisplay = Symbol();
const getAnnotations = Symbol();
const setCurrentTime = Symbol();

const JOB_CHECK_DELAY = 2000;

export default class EditView extends SplitView {
	constructor(settings = {}) {
		settings = {
			...settings,
			splitOffset: '-1.5rem',
			maxOffset: '-1.5rem',
			isResizable: true,
			orientation: SplitView.ORIENTATION.ROWS
		};

		super(settings);

		const self = this;
		self.addClass('edit-view');

		self[ANNOTATIONS] = [];
		self[JOBS] = [];

		self[buildVideo]();
		self[buildTimeline]();
	}

	[layoutVideo]() {
		const self = this;

		if (!self[VIDEO_PROPORTIONS]) {
			self[VIDEO_PROPORTIONS] = self[VIDEO].borderWidth() / self[VIDEO].borderHeight();
		}
		if (!self[VIDEO_CONTROLS_HEIGHT]) {
			self[VIDEO_CONTROLS_HEIGHT] = self[VIDEO_CONTROLS].borderHeight();
		}

		const availableProportions = self[AVAILABLE_VIDEO_WIDTH] / (self[AVAILABLE_VIDEO_HEIGHT] - self[VIDEO_CONTROLS_HEIGHT]);

		if (self[VIDEO_PROPORTIONS] > availableProportions) {
			const newHeight = (self[AVAILABLE_VIDEO_WIDTH] / self[VIDEO_PROPORTIONS]) + self[VIDEO_CONTROLS_HEIGHT];

			self[VIDEO_WRAPPER]
				.css('display', BLOCK);
			self[VIDEO]
				.height('auto')
				.width('100%');
			self[VIDEO_PLAYER]
				.width('100%')
				.height(newHeight)
				.css({
					'margin-top': (self[AVAILABLE_VIDEO_HEIGHT] - newHeight) / 2 + PIXELS
				})
				.resize();
		}
		else {
			const newWidth = (self[AVAILABLE_VIDEO_HEIGHT] - self[VIDEO_CONTROLS_HEIGHT]) * self[VIDEO_PROPORTIONS];

			self[VIDEO_WRAPPER]
				.css('display', INLINE_BLOCK);
			self[VIDEO]
				.height('100%')
				.width('auto');
			self[VIDEO_PLAYER]
				.width(newWidth)
				.height('100%')
				.css({
					'margin-top': 0 + PIXELS
				})
				.resize();
		}
	}

	[buildVideo]() {
		const self = this;

		self.firstView()
			.onResize((width, height) => {
				self[AVAILABLE_VIDEO_HEIGHT] = height;
				self[AVAILABLE_VIDEO_WIDTH] = width;
				self[layoutVideo]();
			});

		self[VIDEO_PLAYER] = new SplitView({
			container: self.firstView(),
			width: 'auto',
			minHeight: '6rem',
			minWidth: '28rem',
			splitOffset: '-3rem',
			orientation: SplitView.ORIENTATION.ROWS
		});

		self[VIDEO_WRAPPER] = new Container({
			container: self[VIDEO_PLAYER].firstView(),
			height: HUNDRED_PERCENT
		});

		self[VIDEO] = new Video({
			container: self[VIDEO_WRAPPER],
			showControls: false,
			height: HUNDRED_PERCENT,
			width: 'auto',
			attr: {
				crossorigin: 'anonymous'
			},
			onReady(duration) {
				self[VIDEO_PROPORTIONS] = null;
				self[VIDEO_PLAYER].isWorking(false);

				self[layoutVideo]();
			},
			onTimeUpdate(currentTime) {
				self[setCurrentTime](currentTime);

				clear(self[INTERVAL_ID]);

				if (self[VIDEO].isPlaying) {
					self[INTERVAL_ID] = setInterval(() => {
						self[setCurrentTime](currentTime + self[ONE_FRAME]);
					}, self[SLIDER].increment());
				}
			},
			onError(error) {
				clear(self[INTERVAL_ID]);
				self[VIDEO_PLAYER].isWorking(false).resize();
				toast.error({
					title: 'Error loading video',
					subTitle: `code: ${error.code} - ${error.message}`
				});
			},
			onPause() {
				clear(self[INTERVAL_ID]);
			}
		});

		self[VIDEO_CONTROLS] = new VideoControls({
			container: self[VIDEO_PLAYER].secondView(),
			video: self[VIDEO],
			onEditTitle(title) {
				self.onEditTitle()(title);
			}
		});

		self[ANNOTATOR] = new Annotator({
			container: self[VIDEO_WRAPPER],
			onAdd(bbox) {
				const currentTime = self[SLIDER].value()[0] / 1000;
				const currentFrame = Math.round(currentTime * self.fps());

				const annotation = {
					frame: currentFrame,
					bbox: bbox,
					entityId: Math.round(Math.random() * 10000),
					jobId: null
				};

				self[ANNOTATIONS].push(annotation);

				api.addAnnotation(self.videoId(), currentFrame, annotation.entityId, annotation.bbox)
					.then((result) => {
						annotation.resultId = result.result_id;
						self[updateAnnotationDisplay]();
					});
			},
			onDeleteAnnotation(resultId) {
				softDelete({
					title: 'Annotation deleted',
					value: self[ANNOTATIONS].find((item) => item.resultId === resultId),
					onDo() {
						self[ANNOTATIONS] = self[ANNOTATIONS].filter((item) => item.resultId !== resultId);
						self[updateAnnotationDisplay]();
					},
					onUndo(value) {
						self[ANNOTATIONS].push(value);
						self[updateAnnotationDisplay]();
					},
					onCommit() {
						api.deleteAnnotation(resultId);
					}
				});
			},
			onDeleteAllAnnotations() {
				softDelete({
					title: 'All annotations deleted',
					value: self[ANNOTATIONS],
					onDo() {
						self[ANNOTATIONS].length = 0;
						self[ANNOTATOR].value([]);
					},
					onUndo(value) {
						self[ANNOTATIONS] = value;
						self[updateAnnotationDisplay]();
					},
					onCommit() {
						api.deleteAnnotations(self.videoId());
					}
				});
			}
		});
	}

	[setCurrentTime](currentTime) {
		this[SLIDER].value([currentTime * 1000]);
		this[updateAnnotationDisplay]();
	}

	[buildTimeline]() {
		const self = this;

		self[TIMELINE] = new Timeline({
			container: self.secondView(),
			height: '100%',
			padding: '0 0.75rem',
			duration: 10000
		});
		self[SLIDER] = new Slider({
			container: self.secondView(),
			classes: 'timeline-slider',
			height: '100%',
			min: 0,
			max: 10000,
			increment: 40,
			onSlide: throttle((value) => {
				self[VIDEO].currentTime(value[0] / 1000);
			}, 250),
			buildTooltip(value) {
				return moment.utc(value).format('HH:mm:ss.SSS');
			}
		});
	}

	[runPrediction](annotations) {
		const self = this;

		annotations.forEach((annotation) => {
			api.addAnnotationJob(annotation.frame, annotation.frame + 60, annotation.resultId)
				.then((result) => {
					if (result) {
						self[JOBS].push({
							id: result.job_id,
							status: 'new'
						});

						self[checkJobs]();
					}
				});
		});
	}

	[getAnnotations]() {
		const self = this;

		return api.getAnnotations(self.videoId())
			.then((results) => {
				self[ANNOTATIONS] = results.results.map((result) => {
					return {
						frame: result.frame_num,
						bbox: result.bbox,
						entityId: result.entity_id,
						resultId: result.result_id,
						jobId: result.job_id
					};
				});
				self[updateAnnotationDisplay]();
			});
	}

	[updateAnnotationDisplay]() {
		const self = this;
		const currentTime = self[SLIDER].value()[0] / 1000;
		const currentFrame = Math.round(currentTime * self.fps());
		const frameAnnotations = self[ANNOTATIONS].filter((annotation) => annotation.frame === currentFrame);
		const predictableAnnotations = frameAnnotations.filter((annotation) => annotation.jobId === null);

		toast.clear();

		self[ANNOTATOR].value(frameAnnotations);

		if (predictableAnnotations.length) {
			toast.info({
				title: 'Predict',
				subTitle: 'Run the predictor for all boxes in this frame',
				duration: null,
				icon: '',
				class: 'predict-button',
				onClick() {
					self[runPrediction](predictableAnnotations);
				}
			});
		}
	}

	source(source) {
		const self = this;

		if (source) {
			this[VIDEO_PLAYER].isWorking(true);
		}

		self[VIDEO].sources([source]);

		return this;
	}
}

Object.assign(EditView.prototype, {
	[checkJobs]: throttle(function() {
		const self = this;

		self[JOBS].forEach((job) => {
			api.getAnnotationJob(job.id)
				.then((results) => {
					results = results.jobs[0];

					if (results.status !== job.status) {
						job.status = results.status;
					}

					if (results.status === 'done') {
						self[getAnnotations]();

						self[JOBS] = self[JOBS].filter((item) => {
							item.id !== job.id;
						});
					}

					if (self[JOBS].length) {
						self[checkJobs]();
					}
				});
		});
	}, JOB_CHECK_DELAY, {
		leading: false
	}),
	title: method.string({
		set(title) {
			this[VIDEO_CONTROLS].title(title);
		}
	}),
	ext: method.string(),
	fps: method.number({
		set(fps) {
			const self = this;

			self[VIDEO].fps(fps);
			self[ONE_FRAME] = 1 / fps;
			self[SLIDER].increment(self[ONE_FRAME] * 1000);
		}
	}),
	duration: method.number({
		set(duration) {
			this[TIMELINE].duration(duration);
			this[SLIDER].max(duration);
		}
	}),
	videoId: method.integer({
		set(videoId) {
			const self = this;

			if (videoId !== -1) {
				self[TIMELINE].isWorking(true);
				self[ANNOTATIONS].length = 0;
				self[ANNOTATOR].value([]);
				self[getAnnotations]()
					.then(() => {
						self[TIMELINE].isWorking(false);
						return api.getAnnotationJobs(videoId);
					})
					.then((results) => {
						results.jobs.forEach((job) => {
							if (job.status !== 'done') {
								self[JOBS].push({
									id: job.job_id,
									status: job.status
								});
							}
						});

						if (self[JOBS].length) {
							self[checkJobs]();
						}
					});
			}
		}
	}),
	onEditTitle: method.function()
});

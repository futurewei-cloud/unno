import { clear, throttle } from 'async-agent';
import { BLOCK, Div, INLINE_BLOCK, Slider, SplitView, Timeline, toast, VectorEditor, Video } from 'hafgufa';
import moment from 'moment';
import { HUNDRED_PERCENT, method, PIXELS } from 'type-enforcer';
import AnnotationManager from './AnnotationManager';
import './EditView.less';
import VideoControls from './VideoControls';

const INTERVAL_ID = Symbol();
const ANNOTATION_MANAGER = Symbol();
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
const AVAILABLE_VIDEO_HEIGHT = Symbol();
const AVAILABLE_VIDEO_WIDTH = Symbol();

const layoutVideo = Symbol();
const buildVideo = Symbol();
const buildTimeline = Symbol();
const updateAnnotationDisplay = Symbol();
const setCurrentTime = Symbol();
const getCurrentFrame = Symbol();

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

		self[ANNOTATION_MANAGER] = new AnnotationManager({
			onLoad() {
				self[TIMELINE].isWorking(false);
			},
			onChange() {
				self[updateAnnotationDisplay]();
			},
			onEntitiesChange(...args) {
				self.onEntitiesChange()(...args);
			}
		});

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

		self[VIDEO_WRAPPER].resize(true);
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

		self[VIDEO_WRAPPER] = new Div({
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

		self[ANNOTATOR] = new VectorEditor({
			container: self[VIDEO_WRAPPER],
			onAdd(id, bounds) {
				self[ANNOTATION_MANAGER].add(self[getCurrentFrame](), bounds, id);
			},
			onChange(id, bounds) {
				self[ANNOTATION_MANAGER].changeBounds(id, bounds);
			},
			onDeleteShape(resultId) {
				self[ANNOTATION_MANAGER].delete(resultId);
			},
			onDeleteAllShapes() {
				self[ANNOTATION_MANAGER].deleteAll();
			}
		});
	}

	[setCurrentTime](currentTime) {
		this[SLIDER].value([currentTime * 1000]);
		this[updateAnnotationDisplay]();
	}

	[getCurrentFrame]() {
		const currentTime = this[SLIDER].value()[0] / 1000;
		return Math.round(currentTime * this.fps());
	}

	[buildTimeline]() {
		const self = this;

		self[TIMELINE] = new Timeline({
			container: self.secondView(),
			height: '100%',
			padding: '0 0.75rem',
			duration: 10000,
			canZoom: false
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

	[updateAnnotationDisplay]() {
		const self = this;
		const frameAnnotations = self[ANNOTATION_MANAGER].getAnnotationsForFrame(self[getCurrentFrame]());
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
					predictableAnnotations.forEach((annotation) => {
						self[ANNOTATION_MANAGER].predict(annotation);
					});
				}
			});
		}
	}

	source(source) {
		const self = this;

		if (source) {
			self[VIDEO_PLAYER].isWorking(true);
		}

		self[VIDEO].sources([source]);

		return self;
	}
}

Object.assign(EditView.prototype, {
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
	videoId: method.string({
		set(videoId) {
			const self = this;

			if (videoId !== -1) {
				self[TIMELINE].isWorking(true);
				self[ANNOTATION_MANAGER].videoId(videoId);
			}
		}
	}),
	onEditTitle: method.function(),
	onEntitiesChange: method.function()
});

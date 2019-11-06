import { clear, throttle } from 'async-agent';
import { Button, Slider, SplitView, Timeline, toast, VectorEditor, Video } from 'hafgufa';
import { List } from 'hord';
import moment from 'moment';
import { pull } from 'object-agent';
import { HUNDRED_PERCENT, method } from 'type-enforcer';
import AnnotationListView from './AnnotationListView';
import AnnotationManager from './AnnotationManager';
import './EditView.less';
import VideoControls from './VideoControls';

const INTERVAL_ID = Symbol();
const ANNOTATION_MANAGER = Symbol();
const ONE_FRAME = Symbol();
const VIDEO_PLAYER = Symbol();
const VIDEO = Symbol();
const VIDEO_CONTROLS_HEIGHT = Symbol();
const ANNOTATION_LIST_WIDTH = Symbol();
const VIDEO_PROPORTIONS = Symbol();
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
			onEntitiesChange(entities) {
				self.onEntitiesChange()(new List(pull(entities, 'id')).unique().length);
			}
		});

		self[buildVideo](self.firstView());
		self[buildTimeline](self.secondView());
	}

	[layoutVideo]() {
		const self = this;

		if (!self[VIDEO_PROPORTIONS]) {
			self[VIDEO_PROPORTIONS] = self[VIDEO].borderWidth() / self[VIDEO].borderHeight();
		}
		if (!self[VIDEO_CONTROLS_HEIGHT]) {
			self[VIDEO_CONTROLS_HEIGHT] = self[VIDEO_PLAYER].get('videoControls').borderHeight();
		}
		if (!self[ANNOTATION_LIST_WIDTH]) {
			self[ANNOTATION_LIST_WIDTH] = self[VIDEO_PLAYER].get('annotationList').borderWidth();
		}

		const availableProportions = (self[AVAILABLE_VIDEO_WIDTH] - self[ANNOTATION_LIST_WIDTH]) /
			(self[AVAILABLE_VIDEO_HEIGHT] - self[VIDEO_CONTROLS_HEIGHT]);
		const isVertical = self[VIDEO_PROPORTIONS] > availableProportions;

		self.classes('vertical', isVertical);

		if (isVertical) {
			self[VIDEO_PLAYER]
				.width('100%')
				.height(((self[AVAILABLE_VIDEO_WIDTH] - self[ANNOTATION_LIST_WIDTH]) / self[VIDEO_PROPORTIONS]) +
					self[VIDEO_CONTROLS_HEIGHT])
				.resize();
		}
		else {
			self[VIDEO_PLAYER]
				.width((self[AVAILABLE_VIDEO_HEIGHT] - self[VIDEO_CONTROLS_HEIGHT]) * self[VIDEO_PROPORTIONS] + self[ANNOTATION_LIST_WIDTH])
				.height('100%')
				.resize();
		}
	}

	[buildVideo](container) {
		const self = this;

		self[VIDEO_PLAYER] = new SplitView({
			container: container,
			classes: 'video-player',
			width: 'auto',
			splitOffset: '-18rem',
			orientation: SplitView.ORIENTATION.COLUMNS,
			firstViewContent: {
				control: SplitView,
				id: 'videoWrapper',
				classes: 'video-wrapper',
				orientation: SplitView.ORIENTATION.ROWS,
				splitOffset: '-3rem',
				firstViewContent: [{
					control: Video,
					id: 'mainVideo',
					showControls: false,
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
				}, {
					control: VectorEditor,
					id: 'annotator',
					onAdd(id, bounds) {
						self[ANNOTATION_MANAGER].add(self[getCurrentFrame](), bounds, id);
					},
					onChange(id, bounds) {
						self[ANNOTATION_MANAGER].changeBounds(id, bounds);
					},
					onDeleteShape(id) {
						self[ANNOTATION_MANAGER].delete(id);
					},
					onDeleteAllShapes() {
						self[ANNOTATION_MANAGER].deleteAll();
					},
					onHighlight(id) {
						self[VIDEO_PLAYER].get('annotationList').highlight(id);
					}
				}],
				secondViewContent: {
					control: VideoControls,
					id: 'videoControls',
					onEditTitle(title) {
						self.onEditTitle()(title);
					}
				}
			},
			secondViewContent: {
				control: SplitView,
				id: 'videoWrapper',
				classes: 'video-wrapper',
				orientation: SplitView.ORIENTATION.ROWS,
				splitOffset: '-3rem',
				firstViewContent: {
					control: AnnotationListView,
					id: 'annotationList',
					width: HUNDRED_PERCENT,
					height: HUNDRED_PERCENT,
					padding: '0',
					margin: '0',
					annotationManager: self[ANNOTATION_MANAGER],
					onMouseEnter(id) {
						self[VIDEO_PLAYER].get('annotator').highlight(id);
					}
				},
				secondViewContent: {
					control: Button,
					label: 'Export Video Annotations',
					icon: 'download',
					margin: '0.5rem',
					css: {
						float: 'right'
					},
					onClick() {
						self[ANNOTATION_MANAGER].export({
							title: self.title(),
							ext: self.ext(),
							fps: self.fps(),
							duration: self.duration()
						});
					}
				}
			}
		});

		self[VIDEO] = self[VIDEO_PLAYER].get('mainVideo');

		self[VIDEO_PLAYER].get('videoControls').video(self[VIDEO]);

		self.firstView()
			.onResize((width, height) => {
				self[AVAILABLE_VIDEO_HEIGHT] = height;
				self[AVAILABLE_VIDEO_WIDTH] = width;
				self[layoutVideo]();
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

	[buildTimeline](container) {
		const self = this;

		self[TIMELINE] = new Timeline({
			container: container,
			height: '100%',
			padding: '0 0.75rem',
			duration: 10000,
			canZoom: false
		});
		self[SLIDER] = new Slider({
			container: container,
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

		self[VIDEO_PLAYER].get('annotator').value(frameAnnotations);
		self[VIDEO_PLAYER].get('annotationList').value(frameAnnotations);
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
			this[VIDEO_PLAYER].get('videoControls').title(title);
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

			if (videoId) {
				self[TIMELINE].isWorking(true);
				self[ANNOTATION_MANAGER].videoId(videoId);
			}
		}
	}),
	onEditTitle: method.function(),
	onEntitiesChange: method.function()
});

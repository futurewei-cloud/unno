import { Button, Slider, SplitView, TextInput } from 'hafgufa';
import { method } from 'type-enforcer';
import { MUTED_ICON, PAUSE_ICON, PLAY_ICON, STEP_BACK_ICON, STEP_FORWARD_ICON, VOLUME_ICON } from './icons';
import './VideoControls.less';

const VIDEO = Symbol();

const updateControls = Symbol();
const updateTitle = Symbol();

export default class VideoControls extends SplitView {
	constructor(settings = {}) {
		super({
			...settings,
			type: 'videoControls',
			splitOffset: '-10rem',
			orientation: SplitView.ORIENTATION.COLUMNS,
			firstViewContent: {
				control: SplitView,
				id: 'controlWrapper',
				splitOffset: '9rem',
				orientation: SplitView.ORIENTATION.COLUMNS,
				css: {
					'text-align': 'left'
				},
				firstViewContent: [{
					control: Button,
					id: 'prevFrameButton',
					icon: STEP_BACK_ICON,
					classes: 'icon-button video-button',
					onClick() {
						self[VIDEO].prevFrame();
					}
				}, {
					control: Button,
					id: 'playPauseButton',
					icon: PLAY_ICON,
					classes: 'icon-button video-button play-pause',
					onClick() {
						if (self[VIDEO].isPlaying) {
							self[VIDEO].pause();
						}
						else {
							self[VIDEO].play();
						}
					}
				}, {
					control: Button,
					id: 'nextFrameButton',
					icon: STEP_FORWARD_ICON,
					classes: 'icon-button video-button',
					onClick() {
						self[VIDEO].nextFrame();
					}
				}],
				secondViewContent: {
					control: TextInput,
					id: 'titleControl',
					isActionButtonEnabled: false,
					actionButtonIcon: '',
					width: '100%',
					onBlur(textInput) {
						self[updateTitle](this.value());
					},
					onEnter(textInput) {
						self[updateTitle](this.value());
					}
				}
			},
			secondViewContent: [{
				control: Button,
				icon: VOLUME_ICON,
				classes: 'icon-button video-button',
				onClick(button) {
					if (button.icon() === VOLUME_ICON) {
						button.icon(MUTED_ICON);
						self[VIDEO].muted(true);
					}
					else {
						button.icon(VOLUME_ICON);
						self[VIDEO].muted(false);
					}
				}
			}, {
				control: Slider,
				min: 0,
				max: 100,
				increment: 1,
				value: [100],
				classes: 'volume-slider',
				width: '7rem',
				buildTooltip: (value) => value + '%',
				onSlide(value) {
					self[VIDEO].volume(value[0] / 100);
				}
			}]
		});

		const self = this;
		self.addClass('video-controls');
	}

	[updateControls](isPaused) {
		const self = this;

		self.get('prevFrameButton').isEnabled(isPaused);
		self.get('nextFrameButton').isEnabled(isPaused);
		self.get('playPauseButton').icon(isPaused ? PLAY_ICON : PAUSE_ICON);
	}

	[updateTitle](value) {
		const self = this;

		value = value.trim();

		if (value !== self.title()) {
			self.onEditTitle()(value);
			self.title(value);
		}
	}

	video(video) {
		const self = this;

		self[VIDEO] = video;

		self[VIDEO]
			.onPlay(() => self[updateControls](false))
			.onPause(() => self[updateControls](true));
	}
}

Object.assign(VideoControls.prototype, {
	title: method.string({
		set(title) {
			this.get('titleControl').value(title);
		}
	}),
	onEditTitle: method.function()
});

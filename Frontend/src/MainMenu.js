import { FilePicker, locale, SplitView } from 'hafgufa';
import { applySettings, method } from 'type-enforcer';
import api from './api';
import VideoFile from './VideoFile';

const updateVideoView = Symbol();
const uploadVideo = Symbol();
const selectCurrentVideo = Symbol();

export default class MainMenu extends SplitView {
	constructor(settings) {
		settings = {
			...settings,
			orientation: SplitView.ORIENTATION.ROWS,
			height: '100%',
			splitOffset: '-8rem',
			secondViewContent: [{
				control: FilePicker,
				isVideo: true,
				previewSize: FilePicker.PREVIEW_SIZES.SMALL,
				width: '100%',
				title: locale.get('uploadNewVideo'),
				isMulti: false,
				headingIcon: '',
				mimeTypes: ['video/mp4', 'video/x-msvideo'],
				onSave(data) {
					self[uploadVideo](data, this);
				}
			}]
		};

		super(settings);

		const self = this;
		self.isWorking(true);

		applySettings(self, settings, [], ['data']);

		api.onChange(() => {
			self.isWorking(true);
		});

		self.resize();
	}

	[uploadVideo](data, filePicker) {
		const self = this;

		filePicker.isWorking(true);

		api.uploadVideo(data, (progressEvent) => {
				if (progressEvent.loaded < progressEvent.total) {
					filePicker.subTitle(Math.round((progressEvent.loaded / progressEvent.total) * 100) + '%');
				}
				else {
					filePicker.subTitle(locale.get('processing'));
				}
			})
			.then(() => {
				filePicker.value([]).subTitle('').isWorking(false);
				self.isWorking(true);
				self.onUploadComplete()();
			});
	}

	[updateVideoView](data) {
		const self = this;

		self.firstView().content(data.map((video) => {
			return {
				control: VideoFile,
				id: video.id,
				title: video.name,
				ext: video.ext,
				length: video.duration,
				fps: video.fps,
				entities: video.entities,
				onSelect() {
					self.firstView().each((control) => {
						control.removeClass('selected');
					});

					self.onSelect()(this);
					this.classes('selected', true);
				},
				onDelete() {
					self.isWorking(true);
					api.deleteVideo(this.id())
						.then(() => {
							self.onDelete()(this);
						});
				}
			};
		}));
	}

	[selectCurrentVideo]() {
		const self = this;

		if (self.currentVideo() && self.data().length) {
			const videoFile = self.get(self.currentVideo());

			if (videoFile) {
				videoFile.click();
			}
		}
	}
}

Object.assign(MainMenu.prototype, {
	data: method.array({
		init: [],
		set(data) {
			const self = this;

			self.isWorking(false);
			self[updateVideoView](data);
			self[selectCurrentVideo]();
		}
	}),
	currentVideo: method.string({
		set() {
			this[selectCurrentVideo]();
		}
	}),
	onUploadComplete: method.function(),
	onSelect: method.function(),
	onDelete: method.function()
});

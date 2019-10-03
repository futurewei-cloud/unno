import { FilePicker, locale, SplitView } from 'hafgufa';
import { applySettings, method } from 'type-enforcer';
import api from './api';
import VideoFile from './VideoFile';

const DATA = Symbol();
const CURRENT_VIDEO = Symbol();

const updateVideoView = Symbol();
const loadVideos = Symbol();
const uploadVideo = Symbol();

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
		self[DATA] = [];
		self[loadVideos]();

		applySettings(self, settings);

		api.onChange(() => {
			self.isWorking(true);
			self[loadVideos]();
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
				self[loadVideos]();
			});
	}

	[updateVideoView]() {
		const self = this;

		self.firstView().content(self[DATA].map((video) => {
			return {
				control: VideoFile,
				id: video.id.toString(),
				title: video.name,
				ext: video.ext,
				length: video.duration,
				fps: video.fps,
				entities: video.entities,
				onSelect() {
					self.firstView().each((control) => {
						control.removeClass('selected');
					});

					self.onSelect().call(this, video);
					this.classes('selected', true);
					self[CURRENT_VIDEO] = video.id;
				},
				onDelete() {
					self.isWorking(true);
					api.deleteVideo(video.id)
						.then(() => {
							self.onDelete().call(self, video);
						});
				}
			};
		}));
	}

	[loadVideos]() {
		const self = this;

		self[updateVideoView]();

		return api.getVideos()
			.then((videos) => {
				self.isWorking(false);
				self[DATA] = videos;
				self[updateVideoView]();

				if (self[DATA].length) {
					self.get(self[CURRENT_VIDEO] || self[DATA][0].id.toString()).click();
				}
			});
	}
}

Object.assign(MainMenu.prototype, {
	onSelect: method.function(),
	onDelete: method.function()
});

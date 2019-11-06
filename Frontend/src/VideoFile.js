import { debounce } from 'async-agent';
import { ContextMenuMixin, Control, DELETE_ICON, Description, EDIT_ICON, Group, locale, OnClickMixin, VIDEO_FILE_ICON } from 'hafgufa';
import moment from 'moment';
import { applySettings, method } from 'type-enforcer';
import './VideoFile.less';

const EXTENSION = 'extensionId';
const LENGTH = 'lengthId';
const ANNOTATIONS = 'annotationsId';
const FPS = 'fpsId';

const GROUP = Symbol();

export default class VideoFile extends ContextMenuMixin(OnClickMixin(Control)) {
	constructor(settings = {}) {
		const group = new Group({
			title: locale.get('loading')
		});
		settings.element = group.element();

		super(settings);

		const self = this;
		self.addClass('video-file');
		self[GROUP] = group;

		const debouncedDelete = debounce(() => {
			self.onDelete()();
		}, 100);

		self
			.width('100%')
			.onClick(() => self.onSelect()())
			.contextMenu([{
				id: 'select',
				title: 'Select',
				icon: EDIT_ICON,
				onSelect() {
					self.onSelect()();
				}
			}, {
				id: 'delete',
				title: 'Delete',
				icon: DELETE_ICON,
				onSelect() {
					debouncedDelete();
				}
			}])
			.isWorking(true);

		applySettings(self, settings, ['title']);
	}
	
	isWorking(isWorking) {
		return this[GROUP].isWorking(isWorking);
	}
}

Object.assign(VideoFile.prototype, {
	title: method.string({
		set(title) {
			this[GROUP]
				.headingIcon(VIDEO_FILE_ICON)
				.title(title)
				.content([{
					control: Description,
					singleLine: true,
					id: LENGTH,
					title: locale.get('videoLength') + ':',
					width: '72%',
					value: '-'
				}, {
					control: Description,
					singleLine: true,
					id: FPS,
					title: locale.get('fps') + ':',
					width: '27%',
					value: '-'
				}, {
					control: Description,
					singleLine: true,
					id: ANNOTATIONS,
					title: locale.get('entities') + ':',
					width: '62%',
					value: '-'
				}, {
					control: Description,
					singleLine: true,
					id: EXTENSION,
					title: locale.get('videoExtension') + ':',
					width: '37%',
					value: '-'
				}]);

			this.isWorking(false);
		}
	}),
	ext: method.string({
		set(ext) {
			const description = this[GROUP].get(EXTENSION);

			if (description) {
				description.value(ext);
			}
		}
	}),
	length: method.integer({
		set(length) {
			const description = this[GROUP].get(LENGTH);

			if (description) {
				description.value(moment.utc(length).format('HH:mm:ss.SSS'));
			}
		}
	}),
	entities: method.integer({
		set(entities) {
			const description = this[GROUP].get(ANNOTATIONS);

			if (description) {
				description.value(entities + '');
			}
		}
	}),
	fps: method.integer({
		set(fps) {
			const description = this[GROUP].get(FPS);

			if (description) {
				description.value(fps + '');
			}
		}
	}),
	onSelect: method.function(),
	onDelete: method.function()
});

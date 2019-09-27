import {
	ContextMenuMixin,
	Control,
	DELETE_ICON,
	Description,
	EDIT_ICON,
	Group,
	locale,
	OnClickMixin,
	VIDEO_FILE_ICON
} from 'hafgufa';
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
		self
			.width('100%')
			.onClick(() => self.onSelect().call(self))
			.contextMenu([{
				id: 'select',
				title: 'Select',
				icon: EDIT_ICON,
				onSelect() {
					self.onSelect().call(self);
				}
			}, {
				id: 'delete',
				title: 'Delete',
				icon: DELETE_ICON,
				onSelect() {
					self.onDelete()();
				}
			}])
			.isWorking(true);

		applySettings(self, settings, ['title']);
	}

	title(title) {
		const sep = title.lastIndexOf('.');
		const extension = sep === -1 ? '-' : title.substring(title.lastIndexOf('.') + 1);

		title = sep === -1 ? title : title.substring(0, title.lastIndexOf('.'));

		this[GROUP]
			.headingIcon(VIDEO_FILE_ICON)
			.title(title)
			.content([{
				control: Description,
				singleLine: true,
				id: LENGTH,
				title: locale.get('videoLength') + ':',
				width: '60%',
				value: '-'
			}, {
				control: Description,
				singleLine: true,
				id: EXTENSION,
				title: locale.get('videoExtension') + ':',
				width: '39%',
				value: extension
			}, {
				control: Description,
				singleLine: true,
				id: ANNOTATIONS,
				title: locale.get('entities') + ':',
				width: '60%',
				value: '-'
			}, {
				control: Description,
				singleLine: true,
				id: FPS,
				title: locale.get('fps') + ':',
				width: '39%',
				value: '-'
			}]);

		this.isWorking(false);
	}

	length(length) {
		const description = this[GROUP].get(LENGTH);

		if (description) {
			description.value(moment.utc(length).format('HH:mm:ss'));
		}
	}

	entities(entities) {
		const description = this[GROUP].get(ANNOTATIONS);

		if (description) {
			description.value(entities + '');
		}
	}

	fps(fps) {
		const description = this[GROUP].get(FPS);

		if (description) {
			description.value(fps + '');
		}
	}

	isWorking(isWorking) {
		return this[GROUP].isWorking(isWorking);
	}
}

Object.assign(VideoFile.prototype, {
	onSelect: method.function(),
	onDelete: method.function()
});

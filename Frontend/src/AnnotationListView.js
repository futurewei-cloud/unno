import { defer } from 'async-agent';
import { Group, VirtualList } from 'hafgufa';
import { HUNDRED_PERCENT, method } from 'type-enforcer-ui';
import AnnotationListItem from './AnnotationListItem';
import './AnnotationListView.less';

const VIRTUAL_LIST = Symbol();
const ANNOTATION_MANAGER = Symbol();

export default class AnnotationListView extends Group {
	constructor(settings = {}) {
		settings.title = 'Annotations';

		super(settings);

		const self = this;
		self.addClass('annotation-list');

		self[ANNOTATION_MANAGER] = settings.annotationManager;

		self[VIRTUAL_LIST] = new VirtualList({
			container: self,
			width: '18rem',
			height: HUNDRED_PERCENT,
			itemControl: AnnotationListItem,
			itemSize: '6rem',
			itemDefaultSettings: {
				annotationManager: self[ANNOTATION_MANAGER],
				onMouseEnter(id) {
					self.onMouseEnter()(id);
				},
				onMouseLeave() {
					self.onMouseEnter()(null);
				},
				onDelete(id) {
					self[ANNOTATION_MANAGER].delete(id);
				}
			},
			onItemRender(control, data) {
				control.id(data.id)
					.jobId(data.jobId)
					.entity(data.entityId);

				defer(() => control.resize(true));
			}
		});
	}

	value(value) {
		const self = this;

		if (self[VIRTUAL_LIST]) {
			self[VIRTUAL_LIST].itemData(value);
			self.resize(true);
		}
	}

	highlight(id) {
		const self = this;

		if (self[VIRTUAL_LIST]) {
			self[VIRTUAL_LIST].getRenderedControls().forEach((control) => {
				control.classes('highlight', control.id() === id);
			});
		}
	}
}

Object.assign(AnnotationListView.prototype, {
	onMouseEnter: method.function()
});

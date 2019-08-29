import { event } from 'd3';
import { ContextMenuMixin, ControlRecycler, DELETE_ALL_ICON, DELETE_ICON, Div } from 'hafgufa';
import shortid from 'shortid';
import { method, Point } from 'type-enforcer';
import Annotation from './Annotation';
import './Annotator.less';

const percent = (size1, size2) => {
	return (size1 / size2) * 100 + '%';
};

const HEIGHT = Symbol();
const WIDTH = Symbol();
const START = Symbol();
const CURRENT_ANNOTATION = Symbol();
const CONTROLS = Symbol();

const startDrawing = Symbol();
const updateDrawing = Symbol();
const stopDrawing = Symbol();

export default class Annotator extends ContextMenuMixin(Div) {
	constructor(settings) {
		super(settings);

		const self = this;
		self.addClass('annotator');

		self[CONTROLS] = new ControlRecycler({
			control: Annotation,
			defaultSettings: {
				container: self
			}
		});

		self.contextMenu([{
			ID: 'deleteAllAnnotations',
			title: 'Delete all annotations',
			icon: DELETE_ALL_ICON,
			onSelect() {
				self.onDeleteAllAnnotations()();
			}
		}]);

		self.on('mousedown', () => {
			event.preventDefault();
			event.stopPropagation();
			self[startDrawing]();

			self.on('mousemove', () => {
					event.preventDefault();
					event.stopPropagation();
					self[updateDrawing]();
				})
				.on('mouseup', () => {
					event.preventDefault();
					event.stopPropagation();
					self[stopDrawing]();

					self.off('mousemove')
						.off('mouseup');
				});
		});
	}

	[startDrawing]() {
		const self = this;

		self[HEIGHT] = self.borderHeight();
		self[WIDTH] = self.borderWidth();
		self[START] = new Point(event.offsetX, event.offsetY);

		self[CURRENT_ANNOTATION] = self[CONTROLS].getRecycledControl();
		self[CURRENT_ANNOTATION]
			.container(self)
			.isDrawing(true)
			.ID(shortid.generate());

		self[updateDrawing]();
	}

	[updateDrawing]() {
		const self = this;

		self[CURRENT_ANNOTATION]
			.top(percent(Math.min(self[START].y, event.offsetY), self[HEIGHT]))
			.left(percent(Math.min(self[START].x, event.offsetX), self[WIDTH]))
			.width(percent(Math.abs(event.offsetX - self[START].x), self[WIDTH]))
			.height(percent(Math.abs(event.offsetY - self[START].y), self[HEIGHT]));
	}

	[stopDrawing]() {
		const self = this;

		self[CURRENT_ANNOTATION].isDrawing(false);

		if (self[CURRENT_ANNOTATION].borderWidth() < 10 && self[CURRENT_ANNOTATION].borderHeight() < 10) {
			self[CONTROLS].discardControl(self[CURRENT_ANNOTATION].ID());
		}
		else {
			self.onAdd()(self[CURRENT_ANNOTATION]);
		}
	}

	value(value) {
		const self = this;

		self[CONTROLS].discardAllControls();

		value.forEach((annotation) => {
			self[CONTROLS]
				.getRecycledControl()
				.container(self)
				.ID(annotation.resultId)
				.bbox(annotation.bbox)
				.contextMenu([{
					ID: 'deleteThisAnnotation',
					title: 'Delete this annotation',
					icon: DELETE_ICON,
					onSelect() {
						self.onDeleteAnnotation()(annotation.resultId);
					}
				}]);
		});
	}
}

Object.assign(Annotator.prototype, {
	onChange: method.function(),
	onAdd: method.function(),
	onDeleteAnnotation: method.function(),
	onDeleteAllAnnotations: method.function()
});

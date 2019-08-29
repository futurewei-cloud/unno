import { ContextMenuMixin, Div, round } from 'hafgufa';
import './Annotation.less';

const percentsToRatios = Symbol();
const ratiosToPercents = Symbol();

export default class Annotation extends ContextMenuMixin(Div) {
	constructor(settings) {
		super(settings);

		const self = this;
		self.addClass('annotation')
			.on('mouseenter', () => {
				self.css('z-index', '1');
			})
			.on('mouseleave', () => {
				self.css('z-index', null);
			});
	}

	[percentsToRatios](value) {
		return value.map((percent) => round(parseFloat(percent) / 100, 6));
	}

	[ratiosToPercents](value) {
		return value.map((ratio) => parseFloat(ratio) * 100 + '%');
	}

	top(value) {
		if (value !== undefined) {
			this.css('top', value);
			return this;
		}

		return this.css('top');
	}

	left(value) {
		if (value !== undefined) {
			this.css('left', value);
			return this;
		}

		return this.css('left');
	}

	bbox(value) {
		const self = this;

		if (value) {
			value = self[ratiosToPercents](value.split(','));

			self.left(value[0]);
			self.top(value[1]);
			self.width(value[2]);
			self.height(value[3]);

			return this;
		}

		return self[percentsToRatios]([self.left(), self.top(), self.width().toString(), self.height().toString()]).join(',');
	}

	isDrawing(value) {
		this.css('pointer-events', value ? 'none' : 'auto');

		return this;
	}
}

import { Button, ContextMenuMixin, Control, DELETE_ICON, MOUSE_ENTER_EVENT, MOUSE_LEAVE_EVENT, Picker, TextInput } from 'hafgufa';
import Dialog from 'hafgufa/src/ui/layout/Dialog';
import locale from 'hafgufa/src/utility/locale';
import { applySettings, AUTO, method } from 'type-enforcer';
import './AnnotationListItem.less';

const ANNOTATION_MANAGER = Symbol();
const CATEGORY_OPTIONS = Symbol();
const CATEGORY_PICKER = Symbol();
const ENTITY_OPTIONS = Symbol();
const ENTITY_PICKER = Symbol();
const PREDICT_BUTTON = Symbol();

const updateCategories = Symbol();
const updateEntities = Symbol();
const setEntityOptions = Symbol();
const updatePredictButton = Symbol();

export default class AnnotationListItem extends ContextMenuMixin(Control) {
	constructor(settings = {}) {
		super(settings);

		const self = this;
		self.addClass('annotation-list-item');

		self[ANNOTATION_MANAGER] = settings.annotationManager;

		self
			.on(MOUSE_ENTER_EVENT, () => {
				self.onMouseEnter()(self.id());
			})
			.on(MOUSE_LEAVE_EVENT, () => {
				self.onMouseLeave()(self.id());
			})
			.contextMenu([{
				id: 'delete',
				title: 'Delete',
				icon: DELETE_ICON,
				onSelect() {
					self.onDelete()(self.id());
				}
			}]);

		self[ENTITY_PICKER] = new Picker({
			container: self,
			width: '45%',
			height: AUTO,
			title: 'Entity',
			canUnselect: false,
			onChange(value) {
				if (value[0].id !== self.entity()) {
					self[ANNOTATION_MANAGER].updateAnnotation({
						id: self.id(),
						entityId: value[0].id
					});
				}
			},
			onEdit(item) {
				let name = item.title;

				let dialog = new Dialog({
					title: locale.get('edit') + ' ' + name,
					anchor: this.element(),
					width: '20rem',
					height: '11rem',
					content: {
						control: TextInput,
						id: 'nameInput',
						title: 'Name',
						value: item.title,
						minLength: 1,
						onChange(value) {
							name = value;
						}
					},
					footer: {
						buttons: [{
							label: locale.get('done'),
							onClick() {
								dialog.remove();
							}
						}]
					},
					onRemove() {
						if (name && name !== item.title) {
							self[ANNOTATION_MANAGER].updateEntity({
								id: item.id,
								name: name
							});
						}

						dialog = null;
					}
				});

				dialog.get('nameInput').isFocused(true);
			}
		});

		self[CATEGORY_PICKER] = new Picker({
			container: self,
			width: '45%',
			height: AUTO,
			title: 'Category',
			onChange(value) {
				self[ANNOTATION_MANAGER].updateEntity({
					id: self[ENTITY_PICKER].value()[0].id,
					category: value[0].id
				});
			}
		});

		self[PREDICT_BUTTON] = new Button({
			container: self,
			label: 'Predict',
			icon: '',
			classes: 'action-button',
			isVisible: false,
			onClick() {
				this.isEnabled(false);
				self[ANNOTATION_MANAGER].predict(self.id());
			}
		});

		applySettings(self, settings);

		self[ANNOTATION_MANAGER]
			.onCategoriesChange((categories) => {
				self[updateCategories](categories);
			})
			.onEntitiesChange((entities) => {
				self[updateEntities](entities);
			})
			.onUpdate((annotation) => {
				if (annotation.id === self.id()) {
					self.jobId(annotation.jobId);
				}
			})
			.onJobChange((jobId, status) => {
				if (jobId === self.jobId()) {
					this[updatePredictButton](status);
				}
			});

		self[updateCategories](self[ANNOTATION_MANAGER].categories());
		self[updateEntities](self[ANNOTATION_MANAGER].entities());
	}

	[updateCategories](categories) {
		const self = this;

		self[CATEGORY_OPTIONS] = categories.map((category) => {
			return {
				title: category.name,
				subTitle: category.parent,
				id: category.id
			};
		});

		self[CATEGORY_PICKER].options(self[CATEGORY_OPTIONS]);
	}

	[updateEntities](entities) {
		const self = this;
		let currentEntityId = self.entity();

		self[ENTITY_OPTIONS] = entities.map((entity) => {
			if (entity.id === currentEntityId) {
				self[CATEGORY_PICKER].value(entity.category);
			}

			return {
				title: entity.name || `entity ${entity.id}`,
				subTitle: '(id: ' + entity.id + ')',
				id: entity.id
			};
		});

		self[setEntityOptions]();
	}

	[setEntityOptions]() {
		const self = this;
		const isPredictable = self.jobId() === null;
		let currentEntityId = self.entity();

		self[ENTITY_PICKER].options(self[ENTITY_OPTIONS].filter((option) => {
			return isPredictable || option.id === currentEntityId;
		}));
	}

	[updatePredictButton](status) {
		const self = this;

		if (status === undefined) {
			status = self[ANNOTATION_MANAGER].jobStatus(self.id());
		}
		if (status === 'done') {
			status = null;
		}

		self[PREDICT_BUTTON]
			.isVisible(self.jobId() === null || !!status)
			.isEnabled(!status)
			.label(status ? 'Predicting...' : 'Predict');

		self[setEntityOptions]();
	}
}

Object.assign(AnnotationListItem.prototype, {
	entity: method.string({
		set(id) {
			const self = this;
			let category = self[ANNOTATION_MANAGER].entities().find({id: id});

			if (category) {
				category = category.category;
			}

			if (!category || category === '0') {
				category = null;
			}

			self[ENTITY_PICKER].value(id);
			self[CATEGORY_PICKER].value(category);

			self[setEntityOptions]();
			self[updatePredictButton]();
		}
	}),
	jobId: method.string({
		other: null,
		set() {
			this[updatePredictButton]();
		}
	}),
	onMouseEnter: method.function(),
	onMouseLeave: method.function(),
	onDelete: method.function()
});

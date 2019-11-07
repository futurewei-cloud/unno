import { Div, GroupedButtons, locale, Section, theme } from 'hafgufa';
import { forOwnReduce } from 'object-agent';
import { HUNDRED_PERCENT } from 'type-enforcer-ui';

export default class SettingsView extends Div {
	constructor(settings = {}) {
		super(settings);

		const languageOptions = forOwnReduce(locale.languages(), (result, abbr, lang) => {
			result.push({
				label: locale.get(lang.toLowerCase()),
				id: abbr,
				isSelected: abbr === locale.language()
			});
			return result;
		}, []);

		this.content([{
			control: Section,
			title: locale.get('settings'),
			canCollapse: false,
			content: [{
				control: GroupedButtons,
				title: locale.get('theme'),
				width: HUNDRED_PERCENT,
				headingIcon: '',
				value: theme.theme(),
				buttons: [{
					label: locale.get('light'),
					id: 'hud_01.light'
				}, {
					label: locale.get('dark'),
					id: 'hud_01.dark'
				}],
				onChange(value) {
					theme.theme(value);
				}
			}, {
				control: GroupedButtons,
				buttons: languageOptions,
				width: HUNDRED_PERCENT,
				title: locale.get('language'),
				headingIcon: '',
				isSelectable: true,
				value: locale.language(),
				onChange(value) {
					locale.language(value);
				}
			}]
		}]);
	}
}

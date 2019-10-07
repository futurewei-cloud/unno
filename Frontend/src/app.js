import { Container, DrawerMenu, Header, Heading, HEADING_LEVELS, Label, locale, theme } from 'hafgufa';
import { AUTO, HUNDRED_PERCENT } from 'type-enforcer';
import api from './api';
import './app.less';
import EditView from './EditView';
import MainMenu from './MainMenu';
import SettingsView from './SettingsView';

const MAIN_CONTAINER = Symbol();
const EDIT_VIEW = Symbol();
const HEADER = Symbol();
const supportedLanguages = {
	English: 'en-US',
	Chinese: 'zh-ch'
};

const mimeTypes = {
	'mp4': 'video/mp4',
	'avi': 'video/x-msvideo'
};

class App {
	constructor() {
		const self = this;

		self[MAIN_CONTAINER] = new Container({
			container: document.body,
			height: HUNDRED_PERCENT,
			margin: '3rem 0 0'
		});

		theme
			.path('[name].[env].min.css')
			.themes(['hud_01.dark', 'hud_01.light'])
			.theme('hud_01.dark');

		locale
			.onLanguageChange(function() {
				this.load('localization/common', 'localization/main')
					.then(() => {
						self.buildEditView();
						self.buildHeader();
					});
			})
			.languages(supportedLanguages);
	}

	buildHeader() {
		const self = this;

		if (self[HEADER]) {
			self[HEADER].remove();
		}

		self[HEADER] = new Header({
			container: document.body,
			content: [{
				control: DrawerMenu,
				menuContainer: self[MAIN_CONTAINER].element(),
				headerControl: MainMenu,
				headerSettings: {
					height: HUNDRED_PERCENT,
					onSelect(video) {
						const videoFile = this;

						if (self[EDIT_VIEW].videoId() !== video.id) {
							self[EDIT_VIEW]
								.source(api.getVideoLink(video.id))
								.title(video.name)
								.ext(video.ext)
								.videoId(video.id)
								.fps(video.fps)
								.duration(video.duration)
								.onEntitiesChange((entities) => {
									videoFile.entities(entities);
								});
						}
					},
					onDelete(video) {
						if (video.id === self[EDIT_VIEW].videoId()) {
							self[EDIT_VIEW].source('')
								.title('-')
								.videoId('');
						}
					}
				}
			}, {
				control: Heading,
				level: HEADING_LEVELS.ONE,
				width: AUTO,
				icon: ':',
				title: locale.get('appTitle'),
				subTitle: '&nbsp;'
			}, {
				control: Label,
				content: locale.get('appSubTitle').replace(' ', '<br>'),
				classes: 'main-sub-title'
			}, {
				control: DrawerMenu,
				isMenuOpen: false,
				menuContainer: self[MAIN_CONTAINER].element(),
				icon: 'cog',
				label: locale.get('settings'),
				drawerDock: 'right',
				addClass: 'align-right',
				headerControl: SettingsView,
				headerSettings: {
					height: '100%'
				}
			}]
		});
	}

	buildEditView() {
		const self = this;

		if (self[EDIT_VIEW]) {
			self[EDIT_VIEW].remove();
		}

		self[EDIT_VIEW] = new EditView({
			container: self[MAIN_CONTAINER],
			height: '100%',
			onEditTitle(title) {
				api.patchVideo(self[EDIT_VIEW].videoId(), title + '.' + self[EDIT_VIEW].ext());
			}
		});
	}
}

new App();

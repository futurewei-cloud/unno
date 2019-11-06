import { defer } from 'async-agent';
import { Container, DrawerMenu, Header, Heading, HEADING_LEVELS, Label, locale, theme } from 'hafgufa';
import { AUTO, HUNDRED_PERCENT } from 'type-enforcer';
import api from './api';
import './app.less';
import EditView from './EditView';
import MainMenu from './MainMenu';
import SettingsView from './SettingsView';

const MAIN_CONTAINER = Symbol();
const MAIN_MENU = Symbol();
const EDIT_VIEW = Symbol();
const HEADER = Symbol();
const DATA = Symbol();
const CURRENT_VIDEO = Symbol();
const MAIN_MENU_ID = 'mainMenu';
const supportedLanguages = {
	English: 'en-US',
	Chinese: 'zh-ch'
};

class App {
	constructor() {
		const self = this;

		self[DATA] = [];

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

		self.loadVideoData();

		api.onChange(() => {
			self.loadVideoData();
		});
	}

	loadVideoData() {
		const self = this;

		return api.getVideos()
			.then((videos) => {
				self[DATA] = videos;

				if (!self[CURRENT_VIDEO]) {
					self[CURRENT_VIDEO] = videos[0].id;
				}

				if (self[MAIN_MENU]) {
					self[MAIN_MENU].data(self[DATA])
						.currentVideo(self[CURRENT_VIDEO]);
				}
			});
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
					id: MAIN_MENU_ID,
					onSelect(videoFile) {
						self[CURRENT_VIDEO] = videoFile.id();

						if (self[EDIT_VIEW].videoId() !== self[CURRENT_VIDEO]) {
							self[EDIT_VIEW]
								.source(api.getVideoLink(self[CURRENT_VIDEO]))
								.title(videoFile.title())
								.ext(videoFile.ext())
								.videoId(self[CURRENT_VIDEO])
								.fps(videoFile.fps())
								.duration(videoFile.length())
								.onEntitiesChange((entities) => {
									videoFile.entities(entities);
								});
						}
					},
					onDelete(videoFile) {
						if (videoFile.id() === self[CURRENT_VIDEO]) {
							self[CURRENT_VIDEO] = '';
							self[MAIN_MENU].currentVideo(self[CURRENT_VIDEO]);
						}
					},
					onUploadComplete() {
						self.loadVideoData()
							.then(() => {
								if (self[DATA].length) {
									self[CURRENT_VIDEO] = self[DATA][self[DATA].length - 1].id;
									self[MAIN_MENU]
										.currentVideo(self[CURRENT_VIDEO]);
								}
							});
					}
				},
				onMenuSlide(isOpen) {
					defer(() => {
						self[MAIN_MENU] = self[MAIN_CONTAINER].get(MAIN_MENU_ID);

						if (self[MAIN_MENU]) {
							self[MAIN_MENU]
								.currentVideo(self[CURRENT_VIDEO])
								.data(self[DATA]);
						}
					});
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

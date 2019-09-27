const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const ThemesPlugin = require('less-themes-webpack-plugin');
const WebpackMildCompile = require('webpack-mild-compile').Plugin;
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: './src/app.js',
	devServer: {port: '8083'},
	output: {
		path: path.resolve(__dirname, '../BackendManager/FrontendProd'),
		filename: 'app.js'
	},
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			title: 'Unno'
		}),
		new CopyPlugin([{
			context: 'node_modules/hafgufa/',
			from: 'localization/*.json',
			to: ''
		}, {
			from: 'localization/*.json',
			to: ''
		}]),
		new ThemesPlugin({
			themesPath: './node_modules/hafgufa/src/ui/themes/hud_01',
			themes: {
				'hud_01': {
					include: ['light'],
					dark: {
						include: ['dark'],
						mobile: [],
						desktop: ['desktop.less']
					},
					light: {
						mobile: [],
						desktop: ['desktop.less']
					}
				}
			}
		}),
		new WebpackMildCompile()
	],
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /node_modules\/(?!hafgufa)/,
			use: {
				loader: 'babel-loader'
			}
		}]
	},
	stats: {
		colors: true
	}
};

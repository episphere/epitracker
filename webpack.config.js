const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		/**
		 * The entry point of the application. It's a starting point for Webpack to
		 * begin building the dependency graph and bundling our application. Webpack
		 * traverses the dependency tree starting from this entry file, ensuring that
		 * all required modules and dependencies are included in the final bundle.
		 *
		 * Import styles and javascript in this file. Loaders will inject the styles
		 * and script during builds.
		 *
		 * See src/index.js for more information on styles and scripts.
		 */
		entry: {
			main: './src/index.js',
			quantiles: './src/logic/quantilePage.js',
		},

		/**
		 * The output configuration defines how Webpack should handle the generated
		 * output files, such as bundled JavaScript files and other assets, and where
		 * they should be emitted.
		 */
		output: {
			// Absolute path of output directory of generated files.
			path: path.resolve(__dirname, 'dist'),
			// Filename pattern for generated javascript bundles.
			filename: '[name].bundle.js',
			// Filename pattern for generated assets.
			assetModuleFilename: 'assets/[name][ext]',
			// Clears out the output directory before generated new files.
			clean: true,
		},

		devtool: isProduction ? false : 'source-map', 

		module: {
			rules: [
				{
					test: /\.(scss|css)$/,
					use: [
						/**
						 * The mini-css-extract-plugin is used for production builds. It
						 * extracts CSS into separate files. The extracted CSS files are then
						 * used by the html-webpack-plugin to inject a <link> tag into the
						 * HTML file during the build process.
						 */
						MiniCssExtractPlugin.loader,

						/**
						 * css-loader interprets and resolves css imports and dependencies
						 */
						{
							loader: 'css-loader',
							options: {
								/*
								 * Source maps are generated to provide mapping between compiled
								 * code and original code for easier debugging
								 *
								 * This should only be turned on for dev builds.
								 */
								sourceMap: !isProduction,
							},
						},

						/**
						 * Add post css plugins, see postcss.config.js for more details.
						 */
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: !isProduction,
							},
						},

						/**
						 * NCIDS CSS requires compiling your Sass with load paths using
						 * dart-sass.
						 *
						 * See https://sass-lang.com/documentation/at-rules/use#load-paths
						 */
						{
							loader: 'sass-loader',
							options: {
								sassOptions: {
									includePaths: [
										// Includes path to /packages directory for NCIDS packages.
										path.join(__dirname, './node_modules/@nciocpl/ncids-css/packages'),
										// Includes path to /uswds-packages directory for USWDS packages.
										path.join(__dirname, './node_modules/@nciocpl/ncids-css/uswds-packages'),
									],
								},
								sourceMap: !isProduction,
							},
						},
					],
				},

				/**
				 * The asset/inline type rule for SVG files allows them to be handled as
				 * inline data URLs.
				 *
				 * Imported SVGs will be transformed into data URLs and inlined directly
				 * into the bundle, reducing the number of separate network requests
				 * needed to load the SVG images.
				 *
				 * This configuration will set a filesize limit to 8192 bytes. Anything
				 * larger will be copied to the dist folder.
				 */
				{
					test: /\.svg/,
					type: 'asset/inline',
					parser: {
						dataUrlCondition: {
							maxSize: 8192,
						},
					},
				},

				{
					test: /\.html$/i,
					use: [
						{
							loader: 'html-loader',
						},
						{
							loader: 'posthtml-loader',
							options: {
								plugins: [
								require('posthtml-include')({ root: path.join(__dirname, 'src') }),
								],
							},
						},
					],
				},

				{
					test: /\.(png|jpg|jpeg|gif)$/i, 
					type: 'asset/resource',
					generator: {
						filename: 'images/[name][ext]' 
					}
				},

				{
          test: /.*/, 
          include: [
            path.resolve(__dirname, 'data') 
          ],
          type: 'asset/resource', 
          generator: {
            filename: 'data/[name][ext]'
          }
        }

				
			],
		},
		plugins: [
			/**
			 * HtmlWebpackPlugin generates HTML files with injected script and link
			 * tags, using the provided template and applies minification options if
			 * enabled.
			 *
			 * The current configuration is designed for demonstration purposes. This
			 * should not be used for multi-page applications.
			 */
			new HtmlWebpackPlugin({
				template: 'src/pages/index.html',
				inject: 'head',
				minify: false,
				meta: {
					charset: { charset: 'UTF-8' },
				},
				chunks: ['main']
			}),

			new HtmlWebpackPlugin({
				template: 'src/pages/quantiles.html',
				filename: 'quantiles/index.html', 
				inject: 'head',
				minify: false,
				meta: {
					charset: { charset: 'UTF-8' },
				},
				chunks: ['main', 'quantiles']
			}),
			

			/**
			 * MiniCssExtractPlugin extracts CSS into separate files for production
			 * builds. It generates CSS files that are then used by HtmlWebpackPlugin
			 * to inject a <link> tag into the HTML file.
			 */
			new MiniCssExtractPlugin({
				filename: '[name].css',
				chunkFilename: '[id].css',
			}),
		],
		optimization: isProduction
			? {
					minimize: true,
					minimizer: [
						/**
						 * CssMinimizerPlugin minimizes and optimizes CSS files.
						 * It uses safe CSS transformations to reduce file size and optimize
						 * performance.
						 */
						new CssMinimizerPlugin({
							minimizerOptions: {
								preset: [
									'default',
									{
										discardComments: { removeAll: true },
									},
								],
							},
						}),
					],
			  }
			: {},
	};
};
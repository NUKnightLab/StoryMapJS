const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = merge({
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist/js'),
        publicPath: '/dist/js/'
    },
    devServer: {
        static: [
            {
                directory: path.resolve(__dirname, 'src/template'),
                publicPath: '/'
            },
            {
                directory: path.resolve(__dirname, 'src/css'),
                publicPath: '/css'
            },
            {
                directory: path.resolve(__dirname, 'dist/css'),
                publicPath: '/dist/css'
            }
        ],
        hot: true,
        open: '/index.html',
        port: 8000,
        watchFiles: ['src/**/*'],
        devMiddleware: {
            writeToDisk: true
        }
    },
    module: {
        rules: [{
            test: /\.less$/,
            use: ['style-loader']
        }]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/template', to: path.resolve(__dirname, 'dist') }
            ]
        })
    ]
}, common)

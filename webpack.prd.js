const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const output_path = path.resolve(__dirname, "dist");

module.exports = merge({
    mode: 'production',
    devtool: 'source-map',
    devServer: {
        contentBase: ['./src/css'],
        contentBasePublicPath: ['/', '/css'],
        stats: 'verbose',
        openPage: "/index.html",
        disableHostCheck: true
    },
    module: {
        rules: [{
            test: /\.less$/,
            use: ['style-loader']
        }]
    },
    plugins: [
        //new HtmlWebpackPlugin({
        //    template: 'src/template/index.html'
        //})
        new CopyPlugin({
            patterns: [{
                from: path.join(output_path, 'js/storymap.js'),
                to: path.join(output_path, 'js/storymap-min.js')
            }]
        })
    ]
}, common)

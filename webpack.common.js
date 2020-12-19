const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const output_path = path.resolve(__dirname, "dist");
module.exports = {
    entry: "./src/js/index.js",
    optimization: {
        usedExports: true
    },
    output: {
        filename: "storymap.js",
        path: path.join(output_path, 'js'),
        library: "KLStoryMap" // https://webpack.js.org/configuration/output/#outputlibrary
    },
    plugins: [
        //new CopyPlugin([{
        //    from: "./source/js/language/locale/*.json",
        //    to: path.join(output_path, "js/locale"),
        //    flatten: true
        //}]),
        //new CopyPlugin([{
        //    from: './source/embed/*',
        //    to: path.join(output_path, "embed"),
        //    flatten: true
        //}]),
        new CleanWebpackPlugin({
            cleanStaleWebpackAssets: true
        }),
    ],
    module: {
        rules: [{
                test: /\.less$/,
                use: [{
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        }
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true,
                        }
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg|png)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: '../css/icons'
                    }
                }]
            }
        ]
    }
};

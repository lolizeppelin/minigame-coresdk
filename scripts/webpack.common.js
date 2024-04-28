const {resolve, PROJECT_PATH} = require('./constants');
const WebpackBar = require('webpackbar');
const DtsBundleWebpack = require('dts-bundle-webpack')
const {CleanWebpackPlugin} = require("clean-webpack-plugin");

module.exports = {
    // 定义了入口文件路径
    entry: {
        index: resolve(PROJECT_PATH, './index.ts'),
    },
    // 定义了编译打包之后的文件名以及所在路径。还有打包的模块类型
    output: {
        // 兼容小程序
        globalObject: "this",
        // 打包后的产物名
        filename: 'index.js',
        // 打包成umd模块
        libraryTarget: 'umd',
        // libraryExport: 'DeprecatedWeiXinDybSDK',
        // 路径
        path: resolve(PROJECT_PATH, './dist'),
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, '../src'),
            '@docs': resolve(__dirname, '../docs'),
            '@public': resolve(__dirname, '../public'),
        },
        extensions: ['.ts', '.tsx', '.js', '.d.ts'],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackBar({
            name: '正在卖力打包中~',
            color: '#fa8c16',
        }),
    ],
    module: {
        rules: [
            {
                test: /\.(js)$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(ts)$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};

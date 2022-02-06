const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const ProgressPlugin = require('progress-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    entry: './src/test-handler/main.ts',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'index.js',
        libraryTarget: 'commonjs2'
    },
    devtool: 'inline-source-map',
    externals: [nodeExternals()],
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader"
            }
        ]
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['.ts', '.js','.json'],
            exclude: 'node_modules'
        }),
        new ProgressPlugin(true)
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: true,
                    output: {
                        comments: false,
                        beautify: false
                    }
                }
            })
        ]
    }
}
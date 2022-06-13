'use strict';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

/**
 * @returns {import("webpack").Configuration}
 */
export default function (env, args) {
    return {
        mode: 'development',
        entry: {
            index: './src/index.ts',
        },
        output: { clean: true },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
            }),
            new MiniCssExtractPlugin(),
        ],
        resolve: { extensions: ['.ts', '...'] },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader' },
                    ]
                },
                {
                    test: /\.ts$/,
                    use: { loader: 'ts-loader' },
                },
                {
                    test: /\.(glsl|vert|frag)$/,
                    use: { loader: 'webpack-glsl-loader' },
                },
            ],
        },
        devServer: { hot: false },
        devtool: 'eval-source-map',
    }
}

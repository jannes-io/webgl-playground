const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    allowedHosts: 'all',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'webgl playground',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      // css
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // images
      {
        test: /\.(png|svg|jpg|jpeg|gif|hdr)$/i,
        type: 'asset/resource',
      },
      // fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // shaders
      {
        test: /\.(frag|vert)$/i,
        use: ['raw-loader'],
      },
      // 3d formats
      {
        test: /\.(obj)$/i,
        use: ['raw-loader'],
      },
      // typescript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    runtimeChunk: 'single',
  },
};

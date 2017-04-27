var path = require('path');
var webpack = require('webpack');
var fs = require('fs');

module.exports = {
  // devtool: process.env.WEBPACK_DEVTOOL || 'source-map',
  entry: [
      './js/vendor/mongoose.js',
      './index.js'
  ],

  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.js'
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      moment$:__dirname + "/js/vendor/moment/min/moment.min.js",
      jquery$:__dirname + "/js/vendor/jquery/dist/jquery.min.js"
    }
    /*alias: {
      jquery$:__dirname + "/node_modules/jquery/dist/jquery.min.js"
    }*/
  },

  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel-loader', query: {
        presets: ['react' ]
      }},
      { test: /(\.css$)/, loaders: ['style-loader', 'css-loader'] }, 
      { test: /\.(png|woff|woff2|eot|ttf|svg|gif)$/, loader: 'url-loader?limit=100000' }
    ]
  },

  plugins: [
    // new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
           $: "jquery",
           jQuery: "jquery"
       })
  ]
}

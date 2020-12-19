const path = require('path');

module.exports = {
  entry: ['./source/js/core/VCO.js', './source/js/VCO.StoryMap.js'],
  output: {
    filename: 'storymap.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

const path = require('path');

module.exports = {
  entry: ['./src/js/storymap/StoryMap.js'],
  output: {
    filename: 'storymap.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

# StoryMapJs


## Development

 See DEVELOPMENT.md to get setup for local development of StoryMap.


## Contributing language translations

StoryMap's older sibling, [TimelineJS](http://timeline.knightlab.com) has proven internationally popular, in part because users have contributed translation support for dozens of languages.  StoryMap is also ready to be used in languages other than English, but once again, we'll need your help.

For each language, we need a simple file with a name like `*xx*.js`, where *xx* is the two letter code for the language. (Technically, it's the ISO 639-1 code—you can find a [list of them on Wikipedia](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).) The file defines a Javascript object with language specific translations. To make one for your language, copy one of the existing files (like [this one for Spanish](https://github.com/NUKnightLab/StoryMapJS/blob/master/source/js/language/locale/es.js)) and edit the quoted strings. Please *don't* change the "keys"—the unquoted strings. If you know how to use GitHub to make a pull request, that's the best way to submit it to us. If that's not your thing, you can [add a comment to this support thread](https://knightlab.zendesk.com/entries/33066836-Help-us-translate-StoryMapJS-into-other-languages) and upload your translation as an attachment.


## GigaPixel

Images are rendered so when set to be map_as_image the entire image is shown. When set as cartography the zoom will set so that all the markers fit.

Points are set to only display on mouseover in image mode, but you can set map_as_image to false in the config options to always show the points. The points are hidden when the intent is an image so that nothing obstructs the image the viewer is looking at. Looking at a painting is hard with a bunch of points on it.


## Map Options
To disable connecting lines on maps use the StoryMap options: "Treat as Image" (as opposed to the default, "Treat as Cartography")

More config options available to do what you want with the line:

	line_follows_path:      true,		// Map history path follows default line, if false it will connect previous and current only
	line_color:             "#c34528",,
	line_color_inactive:    "#CCC",
	line_join:              "miter",
	line_weight:            3,
	line_opacity:           0.80,
	line_dash:              "5,5",
	show_lines:             true,
	show_history_line:      true,


To disable zoom calculation/edit zoom level set calculate_zoom to false in the config options.


Images can now be used in place of map pins.
Use `image` inside the location object and include a url to use. `use_custom_markers` also has to be set to `true` in the story map options. Same goes for custom icons except you need `icon` inside the location object and include a url to use.


## Troubleshooting

Users may be directed to our userinfo page to help with troubleshooting. This page provides information about the user's account and saved storymaps. The endpoint is `https://storymap.knightlab.com/userinfo/`

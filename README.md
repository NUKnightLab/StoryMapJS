#StoryMapJS: Maps that tell stories.

[StoryMapJS](http://storymap.knightlab.com) is a simple tool to help you tell stories with maps. If you're not a programmer, you don't need to spend much time on the GitHub page—instead, go [StoryMapJS](http://storymap.knightlab.com)

If you want information on creating JSON with your own code and embedding it, see the ["Advanced"](http://storymap.knightlab.com/advanced.html) documentation on the StoryMap website.

The rest of this document gets into a few technical details that some folks might want.

## Contributing translations for new languages

StoryMap's older sibling, [TimelineJS](http://timeline.knightlab.com) has proven internationally popular, in part because users have contributed translation support for dozens of languages.  StoryMap is also ready to be used in languages other than English, but once again, we'll need your help.

For each language, we need a simple file with a name like `*xx*.js`, where *xx* is the two letter code for the language. (Technically, it's the ISO 639-1 code—you can find a [list of them on Wikipedia](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).) The file defines a Javascript object with language specific translations. To make one for your language, copy one of the existing files (like [this one for Spanish](https://github.com/NUKnightLab/StoryMapJS/blob/master/source/js/language/locale/es.js)) and edit the quoted strings. Please *don't* change the "keys"—the unquoted strings. If you know how to use GitHub to make a pull request, that's the best way to submit it to us. If that's not your thing, you can [add a comment to this support thread](https://knightlab.zendesk.com/entries/33066836-Help-us-translate-StoryMapJS-into-other-languages) and upload your translation as an attachment.

##GigaPixel

Images are rendered so when set to be map_as_image the entire image is shown. When set as cartography the zoom will set so that all the markers fit.

Points are set to only display on mouseover in image mode, but you can set map_as_image to false in the config options to always show the points. The points are hidden when the intent is an image so that nothing obstructs the image the viewer is looking at. Looking at a painting is hard with a bunch of points on it.

##Map Options
To disable connecting lines on maps use the StoryMap options: "Treat as Image" (as opposed to the default, "Treat as Cartography"

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

## Setting up a development environment

The StoryMapJS repository comprises two distinct modes of development: changes to the javascript library and changes to the authoring system.

We welcome community contributions to the javascript library, and instructions for setting up to do that follow. We don't currently expect community contributions to the authoring tool, and some information about why is further below.

### Setting up to modify StoryMapJS Javascript

In order to stay consistent with our other kinds of deployment tools, we use python and Fabric to build and deploy StoryMapJS. However, if you are comfortable using [CodeKit](http://incident57.com/codekit/), you can use it also: the rules for assembling the various files into a single final storymap.js are specified using CodeKit's syntax.

If you don't use CodeKit, you must have Python installed. We use python 2.7.

Clone our [fabfile](https://github.com/NUKnightLab/fablib) repository and place it in the same parent directory as your StoryMapJS repository.

Install [virtualenv](https://pypi.python.org/pypi/virtualenv) and [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/)

    # Create a virtual environment
    mkvirtualenv storymapjs

    # Activate the virtual environemnt
    workon storymapjs

    # If you are at Knight Lab and intend to work on
		# both javascript and the authoring tool:
    pip install -r js-requirements.txt

Once you've done this, you can edit files in the `source` directory to add features or fix bugs. After editing, use the `fab build` command to compile the javascript fragments into the `build` directory. You should be sure to test any changes you make against code compiled this way.

### Setting up to develop the Authoring Tool/Server

The StoryMapJS authoring tool uses Amazon S3 to store configuration and uploaded images for people who create storymaps. Because we need to control access to the S3 buckets, we have not invested the effort to support development of this part of StoryMap for people outside of the Knight Lab.

If you are associated with Knight Lab, talk to someone on the development staff about getting access to the S3 credentials. Then follow the steps below. Some of this is redundant to the above, but you can just follow these steps and you'll be able to contribute to both facets of the project.


Clone our [fabfile](https://github.com/NUKnightLab/fablib) repository and place it in the same parent directory as your StoryMapJS repository.

Install [virtualenv](https://pypi.python.org/pypi/virtualenv), [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/), and [MongoDB](https://www.mongodb.org/).

```bash
# Create a virtual environment
mkvirtualenv storymapjs

# Activate the virtual environemnt
workon storymapjs

# If you are at Knight Lab and intend to work on
# both javascript and the authoring tool:
pip install -r requirements.txt

# Start the mongod process
<path to binary>/mongod

# Run the development server
fab serve
```

Edit config.json as needed to modify the staging and deployment process.

At this time, edits to the HTML for the website are automatically visible when reloading the local server. Edits to CSS and JavaScript must be manually compiled before you'll see them.  Run `fab build`. This is something we'd like to make more automatic eventually.

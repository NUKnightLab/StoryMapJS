#StoryMapJS: Maps that tell stories.

[StoryMapJS](http://storymap.knightlab.com) is a simple tool to help you tell stories with maps. If you're not a programmer, you don't need to spend much time on the GitHub page—instead, go [StoryMapJS](http://storymap.knightlab.com)

If you want information on creating JSON with your own code and embedding it, see the ["Advanced"](http://storymap.knightlab.com/advanced.html) documentation on the StoryMap website.

The rest of this document gets into a few technical details that some folks might want.

## Contributing translations for new languages

StoryMap's older sibling, [TimelineJS](http://timeline.knightlab.com) has proven internationally popular, in part because users have contributed translation support for dozens of languages.  StoryMap is also ready to be used in languages other than English, but once again, we'll need your help.

For each language, we need a simple file with a name like `*xx*.js`, where *xx* is the two letter code for the language. (Technically, it's the ISO 639-1 code—you can find a [list of them on Wikipedia](http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).) The file defines a Javascript object with language specific translations. To make one for your language, copy one of the existing files (like [this one for Spanish](https://github.com/NUKnightLab/StoryMapJS/blob/master/source/js/language/locale/es.js)) and edit the quoted strings. Please *don't* change the "keys"—the unquoted strings. If you know how to use GitHub to make a pull request, that's the best way to submit it to us. If that's not your thing, you can [add a comment to this support thread](https://knightlab.zendesk.com/entries/33066836-Help-us-translate-StoryMapJS-into-other-languages) and upload your translation as an attachment.

## Setting up a development environment

In order to stay consistent with other kinds of deployment tools, we use python and Fabric to build and deploy StoryMapJS. However, if you are comfortable using [CodeKit](http://incident57.com/codekit/), you can use it also: the rules for assembling the various files into a single final timeline.js are specified using CodeKit's syntax.

If you don't use CodeKit, you must have Python installed. We use python 2.7.

Install [virtualenv](https://pypi.python.org/pypi/virtualenv) and [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/)

    # Create a virtual environment
    mkvirtualenv storymapjs
    
    # Activate the virtual environemnt
    workon storymapjs
        
    # Install python requirements
    pip install -r requirements.txt
 
    # Run the development server
    fab serve

Files located in the `source` directory are assets for storymapjs itself.

Files located in the `website` directory are for the storymapjs website.

Edit config.json as needed to modify the staging and deployment process.
          
At this time, edits to the HTML for the website are automatically visible when reloading the local server. Edits to CSS and JavaScript must be manually compiled before you'll see them.  Run `fab build`. This is something we'd like to make more automatic eventually.
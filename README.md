#StoryMapJS: Maps that tell stories.

[StoryMapJS](http://storymap.knightlab.com) is a simple tool to help you tell stories with maps. If you're not a programmer, you don't need to spend much time on this site—instead, go [StoryMapJS](http://storymap.knightlab.com)

If you want information on creating JSON with your own code and embedding it, see the ["Advanced"](http://storymap.knightlab.com/advanced.html) documentation on the StoryMap website.

The rest of this document explains how to set up to make changes to the StoryMap Javascript yourself

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
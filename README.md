## Setting up a development environment

Install [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/)

Install [Node.js](http://nodejs.org)

    # Install LESS and UglifyJS globally (you may need to use 'sudo npm' instead)
    npm install -g less
    npm install -g uglify-js@1
    
    # Change into the parent directory containing your repositories
    cd path_to_your_repos_root
    
    # Clone repositories
    git clone https://github.com/NUKnightLab/fablib.git
    git clone https://github.com/NUKnightLab/storymapjs.git
    
    # Change into the project repository
    cd storymapjs

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
          
          
## Deploying updates the the CDN

Changes made to javascript and CSS must be deployed to `cdn.knightlab.com` to be used. If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.
    
To stage your changes without forcing `latest` users ahead, type `fab stage` This runs a build, copies the files into a versioned directory in your local `cdn.knightlab.com` repository, and tags the last commit with a version number.

To stage your changes to `latest`, type `fab stage_latest` This copies files from the versioned directory in your local `cdn.knightlab.com` respository into the corresponding `latest` directory. 

You have to push and deploy all CDN changes separately.


## Deploying to S3 (storymapjs.knightlab.com)

You need the `secrets` repository to deploy to S3.  If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.

To update S3, type `fab deploy`.  This runs a build using the latest version tag and synchronizes the files in the build directory with S3.


## Setting up a development environment

Install [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/)

Install [Node.js](http://nodejs.org)

    # Install LESS globally
    npm install -g less
    
    # Change into the parent directory containing your repositories
    cd path_to_your_repos_root
    
    # Clone the project repository
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
Files located in the `site` directory are for the storymapjs website.
          

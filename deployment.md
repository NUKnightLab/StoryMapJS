For KnightLab people only:
          
## Deploying updates the the CDN

Changes made to javascript and CSS must be deployed to `cdn.knightlab.com` to be used. If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.
    
To stage your changes without forcing `latest` users ahead, type `fab stage` This runs a build, copies the files into a versioned directory in your local `cdn.knightlab.com` repository, and tags the last commit with a version number.

To stage your changes to `latest`, type `fab stage_latest` This copies files from the versioned directory in your local `cdn.knightlab.com` respository into the corresponding `latest` directory. 

You have to push and deploy all CDN changes separately.


## Deploying to S3 (storymapjs.knightlab.com)

You need the `secrets` repository to deploy to S3.  If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.

To update S3, type `fab deploy`.  This runs a build using the latest version tag and synchronizes the files in the build directory with S3.

## Deploying to EC2 (FUTURE)

You need the `secrets` repository to deploy to S3.  If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.

Type `fab branch:storymap2 stg|prd deploy`.

The branch task is only needed if you are deploying a branch besides `master`.



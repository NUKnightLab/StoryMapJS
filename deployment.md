For KnightLab people only:

# New git-deploy based static deployment

To stage the current dist folder:

```
 $ git deploy --playbook playbook.static.yml stg <branch>
```

Note that branch is currently required by git-deploy, but has no effect on the
deployment. The static playbook will simply copy the current dist folder to
s3.


# Legacy fablib based deployment:
          
## Deploying updates the the CDN

Changes made to javascript and CSS must be deployed to `cdn.knightlab.com` to be used. If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.
    
To stage your changes without forcing `latest` users ahead, type `fab stage` This runs a build, copies the files into a versioned directory in your local `cdn.knightlab.com` repository, and tags the last commit with a version number.

To stage your changes to `latest`, type `fab stage_latest` This copies files from the versioned directory in your local `cdn.knightlab.com` respository into the corresponding `latest` directory. 

You have to push and deploy all CDN changes separately.

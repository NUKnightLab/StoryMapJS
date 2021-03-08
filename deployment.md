For KnightLab people only:

# New git-deploy based static deployment

To stage the current dist folder:

```
 $ git deploy --playbook playbook.static.yml stg <branch>
```

A stg deployment will always deploy the specified branch to the stg endpoint in the CDN:
s3://cdn.knightlab.com/libs/storymapjs/stg/

To create a versioned endpoint, create a tag:

```
 $ git tag -a <version> -m "deployment version"
 $ git push origin --tags
```

To deploy to a specific versioned endpoint, specify prd:

```
 $ git deploy --playbook playbook.static.yml prd <branch>
```

which will copy the dist build to an endpoint indicated by the branch:
s3://cdn.knightlab.com/libs/storymapjs/<branch>/


The effective execution of copying files to s3 is completed by the s3 role, which
invokes the following local command:

```
aws s3 sync --acl public-read {{ s3_src_dir }} {{ s3_dest }}
```


# Legacy fablib based deployment:
          
## Deploying updates the the CDN

Changes made to javascript and CSS must be deployed to `cdn.knightlab.com` to be used. If you haven't yet, check out that Git repository to the same directory that contains your storymapjs respository.
    
To stage your changes without forcing `latest` users ahead, type `fab stage` This runs a build, copies the files into a versioned directory in your local `cdn.knightlab.com` repository, and tags the last commit with a version number.

To stage your changes to `latest`, type `fab stage_latest` This copies files from the versioned directory in your local `cdn.knightlab.com` respository into the corresponding `latest` directory. 

You have to push and deploy all CDN changes separately.

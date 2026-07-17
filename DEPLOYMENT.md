# Deploying StoryMapJS

There are two separate deployments. They are independent — a library change does
not require an application deploy, and vice versa.

## 1. CDN library (the StoryMap viewer)

Two steps, in two repos:

1. **From the StoryMapJS repo** — build and stage into the local cdn repo:
   ```
   npm run stage_latest
   ```
   (Prompts for a new version tag. Requires the `cdn.knightlab.com` repo cloned
   as a sibling directory, `../cdn.knightlab.com`.)

2. **From the cdn.knightlab.com repo** — publish to S3:
   ```
   ./deploy.sh
   ```

## 2. Editor application (the Flask server)

Deployed separately with git-deploy (`git deploy <env> <ref>`):

```
git deploy prd master
```

(See `deploy/README` and the operations repo for git-deploy setup.)

#!/bin/bash

# Create S3 bucket for StoryMapJS uploads
awslocal s3 mb s3://uploads.knilab.com 2>/dev/null || echo "Bucket uploads.knilab.com already exists"

echo "LocalStack S3 initialization complete"

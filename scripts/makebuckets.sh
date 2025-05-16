#!/usr/bin/env sh
aws --endpoint-url=http://localhost:4566 s3 mb s3://uploads.knilab.com --region us-east-1
aws --endpoint-url=http://localhost:4566 s3 mb s3://cdn.knilab.com --region us-east-1

#!/usr/bin/env python
"""
Tools for managing some administration tasks. Currently provides handlers for listing
the context of a StoryMap folder, and for normalizing longitude values of a StoryMap
to positive values.

Supports passing in an AWS credentials profile name for managing S3 access.

For usage:
./tools.py files --help
"""
import copy
import datetime
import json
import boto3
import typer


app = typer.Typer()

_profile = None

def set_aws_profile(profile):
    global _profile
    _profile = profile

def get_aws_profile():
    global _profile
    return _profile

_s3 = None

def s3_resource():
    global _s3
    if _s3 is None:
        session = boto3.session.Session(profile_name=get_aws_profile())
        _s3 = session.resource("s3")
    return _s3


def s3_client():
    return s3_resource().meta.client


def parse_path(path):
    assert path.startswith('s3://'), f'Invalid s3 path: {path}'
    bucket = path.split('/')[2]
    key = '/'.join(path.split('/')[3:]).strip('/')
    return bucket, key


def load_s3_json(path):
    bucket, key = parse_path(path)
    obj = s3_resource().Object(bucket, key)
    txt = obj.get()['Body'].read().decode('utf-8')
    return json.loads(txt)


def save_s3_json(path, data):
    content = json.dumps(data)
    bucket, key = parse_path(path)
    s3_client().put_object(Bucket=bucket, Key=key, Body=content, ACL="public-read")


class StoryMapPaths():
    """A structure of named paths to StoryMap assets. Accepts any one of the
    asset paths, or the root path, and returns a structure of all the paths.

    path may be either an s3:// path or an https:// path or may start with //.
    Returned paths all start with // for protocol indifference.
    """

    def __init__(self, path):
        if any([
                path.endswith("/"),
                path.endswith("/index.html"),
                path.endswith("/draft.html"),
                path.endswith("/published.json"),
                path.endswith("/draft.json") ]):
            base_path = "/".join(path.split("/")[:-1])
        else:
            raise Exception("Unsupported StoryMap URL format")
        if base_path.startswith("https://"):
            base_path = base_path[len("https:"):]
        elif base_path.startswith("s3://"):
            base_path = base_path[len("s3:")]
        assert base_path.startswith("//"), "Unsupported input path format"
        paths = dict()
        paths["base"] = base_path
        paths["pub"] = f"{base_path}/index.html"
        paths["draft"] = f"{base_path}/draft.html"
        paths["json_pub"] = f"{base_path}/published.json"
        paths["json_draft"] = f"{base_path}/draft.json"
        self.paths = paths

    def s3(self, prop):
        return f"s3:{self.paths[prop]}" 

    def https(self, prop):
        return f"https:{self.paths[prop]}" 


def normalize_longitudes(data):
    """Given a StoryMap data structure, return a modified structure with all longitudes
    normalized to positive values.
    """
    data = copy.deepcopy(data)
    for slide in data["storymap"]["slides"]:
        lon = slide["location"].get("lon")
        if lon is not None and lon < 0:
            lon = lon + 360.0
            slide["location"]["lon"] = lon
    return data


@app.command()
def fixlon(path:str, profile:str=typer.Option(None, help="AWS credentials profile")):
    """Normalizes the longitudes to positive values and re-writes both the published
    and draft json files.
    """
    if profile is not None:
        set_aws_profile(profile)
    paths = StoryMapPaths(path)
    ts = datetime.datetime.utcnow().strftime("%Y%m%d.%H%M%S")
    # pub
    path = paths.s3("json_pub")
    data = load_s3_json(path)
    backup_path = f"{path}.{ts}"
    save_s3_json(backup_path, data) 
    print("Created backup file:", backup_path)
    data = normalize_longitudes(data)
    save_s3_json(path, data)
    print("Saved modified data file to:", path)
    # draft
    path = paths.s3("json_draft")
    data = load_s3_json(path)
    backup_path = f"{path}.{ts}"
    save_s3_json(backup_path, data) 
    print("Created backup file:", backup_path)
    data = normalize_longitudes(data)
    save_s3_json(path, data)
    print("Saved modified data file to:", path)


@app.command()
def files(path:str, profile:str=typer.Option(None, help="AWS credentials profile")):
    """Prints the files in the StorMap folder for the StoryMap associated with the
    given path.
    """
    if profile is not None:
        set_aws_profile(profile)
    paths = StoryMapPaths(path)
    bucket, key = parse_path(paths.s3("base"))
    r = s3_client().list_objects_v2(Bucket=bucket, Prefix=key)
    for obj in r["Contents"]:
        dt = obj["LastModified"].isoformat()
        print(dt, obj["Key"])
    

if __name__=="__main__":
    app()

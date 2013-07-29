import os
from os.path import dirname, abspath, join
from datetime import date
import json
import shutil
import fnmatch
import re
from fabric.api import env, settings, hide, local, lcd
from fabric.decorators import task
from fabric.operations import prompt
from fabric.utils import puts, abort, warn

DEBUG = False

#
# Set paths
#
env.project_path = dirname(dirname(abspath(__file__)))
env.sites_path = dirname(env.project_path)
env.build_path = join(env.project_path, 'build')

#
# Read config.json and update vars
#
with open(join(env.project_path, 'config.json')) as fp:
    s = fp.read()
    s = re.sub(r'//.*', '', s)
    s = re.sub(r'/\*.*?\*/', '', s, flags=re.DOTALL)
    CONFIG = json.loads(s)
    
today = date.today()
CONFIG['date'] = today
CONFIG['year'] = today.year

# Path to cdn deployment
env.cdn_path = abspath(join(
    env.sites_path, 'cdn.knightlab.com', 'app', 'libs', CONFIG['name']))

# Path to s3cmd.cnf in secrets repository
env.s3cmd_cfg = join(env.sites_path, 'secrets', 's3cmd.cfg')

# Banner for the top of CSS and JS files
BANNER = """
/* %(name)s - v%(version)s - %(date)s
 * Copyright (c) %(year)s %(author)s 
 */
""".lstrip()

if DEBUG:
    warn('DEBUGGING IS ON:')
    CONFIG['deploy'] = 'test.knilab.com'
     
    print 'deploy:', CONFIG['deploy']
    print 'tagging is OFF'
    print ''
    
    doit = prompt("Continue? (y/n): ").strip()
    if doit != 'y':
        abort('Stopped')
        
    
def _makedirs(path, isfile=False):
    """
    Make directories in path
    """
    if isfile:
        path = os.path.dirname(path)
    if not os.path.exists(path):
        os.makedirs(path)


def _relpath(root_path, path):
    """Get relative path from root_path"""
    if root_path == path:
        return ''
    return os.path.relpath(path, root_path)
 
    
def _get_tags():
    """Get list of current tags from the repo"""
    tags = os.popen('cd %(project_path)s;git tag' % env).read().strip()
    if tags:
        return [x.strip() for x in tags.split('\n')]
    return []
    
        
def _last_version_tag():
    """Get the last version tag"""
    re_num = re.compile('[^0-9.]')
    
    tags = sorted([map(int, re_num.sub('', t).split('.')) for t in _get_tags()])
    if tags:
        return '.'.join(map(str, tags[-1]))
    return None
          
def _get_version_tag():
    """Get a new version tag from user"""
    tags = _get_tags()
    puts('This project has the following tags:')
    puts(tags)
        
    while True:
        version = prompt("Enter a new version number: ").strip()
        
        if not re.match(r'^[0-9]+\.[0-9]+\.[0-9]+$', version):
            warn('Invalid version number, must be in the format:' \
                ' major.minor.revision')
        elif version in tags:
            warn('Invalid version number, tag already exists')
        else:
            break
    
    return version
 

def _banner(path):
    """
    Place banner at top of js and css files in-place.    
    @path = path or list of paths
    """
    banner = BANNER % CONFIG
   
    if type(path) == list:
        for item in path:
            _banner(item)
    elif os.path.isdir(path):
        for item in [join(path, x) for x in os.listdir(path)]:
            _banner(item)
    elif os.path.exists(path):
        if re.match('.*\.(css|js)$', path):        
            with open(path, 'r+') as fd:
                s = fd.read()
                fd.seek(0)
                fd.write(banner+s)
    else:
        warn('%s does not exist' % path)


def _check_path(path):
    """Check for the existence of a path"""
    if not os.path.exists(path):
        abort('Could not find %s.' % path)
 
      
def _clean(path):
    """Delete directory contents"""
    path = os.path.abspath(path)
    puts('clean %s...' % path)

    if os.path.exists(path):    
        if os.path.isdir(path):
            for item in [join(path, x) for x in os.listdir(path)]:
                if os.path.isfile(item):
                    os.unlink(item)
                else:
                    shutil.rmtree(item)
        else:
            os.unlink(path)


def _concat(src_list, dst):
    """Concatenate files"""
    _makedirs(dst, True)
    local('cat %s > %s' % (' '.join(src_list), dst))


def _copy(src, dst, regex=None):
    """
    Copy from src directory to dest directory
    @regex = regular expression object for matching, else everything
    """   
    puts('copy %s >> %s' % (src, dst))
    
    regex = regex or re.compile('.*')
    
    for (dirpath, dirnames, filenames) in os.walk(src):            
        rel_dir = _relpath(src, dirpath)
               
        for f in filter(lambda x: not x.startswith('.'), filenames):
            rel_path = join(rel_dir, f)          
            if regex.match(rel_path):
                copy_from = join(dirpath, f)
                copy_to = join(dst, rel_path)
                
                puts('copying %s' % rel_path)
                _makedirs(copy_to, True)
                shutil.copy2(copy_from, copy_to)
                
                
def _lessc(src, dst, options=''):
    """Compile LESS css"""        
    if not os.popen('which lessc').read().strip():
        abort('You must install the LESS compiler')

    _makedirs(dst, True)
    
    with hide('warnings'), settings(warn_only=True):
        result = local('lessc %s %s %s' % (options, src, dst))
    if result.failed:
        abort('Error running lessc on %s' % src)    


def _minify(path):
    """
    Minify js to min.js
    @path = path or list of paths
    """
    if type(path) == list:
        for item in path:
            _minify(item)
    elif os.path.isdir(path):
        for item in [join(path, x) for x in os.listdir(path)]:
            _minify(item)
    elif os.path.exists(path):
        if re.match('.*\.js$', path):        
            (base, ext) = os.path.splitext(path)       
            local('slimit -m %s > %s' % (path, base+'.min'+ext))
    else:
        warn('%s does not exist' % path)


def _process_build_block(m):
    """Process a usemin-style build block"""
    type = m.group('type')
    dest = m.group('dest').strip('\\')
    
    if type == 'css':
        return '<link rel="stylesheet" href="%s">' % dest
    elif type == 'js':
        return '<script src="%s"></script>' % dest
    else:
        warn('Unknown build block type (%s)' % type)
        return m.group(0)


def _usemin(src, regex=None):
    """
    Replaces usemin-style build blocks with a reference to a single file.    
    @src = root directory path
    @regex = regular expression object for matching, else all .html

    Build blocks take the format:
    
        <!-- build:type path -->
        (references to unoptimized files go here)
        <!-- endbuild -->
    
    where:
        type = css | js
        path = reference to the optimized file
    
    Any leading backslashes will be stripped, but the path will otherwise
    by used as it appears within the opening build tag.
    """
    puts('usemin %s' % src)
    
    regex = regex or re.compile('.*\.html$')

    re_build = re.compile(r"""
        <!--\s*build:(?P<type>\css|js)\s+(?P<dest>\S+)\s*-->
        .*?
        <!--\s*endbuild\s*-->
        """, re.VERBOSE | re.DOTALL)
 
    for (dirpath, dirnames, filenames) in os.walk(src):            
        rel_dir = _relpath(src, dirpath)

        for f in filter(lambda x: not x.startswith('.'), filenames):
            rel_path = join(rel_dir, f)
            if regex.match(rel_path):          
                abs_path = join(dirpath, f)
                with open(abs_path, 'r+') as fd:
                    s = fd.read()        
                    (new_s, n) = re_build.subn(_process_build_block, s)     
                    if n:
                        puts('replaced %d build blocks in %s' % (n, abs_path))        
                        fd.seek(0)
                        fd.write(new_s)
                        fd.truncate()
            
            
# 
# tasks
#
        
@task
def serve(port='8000'):
    """Run livereload"""
    with lcd(join(env.project_path)):
        local('livereload -b -p %s' % port)
 
@task
def build():
    """Build version"""   
    # get build config
    if not 'build' in CONFIG:
        abort('Could not find "build" in config file')
      
    # determine version
    if not 'version' in CONFIG:
        CONFIG['version'] = _last_version_tag()
    if not CONFIG['version']:
        CONFIG['version'] = '0.0.0' #abort('No available version tag')      
        
    print 'Building version %(version)s...' % CONFIG
            
    # clean build directory
    _clean(env.build_path)
    
    # copy files
    for r in CONFIG['build']['copy']:
        _copy(join(env.project_path, r['src']), env.build_path, 
            re.compile(r['regex']))
        
    # compile less
    if 'lessc' in CONFIG['build']:
        for r in CONFIG['build']['lessc']:
            _lessc(
                join(env.project_path, r['src']), 
                join(env.project_path, r['dst'])
            )    

    # concatenate files
    if 'concat' in CONFIG['build']:
        for r in  CONFIG['build']['concat']:
            _concat(
                map(lambda x: join(env.project_path, x), r['src']), 
                join(env.project_path, r['dst'])
            )
            
    # minify
    if 'minify' in CONFIG['build']:
        _minify(map(
            lambda x: join(env.project_path, x), 
            CONFIG['build']['minify']        
        ))
   
    # usemin
    _usemin(env.build_path)
    
    # banners
    if 'banner' in CONFIG['build']:
        _banner(map(
            lambda x: join(env.project_path, x), 
            CONFIG['build']['banner']
        ))

 
@task
def stage():
    """
    Build, then copy as version to local cdn repository and tag last commit
    """    
    if not 'stage' in CONFIG:
        abort('Could not find "stage" in config file')

    # Make sure cdn exists
    _check_path(join(env.sites_path, 'cdn.knightlab.com', 'app', 'libs'))
    
    # Ask user for a new version
    CONFIG['version'] = _get_version_tag()     
  
    build()
    
    cdn_path = join(env.cdn_path, CONFIG['version'])

    _clean(cdn_path)
    
    _copy(env.build_path, cdn_path, 
        re.compile(CONFIG['stage']))

    if not DEBUG:
        with lcd(env.project_path):
            local('git tag %(version)s' % CONFIG)
            local('git push origin %(version)s' % CONFIG)
            
    
@task
def stage_latest():
    """
    Copy version to latest within local cdn repository
    """
    if 'version' in CONFIG:
        version = CONFIG['version']
    else:
        tags = _get_tags()
        puts('This project has the following tags:')
        puts(tags)
    
        while True:
            version = prompt("Which version to stage as 'latest'? ").strip()        
            if not version in tags:
                warn('You must enter an existing version')
            else:
                break
    
    print 'stage_latest: %s' % version
    
    # Make sure version has been staged
    version_cdn_path = join(env.cdn_path, version)
    if not os.path.exists(version_cdn_path): 
        abort("Version '%s' has not been staged" % version)
      
    # Stage version as latest           
    latest_cdn_path = join(env.cdn_path, 'latest')
    _clean(latest_cdn_path)
    _copy(version_cdn_path, latest_cdn_path)


@task
def deploy():
    """Deploy to S3 bucket"""
    if not 'deploy' in CONFIG:
        abort('Could not find "deploy" in config file')

    # Make sure s3cmd.cnf exists
    _check_path(env.s3cmd_cfg)   
    
    # Build using last version     
    build()
       
    # Sync build to S3   
    puts('Deploying %(version)s to %(deploy)s...' % CONFIG)
    with lcd(env.project_path):
        local('fabfile/s3cmd --config=%s sync' \
                ' --rexclude ".*/\.[^/]*$"' \
                ' --delete-removed --acl-public' \
                ' %s/ s3://%s/' \
                % (env.s3cmd_cfg, env.build_path, CONFIG['deploy'])
            )



          
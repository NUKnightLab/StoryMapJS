    def build():
        """Build lib version"""
        _setup_env()
        # Get build config
        if not 'build' in _config:
            abort('Could not find "build" in config file')
        # Check version
        if not 'version' in _config:
            _config['version'] = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')
            warn('Using development version value "%(version)s"' % _config)
        notice('Building version %(version)s...' % _config)
        # Clean build directory
        clean(_config['build_path'])
        # Build it
        for key, param in _config['build'].iteritems():
            getattr(static, key)(_config, param)


   def stage_dev():
        """
        Build lib and copy to local cdn repository as 'dev' version
        No tagging/committing/etc/
        """
        _setup_env()
        if not 'stage' in _config:
            abort('Could not find "stage" in config file')
        # Make sure cdn exists
        exists(dirname(env.cdn_path), required=True)
        # Build version
        build()
        # Copy to local CDN repository
        cdn_path = join(env.cdn_path, 'dev')
        clean(cdn_path)
        for r in _config['stage']:
            static.copy(_config, [{
                "src": r['src'],
                "dst": cdn_path, "regex": r['regex']}])
        # Create zip file in local CDN repository
        _make_zip(join(cdn_path, '%(name)s.zip' % _config))


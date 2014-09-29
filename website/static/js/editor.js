// editor.js
//
// Requires http://momentjs.com

Array.prototype.remove = function(item) {
    for(var i = this.length; i--;) {
        if(this[i] === item) {
            this.splice(i, 1);
        }
    }
};

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function parseQueryString() {
    var nvpair = {};
    var qs = window.location.search.replace('?', '');
    var pairs = qs.split('&');
    
    for(var i = 0, p; i < pairs.length;i++) {
        p = pairs[i].split('=');
        nvpair[p[0]] = p[1];
    }
    return nvpair;
}

function getScriptPath(scriptname) {
    var scriptTags = document.getElementsByTagName('script');

    for(var i = 0; i < scriptTags.length; i++) {
        if(scriptTags[i].src.match(scriptname)) {
            script_path = scriptTags[i].src;          
            return script_path.split('?')[0].split('/').slice(0, -1).join('/');
        }
    }
    return '';
}

function format_dt(dt_string) {
    var m = moment(dt_string);
    return m.format('ll')+' at '+m.format('LT');
}

function do_ajax(url, data, on_error, on_success) {
    $.ajax({
        url: url,
        data: data,
        dataType: 'json',
        timeout: 45000, // ms
        error: function(xhr, status, err) {
            on_error(err || status);
        },
        success: function(data) {
            if(data.error) {
                on_error(data.error);
            } else {
                on_success(data);
            }
        }
    });
}

function format_error(msg, err) {
    var message = msg;
    if(err) {
        if(err.hasOwnProperty('message')) {
            message += ': ' + err.message;
        } else {
            message += ': ' + err;
        }    
    }
    return message;
}

function show_error(msg, err) { 
    var message = msg;
    
    if(err) {
        if(err.hasOwnProperty('message')) {
            message += ': ' + err.message;
        } else {
            message += ': ' + err;
        }
        
        if(err.hasOwnProperty('stack')) {
            var subject = 'StoryMapJS Editor Report ('+msg+')';
            var body = 'Please describe what you were doing when this error occurred:\n\n\n'
                    + '---DIAGNOSTICS---\n'
                    + message+'\n'
                    + '\n'
                    + 'appCodeName: '+navigator.appCodeName+'\n'
                    + 'appName: '+navigator.appName+'\n'
                    + 'appVersion: '+navigator.appVersion+'\n'
                    + 'platform: '+navigator.platform+'\n'
                    + 'userAgent: '+navigator.userAgent+'\n'
                    + '\n'
                    + err.stack+'\n';
            
            var link = 'mailto:support@knightlab.zendesk.com?'
                + 'subject='+encodeURIComponent(subject)
                + '&body='+encodeURIComponent(body);

            message += '<p><a class="report" href="'+link+'">Report this error to the Knight Lab</a></p>';
        }
    }
    
    hide_progress();
    $('#error_modal .modal-msg').html(message);
    $('#error_modal').modal('show');
}

function hide_error() {
    $('#error_modal').modal('hide');
}

function show_progress(msg) {
    hide_error();
    $('#progress_modal .modal-msg').html(msg);
    $('#progress_modal').modal('show');
}

function hide_progress() {
    $('#progress_modal').modal('hide');
}

function show_confirm(msg, callback) {
    $('#confirm_modal .modal-msg').html(msg);
    $('#confirm_modal .btn-primary').one('click.confirm', function(event) {
        $('#confirm_modal').modal('hide');
        if(callback) {
            callback();
        }
    });
    $('#confirm_modal').modal('show');
}

function show_message(msg, callback) {
    hide_progress();
    
    $('#message_modal .modal-msg').html(msg);
    $('#message_modal .btn').bind('click.confirm', function(event) {
        $(this).unbind('click.confirm');
        $('#message_modal').modal('hide');
        if(callback) {
            callback();
        }
    });
    $('#message_modal').modal('show');
}

function storymap_is_locked(storymapFolder) {
    if(storymapFolder.lock_file) {
        var lock = storymapFolder.lock_file;
        if(!lock.lastModifyingUser.isAuthenticatedUser) {
            var now = moment().unix();
            var then = moment(lock.modifiedDate).unix();           
            return((now - then) < 360);
         }
    } 
    return false;
}

//
// cache
// id => object (see gdrive_storymap_list)
// 

function storymap_cache_get() {
    if(typeof(Storage) !== "undefined") {
        var data = sessionStorage.getItem('storymap_cache');
        if(data) {
            return JSON.parse(data);
        }
    } else {
        return null;
    }
}

function storymap_cache_set(data) {
    if(typeof(Storage) !== "undefined") {
        return sessionStorage.setItem('storymap_cache', JSON.stringify(data))
    } 
}

function storymap_cache_update(id, data) {
    var cache_data = storymap_cache_get();
    if(cache_data) {
        if(id in cache_data) {
            for(key in data) {
                cache_data[id][key] = data[key];
            }
            storymap_cache_set(cache_data);
        }
    }
}

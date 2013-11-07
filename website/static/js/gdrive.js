
// Auth
const CLIENT_ID = '1087881665848.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';

// Folders
const STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap';
const PUBLIC_SUBFOLDER = 'public';

// Uploads
const BOUNDARY = '-------314159265358979323846';
const MULTIPART_DELIMITER = "\r\n--" + BOUNDARY + "\r\n";
const MULTIPART_CLOSE = "\r\n--" + BOUNDARY + "--";

const STORYMAP_TEMPLATE = { storymap: { slides: [] }};
var STORYMAP_INFO = {};


////////////////////////////////////////////////////////////
// Requests
////////////////////////////////////////////////////////////

function gdrive_multipartRequestBody(metadata, contentType, base64Data) {
    var r = MULTIPART_DELIMITER
        + 'Content-Type: application/json\r\n\r\n';
    if (metadata) {
        r += JSON.stringify(metadata);
    }
    r += MULTIPART_DELIMITER
        + 'Content-Type: '+contentType+'\r\n'
        + 'Content-Transfer-Encoding: base64\r\n'
        + '\r\n';
    if (base64Data) {
        r += base64Data;
    }
    r += MULTIPART_CLOSE;
    return r;
}

function gapiRequest(method, metadata, contentType, base64Data) {
    return gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': method,
        'params': {
            'uploadType': 'multipart'
        },
        'headers': {
            'Content-Type': 'multipart/mixed; boundary="'+BOUNDARY+'"'
        },
        'body': gdrive_multipartRequestBody(metadata, contentType, base64Data)
    });
}

function gapiPUTRequest(fileId, contentType, base64Data) {
    return gapi.client.request({
        'path': '/upload/drive/v2/files/'+fileId,
        'method': 'PUT',
        'params': {'uploadType': 'multipart'},
        'headers': {
            'Content-Type': 'multipart/mixed; boundary="'+BOUNDARY+'"'
        },
        'body': gdrive_multipartRequestBody(null, contentType, base64Data)
    });
}

// callback(error, response)
function gdrive_exec(request, callback, debug) {
    request.execute(function(response) {
        if(debug) {
            console.log('gdrive_exec', response);
        }
        if(response.error) {
            callback(response.error.message, null);
        } else {
            callback(null, response);
        }   
    });
}

//////////////////////////////////////////////////////////////////////
// File handling
//
// callback = function(error, <file resource> || null)
// https://developers.google.com/drive/v2/reference/files#resource
//////////////////////////////////////////////////////////////////////

function gdrive_file_create(title, content, parents, callback) {
    var metadata = {
        'title': title,
        'mimeType': 'application/json'
    };
    if (parents) {
        metadata['parents'] = parents;
    }
    var contentType = 'application/json';
    var base64Data = btoa(content);
    
    var request = gapiRequest('POST', metadata, contentType, base64Data);   
    gdrive_exec(request, callback);
}

function gdrive_file_find(query, callback) {
    gdrive_exec(
        gapi.client.drive.files.list({q: query}),
        function(error, response) {
            if(error) {
                callback(error);
            } else if(!response.items || response.items.length < 1) {
                callback(null, null);
            } else if(response.items.length > 1) {
                callback('Multiple files found');
            } else {
                callback(null, response.items[0]);
            }        
        }
    );
}

function gdrive_file_get(id, callback) {
    var request = gapi.client.drive.files.get({'fileId': id});
    gdrive_exec(request, callback);
}

function gdrive_file_update(id, content, callback) {
console.log('gdrive_file_update', id); 
    var request = gapiPUTRequest(id, 'application/json', btoa(content));
    gdrive_exec(request, callback, true);
}

function gdrive_file_delete(id, callback) {
    var request = gapi.client.drive.files.delete({'fileId': id});
    gdrive_exec(request, callback);
}

////////////////////////////////////////////////////////////
// File-system related
////////////////////////////////////////////////////////////

// callback(error, <permissions resource>)
function gdrive_perm_public(id, callback) {
    var request = gapi.client.drive.permissions.insert({
        'fileId': id,
        'resource': {
            'value': '',
            'type': 'anyone',
            'role': 'reader'
        }
    });    
    gdrive_exec(request, callback);
}

// callback(error, [<file resource>])
function gdrive_list(query, callback) {
    var request = gapi.client.drive.files.list({q: query});

    gdrive_exec(request, function(error, response) {
        if(error) {
            callback(error, null);
        } else {
            callback(null, response.items);
        }
    });
}

// callback(error, <file resource>)
function gdrive_folder_create(name, parents, callback) {
    var contentType = 'application/vnd.google-apps.folder';
    var metadata = { 
        'title': name,
        'mimeType': contentType
    };
    if (parents) {
        metadata['parents'] = parents;
    }
    var request = gapiRequest('POST', metadata, contentType);
    gdrive_exec(request, function(error, resource) {
        if(error) {
            callback(error);
        } else {
            gdrive_perm_public(resource.id, function(error, p) {
                callback(error, resource);
            });
        }    
    });
}

// callback = function(error, <file resource>)
function gdrive_folder_getcreate(name, parents, callback) {
    var query = "title='"+name+"' and trashed=false";
    $.each(parents, function(i, parent) {
        query += " and '"+parent.id+"' in parents";
    });
    
    gdrive_list(query, function(error, items) {
        if(error) {
            callback(error);
        } else if(items.length > 1) {
            callback('Multiple folders found');
        } else if(items.length > 0) {
            callback(null, items[0]);
        } else {
            gdrive_folder_create(name, parents, callback);
        }    
    });
}

// callback = function(error, <file resource>)
function gdrive_mkdirs(path, parent, callback) {
    if(typeof path === 'string') {
        path = path.split('/');
    }
    var parents = [];
    if (parent) {
        parents = [parent];
    }
    if (path.length === 1) {
        gdrive_folder_getcreate(path[0], parents, callback);
    } else {
        gdrive_folder_getcreate(path[0], parents, function(error, folder) {
            if(error) {
                callback(error);
            } else {
                gdrive_mkdirs(path.slice(1), folder, callback);
            }
        });
    }
}

//////////////////////////////////////////////////////////////////////
// StoryMap stuff
//////////////////////////////////////////////////////////////////////

//
// Initialize StoryMap folders on google drive
// callback(error, <public folder resource>)
//
function gdrive_storymap_init(create, callback) {
    var query = "title='"+STORYMAP_ROOT_FOLDER+"' and trashed=false";
    
    // Look for StoryMap root folder
    gdrive_file_find(query, function(error, rootFolder) {
        if(error) {
            callback(error);
        } else if(!rootFolder) {
            if(!create) {
                callback('Error getting StoryMap folder');
            } else {               
                gdrive_folder_create(STORYMAP_ROOT_FOLDER, null, function(error, rootFolder) {
                    if(error) {
                        callback(error);
                    } else {
                        gdrive_storymap_init(create, callback);
                    }                 
                });
            }       
        } else {
            // Look for public folder
            query = "title='"+PUBLIC_SUBFOLDER+"' and trashed=false"
                + " and '"+rootFolder.id+"' in parents";
            gdrive_file_find(query, function(error, publicFolder) {
                if(error) {
                    callback(error);
                } else if(!publicFolder) {
                    if(!create) {
                        callback('Error getting public folder');
                    } else {
                        gdrive_folder_create(PUBLIC_SUBFOLDER, [rootFolder.id], callback);
                    }
                } else {
                    callback(error, publicFolder);
                }           
            });
        }
    });
}

//
// List storymaps in parentFolder
// callback(error, [<file resource>])
// TODO:  MORE INFO ABOUT DRAFT/PUBLISHED
//
function gdrive_storymap_list(parentFolder, callback) {
    var q = "'"+parentFolder.id+"' in parents and trashed=false";
    gdrive_list(q, callback);
}

//
// Create storymap in rootFolder
// callback(error, <folder resource>)
//
function gdrive_storymap_create(title, rootFolder, callback) {
    var data = JSON.stringify(STORYMAP_TEMPLATE);
    
    gdrive_folder_create(title, [rootFolder], function(error, storymapFolder) {
        if(error) {
            callback(error);
        } else {
            gdrive_file_create('draft.json', data, [storymapFolder], function(error, response) {
                callback(error, storymapFolder);
            });
        }
    });
}

//
// Load storymap (info only)
// callback(error, <folder resource>)
//
function gdrive_storymap_load(storymap_id, callback) {
console.log('gdrive_storymap_load', storymap_id);
    gdrive_file_get(storymap_id, callback); 

}

//
// Load draft.json from storymapFolder
// callback(error, data)
//
function gdrive_storymap_load_draft(storymapFolder, callback) {
    var url = gdrive_storymap_draft_url(storymapFolder);
    
    $.getJSON(url)
        .done(function(data) {
            callback(null, data);
        })
        .fail(function(xhr, textStatus, error) {
            callback(textStatus+', '+error);
        });
}

//
// Save draft.json in storymapFolder
// callback(error, <file resource>)
//
function gdrive_storymap_save_draft(storymapFolder, data, callback) {
    var content = JSON.stringify(data);
    var query = "title='draft.json' and trashed=false"
        + " and '"+storymapFolder.id+"' in parents";
        
    gdrive_file_find(query, function(error, file) {
console.log('gdrive_storymap_save_draft', error, file);
        if(error) {
            callback(error);
        } else if(file) {
            gdrive_file_update(file.id, content, callback);
        } else {
            gdrive_file_create('draft.json', content, [storymapFolder], callback);
        }
    });
}

//
// Save published.json
// callback(error, <file resource>)
//
function gdrive_storymap_publish(storymapFolder, callback) {
console.log('gdrive_storymap_publish'); 
    var query = "title='published.json' and trashed=false"
        + " and '"+storymapFolder.id+"' in parents";

    // Load content from draft.json
    gdrive_storymap_load_draft(storymapFolder, function(error, data) {
        if(error) {
            callback(error);
        } else {
            var content = JSON.stringify(data);
            // Create/update published.json
            gdrive_file_find(query, function(error, file) {
                if(error) {
                    callback(error);
                } else if(file) {
                    gdrive_file_update(file.id, content, callback);                
                } else {
                    gdrive_file_create('published.json', content, [storymapFolder], callback);               
                }
            });
        }
    });
}

function gdrive_storymap_draft_url(storymapFolder) {
    return storymapFolder.webViewLink + 'draft.json';
}

function gdrive_storymap_published_url(id) {
    return storymapFolder.webViewLink + 'published.json';
}

////////////////////////////////////////////////////////////
// Login/Authorization
// callback(<boolean success value>)
////////////////////////////////////////////////////////////

function gdrive_login(callback) {
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false}, 
        function(authResult) {     
            callback(authResult != null && !authResult.error);        
        }
    );
}

function gdrive_check_auth(callback) {
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
        function(authResult) {
            callback(authResult != null && !authResult.error);
        }
    );
}

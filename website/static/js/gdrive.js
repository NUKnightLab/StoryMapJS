/*
format of Google Drive file/folder resource object
--------------------------------------------------
alternateLink: "https://docs.google.com/folderview?id=0B71wddT5Cwf-cXBDa0FHNk9qRE0&usp=drivesdk"
appDataContents: false
copyable: false
createdDate: "2013-11-06T15:22:03.813Z"
editable: true
etag: ""SQFIsIrlQ4j3H07nwR6GyVXbP4s/MTM4Mzc1MTMyMzgxMw""
iconLink: "https://ssl.gstatic.com/docs/doclist/images/icon_11_shared_collection_list.png"
id: "0B71wddT5Cwf-cXBDa0FHNk9qRE0"
kind: "drive#file"
labels: Object
lastModifyingUser: Object
lastModifyingUserName: "J Wilson"
lastViewedByMeDate: "2013-11-06T15:22:05.463Z"
mimeType: "application/vnd.google-apps.folder"
modifiedDate: "2013-11-06T15:22:03.813Z"
ownerNames: Array[1]
owners: Array[1]
parents: Array[1]
quotaBytesUsed: "0"
shared: true
title: "Population"
userPermission: Object
webViewLink: "https://www.googledrive.com/host/0B71wddT5Cwf-cXBDa0FHNk9qRE0/"
writersCanShare: true
*/

// Auth
var CLIENT_ID = '1087881665848.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

// Folders
var STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap';
var PUBLIC_SUBFOLDER = 'public';

// Uploads
var BOUNDARY = '-------314159265358979323846';
var MULTIPART_DELIMITER = "\r\n--" + BOUNDARY + "\r\n";
var MULTIPART_CLOSE = "\r\n--" + BOUNDARY + "--";

var STORYMAP_INFO = {};


function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

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
// error = string || {code: <int>, message: <string> }
function gdrive_exec(request, callback, debug) {
    try {
        request.execute(function(response) {
            if(response.error) {
                // If authorization error, try to reauthorize and re-exec
                if(response.error.code == 401 || response.error.code == 403) {
                    gdrive_check_auth(function(authorized) {         
                        if(authorized) {
                            gdrive_exec(request, callback, debug);
                        } else {
                            callback(response.error, null);
                        }
                    });
                } else {
                    callback(response.error, null);
                }
            } else {
                callback(null, response);
            }   
        });
    } catch(err) {
        callback(err, null);
    }
}

//////////////////////////////////////////////////////////////////////
// File handling
//
// callback = function(error, <file resource> || null)
// https://developers.google.com/drive/v2/reference/files#resource
//////////////////////////////////////////////////////////////////////

function gdrive_file_create(title, content, parents, callback) {
    var request = null;    
    var metadata = {'title': title};
    
    if (parents) {
        metadata['parents'] = parents;
    }
    
    // data:image/jpeg;base64,.....        
    var m = content.match('^data:(.+);base64,(.+)');
    if(m) {
        metadata['mimeType'] = m[1];
        request = gapiRequest('POST', metadata, m[1], m[2]);          
    } else {    
        metadata['mimeType'] = 'application/json';
        request = gapiRequest('POST', metadata, 'application/json', utf8_to_b64(content));          
    }   
    gdrive_exec(request, callback);
}

function gdrive_file_update(id, content, callback) {
    var request = null;
    
    // data:image/jpeg;base64,.....        
    var m = content.match('^data:(.+);base64,(.+)');
    if(m) {
        request = gapiPUTRequest(id, m[1], m[2]);          
    } else {
        request = gapiPUTRequest(id, 'application/json', utf8_to_b64(content));
    }    
    gdrive_exec(request, callback);
}

function gdrive_file_find(query, callback) {
    gdrive_exec(
        gapi.client.drive.files.list({q: query}),
        function(error, response) {
            if(error) {
                callback(error);
            } else if(!response.items || response.items.length < 1) {
                callback(null);
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

function gdrive_file_delete(id, callback) {
    var request = gapi.client.drive.files.delete({'fileId': id});
    gdrive_exec(request, callback);
}

function gdrive_file_save(storymapFolder, title, data, callback) {
    var query = "title='"+title+"' and trashed=false"
        + " and '"+storymapFolder.id+"' in parents";

    gdrive_file_find(query, function(error, file) {
        if(error) {
            callback(error);
        } else if(file) {
            gdrive_file_update(file.id, data, callback);                
        } else {
            gdrive_file_create(title, data, [storymapFolder], callback);               
        }
    });
}

////////////////////////////////////////////////////////////
// File-system related
////////////////////////////////////////////////////////////

// callback = function(error, <file resource> || null)
function gdrive_rename(id, title, callback) {
    var request = gapi.client.request({
        'path': '/drive/v2/files/'+id,
        'method': 'PUT',
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': {'title': title}
    });
    gdrive_exec(request, callback);
}

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
        callback(error, (response) ? response.items : null);
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
                        gdrive_folder_create(PUBLIC_SUBFOLDER, [rootFolder], callback);
                    }
                } else {
                    callback(error, publicFolder);
                }           
            });
        }
    });
}

//
// Process storymap folder by adding draft_on and published_on datetime strings
// callback(error)
//
function _gdrive_storymap_process(folder, callback) {
    folder['draft_on'] = '';
    folder['published_on'] = '';

    var q = "trashed=false and '"+folder.id+"' in parents";

    gdrive_list(q, function(error, file_list) {
        if(!error && file_list) {
            for(var i = 0; i < file_list.length; i++) {
                var file = file_list[i];        
                if(file.title == 'draft.json') {
                    folder['draft_on'] = file.modifiedDate;
                } else if(file.title == 'published.json') {
                    folder['published_on'] = file.modifiedDate;             
                }
            }            
        }        

        // There should always by a draft.json 
        if(!folder['draft_on']) {
            folder['error'] = 'Invalid StoryMap';
        }
        callback(error);
    });
}

//
// List items in parentFolder
// callback(error, { storymap info by id })
//
function gdrive_storymap_list(parentFolder, callback) {
    var folder_map = {};

    var _process_folders = function(folder_list) {
        if(folder_list && folder_list.length) {
            folder = folder_list.shift();
            
            _gdrive_storymap_process(folder, function(error) {
                if(error) {
                    callback(error);
                } else {
                    folder_map[folder.id] = folder;          
                    _process_folders(folder_list);
                }
            });
        } else {
            callback(null, folder_map);
        }
    };
        
    var q = "'"+parentFolder.id+"' in parents and trashed=false";
    
    gdrive_list(q, function(error, folder_list) {
        if(error) {
            callback(error);
        } else {
            _process_folders(folder_list);
        }
    });
}

//
// Create storymap in rootFolder
// callback(error, <folder resource>)
//
function gdrive_storymap_create(title, data, rootFolder, callback) {
    var data = JSON.stringify(data);
    
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
    gdrive_file_get(storymap_id, function(error, folder) {
        if(error) {
            callback(error);
        } else {
            _gdrive_storymap_process(folder, function(error) {
                callback(error, folder);
            });
        }
    }); 
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
// Create/update draft.json in storymapFolder
// callback(error, <file resource>)
//
function gdrive_storymap_save_draft(storymapFolder, data, callback) {
    var content = JSON.stringify(data);
    gdrive_file_save(storymapFolder, 'draft.json', content, function(error, file) {
        if(file) {
            storymapFolder['draft_on'] = file.modifiedDate;
        }
        callback(error, file);
    });
}

//
// Create/update published.json
// callback(error, <file resource>)
//
function gdrive_storymap_publish(storymapFolder, callback) {
    // Load content from draft.json
    gdrive_storymap_load_draft(storymapFolder, function(error, data) {
        if(error) {
            callback(error);
        } else {
            var content = JSON.stringify(data);
            gdrive_file_save(storymapFolder, 'published.json', content, function(error, file) {
                if(file) {
                    storymapFolder['published_on'] = file.modifiedDate;
                }
                callback(error, file);
            });            
        }
    });
}

function gdrive_storymap_url(storymapFolder, title) {
    return storymapFolder.webViewLink + title;
}

function gdrive_storymap_draft_url(storymapFolder) {
    return storymapFolder.webViewLink + 'draft.json';
}

function gdrive_storymap_published_url(storymapFolder) {
    return storymapFolder.webViewLink + 'published.json';
}

////////////////////////////////////////////////////////////
// Login/Authorization
// callback(<boolean success value>)
////////////////////////////////////////////////////////////

function gdrive_about(callback) {
    var request = gapi.client.drive.about.get();
    gdrive_exec(request, callback);        
}

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


/*
file/folder resource object
---------------------------
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
/*
permission resource object
--------------------------
kind: "drive#permission",
etag: ""a6_EkMpZVptPLZVx1NMw9XbNB-I/q1ykH6RxRVowC85UQfFbig6CPGo"",
id: "anyone",
role: "reader",
type: "anyone"
*/


// Auth
var CLIENT_ID = '1087881665848.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

// Folders
var STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap';
var STORYMAP_FOLDER = 'storymaps';      // new
var PUBLIC_SUBFOLDER = 'public';        // old

// Uploads
var BOUNDARY = '-------314159265358979323846';
var MULTIPART_DELIMITER = "\r\n--" + BOUNDARY + "\r\n";
var MULTIPART_CLOSE = "\r\n--" + BOUNDARY + "--";

// Other
var GDRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';


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
        'params': {'uploadType': 'multipart'},
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

////////////////////////////////////////////////////////////
// Permissions
////////////////////////////////////////////////////////////

// callback(error, [<permission resource>]
function gdrive_perm_list(id, callback) {
    var request = gapi.client.drive.permissions.list({
        'fileId': id
    });
    gdrive_exec(request, function(error, response) {
        callback(error, (response) ? response.items : []);
    });
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

// callback(error)
function gdrive_perm_delete(id, permissionId, callback) {
    var request = gapi.client.drive.permissions.delete({
        'fileId': id,
        'permissionId': permissionId
    });
    gdrive_exec(request, callback);
}

// callback(error)
function gdrive_perm_private(id, callback) {
    gdrive_perm_list(id, function(error, perm_list) {
        if(error) {
            callback(error);
        } else if(!perm_list || !perm_list.length) {
            callback('Expected permissions list');
        } else {
            var i = 0;
            for(; i < perm_list.length; i++) {
                if(perm_list[i].role == 'reader' && perm_list[i].type == 'anyone') {
                    break;
                }
            }
            if(i < perm_list.length) {
                gdrive_perm_delete(id, perm_list[i].id, callback);
            } else {
                callback(null);
            }
        }
    });
}

//////////////////////////////////////////////////////////////////////
// File/folder resource handling
//////////////////////////////////////////////////////////////////////

// callback(error, resource || null)
function gdrive_find(title, parent, callback) {
    var query = "title='"+title+"' and trashed=false";
    if(parent) {
        query += " and '"+parent.id+"' in parents";
    }

    gdrive_exec(
        gapi.client.drive.files.list({q: query}),
        function(error, response) {
            if(error) {
                callback(error);
            } else if(!response.items || response.items.length < 1) {
                callback(null);
            } else if(response.items.length > 1) {
                callback('Multiple items found');
            } else {
                callback(null, response.items[0]);
            }        
        }
    );
}

// callback(error, resource || null)
function gdrive_get(id, callback) {
    gdrive_exec(gapi.client.drive.files.get({'fileId': id}), callback);
}

// callback(error, <file resource> || null)
function gdrive_rename(id, title, callback) {
    var request = gapi.client.request({
        'path': '/drive/v2/files/'+id,
        'method': 'PUT',
        'headers': {'Content-Type': 'application/json'},
        'body': {'title': title}
    });
    gdrive_exec(request, callback);
}

// callback(error)
function gdrive_delete(id, callback) {
    gdrive_exec(gapi.client.drive.files.delete({'fileId': id}), callback);
}

//////////////////////////////////////////////////////////////////////
// File handling
//
// callback(error, <file resource> || null)
// https://developers.google.com/drive/v2/reference/files#resource
//
// base64 content = data:image/jpeg;base64,.....  
//////////////////////////////////////////////////////////////////////

function gdrive_file_create(parent, title, content, callback) {
    var request = null;    
    var metadata = {'title': title};    
    if (parent) {
        metadata['parents'] = [parent];
    }
    
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
    
    var m = content.match('^data:(.+);base64,(.+)');
    if(m) {
        request = gapiPUTRequest(id, m[1], m[2]);          
    } else {
        request = gapiPUTRequest(id, 'application/json', utf8_to_b64(content));
    }    
    gdrive_exec(request, callback);
}

function gdrive_file_save(storymapFolder, title, data, callback) {
    gdrive_find(title, storymapFolder, function(error, file) {
        if(error) {
            callback(error);
        } else if(file) {
            gdrive_file_update(file.id, data, callback);                
        } else {
            gdrive_file_create(storymapFolder, title, data, callback);               
        }
    });
}

////////////////////////////////////////////////////////////
// Folder handling
////////////////////////////////////////////////////////////

// callback(error, [<file resource>])
function gdrive_folder_list(id, callback) {
    var request = gapi.client.drive.files.list({
        q: "trashed=false and '"+id+"' in parents"
    });
    gdrive_exec(request, function(error, response) {
        callback(error, (response) ? response.items : null);
    });
}

// callback(error, <file resource>)
function gdrive_folder_create(name, parent, callback) {
    var metadata = { 
        'title': name,
        'mimeType': GDRIVE_FOLDER_MIME_TYPE
    };
    if (parent) {
        metadata['parents'] = [parent];
    }
    var request = gapiRequest('POST', metadata, GDRIVE_FOLDER_MIME_TYPE);
    gdrive_exec(request, callback);
}

// callback = function(error, <file resource>)
function gdrive_folder_getcreate(title, parent, callback) {
    gdrive_find(title, parent, function(error, folderResource) {
        if(error) {
            callback(error);
        } else if(folderResource) {
            callback(null, folderResource);
        } else {
            gdrive_folder_create(title, parent, callback);        
        }
    });
}

//////////////////////////////////////////////////////////////////////
// StoryMap stuff
//////////////////////////////////////////////////////////////////////

//
// Initialize StoryMap folders on google drive
// callback(error, <public folder resource>)
//


// Publicize everything in folderId
// callback = function(error)
function _gdrive_publicize_folder_list(folderId, callback) {

    var _publicize = function(item_list) {
        if(item_list && item_list.length) {

            item = item_list.shift();               
            gdrive_perm_public(item.id, function(error, p) {
                if(error) {
                    callback(error);
                } else {
                    _publicize(item_list);
                }
            });
        } else {
            callback(null);
        }
    };

    gdrive_folder_list(folderId, function(error, item_list) {
        if(error) {
            callback(error);
        } else {            
            _publicize(item_list);
        }                                   
    });                                 
}

function gdrive_storymap_init(callback) {
    // Look for root folder
    gdrive_find(STORYMAP_ROOT_FOLDER, null, function(error, rootFolder) {
        if(error) {
            callback(error);
        } else if(!rootFolder) {
            // Create root folder
            gdrive_folder_create(STORYMAP_ROOT_FOLDER, null, function(error, rootFolder) {
                if(error) {
                    callback(error);
                } else {
                    // Create storymap folder
                    gdrive_folder_create(STORYMAP_FOLDER, rootFolder, callback);                
                }
            });
        } else {
            // Look for old public folder
            gdrive_find(PUBLIC_SUBFOLDER, rootFolder, function(error, publicFolder) {
                if(error) {
                    callback(error);
                } else if(!publicFolder) {
                    // Get/create storymap folder
                    gdrive_folder_getcreate(STORYMAP_FOLDER, rootFolder, callback);                     
                } else {
                    //  Privatize root folder
                    gdrive_perm_private(rootFolder.id, function(error) {
                        if(error) {
                            callback(error);
                        } else {
                            // Privatize public folder
                            gdrive_perm_private(publicFolder.id, function(error) {
                                if(error) {
                                    callback(error);
                                } else {
                                    // Re-publicize storymap folders
                                    _gdrive_publicize_folder_list(publicFolder.id, function(error) {
                                        if(error) {
                                            callback(error);
                                        } else {
                                            // Rename public folder
                                            gdrive_rename(publicFolder.id, STORYMAP_FOLDER, callback);                                                                
                                        }                                    
                                    });
                                 }                   
                            });    
                        }                  
                    });                
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

    gdrive_folder_list(folder.id, function(error, file_list) {
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
        
    gdrive_folder_list(parentFolder.id, function(error, folder_list) {
        if(error) {
            callback(error);
        } else {
            _process_folders(folder_list);
        }
    });
}

//
// Create public storymap in parentFolder
// callback(error, <folder resource>)
//
function gdrive_storymap_create(title, data, parentFolder, callback) {
    var data = JSON.stringify(data);
    
    gdrive_folder_create(title, parentFolder, function(error, storymapFolder) {
        if(error) {
            callback(error);
        } else {
            gdrive_perm_public(storymapFolder.id, function(error, p) {
                if(error) {
                    callback(error);
                } else {
                    gdrive_file_create(storymapFolder, 'draft.json', data, function(error, response) {
                        callback(error, storymapFolder);
                    });                
                }
            });
        }
    });
}

//
// Load storymap (info only)
// callback(error, <folder resource>)
//
function gdrive_storymap_load(storymap_id, callback) {
    gdrive_get(storymap_id, function(error, folder) {
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


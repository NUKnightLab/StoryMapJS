/*
folder resource object
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
=============================================================================
file resource object
---------------------------
alternateLink: "https://drive.google.com/file/d/0B71wddT5Cwf-d3g3Q0I5SzBHYW8/edit?usp=drivesdk"
appDataContents: false
copyable: true
createdDate: "2014-04-01T15:03:25.860Z"
downloadUrl: "https://doc-10-bc-docs.googleusercontent.com/docs/securesc/cpj9lpeehsbrr3ab71626i3j6vmvbk8c/ophql50virn4ha6do95oeahsgba5qei6/1396360800000/02037372822736866994/02037372822736866994/0B71wddT5Cwf-d3g3Q0I5SzBHYW8?h=16653014193614665626&e=download&gd=true"
editable: true
etag: ""a6_EkMpZVptPLZVx1NMw9XbNB-I/MTM5NjM2NDYwOTc5Ng""
fileExtension: "json"
fileSize: "258"
headRevisionId: "0B71wddT5Cwf-eGhtYXpsTVlSaFZSQjlVQUdKQmhrU0NHL3dRPQ"
iconLink: "https://ssl.gstatic.com/docs/doclist/images/icon_10_generic_list.png"
id: "0B71wddT5Cwf-d3g3Q0I5SzBHYW8"
kind: "drive#file"
labels: Object
lastModifyingUser: Object
    displayName: "J Wilson"
    isAuthenticatedUser: true
    kind: "drive#user"
    permissionId: "02037372822736866994"
displayName: "J Wilson"
isAuthenticatedUser: true
kind: "drive#user"
permissionId: "02037372822736866994"
lastModifyingUserName: "J Wilson"
lastViewedByMeDate: "2014-04-01T15:03:29.796Z"
md5Checksum: "d93b3db67fed021933c6e2076f20f040"
mimeType: "application/json"
modifiedByMeDate: "2014-04-01T15:03:29.796Z"        <------
modifiedDate: "2014-04-01T15:03:29.796Z"
originalFilename: "draft.json"
ownerNames: Array[1]
owners: Array[1]
parents: Array[1]
    id: "0B71wddT5Cwf-bmtHZy1jQnVvMkU"
    isRoot: false
    kind: "drive#parentReference"
quotaBytesUsed: "258"
shared: true
title: "draft.json"
userPermission: Object
webContentLink: "https://docs.google.com/uc?id=0B71wddT5Cwf-d3g3Q0I5SzBHYW8&export=download"
writersCanShare: true
=============================================================================
permission resource object
--------------------------
kind: "drive#permission",
etag: ""a6_EkMpZVptPLZVx1NMw9XbNB-I/q1ykH6RxRVowC85UQfFbig6CPGo"",
id: "anyone",
role: "reader",
type: "anyone"
*/

// Auth
var CLIENT_ID = _GDRIVE_CLIENT_ID;

var SCOPES = [
    'https://www.googleapis.com/auth/drive',        // original
    'https://www.googleapis.com/auth/drive.install',
    'https://www.googleapis.com/auth/userinfo.profile'
];

// Folders
var STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap';
var STORYMAP_FOLDER = 'public';   

// Uploads
var BOUNDARY = '-------314159265358979323846';
var MULTIPART_DELIMITER = "\r\n--" + BOUNDARY + "\r\n";
var MULTIPART_CLOSE = "\r\n--" + BOUNDARY + "--";

// Other
var GDRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
var STORYMAP_LOCK_FILE = 'editor.lock';

var STORYMAP_TYPE_PROP = {
    'key': 'knightlab_type', 
    'value': 'storymap', 
    'visibility': 'PUBLIC'
};

// properties has ....
var STORYMAP_TYPE_FILTER = ""
    + "{key='"+STORYMAP_TYPE_PROP.key+"'"
    + " and value='"+STORYMAP_TYPE_PROP.value+"'"
    + " and visibility='"+STORYMAP_TYPE_PROP.visibility+"'}";
    


function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

// @callback = function(error, object)
function _gdrive_load_json(file, callback) {
    if(file.downloadUrl) {
        var access_token = gapi.auth.getToken().access_token;

        $.ajax({
            url: file.downloadUrl,
            headers: {'Authorization': 'Bearer ' + access_token},
            dataType: 'json',
            error: function(xhr, status, error) {
                callback(status + ((error) ? ' ('+error+')' : ''));
            },
            success: function(data) {
                callback(null, data);
            }
        });   
    } else {
        callback('File has no downloadUrl');
    }    
}

//
// execute a series of asynchronous functions
//
// @func_list = [ function(parameter, function(error) {} ]
// @callback = function(error)
//
function _gdrive_call_chain(parameter, func_list, callback) {
    if(func_list && func_list.length) {
        var func = func_list.shift();
        
        func(parameter, function(error) {
            if(error) {
                callback(error);
            } else {
                _gdrive_call_chain(parameter, func_list, callback);
            }        
        });   
    } else {
        callback(null);
    }
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
        'resource': {'type': 'anyone', 'role': 'reader'}
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

////////////////////////////////////////////////////////////
// Type (properties)
////////////////////////////////////////////////////////////

// get type of resource with id
// callback(error, <string> || null)
function gdrive_type_get(id, callback) {
    var request = gapi.client.drive.properties.list({'fileId': id});    
    gdrive_exec(request, function(error, resp) {
        if(error) {
            callback(error);
        } else if(!resp) {
            callback('expected properties response');
        } else {
            var value = null;
            
            for(var i = 0, items = resp.items || []; i < items.length; i++) {
                if(items[i].key == STORYMAP_TYPE_PROP.key) {
                    value = items[i].value;
                    break;
                }
            }
            
            callback(null, value);            
        }
    });    
}

// add type property to resource with id
// callback(error)
function gdrive_type_add(id, callback) {
    var request = gapi.client.drive.properties.insert({
        'fileId': id,
        'resource': STORYMAP_TYPE_PROP
    });
    gdrive_exec(request, callback);
}

// ensure resource with id has a type property
// callback(error)
function gdrive_type_ensure(id, callback) {
    gdrive_type_get(id, function(error, type) {
        if(error) {
            callback(error);
        } else if(type == null) {
            gdrive_type_add(id, callback);        
        } else {
            callback(null);
        }
    });
}

//////////////////////////////////////////////////////////////////////
// File/folder resource handling
//////////////////////////////////////////////////////////////////////

// callback(error, resource || null)
function gdrive_find(parentFolder, title, filter, callback) {
    var query = "title='"+title+"' and trashed=false";
    if(parentFolder) {
        query += " and '"+parentFolder.id+"' in parents";
    }
    
    gdrive_exec(
        gapi.client.drive.files.list({q: query}),
        function(error, response) {
            if(error) {
                callback(error);
            } else if(!response.items || response.items.length < 1) {
                callback(null);
            } else {
                var f = filter || function(x) { return true; };
                var items = response.items.filter(f);

                if(items.length > 1) {
                    callback('Multiple items named "'+title+'" found');
                } else {
                    callback(null, items[0]);
                }  
            }      
        }
    );
}

// callback(error, <file resource> || null)
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

function gdrive_file_create(parentFolder, title, content, callback) {
    var request = null;    
    var metadata = {'title': title};    
    if (parent) {
        metadata['parents'] = [parentFolder];
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

function gdrive_file_copy(id, dstParent, dstTitle, callback) {
    var request = gapi.client.drive.files.copy({
        'fileId': id,
        'resource': {'title': dstTitle, 'parents': [dstParent]}
    });
    gdrive_exec(request, callback);
}

function gdrive_file_save(parentFolder, title, data, callback) {
    gdrive_find(parentFolder, title, null, function(error, file) {
        if(error) {
            callback(error);
        } else if(file) {
            gdrive_file_update(file.id, data, callback);                
        } else {
            gdrive_file_create(parentFolder, title, data, callback);               
        }
    });
}

////////////////////////////////////////////////////////////
// Folder handling
////////////////////////////////////////////////////////////

// callback(error, <file resource>)
function gdrive_folder_create(parent, title, callback) {
    var metadata = { 
        'title': title,
        'mimeType': GDRIVE_FOLDER_MIME_TYPE
    };
    if (parent) {
        metadata['parents'] = [parent];
    }
    var request = gapiRequest('POST', metadata, "application/json");
    gdrive_exec(request, callback);
}

// filter = response items filter function || null
// callback(error, <file resource>)
function gdrive_folder_getcreate(parentFolder, title, filter, callback) {
    gdrive_find(parentFolder, title, filter, function(error, folder) {
        if(error) {
            callback(error);
        } else if(folder) {
            callback(null, folder);
        } else {
            gdrive_folder_create(parentFolder, title, callback);        
        }
    });
}

// filter = response items filter function || null
// callback(error, <file resource>)
function gdrive_path_create(parent, path_list, filter, callback) {    
    gdrive_folder_getcreate(parent, path_list.shift(), filter, function(error, folder) {
        if(error) {
            callback(error);
        } else if(!path_list.length) {
            callback(null, folder);
        } else {
            gdrive_path_create(folder, path_list, filter, callback);
        }    
    });
}


// callback(error, [<file resource>])
function gdrive_folder_list(id, callback) {
    var request = gapi.client.drive.files.list({
        q: "trashed=false and '"+id+"' in parents"
    });
    gdrive_exec(request, function(error, response) {
        callback(error, (response) ? response.items : null);
    });
}

// copy items in item_list from srcFolder to dstFolder
// callback = function(error)
function _gdrive_copy_process(item_list, srcFolder, dstFolder, callback) {
    if(!(item_list && item_list.length)) {
        callback(); // done
    } else {
        var re = new RegExp('/'+srcFolder.id+'/', 'g');        
        var item = item_list.shift();
        
        if(item.mimeType == GDRIVE_FOLDER_MIME_TYPE) {
            gdrive_folder_copy(item, item.title, dstFolder, function(error, res) {
                if(error) {
                    callback(error);
                } else {
                    _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
                }
            }); 
        } else if(item.title.match('.+\\.json$')) {
            _gdrive_load_json(item, function(error, data) {            
                if(error) {
                    callback(error);
                } else {
                    var content = JSON.stringify(data).replace(re, '/'+dstFolder.id+'/');
                    
                    gdrive_file_create(dstFolder, item.title, content, function(error, response) {
                        if(error) {
                            callback(error);
                        } else {
                            _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
                        }
                    });                
                }
            });
        } else if(item.title != STORYMAP_LOCK_FILE) { // don't copy lock file   
            gdrive_file_copy(item.id, dstFolder, item.title, function(error, res) {
                if(error) {
                    callback(error);
                } else {
                    _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
                }             
            });
        } else {
            _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
        }   
    }
}

// callback(error, <folder resource>)
function gdrive_folder_copy(srcFolder, dstName, dstParent, callback) {
    gdrive_folder_create(dstParent, dstName, function(error, dstFolder) {
        if(error) {
            callback(error);
        } else {
            gdrive_folder_list(srcFolder.id, function(error, item_list) {                
                if(error) {
                    callback(error, dstFolder);            
                } else {
                    _gdrive_copy_process(item_list, srcFolder, dstFolder, function(error) {
                        callback(error, dstFolder);
                    });
                }            
            });
        }
    });
}

//////////////////////////////////////////////////////////////////////
// StoryMap stuff
//////////////////////////////////////////////////////////////////////

//
// lock storymap
// callback(error)
//
function gdrive_storymap_lock(folder, callback) {
    if(folder.lock_file) {
        var request = gapi.client.drive.files.touch({
            'fileId': folder.lock_file.id
        });
        gdrive_exec(request, function(error, f) {
            if(!error) {
                folder['lock_file'] = f;
            }
            callback(error);
        });            
    } else {
        gdrive_file_create(folder, STORYMAP_LOCK_FILE, 'edit', function(error, f) {
            if(!error) {
                folder['lock_file'] = f;
            }
            callback(error);            
        });    
    }
 }
 
 // 
 // unlock storymap
 // callback(error)
 //
function gdrive_storymap_unlock(folder, callback) {
    if(folder && folder.lock_file && folder.lock_file.userPermission.role == 'owner') {
        gdrive_delete(folder.lock_file.id, function(error) {
            if(!error) {
                folder.lock_file = null;
            }
            callback(error);
        });
    } else {
        callback(null);
    } 
}

//
// Get/create StoryMap folders on google drive
// callback(error, <public folder resource>)
//

function _gdrive_filter_shared(file_resource) {
    return !('sharedWithMeDate' in file_resource);  
}

function gdrive_storymap_init(callback) {
    gdrive_path_create(null, [STORYMAP_ROOT_FOLDER, STORYMAP_FOLDER], _gdrive_filter_shared, callback);
}

//
// Process storymap folder permissions => folder.permissions
// callback(error)
//
// role = owner | writer | reader
function _gdrive_storymap_process_perms(folder, callback) {
    folder['permissions'] = [];
 
    //if(folder.userPermission.role == 'owner') {
    gdrive_perm_list(folder.id, function(error, perm_list) {
        if(!error && perm_list) {
            for(var i = 0; i < perm_list.length; i++) {
                var perm = perm_list[i];
                if(perm.role == 'writer') {
                    folder['permissions'].push(perm);
                }                
            }
        }  
          
        callback(error);
    });
}

//
// Process storymap folder files
// callback(error)
//
function _gdrive_storymap_process_files(folder, callback) {
    folder['draft_on'] = '';
    folder['draft_file'] = null;

    folder['published_on'] = '';
    folder['published_file'] = null;
    
    folder['lock_file'] = null;
    
    gdrive_folder_list(folder.id, function(error, file_list) {
        if(!error && file_list) {
            for(var i = 0; i < file_list.length; i++) {
                var file = file_list[i];        
                if(file.title == 'draft.json') {
                    folder['draft_on'] = file.modifiedDate;
                    folder['draft_file'] = file_list[i];
                } else if(file.title == 'published.json') {
                    folder['published_on'] = file.modifiedDate;   
                    folder['published_file'] = file_list[i];          
                } else if(file.title == STORYMAP_LOCK_FILE) {
                    folder['lock_file'] = file_list[i];
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
                                             
            // Ensure type property
            gdrive_type_ensure(folder.id, function(error) {
                if(error) {
                    callback(error);
                } else {
                    _gdrive_call_chain(folder, 
                        [_gdrive_storymap_process_perms, _gdrive_storymap_process_files],
                        function(error) {
                            if(error) {
                                callback(error);
                            } else {
                                folder_map[folder.id] = folder;                               
                                _process_folders(folder_list);                            
                            }                       
                        }
                    );
                }
            });
        } else {
            callback(null, folder_map);
        }
    };
    
    // List all storymaps in parentFolder (public)
    gdrive_folder_list(parentFolder.id, function(error, folder_list) {
        if(error) {
            callback(error);
        } else {
            _process_folders(folder_list);
        }
    });
}

//
// Add storymaps that are 'shared with me' to folder_map
// Must have correct type property and contain draft.json
// callback(error)
//
function gdrive_storymap_list_shared(folder_map, callback) {
    
    var _process_folders = function(folder_list) {
        if(folder_list && folder_list.length) {
            folder = folder_list.shift();     
        
            gdrive_type_get(folder.id, function(error, type) {
                if(error) {
                    callback(error);
//              } else if(type != STORYMAP_TYPE_PROP.value) {
//                    _process_folders(folder_list);             
                } else {
                    _gdrive_call_chain(folder, 
                        [_gdrive_storymap_process_perms, _gdrive_storymap_process_files],
                        function(error) {
                            if(error) {
                                callback(error);
                            } else {
                                if(!folder.error) {
                                    folder_map[folder.id] = folder;   
                                }
                                _process_folders(folder_list);
                            }
                        }
                    );                                        
                }
             });                 
        } else {
            callback(null);
        }
    };
             
    var request = gapi.client.drive.files.list({
        q: "trashed=false and sharedWithMe=true and mimeType='"+GDRIVE_FOLDER_MIME_TYPE+"'"
         + " and properties has "+STORYMAP_TYPE_FILTER     
    });
    
    gdrive_exec(request, function(error, response) {
        if(error) {
            callback(error);
        } else if(!response) {
            callback('expected response');
        } else {
            _process_folders(response.items);        
        }
    });
}


//
// Create public storymap in parentFolder
// requires a unique name
// callback(error, <folder resource>)
//
function gdrive_storymap_create(parentFolder, title, data, callback) {
    var data = JSON.stringify(data);
 
    gdrive_find(parentFolder, title, null, function(error, folderResource) {
        if(error) {
            callback(error);
        } else if(folderResource) {
            callback('A StoryMap named "'+title+'" already exists.');
        } else {
            gdrive_folder_create(parentFolder, title, function(error, storymapFolder) {
                if(error) {
                    callback(error);
                } else {                
                    _gdrive_call_chain(storymapFolder.id, [gdrive_perm_public, gdrive_type_add],
                        function(error) {
                            if(error && error.code != "404") { 
                                // maybe it shouldn't be fatal if "Property not found: key = knightlab_type and visibility = PUBLIC"?
                                callback(error);
                            } else {
                                gdrive_file_create(storymapFolder, 'draft.json', data, function(error, response) {
                                    if(!error) {
                                        storymapFolder['draft_on'] = storymapFolder.modifiedDate;
                                        storymapFolder['published_on'] = '';
                                        storymapFolder['lock_file'] = null; 
                                        storymapFolder['permissions'] = [];                                   
                                    }
                                    callback(error, storymapFolder);
                                });                                            
                            }                          
                        }
                    );
                }
            });
        }
    });
}

//
// Make a copy of the storymap @ srcFolder 
// callback(error, <folder resource>)
//
function gdrive_storymap_copy(srcFolder, dstName, callback) {
    gdrive_folder_copy(srcFolder, dstName, srcFolder.parents[0], function(error, dstFolder) {
        if(error) {
            callback(error);
        } else {
            _gdrive_call_chain(dstFolder.id, [gdrive_perm_public, gdrive_type_ensure],
                function(error) {
                    if(!error) {
                        dstFolder['draft_on'] = srcFolder['draft_on'];
                        dstFolder['published_on'] = srcFolder['published_on'];
                        dstFolder['lock_file'] = null;
                        dstFolder['permissions'] = [];
                    }
                    callback(error, dstFolder);
                }
            );
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
            _gdrive_storymap_process_files(folder, function(error) {
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
    _gdrive_load_json(storymapFolder['draft_file'], callback);
}

//
// Create/update draft.json in storymapFolder
// callback(error, <file resource>)
//
function gdrive_storymap_save_draft(storymapFolder, data, callback) {
    var content = JSON.stringify(data);

    if(storymapFolder.draft_file) {
        gdrive_file_update(storymapFolder.draft_file.id, content, function(error, file) {
            if(file) {
                storymapFolder['draft_on'] = file.modifiedDate;
                storymapFolder['draft_file'] = file;
            }
            callback(error, file);
        });
    } else {
        gdrive_file_save(storymapFolder, 'draft.json', content, function(error, file) {
            if(file) {
                storymapFolder['draft_on'] = file.modifiedDate;
                storymapFolder['draft_file'] = file;
            }
            callback(error, file);
        });
    }
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
            
            if(storymapFolder.published_file) {
                gdrive_file_update(storymapFolder.published_file.id, content, function(error, file) {
                    if(file) {
                        storymapFolder['published_on'] = file.modifiedDate;
                        storymapFolder['published_file'] = file;
                    }
                    callback(error, file);
                });
            } else {
                gdrive_file_save(storymapFolder, 'published.json', content, function(error, file) {
                    if(file) {
                        storymapFolder['published_on'] = file.modifiedDate;
                        storymapFolder['published_file'] = file;
                    }
                    callback(error, file);
                });  
            }          
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
    gdrive_exec(gapi.client.drive.about.get(), callback);        
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
            callback(authResult != null && !authResult.error, authResult);
        }
    );
}

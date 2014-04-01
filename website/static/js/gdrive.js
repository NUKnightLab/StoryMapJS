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
__proto__: Object
lastModifyingUserName: "J Wilson"
lastViewedByMeDate: "2014-04-01T15:03:29.796Z"
md5Checksum: "d93b3db67fed021933c6e2076f20f040"
mimeType: "application/json"
modifiedByMeDate: "2014-04-01T15:03:29.796Z"
modifiedDate: "2014-04-01T15:03:29.796Z"
originalFilename: "draft.json"
ownerNames: Array[1]
owners: Array[1]
parents: Array[1]
quotaBytesUsed: "258"
shared: true
title: "draft.json"
userPermission: Object
webContentLink: "https://docs.google.com/uc?id=0B71wddT5Cwf-d3g3Q0I5SzBHYW8&export=download"
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
var STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap'; // 'KnightLabTools';    // new
var STORYMAP_FOLDER = 'public'; //'storymaps';      

var OLD_STORYMAP_ROOT_FOLDER = 'KnightLabStoryMap'; // old
var OLD_STORYMAP_FOLDER = 'public';        

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

function gdrive_file_copy(id, dstName, dstParent, callback) {
    var request = gapi.client.drive.files.copy({
        'fileId': id,
        'resource': {'title': dstName, 'parents': [dstParent]}
    });
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

// callback(error, <file resource>)
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
            $.getJSON(srcFolder.webViewLink + item.title)
                .done(function(data) {
                    var content = JSON.stringify(data).replace(re, '/'+dstFolder.id+'/');

                    gdrive_file_create(dstFolder, item.title, content, function(error, response) {
                        if(error) {
                            callback(error);
                        } else {
                            _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
                        }
                    });
                })
                .fail(function(xhr, textStatus, error) {
                    callback(textStatus+', '+error);
                });
        } else {           
            gdrive_file_copy(dstFolder, item.id, item.title, dstFolder, function(error, res) {
                if(error) {
                    callback(error);
                } else {
                    _gdrive_copy_process(item_list, srcFolder, dstFolder, callback);
                }             
            });
        }      
    }
}

// callback(error, <folder resource>)
function gdrive_folder_copy(srcFolder, dstName, dstParent, callback) {
    gdrive_folder_create(dstName, dstParent, function(error, dstFolder) {
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

// callback(error, <file resource>)
function gdrive_path_create(path_list, parent, callback) {    
    gdrive_folder_getcreate(path_list.shift(), parent, function(error, folder) {
        if(error) {
            callback(error);
        } else if(!path_list.length) {
            callback(null, folder);
        } else {
            gdrive_path_create(path_list, folder, callback);
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
// Publicize everything in parent
// callback(error)
function gdrive_publicize_list(parent, callback) {
    var _publicize = function(item_list) {
        if(item_list && item_list.length) {
            var item = item_list.shift();     
   
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

    gdrive_folder_list(parent.id, function(error, item_list) {
        if(error) {
            callback(error);
        } else {            
            _publicize(item_list);
        }                                   
    });                                 
}

// Move everything in oldParent to newParent
// callback(error)
function gdrive_move_list(oldParent, newParent, callback) {
    var _move = function(item_list) {
        if(item_list && item_list.length) {
            var item = item_list.shift();

            var request = gapi.client.drive.parents.insert({
                'fileId': item.id,
                'resource': {'id': newParent.id}
            });
            gdrive_exec(request, function(error) {
                if(error) {
                    callback(error);
                } else {
                    callback(error);
                    request = gapi.client.drive.parents.delete({
                        'fileId': item.id,
                        'parentId': oldParent.id
                    });
                    gdrive_exec(request, function(error) {
                        if(error) {
                            callback(error);
                        } else {
                            _move(item_list);
                        }
                    });            
                }           
            });
        } else {
            callback(null);
        }
    };        

    gdrive_folder_list(oldParent.id, function(error, item_list) {
        if(error) {
            callback(error);
        } else {
            _move(item_list);       
        }
    });
}

function gdrive_storymap_init(callback) {
    // Get/create new folder path
    gdrive_path_create([STORYMAP_ROOT_FOLDER, STORYMAP_FOLDER], null, callback);
    
/* commented out new folder migration code --->
    gdrive_path_create([STORYMAP_ROOT_FOLDER, STORYMAP_FOLDER], null, function(error, storymapFolder) {
        if(error) {
            callback(error);
        } else {
            // Look for old root folder
            gdrive_find(OLD_STORYMAP_ROOT_FOLDER, null, function(error, old_rootFolder) {
                if(error) {
                    callback(error);
                } else if(old_rootFolder) {
                    // Look for old storymap folder
                    gdrive_find(OLD_STORYMAP_FOLDER, old_rootFolder, function(error, old_storymapFolder) {
                        if(error) {
                            callback(error);
                        } else if(old_storymapFolder) {
                            // Move contents of old storymap folder into new one
                            gdrive_move_list(old_storymapFolder, storymapFolder, function(error) {
                                if(error) {
                                    callback(error);
                                } else {
                                    // Republicize storymaps
                                    gdrive_publicize_list(storymapFolder, function(error) {
                                        if(error) {
                                            callback(error);
                                        } else {
                                            // Delete old root folder
                                            gdrive_delete(old_rootFolder.id, function(error) {
                                                callback(error, storymapFolder);
                                            });                
                                        }
                                    });                                
                                }
                             });
                        } else {
                            // Delete old root folder
                            gdrive_delete(old_rootFolder.id, function(error) {
                                callback(error, storymapFolder);
                            });                
                        }
                    });
                } else {
                    callback(null, storymapFolder);
                }
            });
        }
    });
<---- folder migration code */
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
console.log(file);
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
// Make a copy the storymap @ srcFolder
// callback(error, <folder resource>)
//
function gdrive_storymap_copy(srcFolder, dstName, callback) {
    gdrive_folder_copy(srcFolder, dstName, srcFolder.parents[0], function(error, dstFolder) {
        if(error) {
            callback(error);
        } else {
            gdrive_perm_public(dstFolder.id, function(error, p) {
                callback(error, dstFolder);
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


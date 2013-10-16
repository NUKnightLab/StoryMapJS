const STORYMAP_FOLDER = 'KnightLabStoryMap';
const PUBLIC_SUBFOLDER = 'public';
const PUBLIC_FOLDER = STORYMAP_FOLDER + '/' + PUBLIC_SUBFOLDER;
const CLIENT_ID = '1087881665848.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';
const boundary = '-------314159265358979323846';
const delimiter = "\r\n--" + boundary + "\r\n";
const close_delim = "\r\n--" + boundary + "--";
const STORYMAP_TEMPLATE = { storymap: { slides: [] }};
var STORYMAP_INFO = {};
var publicFolder = null;

/** Authentication and Initialization **/

var initSelector = function() {
  gapi.client.load('drive', 'v2', function() {
    setPublicFolder(true, function() {
        var storyMapIndex = $('#storymap-index');
        listStoryMaps( function(storyMapList){
            console.log('listing storymaps');
            if (!storyMapList) {
                storyMapList = [];
            }
            $.each(storyMapList, function(i, mapItem) {
                console.log(mapItem);
                STORYMAP_INFO[mapItem.id] = mapItem;
                if (storyMapIndex.length) {
                    storyMapIndex.append('<tr><td><a href="/edit.html?id='
                    + mapItem.id + '" id="'
                    + mapItem.id
                    + '">' + mapItem.title
                    + '</a></td><td><button id="delete-' + mapItem.id
                    + '" class="delete-button">Delete</button></td></tr>');
                }
            });
            hide_progress();
        });
     });
 });
};

var initEditor = function() {
 gapi.client.load('drive', 'v2', function() {
  setPublicFolder(false, function() {
     var params = parseQuerystring();
        loadStoryMapInfo(params.id, function(file) {
            loadStoryMap(params.id, function(err, data) {
                if (err) {
                    console.log(err);
                    alert('Could not load StoryMap data');
                } else {
                    hide_progress();
                    _storymap = data.storymap;
                    showSlides();
                }
            });
        });
     });
  });
};

var showSelector = function() {
    $('#selector').show();
};

var showLoginSection = function() {
    $('#login-section').show();
};

var hideLoginSection = function() {
    $('#login-section').hide();
};

var login = function() {
    checkAuthAndInitSelector(false);
};

var handleAuthResultAndInitSelector = function(authResult) {
  /*
  if (authResult === null) {
    checkAuthAndInitSelector(false);
    return false;
  }
  */
  if (authResult === null) {
    showLoginSection();
    return false;
  }
  var authButton = document.getElementById('authorizeButton');
  if (authResult && !authResult.error) {
    hideLoginSection();
    showSelector();
    initSelector();
  } else {
    authButton.style.display = 'block';
    authButton.onclick = function() {
      gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
          handleAuthResultAndInitSelector);
    };
  }
};

var handleAuthResultAndInitEditor = function(authResult) {
  if (authResult === null) {
    checkAuthAndInitEditor(false);
    return false;
  }
  var authButton = document.getElementById('authorizeButton');
  if (authResult && !authResult.error) {
    initEditor();
  } else {
    authButton.style.display = 'block';
    authButton.onclick = function() {
      gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
          handleAuthResultAndInitEditor);
    };
  }
};

var checkAuthAndInitSelector = function(immediate) {
  if (immediate === undefined) {
    immediate = true;
  }
  gapi.auth.authorize(
    {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': immediate},
    handleAuthResultAndInitSelector);
};

var checkAuthAndInitEditor = function(immediate) {
  if (immediate === undefined) {
    immediate = true;
  }
  gapi.auth.authorize(
    {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': immediate},
    handleAuthResultAndInitEditor);
};

var handleSelectorClientLoad = function() {
  //show_progress('Loading StoryMap list');
  //window.setTimeout(checkAuthAndInitSelector, 1);
  checkAuthAndInitSelector(true);
};

var handleEditorClientLoad = function() {
  show_progress('Loading StoryMap');
  window.setTimeout(checkAuthAndInitEditor, 1);
};

/** File Handling **/

var googleAPIRequest = function(request, callback) {
    var f = function(resp) {
        if (resp.code === 401) {
            checkAuthAndInitSelector();
        } else {
            callback(resp);
        }
    };
    request.execute(f);
};

var multipartRequestBody = function(metadata, contentType, base64Data) {
    var r = delimiter +
        'Content-Type: application/json\r\n\r\n';
        if (metadata) {
            r += JSON.stringify(metadata);
        }
        r += delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n';
        if (base64Data) {
            r += base64Data;
        }
        r += close_delim;
    return r
};

var gapiRequest = function(method, metadata, contentType, base64Data) {
    var request = gapi.client.request({
      'path': '/upload/drive/v2/files',
      'method': method,
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody(metadata, contentType, base64Data)});
    return request;
};

var gapiPUTRequest = function(fileId, contentType, base64Data) {
    var request = gapi.client.request({
        'path': '/upload/drive/v2/files/' + fileId,
        'method': 'PUT',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody(null, contentType, base64Data)});
    return request;
};

var createFolder = function(name, parents, callback) {
    var contentType = 'application/vnd.google-apps.folder';
    var metadata = {
      'title': name,
      'mimeType': contentType
    };
    if (parents) {
        metadata['parents'] = parents;
    }
    var request = gapiRequest('POST', metadata, contentType);
    if (!callback) {
      callback = function(file) {
        console.log(file)
      };
    }
    googleAPIRequest(request, callback);
};

var forFileList = function(query, func) {
    var f = gapi.client.drive.files.list({
        q: query
    });
    f.execute(function(fileList) {
        console.log('Executed query: ' + query);
        console.log(fileList);
        console.log(fileList.items);
        func(fileList.items);
    });
}

var forFile = function(query, func) {
    var f = gapi.client.drive.files.list({
        q: query
    });
    f.execute(function(fileList) {
        if (fileList.items) {
          if (fileList.items.length > 1) {
            console.log(
                'Warning: multiple matches to Google API query found.'
                + ' Using first match to query: ' + query);
          }
          func(fileList.items[0]);
        } else {
          func(null);
        }
    });
};

var setPublicFolder = function(create, callback) {
    var query = "title='" + STORYMAP_FOLDER + "' and trashed=false";
    var f = gapi.client.drive.files.list({
        q: query
    });
    f.execute(function(resp) {
      if (!resp.items) {
        if (create) {
            mkdirs(PUBLIC_FOLDER, null, function(folder) {
                makePublic(folder);
                setPublicFolder(true, callback);
            });
        } else {
            alert('A configuration error has occurred. Please report '
                + 'this error.');
        }
        return false;
      }
      if (resp.items.length > 1) { // this should not happen!
         alert(
             'Warning: multiple ' + STORYMAP_FOLDER + ' folders found. '
             + 'Please report this error.');
         return false;
      }
      var storyMapFolder = resp.items[0];
      var query = "title='" + PUBLIC_SUBFOLDER + "' and trashed=false"
       + " and '" + storyMapFolder.id + "' in parents";
      var f = gapi.client.drive.files.list({
          q: query
      });
      f.execute(function(folders) {
          if (!folders.items) {
             console.log('Public folder not found. This should not happen '
                + 'since the public folder is created at the same time as '
                + 'the storymap folder.'); 
             alert('Folder ' + PUBLIC_FOLDER + ' not found');
          } else {
             if (folders.items.length > 1) {
                 // this should not happen
                 alert('Warning: multiple public folders found. '
                    + 'Please report this error.');
                 return false;
             }
             publicFolder = folders.items[0];
             callback();
          }
      });
    });
};

var getOrCreateFolder = function(name, parents, callback) {
  if (!callback) {
    callback = function(folder) { console.log(folder); };
  }
  //gapi.client.load('drive', 'v2', function() {
    var _id = null;
    var query = "title='" + name + "' and trashed=false";
    $.each(parents, function(i, parent) {
        query += " and '" + parent.id + "' in parents";
    });
    var f = gapi.client.drive.files.list({
        q: query
    });
    f.execute(function(resp) {
      if (!resp.items) {
        createFolder(name, parents, function(file) {
            _id = file;
            callback(file);
        });
      } else {
         if (resp.items.length > 1) {
            alert(
                'Warning: multiple KnightLabStoryMap folders found. '
                + 'Defaulting to the first in list.');
         }
         _id = resp.items[0];
         callback(_id);
      }
    });
  //});
};

var makePublic = function(file) {
    var permissionRequest = gapi.client.drive.permissions.insert({
        'fileId': file.id,
        'resource': {
            'value': '',
            'type': 'anyone',
            'role': 'reader'
        }
    });
    googleAPIRequest(permissionRequest, function(resp) {
        console.log(resp); });
};

var createFile = function(title, content, parents, callback) {
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
  googleAPIRequest(request, callback);
}

var updateFile = function(fileId, content, callback) {
    contentType = 'application/json';
    var base64Data = btoa(content);
    var request = gapiPUTRequest(fileId, contentType, base64Data);
    googleAPIRequest(request, callback);
}

/* copyFile is not being used as "not copyable" error is being produced. */
var copyFile = function(originFileId, copyTitle, callback) {
  var body = {'title': copyTitle};
  var request = gapi.client.drive.files.copy({
    'fileId': originFileId,
    'resource': body
  });
  googleAPIRequest(request, callback);
}

var deleteFile = function(fileId, callback) {
  var request = gapi.client.drive.files.delete({
    'fileId': fileId
  });
  googleAPIRequest(request, callback);
}

var mkdirs = function(path, parent, callback) {
    if (typeof path === 'string') {
        path = path.split('/');
    }
    var parents = [];
    if (parent) {
        parents = [parent];
    }
    if (path.length === 1) {
        getOrCreateFolder(path[0], parents, callback);
    } else {
        getOrCreateFolder(path[0], parents, function(folder) {
            mkdirs(path.slice(1), folder, callback);
        });
    }
}

/*** StoryMap API ***/

var saveStoryMapDraft = function(storyMapId, data, callback) {
    var content = JSON.stringify(data);
    var query = "title='draft.json' and trashed=false "
        + " and '" + storyMapId + "' in parents";
    forFile(query, function(file) {
        if (file) {
            console.log('Updating file: ' + file.id);
            updateFile(file.id, content, function(resp) {
                if (resp.code) {
                    callback(resp.message);
                } else {
                    callback(null);
                }
            });
        } else {
            console.log('Creating file');
            createFile('draft.json', content, [folder], function(file) {
                 console.log(file);
                 if (file.code) {
                    callback(file.message);
                 } else {
                    callback(null);
                 }
            });
        }
    });
};

/* Requires publicFolder to be initialized */
var listStoryMaps = function(callback) {
    console.log('public folder: ' + publicFolder.id); 
    var q = "'" + publicFolder.id + "' in parents and trashed=false";
    forFileList(q, callback);
}

var createStoryMap = function(title, callback) {
  mkdirs(title, publicFolder, function(folder) {
    STORYMAP_INFO[folder.id] = folder;
    var f = function(file) {
        callback(null, folder.id);// folder.id because we want the id
                                  // of the named folder, not the
                                  // draft file.
    }
    createFile('draft.json', JSON.stringify(STORYMAP_TEMPLATE), [folder], f)
    createFile('published.json', '{}', [folder], function(){})
  });
}

function getFile(id, callback) {
  var request = gapi.client.drive.files.get({
    'fileId': id
  });
  request.execute(function(file) {
      callback(file);
  });
}

var loadStoryMapInfo = function(id, callback) {
    if (STORYMAP_INFO[id]) {
        callback(STORYMAP_INFO[id]);
    } else {
        getFile(id, function(file) {
            console.log(file);
            STORYMAP_INFO[id] = file;
            callback(file);
        });
    }
}

var loadStoryMap = function(id, callback) {
    var url = draftURL(id);
    console.log('url: ' + url);
    var data = null;
    $.getJSON(url).done(function(data) {
        callback(null, data);
    }).error(function(resp) {
        if (resp.responseText === '') {
            callback(null, STORYMAP_TEMPLATE);
        } else {
            callback(resp);
        }
    });
};


var draftURL = function(id) {
    return STORYMAP_INFO[id].webViewLink + 'draft.json';
};

var publishedURL = function(id) {
    return STORYMAP_INFO[id].webViewLink + 'published.json';
}

var deleteStoryMap = function(id, callback) {
    deleteFile(id, function(resp) {
        if (resp.code) {
            callback(code.message);
        } else {
            callback();
        }
    });
};

var publishStoryMap = function(id, callback) {
    var info = STORYMAP_INFO[id];
    var query = "title='published.json' and trashed=false "
        + " and '" + id + "' in parents";
    var f = function(file) {
        if (file.code) {
            callback(file.message);
        } else {
            callback(null, publishedURL(id));
        }
    };
    loadStoryMap(id, function(err, data) {
        forFile(query, function(file) {
            var content = JSON.stringify(data);
            if (file) {
                updateFile(file.id, content, f);
            } else {
                createFile('published.json', content, [info], f);
            }
        });
    });
};


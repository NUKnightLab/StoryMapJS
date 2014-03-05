// modal.js
// requires: jquery

// ------------------------------------------------------------
// generic modal event handlers
// ------------------------------------------------------------

modal_error_show = function(event, msg) {
    $(this).find('.modal-error .modal-msg').html(msg);
    $(this).find('.modal-error').show();    
}
modal_error_hide = function(event, msg) {
    $(this).find('.modal-error').hide();  
}
modal_progress_show = function(event, msg) {
    $(this).find('.modal-progress .modal-msg').html(msg);
    $(this).find('.modal-progress').show();    
}
modal_progress_hide = function(event) {
    $(this).find('.modal-progress').hide(); 
}
modal_reset = function(event, error_msg) {
    if(error_msg) {
        $(this).trigger('error_show', error_msg);            
    } else {
        $(this).trigger('error_hide');
    }
    $(this).trigger('progress_hide');
}

// ------------------------------------------------------------
// generic upload control handling, assumes globals:
//      _storymap_info      folder info
//      _storymap_files     list of file name
//
// uploads will trigger an 'upload' event at the modal level
// with the file url as the argument
// ------------------------------------------------------------

$('.upload-panel').on('reset', function(event) {
    $(this).find('.upload-file-link').removeClass('disabled');
    $(this).find('.upload-file').val('');
    $(this).find('.upload-file-name').html('');            
    $(this).find('.btn.upload').addClass('disabled');
    
    var $modal = $(this).closest('.modal');
    
    $modal.find('.upload-conflict').hide();
    $modal.find('.btn.upload').addClass('disabled');
    
    event.stopPropagation();
});

$('.upload-file').change(function(event) {             
    var file = event.target.files[0];
    if(file) {
        var $modal = $(this).closest('.modal');            
        $modal.trigger('error_hide');
    
        $modal.find('.upload-panel .upload-file-name').html(file.name);                
        $modal.find('.btn.upload').removeClass('disabled');
                       
        var $panel = $modal.find('.upload-conflict');

        if(_storymap_files.indexOf(file.name) < 0) {
            $panel.find('input[type="radio"]').prop('checked', false);
            $panel.hide();
        } else {
            $panel.find('input[type="radio"][value="replace"]').prop('checked', true);
            $panel.find('.upload-rename-as').val('');
            $panel.show();
        }
    }
});

$('.upload-conflict input[type="radio"][value="rename"]').click(function(event) {
    $(this).closest('.upload-conflict').find('.upload-rename-as').focus(); 
});

$('.upload-conflict .upload-rename-as').click(function(event) {
    $(this).closest('.upload-conflict').find('input[type="radio"][value="rename"]').prop('checked', true);
});

$('.btn.upload').click(function(event) {
    var $modal = $(this).closest('.modal');   
    var $panel = $modal.find('.upload-conflict');
        
    var file = $modal.find('.upload-file')[0].files[0];
    if(file) {
        var name = file.name;
                                
        if($panel.find('input[type="radio"][value="rename"]').is(':checked')) {
            var $upload_rename_as = $panel.find('.upload-rename-as');
            name = $upload_rename_as.val().trim();
            
            if(!name) {
                $modal.trigger('error_show', 'You must enter a file name.');
                return;
            }
            if(_storymap_files.indexOf(name) > -1) {
                $modal.trigger('error_show', 'A file with this name already exists.  Please enter a different name.');
                $upload_rename_as.focus();
                return;           
            }           
        } 
    
        $modal.trigger('error_hide');
                                                                             
        var reader = new FileReader();
                
        reader.onerror = function() {
            $modal.trigger('reset', 'Error loading file');    
        }
    
        reader.onload = function() {
            $modal.trigger('progress_show', 'Uploading file');
        
            gdrive_file_save(_storymap_info, name, reader.result, function(error, file_resource) {
                if(error || !file_resource) {
                    $modal.trigger('reset', 'Error uploading file' + ((error) ? ' ('+error+')' : ''));    
               } else {
                    if(_storymap_files.indexOf(name) < 0) {      
                        _storymap_files.push(name);
                        _storymap_files.sort();
                    }     
                           
                    $modal.trigger('progress_hide');
                    $modal.trigger('upload', gdrive_storymap_url(_storymap_info, name));                           
                }     
            });
        }
    
        $modal.trigger('progress_show', 'Loading file');
        reader.readAsDataURL(file);  
    }              
});

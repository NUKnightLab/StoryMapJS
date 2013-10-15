
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

function parseQuerystring() {
    var nvpair = {};
    var qs = window.location.search.replace('?', '');
    var pairs = qs.split('&');
    
    for(var i = 0, p; i < pairs.length;i++) {
        p = pairs[i].split('=');
        nvpair[p[0]] = p[1];
    }
    return nvpair;
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

function show_error(msg) {
    $('#error_msg').html(msg);
    $('#error_modal').modal('show');
}

function hide_error() {
    $('#error_modal').modal('hide');
}

function show_progress(msg) {
    hide_error();
    $('#progress_msg').html(msg);
    $('#progress_modal').modal('show');
}

function hide_progress() {
    $('#progress_modal').modal('hide');
}

function show_confirm(msg, callback) {
    $('#confirm_msg').html(msg);
    $('#confirm_modal .btn-primary').bind('click.confirm', function(event) {
        $(this).unbind('click.confirm');
        $('#confirm_modal').modal('hide');
        if(callback) {
            callback();
        }
    });
    $('#confirm_modal').modal('show');
}

function show_message(msg, callback) {
    $('#message_msg').html(msg);
    $('#message_modal .btn-primary').bind('click.confirm', function(event) {
        $(this).unbind('click.confirm');
        $('#message_modal').modal('hide');
        if(callback) {
            callback();
        }
    });
    $('#message_modal').modal('show');
}

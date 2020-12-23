const debug = true;
import { Browser } from "../core/Browser"
import Emoji from "../library/Emoji"


export function extend(/*Object*/ dest) /*-> Object*/ {	// merge src properties into dest
    var sources = Array.prototype.slice.call(arguments, 1);
    for (var j = 0, len = sources.length, src; j < len; j++) {
        src = sources[j] || {};
        for (var i in src) {
            if (src.hasOwnProperty(i)) {
                dest[i] = src[i];
            }
        }
    }
    return dest;
}

/**
 * Implement mixin behavior. Based on 
 *     https://blog.bitsrc.io/understanding-mixins-in-javascript-de5d3e02b466
 * @param {class} cls 
 * @param  {...class} src 
 */
export function classMixin(cls, ...src) {
    for (let _cl of src) {
        for (var key of Object.getOwnPropertyNames(_cl.prototype)) {
            cls.prototype[key] = _cl.prototype[key]
        }
    }
}


export function convertUnixTime(str) { // created for Instagram. It's ISO8601-ish
    // 2013-12-09 01:56:28
    var pattern = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/;
    if (str.match(pattern)) {
        var date_parts = str.match(pattern).slice(1);
    }
    var date_array = [];
    for(var i = 0; i < date_parts.length; i++) {
        var val = parseInt(date_parts[i]);
        if (i == 1) { val = val - 1 } // stupid javascript months
        date_array.push( val )
    }
    date = new Date(date_array[0], date_array[1], date_array[2], date_array[3], date_array[4], date_array[5]);
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    year = date.getFullYear();
    month = months[date.getMonth()];
    day = date.getDate();
    time = month + ', ' + day + ' ' + year;
    return time;
}

export function setData(obj, data) {
    obj.data = extend({}, obj.data, data);
    if (obj.data.uniqueid === "") {
        obj.data.uniqueid = unique_ID(6);
    }
}

export function mergeData(data_main, data_to_merge) {
    var x;
    for (x in data_to_merge) {
        if (Object.prototype.hasOwnProperty.call(data_to_merge, x)) {
            data_main[x] = data_to_merge[x];
        }
    }
    return data_main;
}

export function trace( msg ) {
	if (debug) {
		if (window.console) {
			console.log(msg);
		} else if ( typeof( jsTrace ) != 'undefined' ) {
			jsTrace.send( msg );
		} else {
			alert(msg);
		}
	}
}

/**
 *  Like mergeData, except will only try to copy data that already exists
 *  in data_main
 */
export function updateData(data_main, data_to_merge) {
    var x;
    for (x in data_main) {
        if (Object.prototype.hasOwnProperty.call(data_to_merge, x)) {
            data_main[x] = data_to_merge[x];
        }
    }
    return data_main;
}

export function stamp() {
    var lastId = 0, key = '_vco_id';
    return function (/*Object*/ obj) {
        obj[key] = obj[key] || ++lastId;
        return obj[key];
    };
}

export function findArrayNumberByUniqueID(id, array, prop) {
    var _n = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i].data[prop] == id) {
            trace(array[i].data[prop]);
            _n = i;
        }
    };
    return _n;
}

export function unique_ID(size, prefix) {
    var getRandomNumber = function(range) {
        return Math.floor(Math.random() * range);
    };
    var getRandomChar = function() {
        var chars = "abcdefghijklmnopqurstuvwxyz";
        return chars.substr( getRandomNumber(32), 1 );
    };
    var randomID = function(size) {
        var str = "";
        for(var i = 0; i < size; i++) {
            str += getRandomChar();
        }
        return str;
    };
    if (prefix) {
        return prefix + "-" + randomID(size);
    } else {
        return "vco-" + randomID(size);
    }
}

export function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function htmlify(str) {
    //if (str.match(/<\s*p[^>]*>([^<]*)<\s*\/\s*p\s*>/)) {
    if (Browser.chrome) {
        str = Emoji(str);
    }
    if (str.match(/<p>[\s\S]*?<\/p>/)) {
        
        return str;
    } else {
        return "<p>" + str + "</p>";
    }
}

export function getUrlVars(string) {
    var str,
        vars = [],
        hash,
        hashes;
    str = string.toString();
    if (str.match('&#038;')) { 
        str = str.replace("&#038;", "&");
    } else if (str.match('&#38;')) {
        str = str.replace("&#38;", "&");
    } else if (str.match('&amp;')) {
        str = str.replace("&amp;", "&");
    }
    hashes = str.slice(str.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

export const ratio = {
    square: function(size) {
        var s = {
            w: 0,
            h: 0
        }
        if (size.w > size.h && size.h > 0) {
            s.h = size.h;
            s.w = size.h;
        } else {
            s.w = size.w;
            s.h = size.w;
        }
        return s;
    },
    
    r16_9: function(size) {
        if (size.w !== null && size.w !== "") {
            return Math.round((size.w / 16) * 9);
        } else if (size.h !== null && size.h !== "") {
            return Math.round((size.h / 9) * 16);
        } else {
            return 0;
        }
    },
    r4_3: function(size) {
        if (size.w !== null && size.w !== "") {
            return Math.round((size.w / 4) * 3);
        } else if (size.h !== null && size.h !== "") {
            return Math.round((size.h / 3) * 4);
        }
    }
}

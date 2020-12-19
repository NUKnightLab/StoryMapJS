const debug = true;

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
			//alert(msg);
            console.log('Install jsTrace for detailed debugging');
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

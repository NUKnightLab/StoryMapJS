/*	LIBRARY ABSTRACTION
	
================================================== */
VCO.Lib = VCO.Class.extend({
	
	type: {},
	
	initialize: function () {
		if( typeof( jQuery ) != 'undefined' ){
			this.type.jQuery = true;
		} else {
			this.type.jQuery = false;
		}
	},
	
	hide: function(el, duration) {
		if (duration != null && duration != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).hide(duration);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).hide();
			}
		}
		
	},
	
	remove: function(el) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).remove();
		}
	},
	
	detach: function(el) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).detach();
		}
	},
	
	append: function(el, value) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).append(value);
		}
	},
	
	prepend: function(el, value) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).prepend(value);
		}
	},
	
	show: function(el, duration) {
		if (duration != null && duration != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).show(duration);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).show();
			}
		}
		
	},
	
	load: function(el, callback_function, event_data) {
		var _event_data = {elem:el}; // return element by default
		if (_event_data != null && _event_data != "") {
			_event_data = event_data;
		}
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).load(_event_data, callback_function);
		}
	},
	
	addClass: function(el, cName) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).addClass(cName);
		}
	},
	
	removeClass: function(el, cName) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).removeClass(cName);
		}
	},
	
	attr: function(el, aName, value) {
		if (value != null && value != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).attr(aName, value);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				return jQuery(el).attr(aName);
			}
		}
	},
	
	prop: function(el, aName, value) {
		if (typeof jQuery == 'undefined' || !/[1-9]\.[3-9].[1-9]/.test(jQuery.fn.jquery)) {
		    //VMM.Lib.attribute(el, aName, value);
		} else {
			jQuery(el).prop(aName, value);
		}
	},
	
	attribute: function(el, aName, value) {
		
		if (value != null && value != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).attr(aName, value);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				return jQuery(el).attr(aName);
			}
		}
	},
	
	visible: function(el, show) {
		if (show != null) {
			if( typeof( jQuery ) != 'undefined' ){
				if (show) {
					jQuery(el).show(0);
				} else {
					jQuery(el).hide(0);
				}
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				if ( jQuery(el).is(':visible')){
					return true;
				} else {
					return false;
				}
			}
		}
	},
	
	css: function(el, prop, value) {

		if (value != null && value != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).css(prop, value);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				return jQuery(el).css(prop);
			}
		}
	},
	
	cssmultiple: function(el, propval) {

		if( typeof( jQuery ) != 'undefined' ){
			return jQuery(el).css(propval);
		}
	},
	
	offset: function(el) {
		var p;
		if( typeof( jQuery ) != 'undefined' ){
			p = jQuery(el).offset();
		}
		return p;
	},
	
	position: function(el) {
		var p;
		if( typeof( jQuery ) != 'undefined' ){
			p = jQuery(el).position();
		}
		return p;
	},
	
	width: function(el, s) {
		if (s != null && s != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).width(s);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				return jQuery(el).width();
			}
		}
	},
	
	height: function(el, s) {
		if (s != null && s != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).height(s);
			}
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				return jQuery(el).height();
			}
		}
	},
	
	toggleClass: function(el, cName) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).toggleClass(cName);
		}
	},
	
	each:function(el, return_function) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).each(return_function);
		}
		
	},
	
	html: function(el, str) {
		var e;
		if( typeof( jQuery ) != 'undefined' ){
			e = jQuery(el).html();
			return e;
		}
		
		if (str != null && str != "") {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).html(str);
			}
		} else {
			var e;
			if( typeof( jQuery ) != 'undefined' ){
				e = jQuery(el).html();
				return e;
			}
		}

	},
	
	find: function(el, selec) {
		if( typeof( jQuery ) != 'undefined' ){
			return jQuery(el).find(selec);
		}
	},
	
	stop: function(el) {
		if( typeof( jQuery ) != 'undefined' ){
			jQuery(el).stop();
		}
	},
	
	delay_animate: function(delay, el, duration, ease, att, callback_function) {
		/*
		if (VMM.Browser.device == "mobile" || VMM.Browser.device == "tablet") {
			var _tdd		= Math.round((duration/1500)*10)/10,
				__duration	= _tdd + 's';
				
			VMM.Lib.css(el, '-webkit-transition', 'all '+ __duration + ' ease');
			VMM.Lib.css(el, '-moz-transition', 'all '+ __duration + ' ease');
			VMM.Lib.css(el, '-o-transition', 'all '+ __duration + ' ease');
			VMM.Lib.css(el, '-ms-transition', 'all '+ __duration + ' ease');
			VMM.Lib.css(el, 'transition', 'all '+ __duration + ' ease');
			VMM.Lib.cssmultiple(el, _att);
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				jQuery(el).delay(delay).animate(att, {duration:duration, easing:ease} );
			}
		}
		*/
		
	},
	
	animate: function(el, duration, ease, att, que, callback_function) {
		
		var _ease		= "easein",
			_que		= false,
			_duration	= 1000,
			_att		= {};
		
		if (duration != null) {
			if (duration < 1) {
				_duration = 1;
			} else {
				_duration = Math.round(duration);
			}
			
		}
		
		if (ease != null && ease != "") {
			_ease = ease;
		}
		
		if (que != null && que != "") {
			_que = que;
		}
		
		
		if (att != null) {
			_att = att
		} else {
			_att = {opacity: 0}
		}
		
		/*
		if (VMM.Browser.device == "mobile" || VMM.Browser.device == "tablet") {
			
			var _tdd		= Math.round((_duration/1500)*10)/10,
				__duration	= _tdd + 's';
				
			_ease = " cubic-bezier(0.33, 0.66, 0.66, 1)";
			//_ease = " ease-in-out";
			for (x in _att) {
				if (Object.prototype.hasOwnProperty.call(_att, x)) {
					trace(x + " to " + _att[x]);
					VMM.Lib.css(el, '-webkit-transition',  x + ' ' + __duration + _ease);
					VMM.Lib.css(el, '-moz-transition', x + ' ' + __duration + _ease);
					VMM.Lib.css(el, '-o-transition', x + ' ' + __duration + _ease);
					VMM.Lib.css(el, '-ms-transition', x + ' ' + __duration + _ease);
					VMM.Lib.css(el, 'transition', x + ' ' + __duration + _ease);
				}
			}
			
			VMM.Lib.cssmultiple(el, _att);
			
		} else {
			if( typeof( jQuery ) != 'undefined' ){
				if (callback_function != null && callback_function != "") {
					jQuery(el).animate(_att, {queue:_que, duration:_duration, easing:_ease, complete:callback_function} );
				} else {
					jQuery(el).animate(_att, {queue:_que, duration:_duration, easing:_ease} );
				}
			}
		}
		*/
		
	}
	
});


/*	Dom
	Utilities for working with the DOM
================================================== */

export default class Dom {

	static get(id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	}
	
	static getByClass(id) {
		if (id) {
			return document.getElementsByClassName(id);
		}
	}
	
	static create(tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className;
		if (container) {
			container.appendChild(el);
		}
		return el;
	}
	
	static createText(content, container) {
		var el = document.createTextNode(content);
		if (container) {
			container.appendChild(el);
		}
		return el;
	}
	
	static getTranslateString(point) {
		return Dom.TRANSLATE_OPEN +
				point.x + 'px,' + point.y + 'px' +
				Dom.TRANSLATE_CLOSE;
	}
	
	static setPosition(el, point) {
		el._vco_pos = point;
		if (Browser.webkit3d) {
			el.style[Dom.TRANSFORM] =  Dom.getTranslateString(point);

			if (Browser.android) {
				el.style['-webkit-perspective'] = '1000';
				el.style['-webkit-backface-visibility'] = 'hidden';
			}
		} else {
			el.style.left = point.x + 'px';
			el.style.top = point.y + 'px';
		}
	}
	
	static getPosition(el){
	    var pos = {
	    	x: 0,
			y: 0
	    }
	    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
	        pos.x += el.offsetLeft// - el.scrollLeft;
	        pos.y += el.offsetTop// - el.scrollTop;
	        el = el.offsetParent;
	    }
	    return pos;
	}

	static testProp(props) {
		var style = document.documentElement.style;

		for (var i = 0; i < props.length; i++) {
			if (props[i] in style) {
				return props[i];
			}
		}
		return false;
	}
	
};

/*
Util.extend(Dom, {
	TRANSITION: Dom.testProp(['transition', 'webkitTransition', 'OTransition', 'MozTransition', 'msTransition']),
	TRANSFORM: Dom.testProp(['transformProperty', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']),

	TRANSLATE_OPEN: 'translate' + (Browser.webkit3d ? '3d(' : '('),
	TRANSLATE_CLOSE: Browser.webkit3d ? ',0)' : ')'
});
*/

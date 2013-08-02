/*	VCO.Dom
	Utilities for working with the DOM
	Library abstraction for jQuery
================================================== */



VCO.Dom = {
	
	
	initialize: function () {
		if( typeof( jQuery ) != 'undefined' ){
			this.type.jQuery = true;
		} else {
			this.type.jQuery = false;
		}
	},
	
	get: function (id) {
		return (typeof id === 'string' ? document.getElementById(id) : id);
	},
	
	create: function (tagName, className, container) {
		var el = document.createElement(tagName);
		el.className = className;
		if (container) {
			container.appendChild(el);
		}
		return el;
	}
	
};
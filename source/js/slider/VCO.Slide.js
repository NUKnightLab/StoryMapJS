// TODO Create slide element

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events],
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {}
	},
	_container: {},
	_content_container: {},
	_content: {},
	
	options: {
		uniqueid: 				VCO.Util.unique_ID(6),
		headline: 				"Le portrait mystérieux",
		date: 					null,
		lat: 					-9.143962,
		lon: 					38.731094,
		zoom: 					13,
		icon: 					"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png",
		asset: {
			media: 				"http://youtu.be/lIvftGgps24",
			credit:				"Georges Méliès",
			caption:			"Le portrait mystérieux"
		},
		full_image_background:	false // Use media image as a background
		
	},

	initialize: function(id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},
	
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	onAdd: function() {
		this.fire('slide_added', this.options);
	},

	onRemove: function() {
		this.fire('slide_removed', this.options);
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		this._el.container.className += ' vco-slide';
		
		// Create Layout
		this._el.content_container		= VCO.Dom.create('div', 'vco-content-container', this._el.container);
		this._el.content				= VCO.Dom.create('div', 'vco-content', this._el.content_container);
		this.onAdd();
		
	}
	
});

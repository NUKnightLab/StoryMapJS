/*	VCO.Map
	Makes a Map
================================================== */
 
VCO.Map = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(elem, data, options) {
		// DOM ELEMENTS
		this._el = {
			container: {},
			map: {}
		};
		
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = VCO.Dom.get(elem);
		}
		
		// MAP
		this._map = {};
	
		// Data
		this.data = {
			uniqueid: 			"",
			slides: 				[{test:"yes"}, {test:"yes"}, {test:"yes"}]
		};
	
		//Options
		this.options = {
			map_type: 			"toner"
		};
	
		this.animator = {};
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._initLayout();
		this._initEvents();
		this._createMap();
		
	},
	
	/*	Update Display
	================================================== */
	updateDisplay: function(w, h) {
		this._updateDisplay(w, h);
	},
	
	onResize: function() {
		this._onResize();
	},
	
	/*	Load the media
	================================================== */
	loadMedia: function(url) {
		
	},
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		
	},
	
	hide: function() {
		
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
		this.onRemove();
	},

	/*	Events
	================================================== */
	
	
	/*	Private Methods
	================================================== */
	_initLayout: function() {
		
		// Create Layout
		this._el.map = VCO.Dom.create("div", "vco-map-display", this._el.container);
		
	},
	
	// Update Display
	_updateDisplay: function(width, height, animate) {
		//trace("UPDATE MAP DISPLAY")
	},
	
	_initEvents: function() {
		
	},
	
	_onResize: function() {
		
	},
	
	// Extend this map class and use this to create the map using preferred API
	_createMap: function() {
		trace("Create Map")
	}
	
});
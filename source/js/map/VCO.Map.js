/*	VCO.Map
	Makes a Map

	Events:
	markerAdded
	markerRemoved
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
		this._map = null;
		
		// Markers
		this._markers = [];
	
		// Data
		this.data = {
			uniqueid: 			"",
			slides: 				[{test:"yes"}, {test:"yes"}, {test:"yes"}]
		};
	
		//Options
		this.options = {
			map_type: 			"toner",
			path_gfx: 			"gfx"
		};
		
		// Animation
		this.animator = null;
		
		// Timer
		this.timer = null;
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._initLayout();
		this._initEvents();
		this._createMap();
		this._initData();
		
	},
	
	/*	Public
	================================================== */
	updateDisplay: function(w, h, animate, d) {
		this._updateDisplay(w, h, animate, d);
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
	
	/*	Adding and Removing Markers
	================================================== */
	createMarkers: function(array) { // array of objects
		this._createMarkers(array)
	},
	
	createMarker: function(d) {
		this._createMarker(d);
	},
	
	_destroyMarker: function(marker) { // marker
		this._removeMarker(marker);
		for (var i = 0; i < this._markers.length; i++) {
			if (this._markers[i] == marker) {
				this._markers.splice(i, 1);
			}
		}
		this.fire("markerRemoved", marker);
	},
	
	_createMarkers: function(array) { // array of objects
		for (var i = 0; i < array.length; i++) {
			this._createMarker(array[i]);
		};
	},
	
	
	/*	Map Specific
	================================================== */
	
		/*	Map Specific Create
		================================================== */
		// Extend this map class and use this to create the map using preferred API
		_createMap: function() {
			trace("Create Map")
		},
	
		/*	Map Specific Marker
		================================================== */
		
		// Specific Marker Methods based on preferred Map API
		_createMarker: function(d) { // data and options
			var marker = {};
			this._addMarker(marker);
			this._markers.push(marker);
			this.fire("markerAdded", marker);
		},
	
		_addMarker: function(marker) {
		
		},
	
		_removeMarker: function(marker) {
		
		},
	
		/*	Map Specific Data
		================================================== */
		_initData: function() {
			this._createMarkers(this.data.slides);
		},
		
		_updateMapDisplay: function(w, h, animate, d) {
			
		},
		
		_refreshMap: function() {
			
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
	_updateDisplay: function(w, h, animate, d) {
		//trace("UPDATE MAP DISPLAY")
		this._updateMapDisplay(w, h, animate, d);
		
	},
	
	_initEvents: function() {
		
	}
	
});
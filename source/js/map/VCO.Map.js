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
		
		// Current Marker
		this.current_marker = 0;
	
		// Data
		this.data = {
			uniqueid: 			"",
			slides: 				[{test:"yes"}, {test:"yes"}, {test:"yes"}]
		};
	
		//Options
		this.options = {
			map_type: 			"toner",
			path_gfx: 			"gfx",
			map_popup: 			false, 
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
	
	goTo: function(n, fast) {
		if (n < this._markers.length && n >= 0) {
			this.current_marker = n;
			
			// Stop animation
			if (this.animator) {
				this.animator.stop();
			}
			
			// Make marker active
			this._resetMarkersActive();
			this._markers[this.current_marker].active(true);
			
			this._onMarkerChange();
		}
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
	createMarkers: function(array) {
		this._createMarkers(array)
	},
	
	createMarker: function(d) {
		this._createMarker(d);
	},
	
	_destroyMarker: function(marker) {
		this._removeMarker(marker);
		for (var i = 0; i < this._markers.length; i++) {
			if (this._markers[i] == marker) {
				this._markers.splice(i, 1);
			}
		}
		this.fire("markerRemoved", marker);
	},
	
	_createMarkers: function(array) {
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
		_createMarker: function(d) {
			var marker = {};
			marker.on("markerclick", this._onMarkerClick);
			this._addMarker(marker);
			this._markers.push(marker);
			marker.marker_number = this._markers.length - 1;
			this.fire("markerAdded", marker);
		},
	
		_addMarker: function(marker) {
		
		},
	
		_removeMarker: function(marker) {
		
		},
		
		_resetMarkersActive: function() {
			for (var i = 0; i < this._markers.length; i++) {
				this._markers[i].active(false);
			};
		},
	
		/*	Map Specific Data
		================================================== */
		_initData: function() {
			this._createMarkers(this.data.slides);
			this._resetMarkersActive();
			this._markers[this.current_marker].active(true);
		},
		
		_updateMapDisplay: function(w, h, animate, d) {
			
		},
		
		_refreshMap: function() {
			
		},
	
	/*	Events
	================================================== */
	_onMarkerChange: function(e) {
		this.fire("change", {current_marker:this.current_marker});
	},
	
	_onMarkerClick: function(e) {
		trace("MAP MARKER CLICK");
		if (this.current_marker != e.marker_number) {
			this.goTo(e.marker_number);
		}
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function() {
		
		// Create Layout
		this._el.map = VCO.Dom.create("div", "vco-map-display", this._el.container);
		
	},
	
	// Update Display
	_updateDisplay: function(w, h, animate, d) {
		this._updateMapDisplay(w, h, animate, d);
	},
	
	_initEvents: function() {
		
	}
	
});
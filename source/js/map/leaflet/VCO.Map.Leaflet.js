/*	VCO.Map.Leaflet
	Creates a Map using Leaflet
================================================== */

VCO.Map.Leaflet = VCO.Map.extend({
	
	includes: [VCO.Events],
	
	/*	Create the Map
	================================================== */
	_createMap: function() {
		
		// Set Marker Path
		L.Icon.Default.imagePath = this.options.path_gfx;
		
		this._map = new L.map(this._el.map, {scrollWheelZoom:false}).setView([this.options.default_map_location.lat, this.options.default_map_location.lon], this.options.default_map_location.zoom);
		
		var layer = new L.StamenTileLayer(this.options.map_type);

		this._map.addLayer(layer);
		
	},
	
	/*	Marker
	================================================== */
	_createMarker: function(d) {
		var marker = new VCO.MapMarker.Leaflet(d, this.options);
		marker.on('markerclick', this._onMarkerClick, this);
		this._addMarker(marker);
		this._markers.push(marker);
		marker.marker_number = this._markers.length - 1;
		this.fire("markerAdded", marker);
		
	},

	_addMarker: function(marker) {
		marker.addTo(this._map);
	},

	_removeMarker: function(marker) {
	
	},
	
	/*	Map
	================================================== */
	_panTo: function(loc, animate) {
		this._map.panTo({lat:loc.lat, lon:loc.lon}, {animate: true, duration: this.options.duration/1000, easeLinearity:.10});
	},
	
	_zoomTo: function(z, animate) {
		this._map.setZoom(z);
	},
	
	_viewTo: function(loc, opts) {
		var _animate 	= true,
			_duration 	= this.options.duration/1000,
			_zoom 		= this._getMapZoom();
		
		
		if (loc.zoom) {
			_zoom = loc.zoom;
		}
		
		// Options
		if (opts) {
			if (opts.duration) {
				if (opts.duration == 0) {
					_animate = false;
				} else {
					_duration = duration;
				}
			}
		
			if (opts.zoom && opts.calculate_zoom) {
				_zoom = opts.zoom;
			}
		}	
		
		this._map.setView(
			{lat:loc.lat, lon:loc.lon}, 
			_zoom,
			{
				pan:{animate: _animate, duration: _duration, easeLinearity:.10},
				zoom:{animate: _animate, duration: _duration, easeLinearity:.10}
			}
		)
	},
	
	_getMapLocation: function(m) {
		return this._map.latLngToContainerPoint(m);
	},
	
	_getMapZoom: function() {
		return this._map.getZoom();
	},
	
	_getMapCenter: function() {
		return this._map.getCenter();
	},
	
	/*	Display
	================================================== */
	_updateMapDisplay: function(w, h, animate, d) {
		if (animate) {
			var duration = this.options.duration,
				self = this;
				
			if (d) {duration = d };
			if (this.timer) {clearTimeout(this.timer)};
			
			this.timer = setTimeout(function() {
				self._refreshMap();
			}, duration);
			
		} else {
			if (!this.timer) {
				this._refreshMap();
			};
		}
	},
	
	_refreshMap: function() {
		if (this._map) {
			//this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			};
			
			this._map.invalidateSize();
			//this._viewTo(this._markers[this.current_marker].data.location);
			this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
		};
	}
	
	
});

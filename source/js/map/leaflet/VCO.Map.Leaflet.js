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
		
		//this._map = new L.map(this._el.map, {scrollWheelZoom:false});
		this._map = new L.map(this._el.map, {scrollWheelZoom:false});
		this._map.on("load", this._onMapLoaded, this);
		//this._map.setView([51.505, -0.09], 13);
		
		var layer = new L.StamenTileLayer(this.options.map_type);

		this._map.addLayer(layer);
		
		// Create Overall Connection Line
		this._line = this._createLine(this._line);
		this._addLineToMap(this._line);
		
		// Create Active Line
		this._line_active = this._createLine(this._line_active);
		this._line_active.setStyle({opacity:1});
		this._addLineToMap(this._line_active);
		
		
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
	
	_markerOverview: function() {
		var bounds_array = [];
		
		for (var i = 0; i < this._markers.length; i++) {
			if (this._markers[i].data.real_marker) {
				bounds_array.push( [this._markers[i].data.location.lat, this._markers[i].data.location.lon]);
			}
		};
		
		this._map.fitBounds(bounds_array, {padding:[15,15]});
	},
	
	/*	Line
	================================================== */
	
	_createLine: function(d) {
		return new L.Polyline([], {
			clickable: false,
			color: this.options.line_color,
			weight: this.options.line_weight,
			opacity: this.options.line_opacity,
			dashArray: this.options.line_dash
		} );
		
	},
	
	_addLineToMap: function(line) {
		this._map.addLayer(line);
	},
	
	_addToLine: function(line, d) {
		line.addLatLng({lon: d.location.lon, lat: d.location.lat});
	},
	
	_replaceLines: function(line, array) {
		line.setLatLngs(array);
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
		
		// OFFSET VIEW
		if (this.options.map_center_offset) {
			this._map.setView(
				//this._getMapCenterOffset({lat:loc.lat, lon:loc.lon}, _zoom), 
				{lat:loc.lat, lon:loc.lon}, 
				_zoom,
				{
					pan:{animate: _animate, duration: _duration, easeLinearity:.10},
					zoom:{animate: _animate, duration: _duration, easeLinearity:.10}
				}
			)
		} else {
			this._map.setView(
				{lat:loc.lat, lon:loc.lon}, 
				_zoom,
				{
					pan:{animate: _animate, duration: _duration, easeLinearity:.10},
					zoom:{animate: _animate, duration: _duration, easeLinearity:.10}
				}
			)
		}
		
		
	},
	
	_getMapLocation: function(m) {
		return this._map.latLngToContainerPoint(m);
	},
	
	_getMapZoom: function() {
		return this._map.getZoom();
	},
	
	_getMapCenter: function(offset) {
		if (offset) {
			
		}
		return this._map.getCenter();
	},
	
	_getMapCenterOffset: function(location, zoom, add) {
		var point, offset_y;
		
		offset_y = (this._map.getSize().y/2);
		
		if (add) {
			offset_y = offset_y + this.options.map_center_offset;
			point = this._map.project(location, zoom).add([0, offset_y]);
		} else {
			offset_y = offset_y - this.options.map_center_offset;
			point = this._map.project(location, zoom).subtract([0, offset_y]);
		}

		return this._map.unproject(point, zoom);
	},
	
	_getBoundsZoom: function(origin, destination, correct_for_center) {
		var _origin = origin;
		
		if (this.options.map_center_offset) {
			//_origin = this._getMapCenterOffset(origin, this._getMapZoom(), true);
		}
		
		if (correct_for_center) {
			var _lat = _origin.lat + (_origin.lat - destination.lat)/2,
				_lng = _origin.lng + (_origin.lng - destination.lng)/2;
			_origin = new L.LatLng(_lat, _lng);
		}
		
		var bounds = new L.LatLngBounds([_origin, destination]);
		return this._map.getBoundsZoom(bounds, false);
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
			//this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			// Check to see if it's an overview
			if (this._markers[this.current_marker].data.type && this._markers[this.current_marker].data.type == "overview") {
				this._markerOverview();
			} else {
				this._viewTo(this._markers[this.current_marker].data.location, {zoom:this._getMapZoom(), calculate_zoom:true});
			}
		};
	}
	
	
});

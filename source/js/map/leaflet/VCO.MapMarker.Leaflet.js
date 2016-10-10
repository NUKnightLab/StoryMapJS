/*	VCO.MapMarker.Leaflet
	Produces a marker for Leaflet Maps
================================================== */

VCO.MapMarker.Leaflet = VCO.MapMarker.extend({
	
	
	/*	Create Marker
	================================================== */
	_createMarker: function(d, o) {
		
		var icon = {}; //new L.Icon.Default();
		
		if (d.location && d.location.lat && d.location.lon) {
			this.data.real_marker = true;
			var use_custom_marker = o.use_custom_markers || d.location.use_custom_marker;
			if (use_custom_marker && d.location.icon) {
				this._custom_icon = {
					url: d.location.icon,
					size: d.location.iconSize || [48,48],
					anchor: this._customIconAnchor(d.location.iconSize)
				};
				this._icon = this._createIcon();
			} else if (use_custom_marker && d.location.image) {
				this._custom_image_icon = d.location.image;
				this._icon = this._createImage();
			} else {
				this._icon = this._createDefaultIcon(false);
			}
			
			this._marker = new L.marker([d.location.lat, d.location.lon], {
				title: 		d.text.headline,
				icon: 		this._icon
			});
		
			this._marker.on("click", this._onMarkerClick, this); 
			
			if (o.map_popup) {
				this._createPopup(d, o);
			}
		}
	},
	
	_addTo: function(m) {
		if (this.data.real_marker) {
			this._marker.addTo(m);
		}
	},
	
	_createPopup: function(d, o) {
		/*
		var html = "";
		html += "<h4>" + this.data.text.headline + "</h4>";
		this._marker.bindPopup(html, {closeButton:false, offset:[0, 43]});
		*/
	},
	
	_active: function(a) {
		var self = this;
		
		if (this.data.media && this.data.media.mediatype) {
			this.media_icon_class = "vco-mapmarker-icon vco-icon-" + this.data.media.mediatype.type;
		} else {
			this.media_icon_class = "vco-mapmarker-icon vco-icon-plaintext";
		}
		if (this.data.real_marker) {
			if (a) {
				this._marker.setZIndexOffset(100);
				//this.timer = setTimeout(function() {self._openPopup();}, this.options.duration + 200);
			} else {
				clearTimeout(this.timer);
				this._marker.setZIndexOffset(0);
			}
			//this._marker.closePopup();
			if (this._custom_icon) {
				this._icon = this._createIcon();
			} else if (this._custom_image_icon) {
				this._icon = this._createImage(a);
			} else {
				this._icon = this._createDefaultIcon (a);
			}

			this._setIcon();
		}
	},

	_createIcon: function() {
		return new L.icon({iconUrl: this._custom_icon.url, iconSize: this._custom_icon.size, iconAnchor: this._custom_icon.anchor});
	},

	_createImage: function(active) { // TODO: calculate shadow dimensions
		var className = active ? "vco-mapmarker-image-icon-active" : "vco-mapmarker-image-icon";
		return new L.icon({iconUrl: url, iconSize: [48], iconAnchor:[24, 48], shadowSize: [68, 95], shadowAnchor: [22, 94], className: className});
	},

	_createDefaultIcon: function(active) {
		var className = active ? "vco-mapmarker-active" : "vco-mapmarker";
		return L.divIcon({className: className + " " + this.media_icon_class, iconAnchor:[10, 10]});
	},

	_customIconAnchor: function(size) {
		if (size) {
			return [ size[0] * 0.5, size[1] ];
		} else {
			return [ 24, 48 ];
		}
	},
	
	_openPopup: function() {
		this._marker.openPopup();
	},
	
	_setIcon: function() {
		this._marker.setIcon(this._icon);
	},
	
	_location: function() {
		if (this.data.real_marker) {
			return this._marker.getLatLng();
		} else {
			return {};
		}
	}
	
});

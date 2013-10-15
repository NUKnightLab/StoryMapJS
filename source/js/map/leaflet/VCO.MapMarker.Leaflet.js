/*	VCO.MapMarker.Leaflet
	Produces a marker for Leaflet Maps
================================================== */

VCO.MapMarker.Leaflet = VCO.MapMarker.extend({
	
	
	/*	Create Marker
	================================================== */
	_createMarker: function(d, o) {
		trace(this.data)
		var icon = {}; //new L.Icon.Default();
		
		if (d.location && d.location.lat && d.location.lon) {
			this.data.real_marker = true;
			if (o.use_custom_markers && d.location.icon && d.location.icon != "") {
				this._icon = L.icon({iconUrl: d.location.icon, iconSize: [41]});
				//icon = L.icon({iconUrl: d.media.url, iconSize: [41]});
			
			};
			
			//icon = L.icon({iconUrl: "gfx/map-pin.png", iconSize: [28, 43], iconAnchor: [14, 33]});
			this._icon = L.divIcon({className: 'vco-mapmarker ' + this.media_icon_class});
		
			this._marker = L.marker([d.location.lat, d.location.lon], {
				title: 		d.text.headline,
				icon: 		this._icon
			});
		
			this._marker.on("click", this._onMarkerClick, this); 
			this._createPopup(d, o);
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
		var html = "";
		html += "<h4>" + this.data.text.headline + "</h4>";
		//html += "<p>" + this.data.text.text + "</p>";
		this._marker.bindPopup(html, {closeButton:false, offset:[0, 43]});
	},
	
	_active: function(a) {
		var self = this;
		
		if (this.data.media && this.data.media.mediatype) {
			this.media_icon_class = "vco-mapmarker-icon vco-mapmarker-icon-" + this.data.media.mediatype.type;
		}
		
		if (this.data.real_marker) {
			if (a) {
				//this._marker.setOpacity(1);
				this._marker.setZIndexOffset(100);
				this._icon = L.divIcon({className: 'vco-mapmarker-active ' + this.media_icon_class});
				this.timer = setTimeout(function() {self._openPopup();}, this.options.duration + 200);
				this._setIcon();
			} else {
				//this._marker.setOpacity(.25);
				this._marker.closePopup();
				clearTimeout(this.timer);
				//this._marker.setOpacity(1);
				this._marker.setZIndexOffset(0);
				this._icon = L.divIcon({className: 'vco-mapmarker ' + this.media_icon_class});
				this._setIcon();
			}
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

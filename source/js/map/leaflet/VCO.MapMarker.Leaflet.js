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
			if (o.use_custom_markers && d.location.icon && d.location.icon != "") {
				icon = L.icon({iconUrl: d.location.icon, iconSize: [41]});
				//icon = L.icon({iconUrl: d.media.url, iconSize: [41]});
			
			};
		
			//icon = L.icon({iconUrl: "gfx/map-pin.png", iconSize: [28, 43], iconAnchor: [14, 33]});
			icon = L.divIcon({className: 'vco-mapmarker-leaflet'});
		
			this._marker = L.marker([d.location.lat, d.location.lon], {
				title: 		d.text.headline,
				icon: 		icon
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
		var html = "";
		html += "<h3>" + this.data.text.headline + "</h3>";
		html += "<p>" + this.data.text.text + "</p>";
		this._marker.bindPopup(html);
	},
	
	_active: function(a) {
		if (this.data.real_marker) {
			if (a) {
				this._marker.setOpacity(1);
			} else {
				this._marker.setOpacity(.25);
			}
		}
	},
	
	_location: function() {
		if (this.data.real_marker) {
			return this._marker.getLatLng();
		} else {
			return {};
		}
	}
	
});

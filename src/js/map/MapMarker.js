import { classMixin, mergeData } from "../core/Util";
import Events from "../core/Events";
import Ease from "../animation/Ease";
/*	MapMarker
	Creates a marker. Takes a data object and
	populates the marker with content.
================================================== */

export default class MapMarker {
	
	//includes: [VCO.Events],
	
	/*	Constructor
	================================================== */
	constructor(data, options) {
		
		// DOM Elements
		this._el = {
			container: {},
			content_container: {},
			content: {}
		};
	
		// Components
		this._marker = {};
		
		// Icon
		this._icon = {};
		this._custom_icon = false;
		this._custom_icon_url = "";
		this._custom_image_icon = false;
		
		// Marker Number
		this.marker_number = 0;
		
		// Media Icon
		this.media_icon_class = "";
		
		// Timer
		this.timer = {};
	
		// Data
		this.data = {};
	
		// Options
		this.options = {
			// animation
			duration: 			1000,
			ease: 				Ease.easeInSpline,
			width: 				600,
			height: 			600,
			map_popup: 			false
		};
		
		
		// Animation Object
		this.animator = null;
		
		// Merge Data and Options
		mergeData(this.options, options);
		mergeData(this.data, data);
		
		this._initLayout();
		
	}
	
	/*	Public
	================================================== */
	show() {
	}
	
	hide() {
	}
	
	addTo(m) {
		this._addTo(m);
	}
	
	removeFrom(m) {
		this._removeFrom(m)
	}
	
	updateDisplay(w, h, a) {
		this._updateDisplay(w, h, a);
	}
	
	createMarker(d, o) {
		this._createMarker(d, o);
	}
	
	createPopup(d, o) {
		this._createPopup(d, o);
	}
	
	active(a) {
		this._active(a);
	}
	
	location() {
		return this._location();
	}
	
	/*	Marker Specific
		Specific to Map API
	================================================== */
		_createMarker(d, o) {
		}
		
		_addTo(m) {
		}
		
		_removeFrom(m) {
		}
		
		_createPopup(d, o) {
		}
		
		_active(a) {
		}
		
		_location() {
			return {lat:0, lng:0}
		}
	
	/*	Events
	================================================== */
	_onMarkerClick(e) {
		this.fire("markerclick", {marker_number: this.marker_number});
	}
	
	/*	Private Methods
	================================================== */
	_initLayout() {
		this._createMarker(this.data, this.options);
	}
	
	// Update Display
	_updateDisplay(width, height, animate) {
	}
	
}

classMixin(MapMarker, Events)
export { MapMarker }

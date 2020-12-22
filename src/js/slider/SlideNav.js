import { classMixin, mergeData } from "../core/Util"
import Dom from "../dom/Dom"
import DomMixins from "../dom/DomMixins"
import Events from "../core/Events"
import { DomEvent } from "../dom/DomEvent"
import { mobile as BROWSER_MOBILE } from "../core/Browser"
/*	SlideNav
	Navigation for Slideshows
================================================== */
// TODO null out data


export default class SlideNav {
	
	//includes: [VCO.Events, VCO.DomMixins],
	
	//_el: {},
	
	/*	Constructor
	================================================== */
	constructor(data, options, add_to_container) {
		// DOM ELEMENTS
		this._el = {
			container: {},
			content_container: {},
			icon: {},
			title: {},
			description: {}
		};
	
		// Media Type
		this.mediatype = {};
		
		// Data
		this.data = {
			title: "Navigation",
			description: "Description"
		};
	
		//Options
		this.options = {
			direction: 			"previous"
		};
	
		this.animator = null;
		this.animator_position = null;
		
		// Merge Data and Options
		mergeData(this.options, options);
		mergeData(this.data, data);
		
		
		this._el.container = Dom.create("div", "vco-slidenav-" + this.options.direction);
		
		if (BROWSER_MOBILE) {
			this._el.container.setAttribute("ontouchstart"," ");
		}
		
		this._initLayout();
		this._initEvents();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	}
	
	/*	Update Content
	================================================== */
	update(d) {
		this._update(d);
	}
	
	/*	Color
	================================================== */
	setColor(inverted) {
		if (inverted) {
			this._el.content_container.className = 'vco-slidenav-content-container vco-slidenav-inverted';
		} else {
			this._el.content_container.className = 'vco-slidenav-content-container';
		}
	}
	
	/*	Position
	================================================== */
	updatePosition(pos, use_percent, duration, ease, start_value, return_to_default) {
		var self = this,
			ani = {
				duration: 	duration,
				easing: 	ease,
				complete: function() {
					self._onUpdatePositionComplete(return_to_default);
				}
			};
		var _start_value = start_value;
		
		for (var name in pos) {
			if (pos.hasOwnProperty(name)) {
				if (use_percent) {
					ani[name] = pos[name] + "%";
				} else {
					ani[name] = pos[name] + "px";
				}
			
			}
		}
		
		if (this.animator_position) {
			this.animator_position.stop();
		}
		
		var prop_to_set;
		if (ani.right) {
			prop_to_set = "right";
		} else {
			prop_to_set = "left";
		}
		if (use_percent) {
			this._el.container.style[prop_to_set] = _start_value + "%";
		} else {
			this._el.container.style[prop_to_set] = _start_value + "px";
		}
		
		this.animator_position = Animate(this._el.container, ani);

	}
	
	_onUpdatePositionComplete(return_to_default) {
		if (return_to_default) {
			this._el.container.style.left = "";
			this._el.container.style.right = "";
		}
	}
	
	/*	Events
	================================================== */
	_onMouseClick() {
		this.fire("clicked", this.options);
	}
	
	/*	Private Methods
	================================================== */
	_update(d) {
		// update data
		this.data = mergeData(this.data, d);
		
		// Title
		if (this.data.title != "") {
			this._el.title.innerHTML		= this.data.title;
		}
		
		// Date
		if (this.data.date != "") {
			this._el.description.innerHTML	= this.data.description;
		}
	}
	
	_initLayout() {
		
		// Create Layout
		this._el.content_container			= Dom.create("div", "vco-slidenav-content-container", this._el.container);
		this._el.icon						= Dom.create("div", "vco-slidenav-icon", this._el.content_container);
		this._el.title						= Dom.create("div", "vco-slidenav-title", this._el.content_container);
		this._el.description				= Dom.create("div", "vco-slidenav-description", this._el.content_container);
		
		this._el.icon.innerHTML				= "&nbsp;"
		
		this._update();
	}
	
	_initEvents() {
		DomEvent.addListener(this._el.container, 'click', this._onMouseClick, this);
	}
	
}

classMixin(SlideNav, Events, DomMixins)

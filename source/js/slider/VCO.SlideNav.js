/*	VCO.SlideNav
	Navigation for Slideshows
================================================== */
// TODO null out data

VCO.SlideNav = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
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
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		
		this._el.container = VCO.Dom.create("div", "vco-slidenav-" + this.options.direction);
		
		if (VCO.Browser.mobile) {
			this._el.container.setAttribute("ontouchstart"," ");
		}
		
		this._initLayout();
		this._initEvents();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	
	/*	Update Content
	================================================== */
	update: function(d) {
		this._update(d);
	},
	
	/*	Color
	================================================== */
	setColor: function(inverted) {
		if (inverted) {
			this._el.content_container.className = 'vco-slidenav-content-container vco-slidenav-inverted';
		} else {
			this._el.content_container.className = 'vco-slidenav-content-container';
		}
	},
	
	/*	Position
	================================================== */
	updatePosition: function(pos, use_percent, duration, ease, start_value) {
		trace("updatePosition")
		var ani = {
			duration: 	duration,
			easing: 	ease
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
		
		trace(ani)
		//this.animatePosition(pos, this._el.container, use_percent);
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
		trace("start_value " + _start_value)
		this.animator_position = VCO.Animate(this._el.container, ani);

	},
	
	/*	Events
	================================================== */
	_onMouseClick: function() {
		this.fire("clicked", this.options);
	},
	
	/*	Private Methods
	================================================== */
	_update: function(d) {
		// update data
		this.data = VCO.Util.mergeData(this.data, d);
		
		// Title
		if (this.data.title != "") {
			this._el.title.innerHTML		= this.data.title;
		}
		
		// Date
		if (this.data.date != "") {
			this._el.description.innerHTML	= this.data.description;
		}
	},
	
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-slidenav-content-container", this._el.container);
		this._el.icon						= VCO.Dom.create("div", "vco-slidenav-icon", this._el.content_container);
		this._el.title						= VCO.Dom.create("div", "vco-slidenav-title", this._el.content_container);
		this._el.description				= VCO.Dom.create("div", "vco-slidenav-description", this._el.content_container);
		
		this._el.icon.innerHTML				= "&nbsp;"
		
		this._update();
	},
	
	_initEvents: function () {
		VCO.DomEvent.addListener(this._el.container, 'click', this._onMouseClick, this);
	}
	
	
});
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
			content: {},
			content_item: {},
			caption: {},
			credit: {}
		};
	
		// Media Type
		this.mediatype = {};
		
		// Data
		this.data = {
			uniqueid: 				"",
			date: 					"1899",
			location: {
				lat: 				-9.143962,
				lon: 				38.731094,
				zoom: 				13,
				icon: 				"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png"
			},
			text: {
				headline: 			"Le portrait mystérieux",
				text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
			}
		};
	
		//Options
		this.options = {
			something: 			""
		};
	
		this.animator = {};
		
		// Merge Data
		VCO.Util.setData(this, data);
		
		// Merge Options
		if (options) {
			VCO.Util.setOptions(this, this.options);
		};
		
		this._el.container = VCO.Dom.create("div", "vco-slidenav-" + this.data.direction);
		this._el.container.id = this.data.uniqueid;
		
		// Click Listener
		this._el.container.onclick = function(){};
		
		this._initLayout();
		this._initEvents();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	
	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.data);
	},
	
	onAdd: function() {
		this.fire("added", this.data);
	},

	onRemove: function() {
		this.fire("removed", this.data);
	},
	
	_onMouseClick: function() {
		trace("NAVIGATION CLICKED");
		this.fire("clicked", this.data);
	},
	
	/*	Private Methods
	================================================== */
	_update: function(d) {
		// update data
		this.data = VCO.Util.mergeData(this.data, d);
		
		// Title
		if (this.data.title != "") {
			this._el.title.innerHTML		= this.data.text.headline;
		}
		
		// Date
		if (this.data.date != "") {
			this._el.date.innerHTML			= this.data.date;
		}
	},
	
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-slidenav-content-container", this._el.container);
		this._el.icon						= VCO.Dom.create("div", "vco-icon", this._el.content_container);
		this._el.date						= VCO.Dom.create("div", "vco-date", this._el.content_container);
		this._el.title						= VCO.Dom.create("div", "vco-title", this._el.content_container);
		
		this._el.icon.innerHTML				= "&nbsp;"
		
		this._update();
	},
	
	_initEvents: function () {
		VCO.DomEvent.addListener(this._el.container, 'click', this._onMouseClick, this);
	}
	
	
});

/*
		div.vco-slidenav-next
			div.vco-slidenav-content-container
				div.vco-icon
					| &nbsp;
				div.vco-date 
					| 1899
				div.vco-title 
					| Next Le portrait mystérieux
		div.vco-slidenav-previous
			div.vco-slidenav-content-container
				div.vco-icon
					| &nbsp;
				div.vco-date 
					| 1899
				div.vco-title 
					| Previous Le portrait mystérieux

*/
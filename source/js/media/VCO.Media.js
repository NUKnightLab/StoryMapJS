/*	VCO.Media
	Main media template for media assets.
	Takes a data object and populates a dom object
================================================== */
 
VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	
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
			uniqueid: 			"",
			url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
			credit:				"Georges Méliès",
			caption:			"Le portrait mystérieux"
		};
	
		//Options
		this.options = {
			something: 			""
		};
	
		this.animator = {};
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._el.container = VCO.Dom.create("div", "vco-media");
		this._el.container.id = this.data.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	
	/*	Load the media
	================================================== */
	loadMedia: function(url) {
		
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
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-media-content-container", this._el.container);
		this._el.content					= VCO.Dom.create("div", "vco-media-content", this._el.content_container);
		
		// Add Shadow
		this._el.content.className += ' vco-media-shadow';
		
		// Credit
		if (this.data.credit != "") {
			this._el.credit					= VCO.Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.data.credit;
		}
		
		// Caption
		if (this.data.caption != "") {
			this._el.caption				= VCO.Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.data.caption;
		}
		
	}
	
});
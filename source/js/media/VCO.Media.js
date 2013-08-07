VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		content_item: {},
		caption: {},
		credit: {}
	},
	
	// Media Type
	mediatype: {},
	
	// Options
	options: {
		uniqueid: 			"",
		url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
		credit:				"Georges Méliès",
		caption:			"Le portrait mystérieux"
	},
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		VCO.Util.setOptions(this, options);
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-media");
		this._el.container.id = this.options.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	},
	/*	Constructor
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
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
	},

	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.options);
	},
	
	onAdd: function() {
		this.fire("added", this.options);
	},

	onRemove: function() {
		this.fire("removed", this.options);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		trace(" _initLayout");
		
		// Create Layout
		this._el.content_container			= VCO.Dom.create("div", "vco-media-content-container", this._el.container);
		this._el.content					= VCO.Dom.create("div", "vco-media-content", this._el.content_container);
		
		// Add Shadow
		this._el.content.className += ' vco-media-shadow';
		
		// Credit
		if (this.options.credit != "") {
			this._el.credit					= VCO.Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.options.credit;
		}
		
		// Caption
		if (this.options.caption != "") {
			this._el.caption				= VCO.Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.options.caption;
		}
		
		// Load Media
		//this.mediatype = VCO.MediaType(this.options.url);
		//trace(this.mediatype);
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item", this._el.content);
		this._el.content_item.src			= this.options.url;
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
		
		
	}
	
});
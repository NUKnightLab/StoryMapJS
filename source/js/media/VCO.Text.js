VCO.Text = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		headline: {}
	},
	
	// Options
	options: {
		uniqueid: 			"",
		headline: 			"Le portrait mystérieux",
		text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
	},
	
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		VCO.Util.setOptions(this, options);
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-text");
		this._el.container.id = this.options.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
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
		this._el.content_container			= VCO.Dom.create("div", "vco-text-content-container", this._el.container);
		//this._el.content					= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
		
		// Headline
		if (this.options.headline != "") {
			this._el.headline				= VCO.Dom.create("h2", "vco-headline", this._el.content_container);
			this._el.headline.innerHTML		= this.options.headline;
		}
		
		// Text
		if (this.options.text != "") {
			this._el.content				= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
			this._el.content.innerHTML		= VCO.Util.htmlify(this.options.text);
		}
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
		
		
	}
	
});
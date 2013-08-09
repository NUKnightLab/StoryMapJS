VCO.Media.Text = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {},
		headline: {}
	},
	
	// Data
	data: {
		uniqueid: 			"",
		headline: 			"Le portrait mystérieux",
		text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
	},
	
	// Options
	options: {
		something: 			""
	},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		VCO.Util.setData(this, data);
		if (options) {
			VCO.Util.setOptions(this, this.options);
		};
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-text");
		this._el.container.id = this.data.uniqueid;
		
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
		this._el.content_container			= VCO.Dom.create("div", "vco-text-content-container", this._el.container);
		//this._el.content					= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
		
		// Headline
		if (this.data.headline != "") {
			this._el.headline				= VCO.Dom.create("h2", "vco-headline", this._el.content_container);
			this._el.headline.innerHTML		= this.data.headline;
		}
		
		// Text
		if (this.data.text != "") {
			this._el.content				= VCO.Dom.create("div", "vco-text-content", this._el.content_container);
			this._el.content.innerHTML		= VCO.Util.htmlify(this.data.text);
		}
		
		// Fire event that the slide is loaded
		this.onLoaded();
		
		
		
	}
	
});
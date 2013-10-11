/*	VCO.Media
	Main media template for media assets.
	Takes a data object and populates a dom object
================================================== */
// TODO add link

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
			caption: null,
			credit: null,
			parent: {},
			link: null
		};
		
		// Player (If Needed)
		this.player = null;
		
		// Timer (If Needed)
		this.timer = null;
		
		// Message
		this.message = null;
		
		// Media ID
		this.media_id = null;
	
		// Data
		this.data = {
			uniqueid: 			null,
			url: 				null,
			credit:				null,
			caption:			null,
			link: 				null,
			link_target: 		null
		};
	
		//Options
		this.options = {
			api_key_flickr: 		"f2cc870b4d233dd0a5bfe73fd0d64ef0",
			credit_height: 			0,
			caption_height: 		0
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
			this._el.parent = add_to_container;
		};
		
	},
	
	loadMedia: function() {
		try {
			this._loadMedia();
		} catch (e) {
			trace("Error loading media for ", this._media);
			trace(e);
		}
	},
	
	/*	Media Specific
	================================================== */
		_loadMedia: function() {
		
		},
		
		_updateMediaDisplay: function() {
			this._el.content_item.style.maxHeight = (this.options.height - this.options.credit_height - this.options.caption_height - 16) + "px";
			
		},
	
	/*	Public
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
	
	// Update Display
	updateDisplay: function(w, h, animate) {
		this._updateDisplay(w, h, animate);
	},

	/*	Events
	================================================== */
	onLoaded: function() {
		this.fire("loaded", this.data);
		if (this.message) {
			this.message.hide();
		}
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
		
		// Message
		this.message = new VCO.Message({}, this.options);
		this.message.addTo(this._el.container);
		
		// Create Layout
		this._el.content_container = VCO.Dom.create("div", "vco-media-content-container", this._el.container);
		
		// Link
		if (this.data.link && this.data.link != "") {
			
			this._el.link = VCO.Dom.create("a", "vco-media-link", this._el.content_container);
			this._el.link.href = this.data.link;
			if (this.data.link_target && this.data.link_target != "") {
				this._el.link.target = this.data.link_target;
			} else {
				this._el.link.target = "_blank";
			}
			
			this._el.content = VCO.Dom.create("div", "vco-media-content", this._el.link);
			
		} else {
			this._el.content = VCO.Dom.create("div", "vco-media-content", this._el.content_container);
		}
		
		// Credit
		if (this.data.credit && this.data.credit != "") {
			this._el.credit					= VCO.Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.data.credit;
			this.options.credit_height 		= this._el.credit.offsetHeight;
		}
		
		// Caption
		if (this.data.caption && this.data.caption != "") {
			this._el.caption				= VCO.Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.data.caption;
			this.options.caption_height 	= this._el.caption.offsetHeight;
		}
		
		
	},
	
	// Update Display
	_updateDisplay: function(w, h, animate) {
		trace("UPDATE MEDIA DISPLAY")
		if (w) {
			this.options.width = w;
		}
		if (h) {
			this.options.height = h;
		}
		
		if (this._el.credit) {
			this.options.credit_height 		= this._el.credit.offsetHeight;
		}
		if (this._el.caption) {
			this.options.caption_height 	= this._el.caption.offsetHeight;
		}
		
		this._updateMediaDisplay();
		
	}
	
});
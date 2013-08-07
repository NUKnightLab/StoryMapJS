// TODO Create slide element

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	// DOM ELEMENTS
	_el: {
		container: {},
		content_container: {},
		content: {}
	},
	
	// Components
	_media: {},
	_mediaclass: {},
	_text: {},
	
	// Options
	options: {
		uniqueid: 				"",
		background: {			// OPTIONAL
			url: 				null, //"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
			color: 				"#cdbfe3",
			opacity: 			50
		},
		date: 					null,
		location: {
			lat: 				-9.143962,
			lon: 				38.731094,
			zoom: 				13,
			icon: 				"http://maps.gstatic.com/intl/en_us/mapfiles/ms/micons/blue-pushpin.png"
		},
		text: {
			headline: 			"Le portrait mystérieux",
			text: 				"Lorem ipsum dolor sit amet, consectetuer adipiscing elit."
		},
		media: {
			url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
			credit:				"Georges Méliès",
			caption:			"Le portrait mystérieux",
			mediatype: 			{}
		}
		
	},
	
	/*	Constructor
	================================================== */
	initialize: function(options, add_to_container) {
		
		VCO.Util.setOptions(this, options);
		
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-slide");
		this._el.container.id = this.options.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		}
		
		//return this;
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
		this._el.content_container		= VCO.Dom.create("div", "vco-slide-content-container", this._el.container);
		this._el.content				= VCO.Dom.create("div", "vco-slide-content", this._el.content_container);
		
		// Style Slide Background
		if (this.options.background) {
			if (this.options.background.url) {
				this._el.container.className += ' vco-full-image-background';
				this._el.container.style.backgroundImage="url('" + this.options.background.url + "')";
			}
			if (this.options.background.color) {
				this._el.container.style.backgroundColor = this.options.background.color;
			}
		} 
		
		// Media
		if (this.options.media) {
			this.options.media.mediatype = VCO.MediaType(this.options.media.url);
			trace(this.options.media.mediatype);
			//this._media = new this.options.media.mediatype.classname();
			//var function_name = this.options.media.mediatype.classname;
			trace("TTTEEESSSTT");
			//trace(this.options.media.mediatype.classname);
			//var function_name = eval(this.options.media.mediatype.classname);
			
			//trace(function_name());
			//this._mediaclass = window[this.options.media.mediatype.classname];
			//this._media = new window[this.options.media.mediatype.classname](this.options.media);

			this._media = new this.options.media.mediatype.classname(this.options.media);

			
			//this._media = new window[this.options.media.mediatype.classname](this.options.media);
			//this._media = new VCO.Media(this.options.media);
			this._media.addTo(this._el.content);
		}
		
		// Text
		if (this.options.text) {
			this._text = new VCO.Text(this.options.text);
			this._text.addTo(this._el.content);
		}
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
	}
	
});

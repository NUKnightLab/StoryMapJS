/*	VCO.Slide
	Creates a slide. Takes a data object and
	populates the slide with content.
================================================== */

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
	
	// Data
	data: {
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
			caption:			"Le portrait mystérieux"
		}
		
	},
	
	// Options
	options: {
		something: 				""
	},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		
		VCO.Util.setData(this, data);
		
		if (options) {
			VCO.Util.setOptions(this, this.options);
		}
		
		//this._container = VCO.Dom.get(id);
		this._el.container = VCO.Dom.create("div", "vco-slide");
		this._el.container.id = this.data.uniqueid;
		
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
		this._el.content_container		= VCO.Dom.create("div", "vco-slide-content-container", this._el.container);
		this._el.content				= VCO.Dom.create("div", "vco-slide-content", this._el.content_container);
		
		// Style Slide Background
		if (this.data.background) {
			if (this.data.background.url) {
				this._el.container.className += ' vco-full-image-background';
				this._el.container.style.backgroundImage="url('" + this.data.background.url + "')";
			}
			if (this.data.background.color) {
				this._el.container.style.backgroundColor = this.data.background.color;
			}
		} 
		
		// Media
		if (this.data.media) {
			// Determine the media type
			this.data.media.mediatype = VCO.MediaType(this.data.media.url);
			
			// Create a media object using the matched class name
			this._media = new this.data.media.mediatype.cls(this.data.media);
			
			// add the object to the dom
			this._media.addTo(this._el.content);
			this._media.loadMedia();
		}
		
		// Text
		if (this.data.text) {
			this._text = new VCO.Media.Text(this.data.text);
			this._text.addTo(this._el.content);
		}
		
		// Fire event that the slide is loaded
		//this.onLoaded();
		
	}
	
});

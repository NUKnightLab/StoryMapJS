/*	VCO.Slide
	Creates a slide. Takes a data object and
	populates the slide with content.
================================================== */

VCO.Slide = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, title_slide) {
		
		// DOM Elements
		this._el = {
			container: {},
			scroll_container: {},
			background: {},
			content_container: {},
			content: {},
			call_to_action: null
		};
	
		// Components
		this._media 		= null;
		this._mediaclass	= {};
		this._text			= {};
	
		// State
		this._state = {
			loaded: 		false
		};
		
		this.has = {
			headline: 	false,
			text: 		false,
			media: 		false,
			title: 		false,
			background: {
				image: false,
				color: false,
				color_value :""
			}
		}
		
		this.has.title = title_slide;
		
		this.title = "";
		
		// Data
		this.data = {
			uniqueid: 				null,
			background: 			null,
			date: 					null,
			location: 				null,
			text: 					null,
			media: 					null
		};
	
		// Options
		this.options = {
			// animation
			duration: 			1000,
			slide_padding_lr: 	40,
			ease: 				VCO.Ease.easeInSpline,
			width: 				600,
			height: 			600,
			skinny_size: 		650,
			media_name: 		""
		};
		
		// Actively Displaying
		this.active = false;
		
		// Animation Object
		this.animator = {};
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		this._initLayout();
		this._initEvents();
		
		
	},
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		this.animator = VCO.Animate(this._el.slider_container, {
			left: 		-(this._el.container.offsetWidth * n) + "px",
			duration: 	this.options.duration,
			easing: 	this.options.ease
		});
	},
	
	hide: function() {
		
	},
	
	setActive: function(is_active) {
		this.active = is_active;
		
		if (this.active) {
			if (this.data.background) {
				this.fire("background_change", this.has.background);
			}
			this.loadMedia();
		} else {
			this.stopMedia();
		}
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
	},
	
	updateDisplay: function(w, h, l) {
		this._updateDisplay(w, h, l);
	},
	
	loadMedia: function() {
		
		if (this._media && !this._state.loaded) {
			this._media.loadMedia();
			this._state.loaded = true;
		}
	},
	
	stopMedia: function() {
		if (this._media && this._state.loaded) {
			this._media.stopMedia();
		}
	},
	
	getBackground: function() {
		return this.has.background;
	},
	
	scrollToTop: function() {
		this._el.container.scrollTop = 0;
	},
	
	addCallToAction: function(str) {
		this._el.call_to_action = VCO.Dom.create("div", "vco-slide-calltoaction", this._el.content_container);
		this._el.call_to_action.innerHTML = "<span class='vco-slide-calltoaction-button-text'>" + str + "</span>";
		VCO.DomEvent.addListener(this._el.call_to_action, 'click', this._onCallToAction, this);
	},
	
	/*	Events
	================================================== */
	_onCallToAction: function(e) {
		this.fire("call_to_action", e);
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.container 				= VCO.Dom.create("div", "vco-slide");
		if (this.data.uniqueid) {
			this._el.container.id 		= this.data.uniqueid;
		}
		this._el.scroll_container 		= VCO.Dom.create("div", "vco-slide-scrollable-container", this._el.container);
		this._el.content_container		= VCO.Dom.create("div", "vco-slide-content-container", this._el.scroll_container);
		this._el.content				= VCO.Dom.create("div", "vco-slide-content", this._el.content_container);
		this._el.background				= VCO.Dom.create("div", "vco-slide-background", this._el.container);
		// Style Slide Background
		if (this.data.background) {
			if (this.data.background.url) {
				this.has.background.image 					= true;
				this._el.container.className 				+= ' vco-full-image-background';
				//this._el.container.style.backgroundImage="url('" + this.data.background.url + "')";
				this.has.background.color_value 			= "#000";
				this._el.background.style.backgroundImage 	= "url('" + this.data.background.url + "')";
				this._el.background.style.display 			= "block";
			}
			if (this.data.background.color) {
				this.has.background.color 					= true;
				this._el.container.className 				+= ' vco-full-color-background';
				this.has.background.color_value 			= this.data.background.color;
				//this._el.container.style.backgroundColor = this.data.background.color;
				//this._el.background.style.backgroundColor 	= this.data.background.color;
				//this._el.background.style.display 			= "block";
			}
			if (this.data.background.text_background) {
				this._el.container.className 				+= ' vco-text-background';
			}
			
		} 
		
		
		
		// Determine Assets for layout and loading
		if (this.data.media && this.data.media.url && this.data.media.url != "") {
			this.has.media = true;
		}
		if (this.data.text && this.data.text.text) {
			this.has.text = true;
		}
		if (this.data.text && this.data.text.headline) {
			this.has.headline = true;
			this.title = this.data.text.headline;
		}
		
		// Create Media
		if (this.has.media) {
			
			// Determine the media type
			this.data.media.mediatype 	= VCO.MediaType(this.data.media);
			this.options.media_name 	= this.data.media.mediatype.name;
			this.options.media_type 	= this.data.media.mediatype.type;
			
			// Create a media object using the matched class name
			this._media = new this.data.media.mediatype.cls(this.data.media, this.options);
			
		}
		
		// Create Text
		if (this.has.text || this.has.headline) {
			this._text = new VCO.Media.Text(this.data.text, {title:this.has.title});
		}
		
		// Add to DOM
		if (!this.has.text && !this.has.headline && this.has.media) {
			this._el.container.className += ' vco-slide-media-only';
			this._media.addTo(this._el.content);
		} else if (this.has.headline && this.has.media && !this.has.text) {
			this._el.container.className += ' vco-slide-media-only';
			this._text.addTo(this._el.content);
			this._media.addTo(this._el.content);
		} else if (this.has.text && this.has.media) {
			this._media.addTo(this._el.content);
			this._text.addTo(this._el.content);
		} else if (this.has.text || this.has.headline) {
			this._el.container.className += ' vco-slide-text-only';
			this._text.addTo(this._el.content);
		}
		
		// Fire event that the slide is loaded
		this.onLoaded();
		
	},
	
	_initEvents: function() {
		
	},
	
	// Update Display
	_updateDisplay: function(width, height, layout) {
		var pad_left, pad_right, new_width;
		
		if (width) {
			this.options.width 					= width;
		} else {
			this.options.width 					= this._el.container.offsetWidth;
		}
		
		if(VCO.Browser.mobile && (this.options.width <= this.options.skinny_size)) {
			pad_left 	= 0 + "px";
			pad_right 	= 0 + "px";
			new_width	= this.options.width - 0 + "px";
		} else if (layout == "landscape") {
			pad_left 	= 40 + "px";
			pad_right	= 75 + "px";
			new_width	= this.options.width - (75 + 40) + "px";
		
		} else if (this.options.width <= this.options.skinny_size) {
			pad_left 	= this.options.slide_padding_lr + "px";
			pad_right 	= this.options.slide_padding_lr + "px";
			new_width	= this.options.width - (this.options.slide_padding_lr * 2) + "px";
		} else {
			pad_left	= this.options.slide_padding_lr + "px";
			pad_right 	= this.options.slide_padding_lr + "px";
			new_width	= this.options.width - (this.options.slide_padding_lr * 2) + "px";
		}
		
		this._el.content.style.paddingLeft 	= pad_left;
		this._el.content.style.paddingRight = pad_right;
		this._el.content.style.width		= new_width;
		
		if (this._el.call_to_action) {
			this._el.call_to_action.style.paddingLeft 	= pad_left;
			this._el.call_to_action.style.paddingRight = pad_right;
			this._el.call_to_action.style.width		= new_width;
		}
		
		if (height) {
			this.options.height = height;
			//this._el.scroll_container.style.height		= this.options.height + "px";
			
		} else {
			this.options.height = this._el.container.offsetHeight;
		}
		
		if (this._media) {
			if (!this.has.text && this.has.headline) {
				this._media.updateDisplay(this.options.width, (this.options.height - this._text.headlineHeight()), layout);
			} else {
				this._media.updateDisplay(this.options.width, this.options.height, layout);
			}
		}
		
	}
	
});

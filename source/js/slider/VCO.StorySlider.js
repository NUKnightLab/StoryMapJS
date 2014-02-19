/*	StorySlider
	is the central class of the API - it is used to create a StorySlider

	Events:
	nav_next
	nav_previous
	slideDisplayUpdate
	loaded
	slideAdded
	slideLoaded
	slideRemoved

	TODO
	Memory handling
	
================================================== */

VCO.StorySlider = VCO.Class.extend({
	
	includes: VCO.Events,
	
	/*	Private Methods
	================================================== */
	initialize: function (elem, data, options, init) {
		
		// DOM ELEMENTS
		this._el = {
			container: {},
			slider_container_mask: {},
			slider_container: {},
			slider_item_container: {}
		};
		
		this._nav = {};
		this._nav.previous = {};
		this._nav.next = {};
		
		// Slides Array
		this._slides = [];
		
		// Swipe Object
		this._swipable;
		
		// Preload Timer
		this.preloadTimer;
		
		// Current Slide
		this.current_slide = 0;
		
		// Data Object
		this.data = {
			uniqueid: 				"",
			slides: 				[
				{
					uniqueid: 				"",
					background: {			// OPTIONAL
						url: 				null,
						color: 				null,
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
						headline: 			"Slideshow Example",
						text: 				"Example slideshow slide "
					},
					media: [
						{
							uniqueid: 				"",
							text: {
								headline: 			"Slideshow Example",
								text: 				""
							},
							media: {
								url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
								credit:				"",
								caption:			"",
								link: 				null,
								link_target: 		null
							}
						},
						{
							uniqueid: 				"",
							text: {
								headline: 			"Slideshow Example",
								text: 				""
							},
							media: {
								url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
								credit:				"",
								caption:			"",
								link: 				null,
								link_target: 		null
							}
						},
						{
							uniqueid: 				"",
							text: {
								headline: 			"Slideshow Example",
								text: 				""
							},
							media: {
								url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
								credit:				"",
								caption:			"",
								link: 				null,
								link_target: 		null
							}
						},
						{
							uniqueid: 				"",
							text: {
								headline: 			"Slideshow Example",
								text: 				""
							},
							media: {
								url: 				"http://2.bp.blogspot.com/-dxJbW0CG8Zs/TmkoMA5-cPI/AAAAAAAAAqw/fQpsz9GpFdo/s1600/voyage-dans-la-lune-1902-02-g.jpg",
								credit:				"",
								caption:			"",
								link: 				null,
								link_target: 		null
							}
						}
					]
				},
				{
					uniqueid: 				"",
					background: {			// OPTIONAL
						url: 				null,
						color: 				null,
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
						headline: 			"YouTube",
						text: 				"Just add a link to the video in the media field."
					},
					media: {
						url: 				"http://www.youtube.com/watch?v=lIvftGgps24",
						credit:				"",
						caption:			"",
						link: 				null,
						link_target: 		null
					}
				}
			]
		};
		
		this.options = {
			id: 					"",
			width: 					600,
			height: 				600,
			slide_padding_lr: 		100, // padding on slide of slide
			start_at_slide: 		1,
			// animation
			duration: 				1000,
			ease: 					VCO.Ease.easeInOutQuint,
			// interaction
			dragging: 				true,
			trackResize: 			true
		};
		
		// Main element ID
		if (typeof elem === 'object') {
			this._el.container = elem;
			this.options.id = VCO.Util.unique_ID(6, "vco");
		} else {
			this.options.id = elem;
			this._el.container = VCO.Dom.get(elem);
		}

		if (!this._el.container.id) {
			this._el.container.id = this.options.id;
		}
		
		// Animation Object
		this.animator = null;
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		VCO.Util.mergeData(this.data, data);
		
		if (init) {
			this.init();
		}
	},
	
	init: function() {
		this._initLayout();
		this._initEvents();
		this._initData();
		this._updateDisplay();
		
		// Go to initial slide
		this.goTo(this.options.start_at_slide);
		
		this._onLoaded();
	},
	
	/*	Public
	================================================== */
	updateDisplay: function(w, h) {
		this._updateDisplay(w, h);
	},
	
	// Create a slide
	createSlide: function(d) {
		this._createSlide(d);
	},
	
	// Create Many Slides from an array
	createSlides: function(array) {
		this._createSlides(array);
	},
	
	/*	Create Slides
	================================================== */
	_createSlides: function(array) {
		for (var i = 0; i < array.length; i++) {
			if (array[i].uniqueid == "") {
				array[i].uniqueid = VCO.Util.unique_ID(6, "vco-slide");
			}
			if (i == 0) {
				this._createSlide(array[i], true);
			} else {
				this._createSlide(array[i], false);
			}
			
		};
	},
	
	_createSlide: function(d, title_slide) {
		var slide = new VCO.Slide(d, this.options, title_slide);
		this._addSlide(slide);
		this._slides.push(slide);
	},
	
	_destroySlide: function(slide) {
		this._removeSlide(slide);
		for (var i = 0; i < this._slides.length; i++) {
			if (this._slides[i] == slide) {
				this._slides.splice(i, 1);
			}
		}
	},
	
	_addSlide:function(slide) {
		slide.addTo(this._el.slider_item_container);
		slide.on('added', this._onSlideAdded, this);
	},
	
	_removeSlide: function(slide) {
		slide.removeFrom(this._el.slider_item_container);
		slide.off('added', this._onSlideAdded, this);
	},
	
	/*	Navigation
	================================================== */
	
	goTo: function(n, fast, displayupdate) {
		var self = this;
		
		// Clear Preloader Timer
		if (this.preloadTimer) {
			clearTimeout(this.preloadTimer);
		}
		// Stop Playing Media
		for (var i = 0; i < this._slides.length; i++) {
			this._slides[i].stopMedia();
		}
		
		if (n < this._slides.length && n >= 0) {
			
			
			this.current_slide = n;
			
			// Stop animation
			if (this.animator) {
				this.animator.stop();
			}
			if (this._swipable) {
				this._swipable.stopMomentum();
			}
			
			if (fast) {
				this._el.slider_container.style.left = -(this.options.width * n) + "px";
				this._onSlideChange(displayupdate);
			} else {
				this.animator = VCO.Animate(this._el.slider_container, {
					left: 		-(this.options.width * n) + "px",
					duration: 	this.options.duration,
					easing: 	this.options.ease,
					complete: 	this._onSlideChange(displayupdate)
				});
				
			}
			
			
			// Update Navigation
			
			// Color
			var slide_background = this._slides[this.current_slide].getBackground();
			this.fire("colorchange", slide_background);
			
			if (slide_background.color || slide_background.image) {
				this._nav.next.setColor(true);
				this._nav.previous.setColor(true);
			} else {
				this._nav.next.setColor(false);
				this._nav.previous.setColor(false);
			}
			
			//Info
			if (this._slides[this.current_slide + 1]) {
				this.showNav(this._nav.next, true);
				this._nav.next.update(this.getNavInfo(this._slides[this.current_slide + 1]));
			} else {
				this.showNav(this._nav.next, false);
			}
			if (this._slides[this.current_slide - 1]) {
				this.showNav(this._nav.previous, true);
				this._nav.previous.update(this.getNavInfo(this._slides[this.current_slide - 1]));
			} else {
				this.showNav(this._nav.previous, false);
			}
			
			
			// Preload Slides
			this._slides[this.current_slide].loadMedia();
			
			//this.preloadSlides();
			
			this.preloadTimer = setTimeout(function() {
				self.preloadSlides();
			}, this.options.duration);
			
		}
	},
	
	preloadSlides: function() {
		trace("PRELOAD")
		if (this._slides[this.current_slide + 1]) {
			this._slides[this.current_slide + 1].loadMedia();
			this._slides[this.current_slide + 1].scrollToTop();
		}
		if (this._slides[this.current_slide + 2]) {
			this._slides[this.current_slide + 2].loadMedia();
			this._slides[this.current_slide + 2].scrollToTop();
		}
		if (this._slides[this.current_slide - 1]) {
			this._slides[this.current_slide - 1].loadMedia();
			this._slides[this.current_slide - 1].scrollToTop();
		}
		if (this._slides[this.current_slide - 2]) {
			this._slides[this.current_slide - 2].loadMedia();
			this._slides[this.current_slide - 2].scrollToTop();
		}
	},
	
	
	getNavInfo: function(slide) {
		var n = {
			title: "",
			description: ""
		};
		
		if (slide.data.text) {
			if (slide.data.text.headline) {
				n.title = slide.data.text.headline;
			}
			/*
			// Disabling location in description for now.
			if (slide.data.location) {
				if (slide.data.location.name) {
					n.description = slide.data.location.name;
				}
			}
			*/
		}
		
		return n;
		
	},
	
	next: function() {
		this.goTo(this.current_slide +1);
	},
	
	previous: function() {
		this.goTo(this.current_slide -1);
	},
	
	showNav: function(nav_obj, show) {
		
		if (this.options.width <= 500 && VCO.Browser.mobile) {
			
		} else {
			if (show) {
				nav_obj.show();
			} else {
				nav_obj.hide();
			}
			
		}
	},
	
	/*	Private Methods
	================================================== */
	
	// Update Display
	_updateDisplay: function(width, height, animate) {
		
		var nav_pos;
		
		if (width) {
			this.options.width = width;
		} else {
			this.options.width = this._el.container.offsetWidth;
		}
		
		if (height) {
			this.options.height = height;
		} else {
			this.options.height = this._el.container.offsetHeight;
		}
		
		//this._el.container.style.height = this.options.height;
		
		// position navigation
		nav_pos = (this.options.height/2);
		this._nav.next.setPosition({top:nav_pos});
		this._nav.previous.setPosition({top:nav_pos});
		
		// Position slides
		for (var i = 0; i < this._slides.length; i++) {
			this._slides[i].updateDisplay(this.options.width, this.options.height);
			this._slides[i].setPosition({left:(this.options.width * i), top:0});
			
		};
		
		// Go to the current slide
		this.goTo(this.current_slide, true, true);
	},
	
	/*	Init
	================================================== */
	_initLayout: function () {
		
		trace("initLayout " + this.options.id);
		this._el.container.className += ' vco-storyslider';
		
		// Create Layout
		this._el.slider_container_mask		= VCO.Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.slider_container			= VCO.Dom.create('div', 'vco-slider-container vcoanimate', this._el.slider_container_mask);
		this._el.slider_item_container		= VCO.Dom.create('div', 'vco-slider-item-container', this._el.slider_container);
		
		// Update Size
		this.options.width = this._el.container.offsetWidth;
		this.options.height = this._el.container.offsetHeight;
		
		// Create Navigation
		this._nav.previous = new VCO.SlideNav({title: "Previous", description: "description"}, {direction:"previous"});
		this._nav.next = new VCO.SlideNav({title: "Next",description: "description"}, {direction:"next"});
		
		// add the navigation to the dom
		this._nav.next.addTo(this._el.container);
		this._nav.previous.addTo(this._el.container);
				
		this._el.slider_container.style.left="0px";
		
		if (VCO.Browser.touch) {
			this._swipable = new VCO.Swipable(this._el.slider_container_mask, this._el.slider_container, {
				enable: {x:true, y:false},
				snap: 	true
			});
			this._swipable.enable();
		}
		
	},
	
	_initEvents: function () {
		this._nav.next.on('clicked', this._onNavigation, this);
		this._nav.previous.on('clicked', this._onNavigation, this);
		if (this._swipable) {
			this._swipable.on('swipe_left', this._onNavigation, this);
			this._swipable.on('swipe_right', this._onNavigation, this);
			this._swipable.on('swipe_nodirection', this._onSwipeNoDirection, this);
		}
		
		
	},
	
	_initData: function() {
		// Create Slides and then add them
		this._createSlides(this.data.slides);
	},
	
	/*	Events
	================================================== */
	_onSwipeNoDirection: function(e) {
		this.goTo(this.current_slide);
	},
	
	_onNavigation: function(e) {
		trace("on Navigation");
		
		if (e.direction == "next" || e.direction == "left") {
			this.next();
		} else if (e.direction == "previous" || e.direction == "right") {
			this.previous();
		} 
		this.fire("nav_" + e.direction, this.data);
	},
	
	_onSlideAdded: function(e) {
		this.fire("slideAdded", this.data);
	},
	
	_onSlideRemoved: function(e) {
		this.fire("slideAdded", this.data);
	},
	
	_onSlideChange: function(displayupdate) {
		
		if (!displayupdate) {
			this.fire("change", {current_slide:this.current_slide});
		}
	},
	
	_onMouseClick: function(e) {
		
	},
	
	_fireMouseEvent: function (e) {
		if (!this._loaded) {
			return;
		}

		var type = e.type;
		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) {
			return;
		}

		if (type === 'contextmenu') {
			VCO.DomEvent.preventDefault(e);
		}
		
		this.fire(type, {
			latlng: "something", //this.mouseEventToLatLng(e),
			layerPoint: "something else" //this.mouseEventToLayerPoint(e)
		});
	},
	
	_onLoaded: function() {
		this.fire("loaded", this.data);
	}
	
	
});



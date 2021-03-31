import { classMixin, mergeData, unique_ID, findArrayNumberByUniqueID, hexToRgb } from "../core/Util"
import Dom from "../dom/Dom"
import { DomEvent } from "../dom/DomEvent"
import Events from "../core/Events"
import Ease from "../animation/Ease"
import SlideNav from "./SlideNav"
import Slide from "./Slide"
import Animate from "../animation/Animate"
import Swipable from "../ui/Swipable"
import Message from "../ui/Message"
import { Browser } from "../core/Browser"
import { Language } from "../language/Language"

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


================================================== */

export default class StorySlider {

	//includes: VCO.Events,

	/*	Private Methods
	================================================== */
	constructor(elem, data, options, init) {

		// DOM ELEMENTS
		this._el = {
			container: {},
			background: {},
			slider_container_mask: {},
			slider_container: {},
			slider_item_container: {}
		};

		this._nav = {};
		this._nav.previous = {};
		this._nav.next = {};

		// Slide Spacing
		this.slide_spacing = 0;

		// Slides Array
		this._slides = [];

		// Swipe Object
		this._swipable;

		// Preload Timer
		this.preloadTimer;

		// Message
		this._message;

		// Current Slide
		this.current_slide = 0;

		// Current Background Color
		this.current_bg_color = null;

		// Data Object
		this.data = {};

		this.options = {
			id: 					"",
			layout: 				"portrait",
			width: 					600,
			height: 				600,
			default_bg_color: 		{r:256, g:256, b:256},
			slide_padding_lr: 		40, 			// padding on slide of slide
			start_at_slide: 		1,
			slide_default_fade: 	"0%", 			// landscape fade
			// animation
			duration: 				1000,
			ease: 					Ease.easeInOutQuint,
			// interaction
			dragging: 				true,
			trackResize: 			true
		};

		// Main element ID
		if (typeof elem === 'object') {
			this._el.container = elem;
			this.options.id = unique_ID(6, "vco");
		} else {
			this.options.id = elem;
			this._el.container = Dom.get(elem);
		}

		if (!this._el.container.id) {
			this._el.container.id = this.options.id;
		}

		// Animation Object
		this.animator = null;
		this.animator_background = null;

		// Merge Data and Options
		mergeData(this.options, options);
		mergeData(this.data, data);

		if (init) {
			this.init();
		}
	}

	init() {
		this._initLayout();
		this._initEvents();
		this._initData();
		this._updateDisplay();

		// Go to initial slide
		this.goTo(this.options.start_at_slide);

		this._onLoaded();
		this._introInterface();
	}

	/*	Public
	================================================== */
	updateDisplay(w, h, a, l) {
		this._updateDisplay(w, h, a, l);
	}

	// Create a slide
	createSlide(d) {
		this._createSlide(d);
	}

	// Create Many Slides from an array
	createSlides(array) {
		this._createSlides(array);
	}

	/*	Create Slides
	================================================== */
	_createSlides(array) {
		for (var i = 0; i < array.length; i++) {
			if (array[i].uniqueid == "") {
				array[i].uniqueid = unique_ID(6, "vco-slide");
			}
			if (i == 0) {
				this._createSlide(array[i], true);
			} else {
				this._createSlide(array[i], false);
			}

		};
	}

	_createSlide(d, title_slide) {
		var slide = new Slide(d, this.options, title_slide);
		this._addSlide(slide);
		this._slides.push(slide);
	}

	_destroySlide(slide) {
		this._removeSlide(slide);
		for (var i = 0; i < this._slides.length; i++) {
			if (this._slides[i] == slide) {
				this._slides.splice(i, 1);
			}
		}
	}

	_addSlide(slide) {
		slide.addTo(this._el.slider_item_container);
		slide.on('added', this._onSlideAdded, this);
		slide.on('background_change', this._onBackgroundChange, this);
	}

	_removeSlide(slide) {
		slide.removeFrom(this._el.slider_item_container);
		slide.off('added', this._onSlideAdded, this);
		slide.off('background_change', this._onBackgroundChange);
	}

	/*	Message
	================================================== */

	/*	Navigation
	================================================== */
	goToId(n, fast, displayupdate) {
		if (typeof n == 'string' || n instanceof String) {
			_n = findArrayNumberByUniqueID(n, this._slides, "uniqueid");
		} else {
			_n = n;
		}
		this.goTo(_n, fast, displayupdate);

	}

	goTo(n, fast, displayupdate) {
		var self = this;

		this.changeBackground({color_value:"", image:false});

		// Clear Preloader Timer
		if (this.preloadTimer) {
			clearTimeout(this.preloadTimer);
		}

		// Set Slide Active State
		for (var i = 0; i < this._slides.length; i++) {
			this._slides[i].setActive(false);
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
				this._el.slider_container.style.left = -(this.slide_spacing * n) + "px";
				this._onSlideChange(displayupdate);
			} else {
				this.animator = Animate(this._el.slider_container, {
					left: 		-(this.slide_spacing * n) + "px",
					duration: 	this.options.duration,
					easing: 	this.options.ease,
					complete: 	this._onSlideChange(displayupdate)
				});

			}

			// Set Slide Active State
			this._slides[this.current_slide].setActive(true);

			// Update Navigation and Info
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
			this.preloadTimer = setTimeout(function() {
				self.preloadSlides();
			}, this.options.duration);

		}
	}

	preloadSlides() {
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
	}

	getNavInfo(slide) {
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

	}

	next() {
		if ((this.current_slide +1) < (this._slides.length)) {
			this.goTo(this.current_slide +1);
		} else {
			this.goTo(this.current_slide);
		}
	}

	previous() {
		if (this.current_slide -1 >= 0) {
			this.goTo(this.current_slide -1);
		} else {
			this.goTo(this.current_slide);
		}
	}

	showNav(nav_obj, show) {

		if (this.options.width <= 500 && Browser.mobile) {

		} else {
			if (show) {
				nav_obj.show();
			} else {
				nav_obj.hide();
			}

		}
	}

	changeBackground(bg) {
		var self = this,
			do_animation = false;

		var bg_color = {r:256, g:256, b:256},
			bg_color_rgb,
			bg_percent_start 	= this.options.slide_default_fade,
			bg_percent_end 		= "15%",
			bg_alpha_end 		= "0.87",
			bg_css 				= "",
			bg_old 				= this._el.background.getAttribute('style');

		if (bg.color_value) {
			bg_color = hexToRgb(bg.color_value);
		} else {
			bg_color = this.options.default_bg_color;
		}


		// Stop animation
		if (this.animator_background) {
			this.animator_background.stop();
		}

		bg_color_rgb 	= bg_color.r + "," + bg_color.g + "," + bg_color.b;

		if (!this.current_bg_color || this.current_bg_color != bg_color_rgb) {
			this.current_bg_color = bg_color_rgb;
			do_animation = true;
		}

		if (do_animation) {

			// Figure out CSS
			if (this.options.layout == "landscape") {

				this._nav.next.setColor(false);
				this._nav.previous.setColor(false);

				// If background is not white, less fade is better
				if (bg_color.r < 255 && bg_color.g < 255 && bg_color.b < 255) {
					bg_percent_start = "15%";
				}

				if (bg.image) {
					bg_percent_start = "0%";

				}
				bg_css 	+= "opacity:0;"
				bg_css 	+= "background-image: -webkit-linear-gradient(left, color-stop(rgba(" + bg_color_rgb + ",0.0001 ) " + bg_percent_start + "), color-stop(rgba(" + bg_color_rgb + "," + bg_alpha_end + ") " + bg_percent_end + "));";
				bg_css 	+= "background-image: linear-gradient(to right, rgba(" + bg_color_rgb + ",0.0001 ) "+ bg_percent_start + ", rgba(" + bg_color_rgb + "," + bg_alpha_end + ") " + bg_percent_end + ");";
				bg_css 	+= "background-repeat: repeat-x;";
				bg_css 	+= "filter: e(%('progid:DXImageTransform.Microsoft.gradient(startColorstr='%d', endColorstr='%d', GradientType=1)',argb(" + bg_color_rgb + ", 0.0001),argb(" + bg_color_rgb + ",0.80)));";


			} else {
				if (bg.color_value) {
					bg_css 	+= 'background-color:' + bg.color_value + ";";
				} else {
					bg_css 	+= "background-color:#FFF;";
				}

				if (bg_color.r < 255 && bg_color.g < 255 && bg_color.b < 255 || bg.image) {
					this._nav.next.setColor(true);
					this._nav.previous.setColor(true);
				} else {
					this._nav.next.setColor(false);
					this._nav.previous.setColor(false);
				}
			}

			// FADE OUT IN
			this.animator_background = Animate(this._el.background, {
				opacity: 	0,
				duration: 	this.options.duration/2,
				easing: 	this.options.ease,
				complete: 	function() {
					self.fadeInBackground(bg_css);
				}
			});
		}

	}

	fadeInBackground(bg_css) {
		if (this.animator_background) {
			this.animator_background.stop();
		}

		if (bg_css) {
			this._el.background.setAttribute("style", bg_css);
		}

		this.animator_background = Animate(this._el.background, {
			opacity: 	1,
			duration: 	this.options.duration/2,
			easing: 	this.options.ease
		});

	}

	/*	Private Methods
	================================================== */

	// Update Display
	_updateDisplay(width, height, animate, layout) {
		var nav_pos, _layout;

		if(typeof layout === 'undefined'){
			_layout = this.options.layout;
		} else {
			_layout = layout;
		}

		this.options.layout = _layout;

		this.slide_spacing = this.options.width*2;

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
			this._slides[i].updateDisplay(this.options.width, this.options.height, _layout);
			this._slides[i].setPosition({left:(this.slide_spacing * i), top:0});
		};

		// Go to the current slide
		this.goTo(this.current_slide, true, true);
	}

	_introInterface() {

		if (this.options.call_to_action) {
			var _str = Language.messages.start;
			if (this.options.call_to_action_text != "") {
				_str = this.options.call_to_action_text;
			}
			this._slides[0].addCallToAction(_str);
			this._slides[0].on('call_to_action', this.next, this);
		}

		if (this.options.width <= this.options.skinny_size) {

		} else {
			this._nav.next.updatePosition({right:"130"}, false, this.options.duration*3, this.options.ease, -100, true);
			this._nav.previous.updatePosition({left:"-100"}, true, this.options.duration*3, this.options.ease, -200, true);
		}
	}

	/*	Init
	================================================== */
	_initLayout() {

		this._el.container.className += ' vco-storyslider';

		// Create Layout
		this._el.slider_container_mask		= Dom.create('div', 'vco-slider-container-mask', this._el.container);
		this._el.background 				= Dom.create('div', 'vco-slider-background', this._el.container);
		this._el.slider_container			= Dom.create('div', 'vco-slider-container vcoanimate', this._el.slider_container_mask);
		this._el.slider_item_container		= Dom.create('div', 'vco-slider-item-container', this._el.slider_container);


		// Update Size
		this.options.width = this._el.container.offsetWidth;
		this.options.height = this._el.container.offsetHeight;

		// Create Navigation
		this._nav.previous = new SlideNav({title: "Previous", description: "description"}, {direction:"previous"});
		this._nav.next = new SlideNav({title: "Next",description: "description"}, {direction:"next"});

		// add the navigation to the dom
		this._nav.next.addTo(this._el.container);
		this._nav.previous.addTo(this._el.container);

		this._el.slider_container.style.left="0px";

		if (Browser.touch) {
			//this._el.slider_touch_mask = VCO.Dom.create('div', 'vco-slider-touch-mask', this._el.slider_container_mask);
			this._swipable = new Swipable(this._el.slider_container_mask, this._el.slider_container, {
				enable: {x:true, y:false},
				snap: 	true
			});
			this._swipable.enable();

			// Message
			this._message = new Message({}, {
				message_class: 		"vco-message-full",
				message_icon_class: "vco-icon-swipe-left"
			});
			this._message.updateMessage(Language.buttons.swipe_to_navigate);
			this._message.addTo(this._el.container);
		}
	}

	_initEvents() {
		this._nav.next.on('clicked', this._onNavigation, this);
		this._nav.previous.on('clicked', this._onNavigation, this);

		if (this._message) {
			this._message.on('clicked', this._onMessageClick, this);
		}

		if (this._swipable) {
			this._swipable.on('swipe_left', this._onNavigation, this);
			this._swipable.on('swipe_right', this._onNavigation, this);
			this._swipable.on('swipe_nodirection', this._onSwipeNoDirection, this);
		}
	}

	_initData() {
		// Create Slides and then add them
		this._createSlides(this.data.slides);
	}

	/*	Events
	================================================== */
	_onBackgroundChange(e) {
		var slide_background = this._slides[this.current_slide].getBackground();
		this.changeBackground(e);
		this.fire("colorchange", slide_background);
	}

	_onMessageClick(e) {
		this._message.hide();
	}

	_onSwipeNoDirection(e) {
		this.goTo(this.current_slide);
	}

	_onNavigation(e) {

		if (e.direction == "next" || e.direction == "left") {
			this.next();
		} else if (e.direction == "previous" || e.direction == "right") {
			this.previous();
		}
		this.fire("nav_" + e.direction, this.data);
	}

	_onSlideAdded(e) {
		this.fire("slideAdded", this.data);
	}

	_onSlideRemoved(e) {
		this.fire("slideAdded", this.data);
	}

	_onSlideChange(displayupdate) {

		if (!displayupdate) {
			this.fire("change", {current_slide:this.current_slide, uniqueid:this._slides[this.current_slide].data.uniqueid});
		}
	}

	_onMouseClick(e) {

	}

	_fireMouseEvent(e) {
		if (!this._loaded) {
			return;
		}

		var type = e.type;
		type = (type === 'mouseenter' ? 'mouseover' : (type === 'mouseleave' ? 'mouseout' : type));

		if (!this.hasEventListeners(type)) {
			return;
		}

		if (type === 'contextmenu') {
			DomEvent.preventDefault(e);
		}

		this.fire(type, {
			latlng: "something", //this.mouseEventToLatLng(e),
			layerPoint: "something else" //this.mouseEventToLayerPoint(e)
		});
	}

	_onLoaded() {
		this.fire("loaded", this.data);
		this.fire("title", {title:this._slides[0].title});

	}
}

classMixin(StorySlider, Events)

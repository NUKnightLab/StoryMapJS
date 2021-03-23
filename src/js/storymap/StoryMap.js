import { classMixin, mergeData, updateData, urljoin } from "../core/Util"
import { loadJS, loadCSS } from "../core/Load"
import Dom from "../dom/Dom"
import Ease from "../animation/Ease"
import { setLanguage } from "../language/Language"
import Events from "../core/Events"
import Leaflet from "../map/leaflet/Map.Leaflet"
import MenuBar from "../ui/MenuBar"
import StorySlider from "../slider/StorySlider"
import { Browser } from "../core/Browser"

class StoryMap {

    // TODO: mixin
	// includes: VCO.Events,

	/*	Private Methods
	================================================== */
	//initialize: function (elem, data, options,listeners) {
	constructor(elem, data, options, listeners) {

		for (let key in listeners) {
			var callbacks = listeners[key];
			if (typeof(callbacks) == 'function') {
				this.on(key,callbacks);
			} else {
				for (var idx in callbacks) {
                    if (typeof(callbacks[idx]) == 'function') { 
					    this.on(key,callbacks[idx]);
                    } else {
                        console.log(
                            "WARNING: Ignoring invalid callback '" +
                            callbacks[idx] + "' defined for " +
                            "listener '" + key + "' in StoryMap constructor");
                    }
				}
			}
		}

		var self = this;
		// Version
		this.version = "0.1.16";

		// Ready
		this.ready = false;

		// DOM ELEMENTS
		this._el = {
			container: {},
			storyslider: {},
			map: {},
			menubar: {}
		};
        
		// Determine Container Element
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = Dom.get(elem);
		}

		// Slider
		this._storyslider = {};

		// Map
		this._map = {};
		this.map = {}; // For direct access to Leaflet Map

		// Menu Bar
		this._menubar = {};

		// Loaded State
		this._loaded = {storyslider:false, map:false};

		// Data Object
		// Test Data compiled from http://www.pbs.org/marktwain/learnmore/chronology.html
		this.data = {};

		this.options = {
      script_path: StoryMap.SCRIPT_PATH,
      height: this._el.container.offsetHeight,
      width: this._el.container.offsetWidth,
      layout: "landscape", // portrait or landscape
      base_class: "",
      default_bg_color: { r: 256, g: 256, b: 256 },
      map_size_sticky: 2.5, // Set as division 1/3 etc
      map_center_offset: null, // takes object {top:0,left:0}
      less_bounce: false, // Less map bounce when calculating zoom, false is good when there are clusters of tightly grouped markers
      start_at_slide: 0,
      call_to_action: false,
      call_to_action_text: "",
      menubar_height: 0,
      skinny_size: 650,
      relative_date: false, // Use momentjs to show a relative date from the slide.text.date.created_time field
      // animation
      duration: 1000,
      ease: Ease.easeInOutQuint,
      // interaction
      dragging: true,
      trackResize: true,
      map_type: "stamen:toner-lite",
      attribution: "",
      map_mini: true,
      map_subdomains: "",
      map_as_image: false,
      map_access_token:
        "pk.eyJ1IjoibnVrbmlnaHRsYWIiLCJhIjoiczFmd0hPZyJ9.Y_afrZdAjo3u8sz_r8m2Yw", // default
      map_background_color: "#d9d9d9",
      zoomify: {
        path: "",
        width: "",
        height: "",
        tolerance: 0.8,
        attribution: ""
      },
      map_height: 300,
      storyslider_height: 600,
      slide_padding_lr: 45, // padding on slide of slide
      slide_default_fade: "0%", // landscape fade
      menubar_default_y: 0,
      path_gfx: "gfx",
      map_popup: false,
      zoom_distance: 100,
      calculate_zoom: true, // Allow map to determine best zoom level between markers (recommended)
      line_follows_path: true, // Map history path follows default line, if false it will connect previous and current only
      line_color: "#c34528", //"#DA0000",
      line_color_inactive: "#CCC",
      line_join: "miter",
      line_weight: 3,
      line_opacity: 0.8,
      line_dash: "5,5",
      show_lines: true,
      show_history_line: true,
      api_key_flickr: "8f2d5becf7b6ba46570741620054b507",
      language: "en"

    };

		// Current Slide
		this.current_slide = this.options.start_at_slide;

		// Animation Objects
		this.animator_map = null;
		this.animator_storyslider = null;

		// Merge Options -- legacy, in case people still need to pass in
		mergeData(this.options, options);

        this._initData(data);

		return this;
	}

	/* Initialize the data
	================================================== */
  _initData(data) {
		var self = this;

		if (typeof data === 'string') {
            fetch(data)
            .then(response => response.json())
            .then(result => {
                console.log(result);
				self.data = result.storymap;
            });
		} else if (typeof data === 'object') {
			if (data.storymap) {
				self.data = data.storymap;
			} else {
				console.log("data must have a storymap property")
			}
			self._initOptions();
		} else {
	        console.log("data has unknown type")
	        self._initOptions();
        }
	}

	/* Initialize the options
	================================================== */
  _initOptions() {
 		var self = this;

    // Grab options from storymap data
    updateData(this.options, this.data);

		if (this.options.layout == "landscape") {
			this.options.map_center_offset = {left: -200, top: 0};
		}
		if (this.options.map_type == "zoomify" && this.options.map_as_image) {
			this.options.map_size_sticky = 2;
		}
		if (this.options.map_as_image) {
			this.options.calculate_zoom = false;
		}

    // Use relative date calculations?
		if(this.options.relative_date) {
			if (typeof(moment) !== 'undefined') {
				self._loadLanguage();
			} else {
				loadJS(this.options.script_path + "/library/moment.js", function() {
					self._loadLanguage();
				});
			}
		} else {
			self._loadLanguage();
		}

 		// Emoji Support to Chrome?
		if (Browser.chrome) {
			loadCSS(urljoin(this.options.script_path,"../css/fonts/font.emoji.css"), function() {
			});
		}
  }

	/*	Load Language
	================================================== */

    _loadLanguage() {
        setLanguage(this.options.language);
        this._onDataLoaded();
    }

	/*	Navigation
	================================================== */
	goTo(n) {
		if (n != this.current_slide) {
			this.current_slide = n;
			this._storyslider.goTo(this.current_slide);
			this._map.goTo(this.current_slide);
		}
	}

	updateDisplay() {
		if (this.ready) {
			this._updateDisplay();
		}
	}

	/*	Private Methods
	================================================== */

	// Initialize the layout
	_initLayout() {
		var self = this;

		this._el.container.className += ' vco-storymap';
		this.options.base_class = this._el.container.className;

		// Create Layout
		this._el.menubar		= Dom.create('div', 'vco-menubar', this._el.container);
		this._el.map 			= Dom.create('div', 'vco-map', this._el.container);
		this._el.storyslider 	= Dom.create('div', 'vco-storyslider', this._el.container);

		// Initial Default Layout
		this.options.width 				= this._el.container.offsetWidth;
		this.options.height 			= this._el.container.offsetHeight;
		this._el.map.style.height 		= "1px";
		this._el.storyslider.style.top 	= "1px";

		// Create Map using preferred Map API
		this._map = new Leaflet(this._el.map, this.data, this.options);
		this.map = this._map._map; // For access to Leaflet Map.
		this._map.on('loaded', this._onMapLoaded, this);

		// Map Background Color
		this._el.map.style.backgroundColor = this.options.map_background_color;

		// Create Menu Bar
		this._menubar = new MenuBar(this._el.menubar, this._el.container, this.options);

		// Create StorySlider
		this._storyslider = new StorySlider(this._el.storyslider, this.data, this.options);
		this._storyslider.on('loaded', this._onStorySliderLoaded, this);
		this._storyslider.on('title', this._onTitle, this);
		this._storyslider.init();

		// LAYOUT
		if (this.options.layout == "portrait") {
			// Set Default Component Sizes
			this.options.map_height 		= (this.options.height / this.options.map_size_sticky);
			this.options.storyslider_height = (this.options.height - this._el.menubar.offsetHeight - this.options.map_height - 1);
			this._menubar.setSticky(0);
		} else {
			this.options.menubar_height = this._el.menubar.offsetHeight;
			// Set Default Component Sizes
			this.options.map_height 		= this.options.height;
			this.options.storyslider_height = (this.options.height - this._el.menubar.offsetHeight - 1);
			this._menubar.setSticky(this.options.menubar_height);
		}

		// Update Display
		this._updateDisplay(this.options.map_height, true, 2000);

		// Animate Menu Bar to Default Location
		this._menubar.show(2000);

	}

	_initEvents() {

		// Sidebar Events
		this._menubar.on('collapse', this._onMenuBarCollapse, this);
		this._menubar.on('back_to_start', this._onBackToStart, this);
		this._menubar.on('overview', this._onOverview, this);

		// StorySlider Events
		this._storyslider.on('change', this._onSlideChange, this);
		this._storyslider.on('colorchange', this._onColorChange, this);

		// Map Events
		this._map.on('change', this._onMapChange, this);
	}

	// Update View
	_updateDisplay(map_height, animate, d) {
		var duration 		= this.options.duration,
			display_class 	= this.options.base_class,
			self			= this;

		if (d) {
			duration = d;
		}

		// Update width and height
		this.options.width = this._el.container.offsetWidth;
		this.options.height = this._el.container.offsetHeight;

		// Check if skinny
		if (this.options.width <= this.options.skinny_size) {
			this.options.layout = "portrait";
			//display_class += " vco-skinny";
		} else {
			this.options.layout = "landscape";
		}


		// Map Height
		if (map_height) {
			this.options.map_height = map_height;
		}


		// Detect Mobile and Update Orientation on Touch devices
		if (Browser.touch) {
			this.options.layout = Browser.orientation();
			display_class += " vco-mobile";
		}

		// LAYOUT
		if (this.options.layout == "portrait") {
			display_class += " vco-skinny";
			// Map Offset
			this._map.setMapOffset(0, 0);

			this.options.map_height 		= (this.options.height / this.options.map_size_sticky);
			this.options.storyslider_height = (this.options.height - this.options.map_height - 1);
			this._menubar.setSticky(0);

			// Portrait
			display_class += " vco-layout-portrait";

			if (animate) {

				// Animate Map
				if (this.animator_map) {
					this.animator_map.stop();
				}

				this.animator_map = Animate(this._el.map, {
					height: 	(this.options.map_height) + "px",
					duration: 	duration,
					easing: 	Ease.easeOutStrong,
					complete: function () {
						self._map.updateDisplay(self.options.width, self.options.map_height, animate, d, self.options.menubar_height);
					}
				});

				// Animate StorySlider
				if (this.animator_storyslider) {
					this.animator_storyslider.stop();
				}
				this.animator_storyslider = Animate(this._el.storyslider, {
					height: 	this.options.storyslider_height + "px",
					duration: 	duration,
					easing: 	Ease.easeOutStrong
				});

			} else {
				// Map
				this._el.map.style.height = Math.ceil(this.options.map_height) + "px";

				// StorySlider
				this._el.storyslider.style.height = this.options.storyslider_height + "px";
			}

			// Update Component Displays
			this._menubar.updateDisplay(this.options.width, this.options.height, animate);
			this._map.updateDisplay(this.options.width, this.options.height, false);
			this._storyslider.updateDisplay(this.options.width, this.options.storyslider_height, animate, this.options.layout);

		} else {

			// Landscape
			display_class += " vco-layout-landscape";

			this.options.menubar_height = this._el.menubar.offsetHeight;

			// Set Default Component Sizes
			this.options.map_height 		= this.options.height;
			this.options.storyslider_height = this.options.height;
			this._menubar.setSticky(this.options.menubar_height);

			// Set Sticky state of MenuBar
			this._menubar.setSticky(this.options.menubar_height);

			this._el.map.style.height = this.options.height + "px";

			// Update Component Displays
			this._map.setMapOffset(-(this.options.width/4), 0);

			// StorySlider
			this._el.storyslider.style.top = 0;
			this._el.storyslider.style.height = this.options.storyslider_height + "px";

			this._menubar.updateDisplay(this.options.width, this.options.height, animate);
			this._map.updateDisplay(this.options.width, this.options.height, animate, d);
			this._storyslider.updateDisplay(this.options.width/2, this.options.storyslider_height, animate, this.options.layout);
		}

		if (this.options.language.direction == 'rtl') {
			display_class += ' vco-rtl';
		}
		else if (this.options.language.direction == 'rtl'){
			display_class += ' vco-rtl';
		}

		// Apply class
		this._el.container.className = display_class;


	}


	/*	Events
	================================================== */

	_onDataLoaded(e) {
		this.fire("dataloaded");
		this._initLayout();
		this._initEvents();
		this.ready = true;
	}

	_onTitle(e) {
		this.fire("title", e);
	}

	_onColorChange(e) {
		if (e.color || e.image) {
			this._menubar.setColor(true);
		} else {
			this._menubar.setColor(false);
		}
	}

	_onSlideChange(e) {
		if (this.current_slide != e.current_slide) {
			this.current_slide = e.current_slide;
			this._map.goTo(this.current_slide);
			this.fire("change", {current_slide: this.current_slide}, this);
		}
	}

	_onMapChange(e) {
		if (this.current_slide != e.current_marker) {
			this.current_slide = e.current_marker;
			this._storyslider.goTo(this.current_slide);
			this.fire("change", {current_slide: this.current_slide}, this);
		}
	}

	_onOverview(e) {
		this._map.markerOverview();
	}

	_onBackToStart(e) {
		this.current_slide = 0;
		this._map.goTo(this.current_slide);
		this._storyslider.goTo(this.current_slide);
		this.fire("change", {current_slide: this.current_slide}, this);
	}

	_onMenuBarCollapse(e) {
		this._updateDisplay(e.y, true);
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

	_onMapLoaded() {
		this._loaded.map = true;
		this._onLoaded();
	}

	_onStorySliderLoaded() {
		this._loaded.storyslider = true;
		this._onLoaded();
	}

	_onLoaded() {
		if (this._loaded.storyslider && this._loaded.map) {
			this.fire("loaded", this.data);
		}
	}
}

// TODO. what is this?
//(function(_) {
//  var scripts = document.getElementsByTagName("script"),
//    		src = scripts[scripts.length-1].src;
//  _.SCRIPT_PATH = src.substr(0,src.lastIndexOf("/"));

classMixin(StoryMap, Events)
export { StoryMap }

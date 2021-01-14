import { classMixin, mergeData } from "../core/Util"
import Dom from "../dom/Dom"
import Events from "../core/Events"
import Message from "../ui/Message"
import { Browser } from "../core/Browser"
/*	VCO.Media
	Main media template for media assets.
	Takes a data object and populates a dom object
================================================== */
// TODO add link

export class Media {

	//includes: [VCO.Events],

	//_el: {},

	/*	Constructor
	================================================== */
	constructor(data, options, add_to_container) {
		// DOM ELEMENTS
		this._el = {
			container: {},
			content_container: {},
			content: {},
			content_item: {},
			content_link: {},
			caption: null,
			credit: null,
			parent: {},
			link: null
		};

		// Player (If Needed)
		this.player = null;

		// Timer (If Needed)
		this.timer = null;
		this.load_timer = null;

		// Message
		this.message = null;

		// Media ID
		this.media_id = null;

		// State
		this._state = {
			loaded: false,
			show_meta: false,
			media_loaded: false
		};

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
      api_key_flickr: "8f2d5becf7b6ba46570741620054b507",
      credit_height: 0,
      caption_height: 0
    };

		this.animator = {};

		// Merge Data and Options
		mergeData(this.options, options);
		mergeData(this.data, data);

		this._el.container = Dom.create("div", "vco-media");

		if (this.data.uniqueid) {
			this._el.container.id = this.data.uniqueid;
		}


		this._initLayout();

		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
			this._el.parent = add_to_container;
		};

	}

	loadMedia() {
		var self = this;

		if (!this._state.loaded) {
			try {
				this.load_timer = setTimeout(function() {
					self._loadMedia();
					self._state.loaded = true;
					self._updateDisplay();
				}, 1200);
			} catch (e) {
				console.log("Error loading media for ", this._media);
				console.log(e);
			}

			//this._state.loaded = true;
		}
	}

	loadingMessage() {
		this.message.updateMessage(this._('loading') + " " + this.options.media_name);
	}

	updateMediaDisplay(layout) {
		if (this._state.loaded) {
			this._updateMediaDisplay(layout);

			if (!Browser.mobile && layout != "portrait") {
				this._el.content_item.style.maxHeight = (this.options.height/2) + "px";
			}

			if (this._state.media_loaded) {
				if (this._el.credit) {
					this._el.credit.style.width		= "auto";
				}
				if (this._el.caption) {
					this._el.caption.style.width	= "auto";
				}
			}

			// Fix for max-width issues in Firefox
			if (Browser.firefox) {
				if (this._el.content_item.offsetWidth > this._el.content_item.offsetHeight) {
					this._el.content_item.style.width = "100%";
					this._el.content_item.style.maxWidth = "100%";

				}

				if (layout == "portrait") {
					this._el.content_item.style.maxHeight = "none";
				}
			}
			if (this._state.media_loaded) {
				if (this._el.credit) {
					this._el.credit.style.width		= this._el.content_item.offsetWidth + "px";
				}
				if (this._el.caption) {
					this._el.caption.style.width	= this._el.content_item.offsetWidth + "px";
				}
			}


		}
	}

	/*	Media Specific
	================================================== */
		_loadMedia() {

		}

		_updateMediaDisplay(l) {
			//this._el.content_item.style.maxHeight = (this.options.height - this.options.credit_height - this.options.caption_height - 16) + "px";
		}

	/*	Public
	================================================== */
	show() {

	}

	hide() {

	}

	addTo(container) {
		container.appendChild(this._el.container);
		this.onAdd();
	}

	removeFrom(container) {
		container.removeChild(this._el.container);
		this.onRemove();
	}

	// Update Display
	updateDisplay(w, h, l) {
		this._updateDisplay(w, h, l);
	}

	stopMedia() {
		this._stopMedia();
	}

	loadErrorDisplay(message) {
		this._el.content.removeChild(this._el.content_item);
		this._el.content_item	= Dom.create("div", "vco-media-item vco-media-loaderror", this._el.content);
		this._el.content_item.innerHTML = "<div class='vco-icon-" + this.options.media_type + "'></div><p>" + message + "</p>";

		// After Loaded
		this.onLoaded(true);
	}

	/*	Events
	================================================== */
	onLoaded(error) {
		this._state.loaded = true;
		this.fire("loaded", this.data);
		if (this.message) {
			this.message.hide();
		}
		if (!error) {
			this.showMeta();
		}
		this.updateDisplay();
	}

	onMediaLoaded(e) {
		this._state.media_loaded = true;
		this.fire("media_loaded", this.data);
		if (this._el.credit) {
			this._el.credit.style.width		= this._el.content_item.offsetWidth + "px";
		}
		if (this._el.caption) {
			this._el.caption.style.width		= this._el.content_item.offsetWidth + "px";
		}
	}

	showMeta(credit, caption) {
		this._state.show_meta = true;
		// Credit
		if (this.data.credit && this.data.credit != "" && !this._el.credit) {
			this._el.credit					= Dom.create("div", "vco-credit", this._el.content_container);
			this._el.credit.innerHTML		= this.data.credit;
			this.options.credit_height 		= this._el.credit.offsetHeight;
		}

		// Caption
		if (this.data.caption && this.data.caption != "" && !this._el.caption) {
			this._el.caption				= Dom.create("div", "vco-caption", this._el.content_container);
			this._el.caption.innerHTML		= this.data.caption;
			this.options.caption_height 	= this._el.caption.offsetHeight;
		}
	}

	onAdd() {
		this.fire("added", this.data);
	}

	onRemove() {
		this.fire("removed", this.data);
	}

	/*	Private Methods
	================================================== */
	_initLayout() {

		// Message
		this.message = new Message({}, this.options);
		this.message.addTo(this._el.container);

		// Create Layout
		this._el.content_container = Dom.create("div", "vco-media-content-container", this._el.container);

		// Link
		if (this.data.link && this.data.link != "") {

			this._el.link = Dom.create("a", "vco-media-link", this._el.content_container);
			this._el.link.href = this.data.link;
			if (this.data.link_target && this.data.link_target != "") {
				this._el.link.target = this.data.link_target;
			} else {
				this._el.link.target = "_blank";
			}

			this._el.content = Dom.create("div", "vco-media-content", this._el.link);

		} else {
			this._el.content = Dom.create("div", "vco-media-content", this._el.content_container);
		}
	}

	// Update Display
	_updateDisplay(w, h, l) {
		if (w) {
			this.options.width = w;
		}
		if (h) {
			this.options.height = h;
		}

		if (l) {
			this.options.layout = l;
		}

		if (this._el.credit) {
			this.options.credit_height 		= this._el.credit.offsetHeight;
		}
		if (this._el.caption) {
			this.options.caption_height 	= this._el.caption.offsetHeight + 5;
		}

		this.updateMediaDisplay(this.options.layout);

	}

	_stopMedia() {

	}

}

classMixin(Media, Events)

import { classMixin, mergeData, setData, htmlify, convertUnixTime  } from "../../core/Util"
import Events from "../../core/Events"
import Dom from "../../dom/Dom"

export default class Text {
	
	/*	Constructor
	================================================== */
	constructor(data, options, add_to_container) {
	// DOM ELEMENTS
	this._el = {
		container: {},
		content_container: {},
		content: {},
		headline: {},
		date: {},
		start_btn: {}
	}
	
	// Data
	this.data = {
		uniqueid: 			"",
		headline: 			"headline",
		text: 				"text"
	}
	
	// Options
	this.options = {
		title: 			false
	}
	
		
		setData(this, data);
		
		// Merge Options
		mergeData(this.options, options);
		
		this._el.container = Dom.create("div", "vco-text");
		this._el.container.id = this.data.uniqueid;
		
		this._initLayout();
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
		};
		
	}
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show() {
		
	}
	
	hide() {
		
	}
	
	addTo(container) {
		container.appendChild(this._el.container);
		//this.onAdd();
	}
	
	removeFrom(container) {
		container.removeChild(this._el.container);
	}
	
	headlineHeight() {
		return this._el.headline.offsetHeight + 40;
	}
	
	addDateText(str) {
		this._el.date.innerHTML = str;
	}
	
	/*	Events
	================================================== */
	onLoaded() {
		this.fire("loaded", this.data);
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
		
		// Create Layout
		this._el.content_container			= Dom.create("div", "vco-text-content-container", this._el.container);
		
		// Date
		this._el.date 				= Dom.create("h3", "vco-headline-date", this._el.content_container);
		
		// Headline
		if (this.data.headline != "") {
			var headline_class = "vco-headline";
			if (this.options.title) {
				headline_class = "vco-headline vco-headline-title";
			}
			this._el.headline				= Dom.create("h2", headline_class, this._el.content_container);
			this._el.headline.innerHTML		= this.data.headline;
		}
		
		// Text
		if (this.data.text != "") {
			var text_content = "";
			
			text_content 					+= htmlify(this.data.text);
			
			// Date
			if (this.data.date && this.data.date.created_time && this.data.date.created_time != "") {
				if (this.data.date.created_time.length > 10) {
					if (typeof(moment) !== 'undefined') {
						text_content 	+= "<div class='vco-text-date'>" + moment(this.data.date.created_time, 'YYYY-MM-DD h:mm:ss').fromNow() + "</div>";
					
					} else {
						text_content 	+= "<div class='vco-text-date'>" + convertUnixTime(this.data.date.created_time) + "</div>";
					}
				}
			}
			
			
			this._el.content				= Dom.create("div", "vco-text-content", this._el.content_container);
			this._el.content.innerHTML		= text_content;
			
		}
		
		
		// Fire event that the slide is loaded
		this.onLoaded();
		
		
		
	}
	
}

classMixin(Text, Events)

/*	VCO.SizeBar
	Draggable component to control size
================================================== */
 
VCO.Messege = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(data, options, add_to_container) {
		// DOM ELEMENTS
		this._el = {
			parent: {},
			container: {},
			messege_container: {},
			loading_icon: {},
			messege: {}
		};
	
		//Options
		this.options = {
			width: 					600,
			height: 				600
		};
		
		this._el.container = VCO.Dom.create("div", "vco-messege");
		
		if (add_to_container) {
			add_to_container.appendChild(this._el.container);
			this._el.parent = add_to_container;
		};
		
		
		// Animation
		this.animator = {};
		
		// Merge Data and Options
		VCO.Util.mergeData(this.data, data);
		VCO.Util.mergeData(this.options, options);
		
		this._initLayout();
		this._initEvents();
	},
	
	/*	Public
	================================================== */
	updateMessege: function(t) {
		this._updateMessege(t);
	},
	
	
	/*	Update Display
	================================================== */
	updateDisplay: function(w, h) {
		this._updateDisplay(w, h);
	},
	
	_updateMessege: function(t) {
		if (!t) {
			if (VCO.Language) {
				this._el.messege.innerHTML = VCO.Language.messeges.loading;
			} else {
				this._el.messege.innerHTML = "Loading";
			}
		} else {
			this._el.messege.innerHTML = t;
		}
	},
	

	/*	Events
	================================================== */

	
	_onMouseClick: function() {
		this.fire("clicked", this.options);
	},

	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.messege_container = VCO.Dom.create("div", "vco-messege-container", this._el.container);
		this._el.loading_icon = VCO.Dom.create("div", "vco-loading-icon", this._el.messege_container);
		this._el.messege = VCO.Dom.create("div", "vco-messege-content", this._el.messege_container);
		
		this._updateMessege();
		
	},
	
	_initEvents: function () {
		
	},
	
	// Update Display
	_updateDisplay: function(width, height, animate) {
		
	}
	
});
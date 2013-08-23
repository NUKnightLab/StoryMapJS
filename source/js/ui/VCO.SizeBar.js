/*	VCO.SizeBar
	Draggable component to control size
================================================== */
 
VCO.SizeBar = VCO.Class.extend({
	
	includes: [VCO.Events],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(elem, data, options) {
		// DOM ELEMENTS
		this._el = {
			container: {},
			grip: {}
		};
		
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = VCO.Dom.get(elem);
		}
	
		// Data
		this.data = {
			uniqueid: 			""
		};
	
		//Options
		this.options = {
			something: 			""
		};
		
		// Draggable
		this._draggable = {};
		
		// Animation
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
		
	},
	
	hide: function() {
		
	},

	/*	Events
	================================================== */

	
	_onMouseClick: function() {
		trace("SIZEBAR CLICKED");
		this.fire("clicked", this.data);
	},
	
	_onDragStart: function() {
		trace("SIZEBAR _onDragStart");
	},
	_onDrag: function() {
		trace("SIZEBAR _onDrag");
	},
	_onDragEnd: function() {
		trace("SIZEBAR _onDragEnd");
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		
		//Make draggable
		this._draggable = new VCO.Draggable(this._el.container);
		
		this._draggable.on({
			'dragstart': this._onDragStart,
			'drag': this._onDrag,
			'dragend': this._onDragEnd
		}, this);
		
		this._draggable.enable();
	},
	
	_initEvents: function () {
		VCO.DomEvent.addListener(this._el.container, 'click', this._onMouseClick, this);
		var events = ['dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'contextmenu'];
	}
	
});
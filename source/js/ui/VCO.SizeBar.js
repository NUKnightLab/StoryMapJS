/*	VCO.SizeBar
	Draggable component to control size
================================================== */
 
VCO.SizeBar = VCO.Class.extend({
	
	includes: [VCO.Events, VCO.DomMixins],
	
	_el: {},
	
	/*	Constructor
	================================================== */
	initialize: function(elem, parent_elem, options) {
		// DOM ELEMENTS
		this._el = {
			parent: {},
			container: {},
			arrow: {},
			grip: {}
		};
		
		if (typeof elem === 'object') {
			this._el.container = elem;
		} else {
			this._el.container = VCO.Dom.get(elem);
		}
		
		if (parent_elem) {
			this._el.parent = parent_elem;
		}
	
		//Options
		this.options = {
			width: 					600,
			height: 				600,
			duration: 				1000,
			ease: 					VCO.Ease.easeInOutQuint,
			sizebar_default_y: 		600
		};
		
		// Draggable
		this._draggable = {};
		
		// Animation
		this.animator = {};
		
		// Merge Data and Options
		VCO.Util.mergeData(this.options, options);
		
		this._initLayout();
		this._initEvents();
	},
	
	/*	Public
	================================================== */
	show: function(d) {
		
		var duration = this.options.duration;
		if (d) {
			duration = d;
		}
		
		this.animator = VCO.Animate(this._el.container, {
			top: 		VCO.Dom.getPosition(this._el.parent).y + this.options.sizebar_default_y + "px",
			duration: 	duration,
			easing: 	VCO.Ease.easeOutStrong
		});
	},
	
	hide: function(top) {
		this.animator = VCO.Animate(this._el.container, {
			top: 		top,
			duration: 	this.options.duration,
			easing: 	VCO.Ease.easeOutStrong
		});
	},
	
	setSticky: function(y) {
		this.options.sizebar_default_y = y;
	},
	
	/*	Update Display
	================================================== */
	updateDisplay: function(w, h) {
		this._updateDisplay(w, h);
	},
	

	/*	Events
	================================================== */
	
	_onMouseClick: function() {
		this.fire("clicked", this.options);
	},
	_onDragStart: function(e) {
		
	},
	_onDragMove: function(e) {
		var top_pos = e.new_pos.y - VCO.Dom.getPosition(this._el.parent).y;
		this.fire("move", {y:top_pos});
	},
	_onMomentum: function(e) {
		var top_pos = e.new_pos.y - VCO.Dom.getPosition(this._el.parent).y;
		if (top_pos < this.options.sizebar_default_y) {
			this._draggable.stopMomentum();
			if (e.direction == "down") {
				this.show();
				this.fire("momentum", {y:this.options.sizebar_default_y});
			} else {
				this.hide(VCO.Dom.getPosition(this._el.parent).y);
				this.fire("momentum", {y:1});
			}
		} else {
			this.fire("momentum", {y:top_pos});
		}
	},
	_onDragEnd: function(e) {
		
	},
	_onSwipeUp: function(e) {
		var top_pos = e.new_pos.y - VCO.Dom.getPosition(this._el.parent).y;
		this._draggable.stopMomentum();
		if (top_pos > this.options.sizebar_default_y) {
			this.show();
			this.fire("momentum", {y:this.options.sizebar_default_y});
		} else {
			this.hide(VCO.Dom.getPosition(this._el.parent).y);
			this.fire("swipe", {y:1});
		}
	},
	
	_onSwipeDown: function(e) {
		if (VCO.Dom.getPosition(this._el.container).y < this.options.sizebar_default_y) {
			this._draggable.stopMomentum();
			this.show();
			this.fire("swipe", {y:this.options.sizebar_default_y});
		}
		
	},
	
	/*	Private Methods
	================================================== */
	_initLayout: function () {
		
		// Create Layout
		this._el.arrow = VCO.Dom.create("div", "vco-arrow-up", this._el.container);
		this._el.container.style.top = this.options.sizebar_default_y + "px";
		
		//Make draggable
		this._draggable = new VCO.Draggable(this._el.container, {enable:{x:false, y:true}, constraint:{bottom:this.options.height}});
		
		this._draggable.on('dragstart', this._onDragStart, this);
		this._draggable.on('dragmove', this._onDragMove, this);
		this._draggable.on('dragend', this._onDragEnd, this);
		this._draggable.on('swipe_up', this._onSwipeUp, this);
		this._draggable.on('swipe_down', this._onSwipeDown, this);
		this._draggable.on('momentum', this._onMomentum, this);

		this._draggable.enable();
		
		
	},
	
	_initEvents: function () {
		
	},
	
	// Update Display
	_updateDisplay: function(width, height, animate) {
		
		if (width) {
			this.options.width = width;
		}
		if (height) {
			this.options.height = height;
		}
		
		// Update draggable constraint
		this._draggable.updateConstraint({bottom:this.options.height - this._el.container.offsetHeight });
		
		this._el.container.style.width = this.options.width + "px";
		this._el.arrow.style.left = ((this.options.width/2) - 30) + "px";
	}
	
});
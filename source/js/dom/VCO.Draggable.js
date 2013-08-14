/*	VCO.Draggable
	Inspired by Leaflet
	VCO.Draggable allows you to add dragging capabilities to any element. Supports mobile devices too.
================================================== */

VCO.Draggable = VCO.Class.extend({
	includes: VCO.Events,

	statics: {
		START: VCO.Browser.touch ? 'touchstart' : 'mousedown',
		END: VCO.Browser.touch ? 'touchend' : 'mouseup',
		MOVE: VCO.Browser.touch ? 'touchmove' : 'mousemove',
		TAP_TOLERANCE: 15
	},

	initialize: function (element, dragStartTarget) {
		this._element = element;
		this._dragStartTarget = dragStartTarget || element;
	},

	enable: function () {
		if (this._enabled) {
			return;
		}
		VCO.DomEvent.addListener(this._dragStartTarget, VCO.Draggable.START, this._onDown, this);
		this._enabled = true;
	},

	disable: function () {
		if (!this._enabled) {
			return;
		}
		VCO.DomEvent.removeListener(this._dragStartTarget, VCO.Draggable.START, this._onDown);
		this._enabled = false;
	},

	_onDown: function (e) {
		if ((!VCO.Browser.touch && e.shiftKey) || ((e.which !== 1) && (e.button !== 1) && !e.touches)) {
			return;
		}

		if (e.touches && e.touches.length > 1) {
			return;
		}

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
			el = first.target;

		VCO.DomEvent.preventDefault(e);

		if (VCO.Browser.touch && el.tagName.toLowerCase() === 'a') {
			el.className += ' leaflet-active';
		}

		this._moved = false;
		if (this._moving) {
			return;
		}

		if (!VCO.Browser.touch) {
			VCO.DomUtil.disableTextSelection();
			this._setMovingCursor();
		}

		this._startPos = this._newPos = VCO.DomUtil.getPosition(this._element);
		this._startPoint = new VCO.Point(first.clientX, first.clientY);

		VCO.DomEvent.addListener(document, VCO.Draggable.MOVE, this._onMove, this);
		VCO.DomEvent.addListener(document, VCO.Draggable.END, this._onUp, this);
	},

	_onMove: function (e) {
		if (e.touches && e.touches.length > 1) {
			return;
		}

		VCO.DomEvent.preventDefault(e);

		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e);

		if (!this._moved) {
			this.fire('dragstart');
			this._moved = true;
		}
		this._moving = true;

		var newPoint = new VCO.Point(first.clientX, first.clientY);
		this._newPos = this._startPos.add(newPoint).subtract(this._startPoint);

		VCO.Util.requestAnimFrame(this._updatePosition, this, true, this._dragStartTarget);
	},

	_updatePosition: function () {
		this.fire('predrag');
		VCO.DomUtil.setPosition(this._element, this._newPos);
		this.fire('drag');
	},

	_onUp: function (e) {
		if (e.changedTouches) {
			var first = e.changedTouches[0],
				el = first.target,
				dist = (this._newPos && this._newPos.distanceTo(this._startPos)) || 0;

			if (el.tagName.toLowerCase() === 'a') {
				el.className = el.className.replace(' vco-active', '');
			}

			if (dist < VCO.Draggable.TAP_TOLERANCE) {
				this._simulateEvent('click', first);
			}
		}

		if (!VCO.Browser.touch) {
			VCO.DomUtil.enableTextSelection();
			this._restoreCursor();
		}

		VCO.DomEvent.removeListener(document, VCO.Draggable.MOVE, this._onMove);
		VCO.DomEvent.removeListener(document, VCO.Draggable.END, this._onUp);

		if (this._moved) {
			this.fire('dragend');
		}
		this._moving = false;
	},

	_setMovingCursor: function () {
		this._bodyCursor = document.body.style.cursor;
		document.body.style.cursor = 'move';
	},

	_restoreCursor: function () {
		document.body.style.cursor = this._bodyCursor;
	},

	_simulateEvent: function (type, e) {
		var simulatedEvent = document.createEvent('MouseEvents');

		simulatedEvent.initMouseEvent(
				type, true, true, window, 1,
				e.screenX, e.screenY,
				e.clientX, e.clientY,
				false, false, false, false, 0, null);

		e.target.dispatchEvent(simulatedEvent);
	}
});

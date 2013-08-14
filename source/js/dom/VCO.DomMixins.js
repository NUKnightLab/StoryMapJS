/*	VCO.DomMixins
	DOM methods used regularly
	Assumes there is a _el.container and animator
================================================== */
VCO.DomMixins = {
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show: function() {
		this.animator = VCO.Animate(this._el.slider_container, {
			left: 		-(this._el.container.offsetWidth * n) + "px",
			duration: 	this.options.duration,
			easing: 	this.options.ease,
			complete: function () {
				trace("DONE");
			}
		});
	},
	
	hide: function() {
		
	},
	
	addTo: function(container) {
		container.appendChild(this._el.container);
		//this.onAdd();
	},
	
	removeFrom: function(container) {
		container.removeChild(this._el.container);
		//this.onRemove();
	},
	
	/*	Set the Position
	================================================== */
	setPosition: function(pos, el) {
		for (var name in pos) {
			if (pos.hasOwnProperty(name)) {
				if (el) {
					el.style[name] = pos[name] + "px";
				} else {
					this._el.container.style[name] = pos[name] + "px";
				};
			}
		}
	}
	
};

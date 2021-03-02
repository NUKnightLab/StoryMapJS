/*	DomMixins
	DOM methods used regularly
	Assumes there is a _el.container and animator
================================================== */
export default class DomMixins {
	
	/*	Adding, Hiding, Showing etc
	================================================== */
	show(animate) {
		if (animate) {
			/*
			this.animator = VCO.Animate(this._el.container, {
				left: 		-(this._el.container.offsetWidth * n) + "px",
				duration: 	this.options.duration,
				easing: 	this.options.ease
			});
			*/
		} else {
			this._el.container.style.display = "block";
		}
	}
	
	hide(animate) {
		this._el.container.style.display = "none";
	}
	
	addTo(container) {
		container.appendChild(this._el.container);
		this.onAdd();
	}
	
	removeFrom(container) {
		container.removeChild(this._el.container);
		this.onRemove();
	}
	
	/*	Animate to Position
	================================================== */
	animatePosition(pos, el, use_percent) {
		var ani = {
			duration: 	this.options.duration,
			easing: 	this.options.ease
		};
		for (var name in pos) {
			if (pos.hasOwnProperty(name)) {
				if (use_percent) {
					ani[name] = pos[name] + "%";
				} else {
					ani[name] = pos[name] + "px";
				}
				
			}
		}
		
		if (this.animator) {
			this.animator.stop();
		}
		this.animator = VCO.Animate(el, ani);
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
	
	/*	Set the Position
	================================================== */
	setPosition(pos, el) {
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
	
	getPosition() {
		return VCO.Dom.getPosition(this._el.container);
	}

};

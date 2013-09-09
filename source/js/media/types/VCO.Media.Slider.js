/*	VCO.Media.SLider
	Produces a Slider
	Takes a data object and populates a dom object
================================================== */

VCO.Media.Slider = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	loadMedia: function() {
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item vco-media-image", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
});
/*	VCO.Media.Image
	Produces image assets.
	Takes a data object and populates a dom object
================================================== */

VCO.Media.Image = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	loadMedia: function() {
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item vco-media-image", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
});
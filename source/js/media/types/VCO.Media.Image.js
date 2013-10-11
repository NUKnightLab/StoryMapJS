/*	VCO.Media.Image
	Produces image assets.
	Takes a data object and populates a dom object
================================================== */
// TODO Add link

VCO.Media.Image = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	_loadMedia: function() {
		//this._el.content.className += " vco-media-shadow ";
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item vco-media-image vco-media-shadow", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
});
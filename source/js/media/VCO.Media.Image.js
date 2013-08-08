/*	VCO.Media.Image
	Produces image assets.
	Takes a data object and populates a dom object
================================================== */

VCO.Media.Image = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	//Options
	options: {
		something: 			""
	},
	
	/*	Load the media
	================================================== */
	loadMedia: function(url) {
		
		this._el.content_item				= VCO.Dom.create("img", "vco-media-item", this._el.content);
		this._el.content_item.src			= this.data.url;
		
		this.onLoaded();
	}
	
});
/*	VCO.Media.Website
================================================== */

VCO.Media.Website = VCO.Media.extend({
	
	includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	_loadMedia: function() {

		this._el.content_item	= VCO.Dom.create("div", "vco-media-item vco-media-web", this._el.content);
                var self = this;
		VCO.ajax({
			type: 'GET',
			url: this.data.url,
			dataType: 'html',
			success: function(d){
				self.createMedia(d);
			},
			error:function(xhr, type){
				var error_text = "Unable to load website";
				self.loadErrorDisplay(error_text);
			}
		});
		
		
	},
	
	createMedia: function(d) {		
		this._el.content_item.innerHTML	= d;
		
		// After Loaded
		this.onLoaded();
			
	}
	
	
	
});

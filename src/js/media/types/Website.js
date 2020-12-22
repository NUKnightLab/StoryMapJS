import { Media } from "../Media"

/*	VCO.Media.Website
================================================== */

export default class Website extends Media {
	
	//includes: [VCO.Events],
	
	/*	Load the media
	================================================== */
	_loadMedia() {
	}
	
	createMedia(d) {		
		// After Loaded
		this.onLoaded();
	}
	
}

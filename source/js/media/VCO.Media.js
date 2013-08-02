VCO.Media = VCO.Class.extend({
	
	includes: [VCO.Events],
	_container: {},
	
	options: {
		stroke: true,
		color: '#0033ff',
		weight: 5,
		opacity: 0.5,

		fill: false,
		fillColor: null, //same as color by default
		fillOpacity: 0.2
	},

	initialize: function (id, options) {
		VCO.Util.setOptions(this, options);
		this._container = VCO.Dom.get(id);
		this._initLayout();
	},

	onAdd: function (map) {
		
	},

	onRemove: function (map) {
		
	},

	_initLayout: function () {
		trace(" _initLayout");
		
		var container = this._container;
		container.className += ' vco-media';
		
		
	}
	
});
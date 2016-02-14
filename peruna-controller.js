const EventEmitter = require('events');
const util = require('util');

exports = module.exports = (function () {

	function PerunaController () {
		this.scope = {};
	}

	util.inherits(PerunaController, EventEmitter);

	return PerunaController;

}).call(this);
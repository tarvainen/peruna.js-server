exports = module.exports = (function () {
	
	function Document () {
		this.elements = [];
	}

	Document.prototype.toString = function () {
		var result = '';
		for (var i = 0; i < this.elements.length; i++) {
			result += this.elements[i].toString();
		}

		return result;
	}

	return Document;

}).call(this);
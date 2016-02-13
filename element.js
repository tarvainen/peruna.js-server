exports = module.exports = (function () {
	
	function Element () {
		this.attributes = {};
	}

	Element.prototype.toString = function () {
		var str = '<';
		str += this.nodeName;
		str += '>';

		str += '</' + this.nodeName + '>';

		return str;
	}

	return Element;
}).call(this);
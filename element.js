exports = module.exports = (function () {
	
	function Element () {
		this.attributes = {};
		this.innerHTML = '';
	}

	Element.prototype.toString = function () {
		var str = '<';
		str += this.nodeName;
		str += '>';

		str += this.innerHTML;

		str += '</' + this.nodeName + '>';

		return str;
	}

	return Element;
}).call(this);
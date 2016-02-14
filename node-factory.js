exports = module.exports = (function () {

	function NodeFactory () {

	}

	NodeFactory.prototype.create = function (nodeName, attrs, empty) {
		attrs = attrs || {};
		empty = empty || false;
		nodeName = nodeName || 'div';

		var node = '<' + nodeName;

		for (var i in attrs) {
			node += ' ' + i + '="' + attrs[i] + '"';
		}

		empty ? node += '/>' : node += '></' + nodeName + '>';
		return node;
	}

	return new NodeFactory();
	
}).call(this);
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginutils = require('rollup-pluginutils');
var path = _interopDefault(require('path'));

function json ( options ) {
	if ( options === void 0 ) options = {};

	var filter = rollupPluginutils.createFilter( options.include, options.exclude );

	return {
		name: 'json',

		resolveId: function(importee, importer) {
			if (importee.slice (-5) === '!json') {

				var dir = path.dirname(importer);
				var newId = path.normalize(path.join(dir, importee.slice(0, importee.length - 5)));

				return newId;
			}
		},

		transform: function transform ( json, id ) {
			if ( id.slice( -5 ) !== '.json' ) return null;
			if ( !filter( id ) ) return null;

			var code;
			var ast = {
				type: 'Program',
				sourceType: 'module',
				start: 0,
				end: null,
				body: []
			};

			if ( json[0] !== '{' ) {
				code = "export default " + json + ";";

				ast.body.push({
					type: 'ExportDefaultDeclaration',
					start: 0,
					end: code.length,
					declaration: {
						type: 'Literal',
						start: 15,
						end: code.length - 1,
						value: null,
						raw: 'null'
					}
				});
			} else {
				var data = JSON.parse( json );

				var validKeys = [];
				var invalidKeys = [];

				Object.keys( data ).forEach( function (key) {
					if ( key === rollupPluginutils.makeLegalIdentifier( key ) ) {
						validKeys.push( key );
					} else {
						invalidKeys.push( key );
					}
				});

				var char = 0;
				var namedExports = validKeys.map( function (key) {
					var declaration = "export var " + key + " = " + (JSON.stringify( data[ key ] )) + ";";

					var start = char;
					var end = start + declaration.length;

					// generate fake AST node while we're here
					ast.body.push({
						type: 'ExportNamedDeclaration',
						start: char,
						end: char + declaration.length,
						declaration: {
							type: 'VariableDeclaration',
							start: start + 7,
							end: end,
							declarations: [
								{
									type: 'VariableDeclarator',
									start: start + 11,
									end: end - 1,
									id: {
										type: 'Identifier',
										start: start + 11,
										end: start + 11 + key.length,
										name: key
									},
									init: {
										type: 'Literal',
										start: start + 11 + key.length + 3,
										end: end - 1,
										value: null,
										raw: 'null'
									}
								}
							],
							kind: 'var'
						},
						specifiers: [],
						source: null
					});

					char = end + 1;
					return declaration;
				});

				var defaultExportNode = {
					type: 'ExportDefaultDeclaration',
					start: char,
					end: null,
					declaration: {
						type: 'ObjectExpression',
						start: char + 15,
						end: null,
						properties: []
					}
				};

				char += 18; // 'export default {\n\t'.length'

				var defaultExportRows = validKeys.map( function (key) {
					var row = key + ": " + key;

					var start = char;
					var end = start + row.length;

					defaultExportNode.declaration.properties.push({
						type: 'Property',
						start: start,
						end: end,
						method: false,
						shorthand: false,
						computed: false,
						key: {
							type: 'Identifier',
							start: start,
							end: start + key.length,
							name: key
						},
						value: {
							type: 'Identifier',
							start: start + key.length + 2,
							end: end,
							name: key
						},
						kind: 'init'
					});

					char += row.length + 3; // ',\n\t'.length

					return row;
				}).concat( invalidKeys.map( function (key) { return ("\"" + key + "\": " + (JSON.stringify( data[ key ] ))); } ) );

				var defaultExportString = "export default {\n\t" + (defaultExportRows.join( ',\n\t' )) + "\n};";

				ast.body.push( defaultExportNode );
				code = (namedExports.join( '\n' )) + "\n" + defaultExportString;

				var end = code.length;

				defaultExportNode.declaration.end = end - 1;
				defaultExportNode.end = end;
			}

			ast.end = code.length;

			return { ast: ast, code: code, map: { mappings: '' } };
		}
	};
}

module.exports = json;
//# sourceMappingURL=rollup-plugin-json.cjs.js.map

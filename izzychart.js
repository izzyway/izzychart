/** Create an Element */
function $new(qName, content, ns){
	var e = ns !== undefined?document.createElementNS(ns, qName):document.createElement(qName);
	if (content != null && content !== undefined && content != ''){
		var c = document.createTextNode(content);
		e.appendChild(c);
	}	
	return e;
}

function $isJSONArray(obj){
	return obj && obj.length && /\[.*\]/.test(JSON.stringify(obj));
}
function $isJSONObject(obj){
	return obj && /{.*}/.test(JSON.stringify(obj));
}
function $isNumber(n){
	return typeof(n) == 'number';
}	
function $isString(s){
	return typeof(s) == 'string';
}	
function $isDate(d){
	return d.getTime;
}	
/** Set an attribute to an Element */
Element.prototype.$set = function(name, value, ns){
	if ($isJSONObject(name)){
		for (var key in name) {
			if (value !== undefined) this.setAttributeNS(value, key, name[key]);
			else this.setAttribute(key, name[key]);
		}
	}else{		
		if (ns !== undefined) this.setAttributeNS(ns, name, value);
		else this.setAttribute(name, value);
	}	
	return this;
}
/** Append an Element to the Element */
Element.prototype.$append = function(element){
	if (!element) throw 'Cannot append NULL element';
	this.appendChild(element);
	return this;
}
Element.prototype.$insert = function(element){
	if (!element) throw 'Cannot insert NULL element';
	if (this.firstChild) this.insertBefore(element, this.firstChild);
	else {
		this.innerHTML = " ";
		this.replaceChild(element, this.firstChild);
	}
	return this;
}
Document.prototype.$get = function(id){
	return this.getElementById(id);
}
/** Append an Element to the Element identified by the id */
Document.prototype.$append = function(id, element){
	var elt = this.$get(id);
	if (elt){
		return elt.$append(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}
Document.prototype.$insert = function(id, element){
	var elt = this.$get(id);
	if (elt){
		return elt.$insert(element);
	}else{
		throw 'Cannot find element with id "'+id+'"';
	}
}


IzzyChart.DEFAULT_CONFIG = {
	namespace	: 'http://www.w3.org/2000/svg',
	debug		: false,
	title		: '',
	width		: 800,
	height		: 600,
	border		: {width: 4, color: 'black', display: 'solid', corner: 'square'},
	gridX		: {scale: 'auto', color: 'lightgray', width: 1, display: 'dotted'},
	gridY		: {scale: 'auto', color: 'lightgray', width: 1, display: 'dotted'},
	axisX		: {scale: 'auto', color: 'darkgray', width: 1, display: 'solid', position: 'auto', label:{font: 'Verdana', size: 10, color: 'black', format: '#.##'}},
	axisY		: {scale: 'auto', color: 'darkgray', width: 1, display: 'solid', position: 'auto', label:{font: 'Verdana', size: 10, color: 'black', format: '#.##'}},
	legend		: {position: 'top right', background: 'white', border: {color: 'black', width: 1}, label: {font: 'Verdana', size: 10, color: 'black'}},
	series		: [ {type: 'line', color: 'blue', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'green', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'red', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'yellow', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'magenta', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'orange', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'cyan', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'lightgray', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'black', size: 2, display: 'curved', title: ''},
					{type: 'line', color: 'gray', size: 2, display: 'curved', title: ''}]
}
IzzyChart.MAX_SERIES = 10;
function IzzyChart(){
	this.series = [];		
}
IzzyChart.prototype.addSeries = function(data){
	if ($isJSONArray(data)) this.series.push(data);	
	else throw 'Data ('+typeof(data)+') should be an JSONArray';
}
IzzyChart.prototype.get = function(key){
	var keys = key.split('.');
	var c = this.config;
	var d = IzzyChart.DEFAULT_CONFIG;
	for (var index = 0; index < keys.length; index++){
		var key = keys[index];
		var i = null;
		var j = i;
		if (/[a-z]+\[[0-9]+\]/.test(key)){			
			i = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
			j = i;
			key = key.substring(0, key.indexOf('['));
			while (i > IzzyChart.MAX_SERIES) i -= IzzyChart.MAX_SERIES;
		}
		c = (c !== undefined && key in c)?i?c[key][j]:c[key]:undefined; 
		d = (d !== undefined && key in d)?i?d[key][i]:d[key]:undefined; 		
	}
	return c === undefined?d:c;
}
IzzyChart.prototype.min = function(a, b){
	if ($isNumber(a) && $isNumber(b)) return Math.min(a, b);
	if ($isDate(a) && $isDate(b)) return a.getTime() < b.getTime()?a:b;	
}
IzzyChart.prototype.max = function(a, b){
	if ($isNumber(a) && $isNumber(b)) return Math.max(a, b);
	if ($isDate(a) && $isDate(b)) return a.getTime() > b.getTime()?a:b;	
}
IzzyChart.prototype.dist = function(a, b){
	if ($isNumber(a) && $isNumber(b)) return Math.abs(a - b);
	if ($isDate(a) && $isDate(b)) return Math.abs(a.getTime() - b.getTime());
}
IzzyChart.prototype.compute = function(){
	var first = true;
	this.barWidth = -1;
	this.barNumber = 0;
	this.barIndex = 0;
	for (var seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++){
		var chart = this.series[seriesIndex];	
		var points = [];
		for (var pointIndex = 0; pointIndex < chart.length; pointIndex++){		
			var point = chart[pointIndex];
			points.push(point[0]);
			if (point.length == 2 && $isJSONArray(point)){
				if ($isNumber(point[0]) || $isDate(point[0]) || $isString(point[0])){
					if (first){
						this.minX = this.maxX = point[0];					
						this.minY = this.maxY = point[1];					
						first = false;
					}else{
						this.minX = this.min(point[0], this.minX);
						this.maxX = this.max(point[0], this.maxX);
						this.minY = this.min(point[1], this.minY);
						this.maxY = this.max(point[1], this.maxY);
					}				
				}else throw 'Incompatible type: '+typeof(point[0])+' not managed';
			}else{console.log(JSON.stringify(point));
				throw 'Data should be an JSONArray of JSONArray [[x0, y0], [x1, y1] ...]';
			}
		}
		if (this.get('series['+seriesIndex+'].type') == 'bar'){
			points.sort();
			if (this.barWidth == -1) this.barWidth = this.maxX;
			for (var i = 0; i < points.length - 1; i++){
				this.barWidth = this.min(this.barWidth, this.dist(points[i], points[i+1]));
			}			
			this.barNumber++;
			if (this.debug) console.log('Min widht: '+this.barWidth);
		}
	}
	if (this.debug) console.log('minX='+this.minX+' maxX='+this.maxX+' minY='+this.minY+' maxY='+this.maxY);
	if (($isString(this.minX) || this.minX == this.maxX) && ($isString(this.minY) || this.minY == this.maxY)) throw 'Incorrect data';
}

IzzyChart.prototype.draw = function(id, config){

	if (!id) throw 'id is not optional';
	this.config = config;
	var ns = this.get('namespace');
	var width = this.get('width');
	var height = this.get('height');	
	
	function addAxis(t, element){	
		function axis(c, m1, m2, l1, l2, mx1, mn1, mx2, mn2, i, axis){
			function format(n){
				if ($isNumber(n)){
					var f = /(#+)(.?)(#*)/.exec(t.get('axis'+c+'.label.format'));
					if (f.length == 4){						
						var p = ('' + n.toFixed(f[3].length)).split('.');						
						if (p.length > 1) return p[0] + f[2] + p[1];
						else return p[0];
					}else{
						return n.toFixed(0);
					}					
				}else{
					return n;
				}
			}
			
			if (t.get('axis'+c+'.width') > 0 && t.get('axis'+c+'.display') != 'none'){
				var scale = t.get('axis'+c+'.scale');		
				if (scale == 0 || !$isNumber(scale)){
					if (scale == 'auto') scale = (m1-t.get('axis'+c+'.label.size')) / 10;
					else throw 'Unknown axis'+c+' scale '+scale;
				}else scale = scale * (m1-t.get('axis'+c+'.label.size'))/(mx1 - mn1);
				var unit = scale;
				var p = t.get('axis'+c+'.position') == 'bottom' || t.get('axis'+c+'.position') == 'right'?m2:0;
				if (t.get('axis'+c+'.position') == 'auto' && mn2 < 0 && mx2 > 0){
					p = axis;
				}
				if (t.debug) console.log('axis'+c+'='+scale+' p='+p);
				var attr ={stroke: t.get('axis'+c+'.color'), 'stroke-width': t.get('axis'+c+'.width')};
				if (t.get('axis'+c+'.display') == 'dotted') attr['stroke-dasharray'] = '1 3';
				var line = $new('line', null, ns).$set(attr).$set(l1+'1', 0).$set(l2+'1', p).$set(l1+'2', m1).$set(l2+'2', p);
				element.$append(line);				
				var m = t.get('axis'+c+'.position') == 'bottom' || t.get('axis'+c+'.position') == 'right'?-1:1;
				while (scale < m1){	
					var attr ={stroke: t.get('axis'+c+'.color'), 'stroke-width': t.get('axis'+c+'.width')};
					var line = $new('line', null, ns).$set(l1+'1', scale).$set(l2+'1', p-3).$set(l1+'2', scale).$set(l2+'2', p+3).$set(attr);
					element.$append(line);		
					attr ={'font-family': t.get('axis'+c+'.label.font'), 'font-size': t.get('axis'+c+'.label.size'), fill: t.get('axis'+c+'.label.color')};
					var cc = format(mn1 + (mx1 - mn1) * scale/(m1-t.get('axis'+c+'.label.size')));					
					var text = $new('text', cc, ns).$set(attr).$set(l1, i?m1-scale:scale).$set(l2, p+m*t.get('axis'+c+'.label.size'));
					element.$append(text);	
					scale += unit;
				}
			}else if (t.debug) console.log('axis'+c+'=no axis');			
		}
		axis('Y', width, height, 'x', 'y', t.maxX, t.minX, t.maxY, t.minY, false, axisY(0));
		axis('X', height, width, 'y', 'x', t.maxY, t.minY, t.maxX, t.minX, true, axisX(0));	
	}
	function addGrid(t, element){		
		function grid(c, d, m, w, x, y){
			if (t.get('grid'+c+'.width') > 0 && t.get('grid'+c+'.display') != 'none'){
				var scale = t.get('grid'+c+'.scale');		
				if (scale == 0 || !$isNumber(scale)){
					if (scale == 'auto') scale = 100;
					else throw 'Unknown grid'+c+' scale '+scale;
				}else scale = scale * d;
				var unit = scale;
				if (t.debug) console.log('scale'+c+'='+scale);
				while (scale < m){			
					var attr ={stroke: t.get('grid'+c+'.color'), 'stroke-width': t.get('grid'+c+'.width')};
					if (t.get('grid'+c+'.display') == 'dotted') attr['stroke-dasharray'] = '1 3';
					var line = $new('line', null, ns).$set(attr).$set(x+'1', scale).$set(y+'1', 0).$set(x+'2', scale).$set(y+'2', w);
					element.$append(line);
					scale += unit;
				}	
			}else if (t.debug) console.log('scale'+c+'=no grid');
		}
		grid('X', width/(t.maxX - t.minX), width, height, 'x', 'y');
		grid('Y', (t.maxY - t.minY)/height, height, width, 'y', 'x');
	}	
	function addLegend(t, elt, w, h, ns){
		var m = 0;
		for (var i = 0; i < t.series.length; i++) m = t.max(m, t.get('series['+i+'].title').length);
		if (t.debug) console.log('Max title length = '+m);
		if (m>0 && t.get('legend.position') != 'none'){	
			var x, y;
			var l = t.get('legend.label.size');
			x = y = t.get('border.width') * 2;
			var height = (4+t.series.length)*l;
			var width = m*l*0.8;
			if (t.get('legend.position').indexOf('bottom') >= 0) y = h - height - y;
			if (t.get('legend.position').indexOf('right') >= 0) x = w - width - y;
			var attr = {fill: t.get('legend.background'), stroke: t.get('legend.border.color'), 'stroke-width': t.get('legend.border.width')};
			elt.$append($new('rect', null, ns).$set(attr).$set('x', x).$set('y', y).$set('height', height).$set('width', width));
			attr ={'font-family': t.get('legend.label.font'), 'font-size': l, fill: t.get('legend.label.color')};			
			x+= l*2.5;
			for (var i=0; i<t.series.length; i++){										
				y+=l*2;
				elt.$append($new('rect', null, ns).$set(attr).$set('x', x-2*l).$set('y', y-l).$set('height', l).$set('width', 1.5*l).$set('fill', t.get('series['+i+'].color')));
				elt.$append($new('text', t.get('series['+i+'].title'), ns).$set(attr).$set('x', x).$set('y', y));
			}
		}
	}	
	function axisX(x){
			return (bx/2+Math.abs(xx - x)*uX);
	}
	function axisY(y){
			return (by/2+Math.abs(YY-y)*uY);
	}
	
	function addLineSeries(t, index, chart){
		function n(p){
			return axisX(p[0]) + ',' + axisY(p[1]);
		}
		var tp = t.get('series['+index+'].display') == 'curved'?'S':'';		
		var d = 'M';		
		for (var i = 0; i < t.series[index].length; i++){
			d += n(t.series[index][i]) + ' ';
			if (i == 0) d += tp;
		}
		var style = 'fill:none; stroke:'+t.get('series['+index+'].color')+'; stroke-width:'+t.get('series['+index+'].width');
		if (t.debug) console.log('add series #'+index+' (LINE) - '+d);
		chart.$append($new('path', null, ns).$set('d', d).$set('style', style));
	}
	function addBarSeries(t, index, chart){		
		var color = t.get('series['+index+'].color');
		var width = uX*t.barWidth / t.barNumber;		
		var d = '';
		for (var i = 0; i < t.series[index].length; i++){
			var attr = {fill: color, stroke: color, 'stroke-width': 1};
			var point = t.series[index][i];
			var height = Math.abs(point[1] * uY);
			var y = axisY(point[1]);
			if (point[1] < 0){
				y = axisY(0);
			}
			var x = axisX(point[0])+t.barIndex * width;			
			d += '['+x + ',' + y + ' '+width+'x'+height+'] ';
			chart.$append($new('rect', null, ns).$set(attr).$set('x', x).$set('y', y).$set('height', height).$set('width', width));		
		}		
		if (t.debug) console.log('add series #'+index+' (BAR) - '+d);
		t.barIndex++;
	}
			
	this.debug = this.get('debug');
	var parent = document.$get(id);
	if (!parent) throw 'No element found with id = '+id;
	if (this.debug) console.log('Insert child into Element with id '+id );
	this.compute();
	var chart = $new('svg', null, ns).$set({'width': width, 'height': height, xmlns: ns})
	           .$append($new('title', this.get('title'), ns));
	var bx = this.get('axisX.label.size');
	var by = this.get('axisY.label.size');
	var uX = Math.abs((width-bx) / (this.maxX - this.minX));
	var uY = Math.abs((height-by) / (this.maxY - this.minY));
	var xx = this.minX;
	var YY = this.maxY;
	addGrid(this, chart);
	
	
	if (this.debug) console.log('unit X = '+uX+' Y = '+uY);
	
	function drawSeries(t, type, fct){
		for (var seriesIndex = 0; seriesIndex < t.series.length; seriesIndex++){
			var ty = t.get('series['+seriesIndex+'].type');
			if (ty == type) fct(t, seriesIndex, chart);	
		}
	}	
	drawSeries(this, 'bar', addBarSeries);	
	drawSeries(this, 'line', addLineSeries);
	
	addAxis(this, chart);	
	if (this.get('border.width') > 0 && this.get('border.display') != 'none'){
		var attr = {x: 0, y: 0, width: this.get('width'), height: this.get('height'), 
		  			fill: 'none', stroke: this.get('border.color'), 'stroke-width': this.get('border.width')};
		if (this.get('border.corner') == 'rounded'){ attr['rx'] = 10;attr['ry'] = 10;}
		chart.$append($new('rect', null, ns).$set(attr));
	}	
	addLegend(this, chart, width, height, ns);
	parent.$insert(chart);	
}
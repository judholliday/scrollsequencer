/*
 * jQuery Scroll Sequencer
 * Updates page elements based on the amount the page is scrolled
 * 
 * http://www.github.com/judholliday/scrollsequencer
 *
 * Copyright (c) 2012 Jud Holliday & ZAAZ, Inc.
 * 
 * 
 * Version: 0.5.0 (2012.02.20)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */


(function( $ ){
	
	var topOffset = 0,
		pageHeight = $(window).height(),
		items = [],
		funcs = [],
		minMaxHash = {},
		markedItemsHash = {},
		startScrollPos = 0,
		endScrollPos = $(window).height(),
		w = $(window),

	methods = {
		
		//default method which adds an element to the array to be scrolled
		attach: function(obj){
			
			var item;
			if (obj instanceof Array){
				var scrollStart,scrollEnd;
				for (var i=0; i<obj.length; i++){
					scrollStart = Math.floor(_map(obj[i].start, 0, 1, startScrollPos, endScrollPos));
					scrollEnd = Math.ceil(_map(obj[i].end, 0, 1, startScrollPos, endScrollPos));
					delete obj[i].start;
					delete obj[i].end;
					
					item = {scrollStart:scrollStart, scrollEnd:scrollEnd, el:this, props:obj[i]};
					items.push(item);
				}
			} else {
				item = {scrollStart:startScrollPos, scrollEnd:endScrollPos, el:this, props:obj};
				items.push(item);
			}
		}, 
		
		//will display the total range over which values have been set for a property and what the min and max values are
		//primarily used for debugging
		showMinMax: function(){
			var data = minMaxHash[this.selector];
			console.log("minMax data", this.selector, data);
		}
	     
	},
	
	//private methods
	_update = function(){
		var item, value, selector;
		for (var i=0; i<items.length; i++){
			item = items[i];
			
			if (item.func != null){
				if ( w.scrollTop() >= item.scrollStart && w.scrollTop() <= item.scrollEnd){
					if (item.active){
						item.active = false;
						//apply func and args here
						item.func.apply( null, Array.prototype.slice.call( item.args, 1 ));
					} 
				} else {
					item.active = true;
				}
				
			} else {
				//check to see if the item is within range
				if (w.scrollTop() >= item.scrollStart && w.scrollTop() <= item.scrollEnd){
					_setValue(item);
				} else {
					selector = item.el.selector;
					//check each element that has been 'marked' as being updated and set it
					//to the correct 'out of range' value
					for (var prop in markedItemsHash[selector]){
						var minMaxData = minMaxHash[selector][prop];
						//console.log(selector + " - " + prop);
						if (w.scrollTop() < minMaxData.scrollMin){
							item.el.css(prop, minMaxData.startVal);
							delete markedItemsHash[selector][prop];
						} else if (w.scrollTop() > minMaxData.scrollMax){
							item.el.css(prop, minMaxData.endVal);
							delete markedItemsHash[selector][prop];
						}
					}
				}
			}
		}
		//console.log("marked Items", markedItemsHash);
	},
	
	_setValue = function(item){
		var val, tmp, startVal, endVal, selector;
		for (var prop in item.props){
			val = item.props[prop];
			selector = item.el.selector;
			//'mark' an elemnt/property combo as being updated
			//this will allow us to check and update it later if it goes out of range
			if (markedItemsHash[selector] == null){
				markedItemsHash[selector] = {};
			}
			//console.log("mark element", item.el);
			markedItemsHash[selector][prop] = true;
			
			if (val.toString().indexOf(",") != -1){
				tmp = val.split(",");
				val = _map(w.scrollTop(), item.scrollStart, item.scrollEnd, parseFloat(tmp[0]), parseFloat(tmp[1]));
			} 
			
			item.el.css(prop, val);
		}
	},
	//if the window is refreshed when already partially scrolled we need to go through and set all the values
	//as if the user had scrolled down the page
	_scrollInit = function(){
		$(window).unbind('scroll.scrollSeq', _scrollInit);
		for (var i=0; i<items.length;i++){
			if (items[i].scrollStart <= w.scrollTop()){
				_setValue(items[i]);
			}
		}
	},
	
	_map = function(val, low1, high1, low2, high2){
		return low2 + (high2 - low2) * (val - low1) / (high1 - low1);
	};

	$.fn.scrollSeq = function( method ) {
	    
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.attach.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.scrollSeq' );
		}
		
		return this;
	};
	
	
	$.scrollSeq = function(options) {}
	
	$.scrollSeq.init = function(){
		$(window).bind('scroll.scrollSeq', _update);
		$(window).bind('scroll.scrollSeq', _scrollInit);
		
		var item, val, min, max, selector;
		for (var i=0; i<items.length; i++){
			item = items[i];
			
			if (item.func == null){
				selector = item.el.selector;
				
				//create a hash of each ui element that will be updated
				if (minMaxHash[selector] == null){
					minMaxHash[selector] = {};
					markedItemsHash[selector] = {};
				}
				//create a hash of each property which is updated on that element
				for (var prop in item.props){
					val = item.props[prop];
					
					//find the minimum scroll position and max scroll position for each property of each element
					//find out what the value should be at the min and max and save that for later
					if (minMaxHash[selector][prop] == null ){
						
						//mark every item as needing to be checked at first
						//this ensures that items get updated if the page is reloaded when already scrolled
						markedItemsHash[selector][prop] = true;
						
						if (val.toString().indexOf(",") != -1){
							val = val.split(",");
							min = (isNaN( parseFloat(val[0]) )) ? val[0] : parseFloat(val[0]);
							max = (isNaN( parseFloat(val[1]) )) ? val[0] : parseFloat(val[1]);
						} else {
							val = (isNaN( parseFloat(val) )) ? val : parseFloat(val);
							min = val;
							max = val;
						}
						minMaxHash[selector][prop] = {scrollMin:item.scrollStart, scrollMax:item.scrollEnd, startVal:min, endVal:max};
					} else {
						//update min and max values if new range is found
						if (item.scrollStart < minMaxHash[selector][prop].scrollMin){
							minMaxHash[selector][prop].scrollMin = item.scrollStart;
							if (val.toString.indexOf(",") != -1){
								val = val.split(",");
								val = (isNaN( parseFloat(val[0]) )) ? val[0] : parseFloat(val[0]);
								minMaxHash[selector][prop].startVal = val;
							} else {
								val = (isNaN( parseFloat(val) )) ? val : parseFloat(val);
								minMaxHash[selector][prop].startVal = val;
							}
						}
						if (item.scrollEnd > minMaxHash[selector][prop].scrollMax){
							minMaxHash[selector][prop].scrollMax = item.scrollEnd;
							if (val.toString().indexOf(",") != -1){
								val = val.split(",");
								val = (isNaN( parseFloat(val[1]) )) ? val[1] : parseFloat(val[1]);
								minMaxHash[selector][prop].endVal = val;
							} else {
								val = (isNaN( parseFloat(val) )) ? val : parseFloat(val);
								minMaxHash[selector][prop].endVal = val;
							}
						}
					}
				}
			}
		}
		_update();
	};
	
	$.scrollSeq.setDefaults = function(obj) {
		if (obj.topOffset != null)
			topOffset = obj.topOffset;
		if (obj.pageHeight != null)
			pageHeight = obj.pageHeight;
	};
	
	$.scrollSeq.destroy = function(){
		$(window).unbind('.scrollSeq');
	};
	
	$.scrollSeq.setPageHeight = function(height){
		pageHeight = height;
	};
	
	$.scrollSeq.setRange = function(startPos, endPos){
		startScrollPos = startPos;
		endScrollPos = endPos;
	};
	$.scrollSeq.setRangeByPageNumber = function(startPageNum, endPageNum){
		
		var numPages = 1;
		if (endPageNum != null && endPageNum == startPageNum){
			numPages = endPageNum - startPageNum + 1;
		} 
		startScrollPos = startPageNum*pageHeight;
		endScrollPos = startScrollPos+(pageHeight*numPages)-1;
	};
	$.scrollSeq.addCallback = function(functionName){
		var item = {active:true, scrollStart:startScrollPos, scrollEnd:endScrollPos, func:functionName, args:arguments};
		items.push(item);
	}

})( jQuery );


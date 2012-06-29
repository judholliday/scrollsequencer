if(!window.console) {
	window.console = function() {
		this.log = function(str) {};
		this.dir = function(str) {};
	};
}

$(document).ready(function(){
	
	//auto scroll to the section on click
    $('.floatingNav li a').click(function(){
       var id = $(this).attr("href");
       $.scrollTo($(id), 1000);
       return false;
	});
	
	
	//	$.scrollSeq.setDefaults({
	//		"pageHeight":pageHeight
	//	});
	
	$.scrollSeq.setRange(0, 500);
	$("#section1 .bg").scrollSeq({position:"fixed", top:"0,-200"});
	
	$.scrollSeq.setRange(500, 1000);
	$("#section1 .bg").scrollSeq({position:"absolute"});
	
	$.scrollSeq.setRange(300, 1500);
	$("#section3 .bg").scrollSeq({position:"fixed",top:"200,-200"});
		
	//call at the end to intialize all begining positions	
	$.scrollSeq.init();	
	
});

"use strict";
$(document).foundation();

$(document).ready(function() {



  var changeImageById = function(resp,hitNum) {
    if (resp.len <= hitNum)
      {
        $("#thumbnail".concat(hitNum)).attr("style","visibility: hidden;");
        return;
      };
      var path_image = resp.ans[hitNum];
        $("#thumbnail".concat(hitNum)).attr("style","visibility: visible;");

    $("#image".concat(hitNum)).attr("src",path_image);
  };


  window.onload = function() {
    $('#thefactoryform').submit(function() {
    	console.log("Submit");
        $.ajax({
        	url: "/query",
        	dataType: "json",
        	data: {"query": $('#thefactoryformText').val()},
        	success: function(result){
	        	console.log(result);
	        	for (var i = 0; i < 8; i++) {
		            changeImageById(result,i);
		        };
	        	console.log("successfull ajax call to /query");
	    	},
	    	error: function(xhr,status,error){
	    		console.log(error);
	    		console.log("error ajax call to /query");
	    	}
		});
        return false;
    });
  };
});


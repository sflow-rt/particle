$(function() {
  var restPath = '../scripts/flows.js/';
  var optionsURL = restPath + 'options/json';
  var dataURL = restPath + 'flows/json';

  $.get(optionsURL,function(opts) {
    var widget = $('#traffic').flow(opts);
    widget.bind('flowclick',function(e,flow) {
      console.log(flow);
    });
 
    (function pollFlows() {
      $.ajax({
        url: dataURL,
        success: function(data) {
          widget.flow('data',data);
        },
        error: function(result,status,errorThrown) {
          widget.flow('data',[]);
        },
        complete: function() {
          setTimeout(pollFlows,1000);
        },
        timeout: 60000
      });
    })();
  });
});

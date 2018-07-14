$(function() {
  var restPath = '../scripts/flows.js/';
  var optionsURL = restPath + 'options/json';
  var dataURL = restPath + 'flows/json';
  var linkURL = restPath + 'link/json';

  var widget;

  function pollFlows() {
    $.ajax({
      url: dataURL,
      success: function(data) {
        widget.flow('data',data);
        setTimeout(pollFlows,1000);
      },
      error: function(result,status,errorThrown) {
        widget.flow('data',[]);
        setTimeout(pollFlows,5000);
      },
      timeout: 60000 
    });
  };

  $.get(optionsURL,function(opts) {
    widget = $('#traffic').flow(opts);
    widget.bind('flowclick',function(e,flow) {
      console.log(flow);
    });
 
    pollFlows();
  });
});

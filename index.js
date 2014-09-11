var $ = require('jquery');
var Emitter = require('emitter');
var mockDataCache = {};

module.exports = Mocker;
Emitter(Mocker.prototype);

/////////////////////////constractor
function Mocker() {
  Emitter.call(this);
}

Mocker.prototype.initAjaxProxy = function(){
  var sFlag = opt.url.indexOf("/") === 0 ;
	this.on("mockAjax", function(opt) {
		  console.info("mockAjax:"+opt.url);
	    var mockurl = ["http://",
	      window.mocker_server_host,
	      ":",
	      window.mocker_server_port,
	      "/",
	      window.mocker_server_prefix,
	      sFlag ? "" : "/",
	      opt.url,
	      "?callback=?"
	    ].join("");

	    var sucCallback = opt.success;

	    // console.info("create new xhr :" + mockurl);
	    $.ajax({
	      type:"get",
	      url: mockurl,
	      dataType: "jsonp",
	      success: function(data) {

	        sucCallback && sucCallback(data);
	      }
	    });
	  })
};

Mocker.prototype.initMockDataCache = function(callback) {
  var mockurl = ["http://",
    window.mocker_server_host,
    ":",
    window.mocker_server_port,
    "/",
    window.mocker_server_prefix,
    "/",
    "getMockDetails",
    "?callback=?"
  ].join("");

  $.ajax({
    url: mockurl,
    data: {
      project_id: 1
    },
    dataType: "jsonp",
    success: function(details) {
      $.each(details, function(index, detail) {
        mockDataCache[detail.url] = detail.is_mock;
      })

      callback && typeof(callback) === "function" && callback();
    }
  });
};

//////////////////
Mocker.prototype.start = function(callback) {
  this.initAjaxProxy();
  this.initMockDataCache(callback);
  var me = this;
  console.info("starting listening mocker-client....")
  //intercept ajax and emit event
  $(document).ajaxSend(function(event, xhr, opt) {
    if (opt.dataType !== 'jsonp') {
      var url = opt.url;
      //validate ismock for every xhr!
      if (mockDataCache && mockDataCache[url] && parseInt(mockDataCache[url], 10) === 1) {
        xhr.abort();
        me.emit("mockAjax", opt);
      }
    }

  });




}

Mocker.prototype.stop = function() {
  console.info("stop mocker-client")
}

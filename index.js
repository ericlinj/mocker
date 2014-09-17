var $ = require('jquery');
var Emitter = require('emitter');
var mockDataCache = {};

module.exports = Mocker;
Emitter(Mocker.prototype);

if (typeof console == "undefined") {
  this.console = {
    log: function() {},
    info: function() {}
  };
}

/////////////////////////constractor
function Mocker() {
  Emitter.call(this);
}

Mocker.prototype.initAjaxProxy = function() {
  this.on("mockAjax", function(opt) {
    // console.info("mockAjax:"+opt.url);
    var mockurl = ["http://",
      window.mocker_server_host,
      ":",
      window.mocker_server_port,
      "/",
      window.mocker_server_prefix,
      opt.url.indexOf('/') === 0 ? '' : '/',
      opt.url,
      "?callback=?"
    ].join("");

    var sucCallback = opt.success;

    // console.info("create new xhr :" + mockurl);
    var mockData = typeof(opt.data) === 'object' ? {msg:"only string data is pass"} : opt.data;
    $.ajax({
      type: "get",
      url: mockurl,
      data: mockData,
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
    data: "project_id=" + window.mocker_project_id || 1,
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
  if (window.openmocker && parseInt(window.openmocker, 10) === 1) {
    console.info("start mock!")
    this.initAjaxProxy();
    this.initMockDataCache(callback);
    var me = this;
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
  } else {
    console.info("mocker-client is invalid ,please check mocker js! ")
    callback();
  }
}

Mocker.prototype.stop = function() {
  console.info("stop mocker-client")
}

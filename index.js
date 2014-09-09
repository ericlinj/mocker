var $ = require('jquery');
var Emitter = require('emitter');
var mockDataCache = {};

module.exports = Mocker;
Emitter(Mocker.prototype);

/////////////////////////constractor
function Mocker() {
  Emitter.call(this);
  this.initMockDataCache();
}

Mocker.prototype.initMockDataCache = function() {
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
    }
  });
};

//////////////////
Mocker.prototype.start = function() {
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

  //catch event
  me.on("mockAjax", function(opt) {
    var mockurl = ["http://",
      window.mocker_server_host,
      ":",
      window.mocker_server_port,
      "/",
      window.mocker_server_prefix,
      "/",
      opt.url,
      "?callback=?"
    ].join("");

    var sucCallback = opt.success;

    // console.info("create new xhr :" + mockurl);
    $.ajax({
      url: mockurl,
      dataType: "jsonp",
      success: function(data) {

        sucCallback && sucCallback(data);
      }
    });
  })
}

Mocker.prototype.stop = function() {
  console.info("stop mocker-client")
}

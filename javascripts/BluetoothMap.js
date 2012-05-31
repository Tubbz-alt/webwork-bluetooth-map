var blackberry;
var vxmt;
var BluetoothMap = function(map_name) {
    this.map_name = map_name;
    this.file_path = "file:///SDCard/";

    this.update_latest_location(localStorage.getItem("latest_lat") || 31.178882, localStorage.getItem("latest_longt") || 121.403561);
    
    if(vxmt) {
        vxmt.gps.basic.start_listen(this.map_name + '.gps_mess_arrived');
    }
};

BluetoothMap.prototype = {
    file_name: '',
    saved_file: false,
    locator_bt_key : null,
    logs : [],
    current_page : 'home',
    markers : [],

    latest_gps : {values : {}},
    latest_lat : 0,
    latest_longt: 0,

    init_menus : function() {
        var real_this = this;
        var mh = blackberry.ui.menu;

        if (mh.getMenuItems().length > 0) {
            mh.clearMenuItems();
        }
        
        if(this.current_page == 'map_canvas') {
            mh.addMenuItem(
                new mh.MenuItem(false, 1, "Save", function() {
                    if(real_this.saved_file) {
                        real_this.save_file();
                    } else {
                        real_this.switch_page('save_kml');
                    }
                })
            );
        }

        mh.addMenuItem(
            new mh.MenuItem(false, 2, "Back", function() {
                real_this.switch_page('home');
            })
        );

        // mh.addMenuItem(
        //     new mh.MenuItem(false, 2, "Connect to Locator", function() {
        //       var locator_saved_addr = this.get_locator_addr() || '';
        //       real_this.connect_to_locator(locator_saved_addr);
        //     })
        // );
    },

    start_map : function() {
        var locator_saved_addr = this.get_locator_addr() || '';
        this.connect_to_locator(locator_saved_addr);

        // var bluetooth = vxmt.bluetooth.basic;
        // real_this.connect_to_locator('vLocPro');
        // Test GPS ===================
        // var bluetooth = vxmt.bluetooth.basic;
        // bluetooth.connect(this.external_gps_bt_key, 'vLocPro', this.map_name + '.show_gps_mess');
        // setInterval(function(){
        //     var rmc = new GPRMC(23.232321, 213.232323);
        //     
        //     real_this.write_test_gps_mess(rmc.mock_text());
        //     real_this.write_test_gps_mess(rmc.mock_gga_text());
        // 
        //     // real_this.write_test_gps_mess('$GPRMC,155547,A,2313.94,N,21313.94,E,000.5,054.7,180412,020.3,E*7c');
        //     // real_this.write_test_gps_mess('$GPRMC,225446,A,4916.45,N,12311.12,W,000.5,054.7,191194,020.3,E*68');
        //     // real_this.write_test_gps_mess('$GPGGA,155617,2313.9393,N,21313.9394,E,1,05,1.5,280.2,M,-34.0,M,,*66');
        //     // real_this.write_test_gps_mess('$GPGGA,170834,4124.8963,N,08151.6838,W,1,05,1.5,280.2,M,-34.0,M,,*75');
        // }, 2000);
    },

    connect_to_locator : function(bt_addr) {
        if(vxmt) {
            var bluetooth = vxmt.bluetooth.basic;
            if(this.locator_bt_key) {
                bluetooth.close(locator_bt_key);
            }
            this.locator_bt_key = this.map_name + '_locator_' + new Date().getTime();
            bluetooth.connect(this.locator_bt_key, bt_addr, this.map_name + '.bluetooth_mess_arrived');
        }
    },

    waiting_gps : false,
    bluetooth_mess_arrived : function(mess) {
        var p_this = this;
        var log = new LocatorData(mess);
        log.set_gps(p_this.latest_gps.values);
        p_this.logs.unshift(log);
        // alert(this.latest_gps.values.lat || 0);
        // alert(this.latest_gps.values.longt || 0);

        var newPointLocation = this.get_latest_location();
        this.add_marker(newPointLocation, log);
        this.map.setCenter(newPointLocation);
        // this.latest_gps.expired = true;
        // this.waiting_gps = true;
    },

    get_latest_location : function() {
        return new google.maps.LatLng(this.latest_lat || 0, this.latest_longt || 0);
    },

    update_latest_location : function(lat, longt) {
        this.latest_gps = {
            expired: false,
            values: {'lat' : lat, 'longt' : longt}
        };
        this.latest_lat = lat;
        this.latest_longt = longt;

        // localStorage.setItem("latest_gps", this.latest_gps);
        localStorage.setItem("latest_lat", lat);
        localStorage.setItem("latest_longt", longt);
    },

    show_current_location : function() {
        var newPointLocation = this.get_latest_location();

        this.current_location_marker.setPosition(newPointLocation);
        this.map.setCenter(newPointLocation);
    },

    write_test_gps_mess : function(mess) {
      if(vxmt) {
        var bluetooth = vxmt.bluetooth.basic;
        bluetooth.write_back(this.locator_bt_key, mess);
      }
    },

    gps_mess_arrived : function(lat, longt) {
        // alert('gps arrived:' + lat + ' longt:' + longt);
        //set latest point
        this.update_latest_location(lat, longt);

        if(this.locator_bt_key) {
            var gps_data = new GPRMC(lat, longt);
            this.write_test_gps_mess(gps_data.mock_text());
            this.write_test_gps_mess(gps_data.mock_gga_text());
        }
        if(this.current_page == 'map_canvas') { 
            this.show_current_location();
        }
    },

    switch_page : function(page) {
        if(this.current_page == 'map_canvas') {
            if(vxmt) {
              var bluetooth = vxmt.bluetooth.basic;
              bluetooth.close(this.locator_bt_key);
              this.locator_bt_key = null;

            }
        }

        if(page == 'home') {
            if(vxmt) {
              blackberry.system.event.onHardwareKey(blackberry.system.event.KEY_BACK, null);
            }
        } else {
          if(vxmt) {
            blackberry.system.event.onHardwareKey(blackberry.system.event.KEY_BACK, function(){
              app.switch_page('home');
            });
          }
        }

        $('div.page').hide();
        $('#' + page).show();
        this.current_page = page;
        
        if(vxmt) {
            this.init_menus();
        }
    },

    pop_menu : function() {
        blackberry.ui.menu.open();
    },

    open_file : function(json_file) {
        var real_this = this;

        if(blackberry) {
            // real_this.attr('data-json')
            blackberry.io.file.readFile(real_this.file_path + json_file, function(_fullPath, contentBlob) {
                real_this.logs = JSON.parse(blackberry.utils.blobToString(contentBlob));
                $(real_this.logs).each(function(ind, ele){
                    ele.prototype = LocatorData.prototype;
                });
            }, false);
        }
        
        real_this.saved_file = true;
        real_this.file_name = json_file.substr(0, json_file.length - 5);
        real_this.apply_logs_to_map();
    },

    save_file : function() {
        var kml = new KML(app);

        var kmlFilePath = app.file_path + this.file_name + '.kml'
        var jsonFilePath = app.file_path + this.file_name + '.json'

        if(blackberry) {
            blackberry.io.file.saveFile(kmlFilePath, blackberry.utils.stringToBlob(kml.kml_stream()));
            blackberry.io.file.saveFile(jsonFilePath, blackberry.utils.stringToBlob(JSON.stringify(app.logs)));
        } else {
            console.log(JSON.stringify(app.logs).to_s);
            console.log('Saved file: ' + jsonFilePath);
        }
        
        this.saved_file = true;
    },

    apply_logs_to_map : function() {
        var real_this = this;
        $(this.markers).each(function(indx, ele){
            ele.setMap(null);
        });
        this.markers = [];
        
        $(this.logs).each(function(indx, ele){
            var po = new google.maps.LatLng(ele.gps.lat || 0, ele.gps.longt || 0);
            real_this.add_marker(po, ele);
        });
    },
    
    add_marker : function(location, log) {
        var newPoint = new google.maps.Marker({
            position: location,
            title: log.pop_up_mess()
        });
        google.maps.event.addListener(newPoint, 'click', function(){
            alert(log.pop_up_mess());
        });

        newPoint.setMap(this.map);
        this.markers.push(newPoint);
    },

    init_google_map : function(div_id) {
      var init_center = this.get_latest_location();

      var myOptions = {
        center: init_center,
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: true,
        zoomControl: true
      };
      this.map = new google.maps.Map(document.getElementById(div_id), myOptions);

      var image = '../images/current_location.png';
      this.current_location_marker = new google.maps.Marker({
          position: init_center,
          icon: image,
          map: this.map
      });
    },

    bt_device_list : function() {
      var services = vxmt.bluetooth.basic.service_list();
      return $(services).map(function(_index, ele){
        var vals = ele.split("||");
        return {name : vals[0], addr : vals[1]};
      });
    },

    save_locator_addr : function(addr) {
      localStorage.setItem("locator_addr", addr);
    },

    get_locator_addr : function() {
      return localStorage.getItem('locator_addr');
    }
};

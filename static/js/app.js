//
// Pipelining function for DataTables. To be used to the `ajax` option of DataTables
//
$.fn.dataTable.pipeline = function ( opts ) {
    // Configuration options
    var conf = $.extend( {
        pages: 5,     // number of pages to cache
        url: '',      // script url
        data: null,   // function or object with parameters to send to the server
                      // matching how `ajax.data` works in DataTables
        method: 'GET' // Ajax HTTP method
    }, opts );
 
    // Private variables for storing the cache
    var cacheLower = -1;
    var cacheUpper = null;
    var cacheLastRequest = null;
    var cacheLastJson = null;
 
    return function ( request, drawCallback, settings ) {
        var ajax          = false;
        var requestStart  = request.start;
        var drawStart     = request.start;
        var requestLength = request.length;
        var requestEnd    = requestStart + requestLength;
         
        if ( settings.clearCache ) {
            // API requested that the cache be cleared
            ajax = true;
            settings.clearCache = false;
        }
        else if ( cacheLower < 0 || requestStart < cacheLower || requestEnd > cacheUpper ) {
            // outside cached data - need to make a request
            ajax = true;
        }
        else if ( JSON.stringify( request.order )   !== JSON.stringify( cacheLastRequest.order ) ||
                  JSON.stringify( request.columns ) !== JSON.stringify( cacheLastRequest.columns ) ||
                  JSON.stringify( request.search )  !== JSON.stringify( cacheLastRequest.search )
        ) {
            // properties changed (ordering, columns, searching)
            ajax = true;
        }
         
        // Store the request for checking next time around
        cacheLastRequest = $.extend( true, {}, request );
 
        if ( ajax ) {
            // Need data from the server
            if ( requestStart < cacheLower ) {
                requestStart = requestStart - (requestLength*(conf.pages-1));
 
                if ( requestStart < 0 ) {
                    requestStart = 0;
                }
            }
             
            cacheLower = requestStart;
            cacheUpper = requestStart + (requestLength * conf.pages);
 
            request.start = requestStart;
            request.length = requestLength*conf.pages;
 
            // Provide the same `data` options as DataTables.
            if ( $.isFunction ( conf.data ) ) {
                // As a function it is executed with the data object as an arg
                // for manipulation. If an object is returned, it is used as the
                // data object to submit
                var d = conf.data( request );
                if ( d ) {
                    $.extend( request, d );
                }
            }
            else if ( $.isPlainObject( conf.data ) ) {
                // As an object, the data given extends the default
                $.extend( request, conf.data );
            }
 
            settings.jqXHR = $.ajax( {
                "type":     conf.method,
                "url":      conf.url,
                "data":     request,
                "dataType": "json",
                "cache":    false,
                "success":  function ( json ) {
                    cacheLastJson = $.extend(true, {}, json);
 
                    if ( cacheLower != drawStart ) {
                        json.data.splice( 0, drawStart-cacheLower );
                    }
                    if ( requestLength >= -1 ) {
                        json.data.splice( requestLength, json.data.length );
                    }
                     
                    drawCallback( json );
                }
            } );
        }
        else {
            json = $.extend( true, {}, cacheLastJson );
            json.draw = request.draw; // Update the echo for each response
            json.data.splice( 0, requestStart-cacheLower );
            json.data.splice( requestLength, json.data.length );
 
            drawCallback(json);
        }
    }
};
 
// Register an API method that will empty the pipelined data, forcing an Ajax
// fetch on the next draw (i.e. `table.clearPipeline().draw()`)
$.fn.dataTable.Api.register( 'clearPipeline()', function () {
    return this.iterator( 'table', function ( settings ) {
        settings.clearCache = true;
    } );
} );

$(document).ready(function () {

  // Define Themes
  var themes = {
    'default': "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
    'cerulean': "//bootswatch.com/cerulean/bootstrap.min.css",
    'cosmo': "//bootswatch.com/cosmo/bootstrap.min.css",
    'cyborg': "//bootswatch.com/cyborg/bootstrap.min.css",
    'darkly': "//bootswatch.com/darkly/bootstrap.min.css",
    'flatly': "//bootswatch.com/flatly/bootstrap.min.css",
    'journal': "//bootswatch.com/journal/bootstrap.min.css",
    'lumen': "//bootswatch.com/lumen/bootstrap.min.css",
    'paper': "//bootswatch.com/paper/bootstrap.min.css",
    'readable': "//bootswatch.com/readable/bootstrap.min.css",
    'sandstone': "//bootswatch.com/sandstone/bootstrap.min.css",
    'simplex': "//bootswatch.com/simplex/bootstrap.min.css",
    'slate': "//bootswatch.com/slate/bootstrap.min.css",
    'spacelab': "//bootswatch.com/spacelab/bootstrap.min.css",
    'superhero': "//bootswatch.com/superhero/bootstrap.min.css",
    'united': "//bootswatch.com/united/bootstrap.min.css",
    'yeti': "//bootswatch.com/yeti/bootstrap.min.css"
  };

  var userTheme = $.cookie('theme');
  //var userTheme = ($.cookie('theme')) ? $.cookie('theme') : 'default';

  /*
   * Tables
   */

  var table = $('#table-maplist').DataTable({
    serverSide: true,
    ajax: $.fn.dataTable.pipeline({
        url: GLOBAL.API_URL + '/maps/',
        pages: 5 // number of pages to cache
    }),
    lengthMenu: [25, 50, 100, 250],
    pageLength: 25,
    order: [[10, 'desc']],
    colReorder: true,
    stateSave: true,
    fixedHeader: {
      header: true,
      headerOffset: $('#main-nav').height()
    },
    processing: true,
    deferRender: true,
    language: {
      search: "",
      lengthMenu: '_MENU_',
      processing: '<h4 class="text-center">Processing request...<br><br><i class="fa fa-spinner fa-pulse fa-3x"></i></h4>'
    },
    buttons: [
      {
        extend: 'csvHtml5',
        text: '<i class="fa fa-download" title="Download CSV"></i> CSV'
      },
      {
        extend: 'colvis',
        postfixButtons: ['colvisRestore'],
        text: '<i class="fa fa-eye" title="Toggle Column Visibility"></i> Columns'
      },
      {
        text: '<i class="fa fa-eraser" title="Reset Table State"></i> Reset',
        action: function (e, dt, node, config) {
          dt.state.clear();
          window.location.reload();
        }
      }
    ],
    dom: "<'#table-controls'lfB>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row footer-bar navbar-inverse'<'col-sm-5 navbar-brand'i><'col-sm-7'p>>",
    columns: [
      { // bsp
        data: 'bsp'
      },
      { // mapshot
        data: function (row, type, val, meta) {
          var arr = [];
          if (Object.keys(row.bsp)) {
            $.each(row.bsp, function (key, value) {
              if (row.bsp[key]['mapshot']) {
                var mapshot = row.bsp[key]['mapshot'].replace('.tga', '.jpg');
              } else {
                var mapshot = 'no_mapshot.png';
              }
              arr.push(mapshot);
            });
          }
          return arr;
        }
      },
      { // pk3
        data: 'pk3'
      },
      { // filesize
        data: 'filesize'
      },
       {// filesize
        data: 'filesize'
      },
      { // shasum
        data: 'shasum'
      },
      { // title
        data: function (row, type, val, meta) {
          return row.bsp;
        }
      },
      { // author
        data: function (row, type, val, meta) {
          return row.bsp;
        }
      },
      { // gametypes
        data: function (row, type, val, meta) {
          return row.bsp;
        }
      },
      { // entities
        data: function (row, type, val, meta) {
          return row.bsp;
        }
      },
      { // date
        data: 'date'
      }
    ],
    columnDefs: [
      { // bsp
        targets: 0,
        render: function (data, type, full, meta) {
          if (data) {
            var bsps = Object.keys(data).join('<br>');
            if (bsps.length > 40 && bsps.indexOf('<br>') == -1) {
              bsps = '<span data-toggle="tooltip" title="' + bsps + '">' + bsps.substr(0, 38) + '...</span>';
            }
          }
          bsps += '<br><br><a type="button" class="btn btn-xs btn-default" data-toggle="modal" data-target="#view-map-package" data-map-id="' + full.id + '"><i class="fa fa-eye"></i> View</a>';
          bsps += ' <a href="#" class="btn btn-xs btn-primary"><i class="fa fa-download"> Download</a>';
          return bsps;
        }
      },
      { // mapshot file
        targets: 1,
        render: function (data, type, full, meta) {

          var api = $('#table-maplist').DataTable();
          var loadImages = (api.column(5).visible() === true) ? true : false;

          var string = "";
          
          data.forEach(function (value, index, array) {
            string += '<div class="btn mapshot-link" data-img="./resources/mapshots/' + value + '" data-toggle="modal" data-target="#view-map-package" data-map-id="' + full.id + '">'
              + '  <img src="./resources/mapshots/' + value + '" class="mapshot css-animated" />'
              + '  <span>' + value + '</span>'
              + '</div>';
          });

          return string;
        }
      },
      { // pk3
        targets: 2,
        render: function (data, type, full, meta) {
          var pk3 = data;
          if (type === 'display' && data.length > 40) {
            data = '<span title="' + data + '">' + data.substr(0, 38) + '...</span>';
          }
          return '<a href="http://dl.xonotic.co/' + pk3 + '">' + data + '</a>';
        }
      },
      { // filesize
        targets: 3,
        orderData: 3,
        render: function (data, type, full, meta) {
          return bytesToSize(data);
        }
      },
      { // filesize (bytes)
        targets: 4,
        visible: false,
        searchable: false
      },
      { // shasum
        targets: 5,
        visible: false
      },
      { // title
        targets: 6,
        render: function (data, type, full, meta) {
          var str = "";
          if (Object.keys(data)) {
            $.each(data, function (key, value) {
              var manyMaps = (Object.keys(data).length > 1);
              if (manyMaps) {
                str += '<em>' + key + '</em><br>';
              }
              str += data[key]['title'] + '<br>';
              if (manyMaps) {
                str += '<br>';
              }
            });
          }
          return str;
        }
      },
      { // author
        targets: 7,
        render: function (data, type, full, meta) {
          var str = '';
          if (Object.keys(data)) {
            $.each(data, function (key, value) {
              var manyMaps = (Object.keys(data).length > 1);
              if (manyMaps) {
                str += '<em>' + key + '</em><br>'
              }
              str += data[key]['author'] + '<br>';
              if (manyMaps) {
                str += '<br>';
              }
            });
          }
          return str;
        }
      },
      { // gametypes
        targets: 8,
        //type: 'html',
        render: function (data, type, full, meta) {
          var str = "";
          if (Object.keys(data)) {
            $.each(data, function (key, value) {
              if (data[key]['gametypes'].length > 0) {
                var manyMaps = (Object.keys(data).length > 1);
                if (manyMaps) {
                  str += '<em>' + key + '</em><br>'
                }
                $.each(data[key]['gametypes'], function (k, v) {
                  str += '<i class="icon icon-gametype_' + v + '" data-toggle="tooltip" title="' + v + '"><b>' + v + '</b></i> ';
                });
                if (manyMaps) {
                  str += '<br><br>';
                }
              }
            });
          }
          return str;
        }
      },
      { // entities
        targets: 9,
        //type: 'html',
        render: function (data, type, full, meta) {
          // var response = workerParser.enities(data);
          // response.then(function(entities){
          //   return entities;
          // });
          if (Object.keys(data)) {
            var str = "";
            $.each(data, function (key, value) {
              if (data[key].entities) {
                var manyMaps = (Object.keys(data).length > 1);
                if (manyMaps) {
                  str += '<em>' + key + '</em><br>'
                }
                $.each(data[key].entities, function (k, v) {
                  str += '<i class="icon icon-' + k + '" data-toggle="tooltip" title="' + v + ' ' + k + '"><b>' + k + '</b></i> ';
                });
                if (manyMaps) {
                  str += '<br><br>';
                }
              }
            });
            return str;
          }
          return "";
        }
      }
    ],
    initComplete: function (settings, json) {

      // clear filters on page load
      $('tfoot input').val('').trigger('change');
      $('tfoot select').val('').trigger('change');

      // Make the search more better ;)
      $('#table-maplist_filter')
        .addClass('pull-right')
        .css('position', 'relative')
        .append('<span id="search-clear" class="fa fa-times-circle-o hidden"></span>');
      $('#search-clear').click(function (e) {
        $('#table-maplist_filter input').val('');
        table.search('').draw();
      });

      // Put the controls in the navbar
      $('#table-controls').detach().appendTo('#nav-table-controls');

      // Style and show
      $('#table-maplist_length').addClass('pull-right');
      $('#table-controls .btn').addClass('btn-sm');
      $('#table-controls .dt-buttons').addClass('pull-right');
      $('#table-controls').show();

      if (userTheme) {
        setTheme(userTheme);
      }

      var searchTerm = $('#table-maplist_filter input').val();
      if (searchTerm) {
        $('#search-clear').removeClass('hidden');
      }

    },
    drawCallback: function (settings) {
      $('#table-controls').show();

      $('.mapshot').load(function(e) {
        $('tr .mapshot').hide().fadeIn();
      });

      $('body').trigger('scroll');

      $('#apology').fadeOut();
      $('.first-load-backdrop').remove();

      $('.carousel').carousel();
    }
  });

  table.on( 'draw.dt', function () {
    setTimeout(function() {
      table.fixedHeader.adjust();
    }, 10);
  });

  $(window).scroll( function() {
    $('tr').each(function () {

      var bottom_of_object = $(this).position().top + $(this).outerHeight();
      var bottom_of_window = $(window).scrollTop() + $(window).height();

      if ( bottom_of_window > bottom_of_object ) {
        $(this).animate({'opacity': '1'}, 500);
      }

    });
  });

  table.on('search.dt', function () {
    if (table.search() == "") {
      $('#search-clear').addClass('hidden');
    } else {
      $('#search-clear').removeClass('hidden');
    }
  });

  // Setup add a text input to filtesearch footers
  $('#table-maplist tfoot th.filtersearch').each(function () {
    var title = $(this).text();
    $(this).html('<input type="text" placeholder="filter ' + title + '" class="form-control input-sm" />');
  });

  // Setup add a dropdown to dropdownsearch footers
  // $('#table-maplist tfoot th.dropdownsearch').each(function () {
  //   var title = $(this).text();
  //   $(this).html('<select class="form-control input-sm"><option value="">all (' + title + ' &amp; no ' + title + ')</option><option value="yes">' + title + '</option><option value="no">no ' + title + '</option></select>');
  // });

  // Setup add a dropdown to dropdownsearch footers
  $('#table-maplist tfoot th.dropdownsearch-mapshot').each(function () {
    var title = $(this).text();
    $(this).html('<select class="form-control input-sm"><option value="">all (' + title + ' &amp; no ' + title + ')</option><option value="maps/">' + title + '</option><option value="no_mapshot.png">no ' + title + '</option></select>');
  });

  $('#table-maplist').on('page.dt', function() {
    $(document).scrollTop(0);
  });

  // To be shown by initComplete
  $('#table-controls').hide();

  // Apply filtersearch and dropdownsearch
  table.columns().every(function () {
    var that = this;

    $('input', this.footer()).on('keyup change', function () {
      if (that.search() !== this.value) {
        that
          .search(this.value)
          .draw();
      }
    });

    $('select', this.footer()).on('change', function () {
      if (that.search() !== this.value) {
        that
          .search(this.value)
          .draw();
      }
    });

  });


  /*
   * Modals
   */

  $('#view-map-package').on('show.bs.modal', function (e) {
    var map_id = $(e.relatedTarget).data('map-id');
    $.get(GLOBAL.API_URL + '/map/' + map_id, function(response) {
      var map_package = response.data[0];
      var index = 0;
      var $bspViewer = $('#bsp-viewer');
      var $bspInidcators = $('#bsp-indicators');
      var $bspTemplate = $('#bsp-template');

      $bspViewer.empty();
      $bspInidcators.empty();

      $('#view-map-package .panel-footer').hide();

      $.each(map_package.bsp, function(bsp_name, this_bsp) {

        var $newBsp = $bspTemplate.clone();
        var $newIndicator = $('<li data-target="#bsp-carousel" data-slide-to="' + index + '"></li>');

        if (index == 0) {
          $newBsp.addClass('active');
          $newIndicator.addClass('active');
        }

        $newBsp.appendTo($bspViewer).removeClass('hidden').attr('id', 'item-' + index);
        $newIndicator.appendTo($bspInidcators);

        $('.mp_pk3').text(map_package['pk3']);
        $('#item-' + index + ' .mp_bsp').text(bsp_name);
        $('#item-' + index + ' .mp_url').attr('href', GLOBAL.DOWNLOAD_URL + '/' + map_package['pk3']);
        $('#item-' + index + ' .mp_title').text(this_bsp['title']);
        $('#item-' + index + ' .mp_description').text(this_bsp['description']);

        $('#item-' + index + ' .mp_gametypes').text(this_bsp['gametypes']);
        $('#item-' + index + ' .mp_entities').text(this_bsp['entities']);

        $('#item-' + index + ' .mp_author').text(this_bsp['author']);
        $('#item-' + index + ' .mp_filesize').text(this_bsp['filesize']);
        $('#item-' + index + ' .mp_date').text(map_package['date']);

        $('#item-' + index + ' .mp_shasum').text(map_package['shasum']);

        $('#item-' + index + ' .mp_license').text(!!this_bsp['license']);
        $('#item-' + index + ' .mp_map').text(!!this_bsp['map']);
        $('#item-' + index + ' .mp_waypoints').text(!!this_bsp['waypoints']);
        $('#item-' + index + ' .mp_radar').text(!!this_bsp['radar']);

        var mapshot = this_bsp['mapshot'];

        if (mapshot) {
          mapshot = mapshot.replace('.tga', '.jpg');
        } else {
          mapshot = 'no_mapshot.png';
        }
        mapshot = '/resources/mapshots/' + mapshot;
        $('.mp_mapshot').attr('src', mapshot);

        var gametypes = this_bsp['gametypes'];
        var entities = this_bsp['entities'];
        var gametypes_html = "";
        var entities_html = "";

        $.each(gametypes, function (k, v) {
          gametypes_html += '<i class="icon icon-gametype_' + v + '" data-toggle="tooltip" title="' + v + '"><b>' + v + '</b></i> ';
        });

        $.each(entities, function (k, v) {
          console.log(entities);
          entities_html += '<i class="icon icon-' + k + '" data-toggle="tooltip" title="' + v + ' ' + k + '"><b>' + k + '</b></i> ';
        });

        $('#item-' + index + ' .mp_gametypes').html(gametypes_html);
        $('#item-' + index + ' .mp_entities').html(entities_html);

        index++;
        console.log(index);
      });

      if (index > 1) {
        $('#view-map-package .panel-footer').show();
      }

    });
  });


  /*
   * Tabs
   */

  // Need to hide datatables when changing tabs for fixedHeader
  var visible = true;
  var tableContainer = $(table.table().container());

  // Bootstrap tab shown event
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {

    var currentTab = $('.nav li.active a').attr('href');

    switch (currentTab) {

      case "#maplist":

      case "#statistics":

      case "#about":

      default:

        visible = false;

    }

    $('#nav-table-controls').hide();
    table.fixedHeader.adjust();

    // decide whether to show the table or not
    if (visible) { // hide table
      tableContainer.css('display', 'none');
    } else { // show table
      tableContainer.css('display', 'block');
    }

  });

  $('[href=\\#maplist]').click(function() {
    setTimeout(function() {
      $('#nav-table-controls').show();
    }, 10);
  });


  /*
   * Theme Switcher
   */

  function themeSwitcher() {

    // Setup menu

    var themeMenu = '<li id="theme-switcher-wrapper" class="navbar-btn"><div class="dropdown btn-group">' +
      '<a class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" href="#">' +
      '<span>Theme</span> ' +
      '<i class="caret"></i>' +
      '</a>' +
      '<ul id="theme-switcher" class="dropdown-menu"></ul>' +
      '</div></li>';

    $('.navbar-right').append(themeMenu);

    $.each(themes, function (index, value) {
      var title = index.charAt(0).toUpperCase() + index.substr(1);
      $('#theme-switcher').append('<li><a href="#" data-theme="' + index + '">' + title + '</a></li>');
    });

    $('#theme-switcher li a').click(function () {
      var theme = $(this).attr('data-theme');
      setTheme(theme);
    });

  }

  function setTheme(theme) {
    var themeurl = themes[theme];
    $.cookie('theme', theme)
    $('#theme-switcher li').removeClass('active');
    $('#theme').attr('href', themeurl);
    $('#theme-custom').attr('href', './static/css/themes/' + theme + '/custom.css');
    $('#theme-switcher li a[data-theme=' + theme + ']').parent().addClass('active');
    $('#theme-switcher-wrapper span').text('Theme: ' + theme);
    // table.fixedHeader.adjust();
  }

  new Konami(function () {
    themeSwitcher();
  });

});

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

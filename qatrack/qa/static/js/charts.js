"use strict";
var test_list_data = {};
var main_graph;
var previous_point = null;
var test_list_members = {}; //short names of test list tests belonging to test lists


/*************************************************************************/
//return all checked checkboxes within container
function get_checked(container){
    var vals =  [];
    $(container+" input[type=checkbox]:checked").each(function(i,cb){
        vals.push(cb.value);
    });
    return vals;
}
/*************************************************************************/
//get all filters for data request
function get_filters(){
    var short_names = get_checked("#test-filter");
    var units = get_checked("#unit-filter");
    var review_status = get_checked("#review-status-filter");
    return {
        short_names: $(short_names).get().join(','),
        units: $(units).get().join(','),
        from_date: $("#from-date").val(),
        to_date: $("#to-date").val(),
        review_status: $(review_status).get().join(',')
    };
}
/*************************************************************************/
//Convert a collection of plot values, refs, tols etc to a series that flot can show
function convert_to_flot_series(idx,collection){

    var series = [];

    var create_name = function(type){return collection.short_name+'_unit'+collection.unit+"_"+type;};

    var dates = $.map(collection.data.dates,QAUtils.parse_iso8601_date);

    var show_tolerances = $("#show-tolerances").is(":checked");
    var show_references = $("#show-references").is(":checked");
    var show_lines = $("#show-lines").is(":checked");
    if(show_tolerances){
        var tolerances = {act_low:[], tol_low:[], tol_high:[], act_high:[]};
        $.each(collection.data.tolerances,function(idx,tol){
            var ref = collection.data.references[idx];
            var date = dates[idx];

            if (tol.type === QAUtils.PERCENT){
                tol = QAUtils.convert_tol_to_abs(ref,tol);
            }

            $.each(["act_low","tol_low","tol_high","act_high"],function(idx,type){
                tolerances[type].push([date,tol[type]]);
            });
        });

        $.each(["act_low","tol_low","tol_high","act_high"],function(idx,type){
            var vals = [];

            var opts = {
                id: create_name(type),
                data:tolerances[type],
                lines: {show:true, lineWidth:0,steps:true}
            };

            if (idx>0) {
                opts["fillBetween"] = series[series.length-1].id;
                opts.lines["fill"] = 0.2;
                if ((idx===1 ) || (idx===3)){
                    opts["color"] = QAUtils.TOL_COLOR;
                }else{
                    opts["color"] = QAUtils.OK_COLOR;
                }
            }

            series.push(opts);
        });
    }

    var val_name = create_name("values");
    series.push({
        id: val_name,
        label: collection.name+"- Unit"+collection.unit,
        data:QAUtils.zip(dates,collection.data.values),
        points: {show:true, fill:0.2},
        lines: {show:show_lines,lineWidth:1},
        hoverable: true,
        color:idx
    });

    if (show_references){
        var ref_name = create_name("references");
        series.push({
            id: ref_name,
            data:QAUtils.zip(dates,collection.data.references),
            lines: {show:true,lineWidth:2,steps:true},
            points:{show:false},//true,symbol:dash,radius:5},
            color:idx,
            shadowSize:0
        });
    }
    return series;
}


/*************************************************************************/
//create data table for retrieved data items
function create_data_table(collections,url){
    var table = $("#data-table");
	$("#export-csv").attr("href","export/?"+url.replace(QAUtils.API_URL,"").replace("?","&")+"&format=csv");
    var headers = ['<tr class="col-group">'];
    var max_length = 0;

	//create table headers for each test item name
    $.each(collections,function(idx,collection){
        var unit = "Unit"+(collection.unit < 10 ? "0" :"")+collection.unit;
        headers.push('<th colspan="2">'+unit+" - " + collection.name+'</th>');
        max_length = Math.max(collection.data.dates.length,max_length);
    });
    headers.push("</tr><tr>");

	//add date and value columns under each test item name
    var cols = [];
    $.each(collections,function(idx,collection){
        headers.push('<th>Date</th><th class="col-group">Values</th>');
        cols.push({"sType":"day-month-year-sort"});
        cols.push(null);
    });
    headers.push("</tr>");

    table.find("thead").html(headers.join(""));


	//now turn html table into functional data table
    var data_table = table.dataTable();
    data_table.fnDestroy();
    table.find("tbody").html("");
    data_table = table.dataTable({
        "aoColumns":cols,
		"sDom": "T<'row-fluid'<'span6'><'span6'>r>t<'row-fluid'<'span6'l><'span6'p>><'row-fluid'<'span6'i><'span6'>>",
		"sPaginationType": "bootstrap",
		"oTableTools": {
            "aButtons": [
                "csv"
            ]
        }
	});
    var rows = [];

    var row_idx;
    var date;
    for (row_idx=0; row_idx< max_length; row_idx++){
        var row = [];
        $.each(collections, function(idx,collection){
            if (collection.data.dates[row_idx] !== undefined){
                date = QAUtils.parse_iso8601_date(collection.data.dates[row_idx]);
                row.push(QAUtils.format_date(date));
                row.push(collection.data.values[row_idx]);
            }else{
                row.push("");
                row.push("");
            }
        });
        rows.push(row);
    }
    data_table.fnAddData(rows);

}
/*************************************************************************/
//Do a full update of the chart
//Currently everything is re-requested and re-drawn which isn't very efficient
function update(){

    var filters = get_filters();
    if ((filters.units === "") || (filters.short_names === "")){
        return;
    }
    QAUtils.test_values(filters, function(results_data,status,jqXHR,url){
        create_data_table(results_data.objects,url);

        var main_graph_series = [];
        $.each(results_data.objects,function(idx,collection){
            var collection_series = convert_to_flot_series(idx,collection);
            var ii;
            for (ii=0; ii<collection_series.length;ii++){
                main_graph_series.push(collection_series[ii]);
            }
        });

        main_graph.setData(main_graph_series);
        main_graph.setupGrid();
        main_graph.draw();
    });

}

/**********************************************************************/
//sets up all avaialable filters by querying server to find avaialable values
function setup_filters(on_complete){

    //list of filter resources
    var filters = [
        {
            container:"#unit-filter",
            resource_name:"unit",
            display_property:"name",
            value_property:"number",
            to_check : ["all"]
        },
        {
            container:"#test-list-filter",
            resource_name:"testlist",
            display_property:"name",
            value_property:"slug",
            to_check : ["all"]
        },
        {
            container:"#frequency-filter",
            resource_name:"frequency",
            display_property:"display",
            value_property:"value",
            to_check : ["all"]
        },
        {
            container:"#category-filter",
            resource_name:"category",
            display_property:"name",
            value_property:"slug",
            to_check : ["all"]

        },
        {
            container:"#review-status-filter",
            resource_name:"status",
            display_property:"display",
            value_property:"value",
            check_all:false,
            to_check:[QAUtils.APPROVED, QAUtils.UNREVIEWED]
        }


    ];
    var ajax_counter =0;

    $(filters).each(function(idx,filter){
		var toggle = $(filter.container).parent().parent().find(".accordion-toggle");
		toggle.html('<i class="icon-time"></i>'+toggle.html()+'<em>Loading...</em>');

        /*set up test list test filters */
        QAUtils.get_resources(filter.resource_name,function(resources){
            var options = "";
			var checked;
            $(resources.objects).each(function(index,resource){
                var display = resource[filter.display_property];
                var value = resource[filter.value_property];

                if (
                    (filter.to_check.length >= 0) && (
                        ($.inArray(value,filter.to_check)>=0) ||
                        (filter.to_check[0] === "all")
                    )
                ){
                    checked = 'checked="checked"';
                }else{
                    checked = filter.check_all ? 'checked="checked"' : "";
                }
                options += '<label class="checkbox"><input type="checkbox" ' + checked + ' value="' + value + '">' + display + '</input></label>';
            });

            $(filter.container).html(options);

			toggle.find("i, em").remove();

            //signal when we've completed all async calls
            ajax_counter += 1;
            if (ajax_counter >= filters.length){
                on_complete(ajax_counter,filters.length);
            }

        });

    });


}
/*********************************************************************/
//Interactions with plot
function show_tooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css( {
        position: 'absolute',
        display: 'none',
        top: y + 5,
        left: x + 5,
        border: '1px solid #fdd',
        padding: '2px',
        'background-color': '#fee',
        opacity: 0.80
    }).appendTo("body").fadeIn(200);
}

function on_hover(event, pos, test) {

    if (test) {
        if (previous_point !== test.dataIndex) {

            previous_point = test.dataIndex;

            $("#tooltip").remove();
            var x = new Date(test.datapoint[0]);
            var y = test.datapoint[1].toFixed(2);

            show_tooltip(test.pageX, test.pageY, test.series.label + " of " + x + " = " + y);
        }
    }
    else {
        $("#tooltip").remove();
        previous_point = null;
    }
}

/************************************************************************/
//populate global list of test list memberships
function populate_test_list_members(on_complete){

    QAUtils.get_resources("testlist",function(test_lists){
        $.each(test_lists.objects,function(idx,test_list){
            test_list_members[test_list.slug] = test_list;
        });
        //signal we've finished all our tests
        var counter=1, ntests=1;
        on_complete(counter,ntests);
    });
}
/*************************************************************************/
//filter the test list tests based on user choices
function filter_tests(){
    var test_lists = get_checked("#test-list-filter");
    var tests = [];
    var categories = get_checked("#category-filter");
    var frequencies = get_checked("#frequency-filter");

    var options = "";
    $.each(test_list_members,function(name,test_list){

        if ($.inArray(name,test_lists)>=0){
            $.each(test_list.tests,function(idx,test){
                if (
                    ($.inArray(test.category.slug,categories)>=0) &&
                    (QAUtils.intersection(frequencies,test_list.frequencies).length>0)
                ){

                    tests.push(test);
                    options += '<label class="checkbox"><input type="checkbox"' + ' value="' + test.short_name + '">' + test.name + '</input></label>';
                }
            });
        }

    });
    $("#test-filter").html(options);

}
/**************************************************************************/
//set initial options based on url hash
function set_options_from_url(){
    var options = QAUtils.options_from_url_hash(document.location.hash);

    $.each(options,function(key,value){
        switch(key){
            case  "test" :
                $("#test-filter input").attr("checked",false);
                $("#test-filter input[value="+value+"]").attr("checked","checked");
            break;
            case "unit":
                $("#unit-filter input").attr("checked",false);
                $("#unit-filter input[value="+value+"]").attr("checked","checked");
                break;
            default:
                break;
        }

    });
    update();
}
/**************************************************************************/
$(document).ready(function(){

    //set up main chart and options
    main_graph = $.plot(
        $("#trend-chart"),
        [{}],
        {
            xaxis:{
                mode: "time",
                timeformat: "%d %b %y",
                autoscaleMargin:0.001
            },
            legend:{
                container:"#chart-legend"
            },
            grid:{
                hoverable:true
            }
        }
    );

    $(window).resize = function(){main_graph.resize();};
    $("#trend-chart").bind("plothover", on_hover);


    //filters are populated asynchronously so we need to wait until that's done
    //before final initialization
    var after_init = function(){
        filter_tests();
        set_options_from_url();
        $("#test-collapse").collapse("show");

    };

    var async_finished = 0;
    var total_async_tasks = 2;
    var update_count = function(){
        async_finished += 1;
        if (async_finished >= total_async_tasks){
            after_init();
        }
    };

    //grab all the test list tests, tests, units etc from server
    setup_filters(update_count);
    populate_test_list_members(update_count);

    //update chart when a data filter changes
    $("#unit-filter, #test-filter, #review-status-filter").change(update);

    $("#test-list-filter, #category-filter, #frequency-filter").change(filter_tests);

    $(".chart-options").change(update);

    $(".date").datepicker().on('changeDate',update);

    $(".collapse").collapse({selector:true,toggle:true});




});
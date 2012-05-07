var QAUtils = new function() {

    this.ACT_COLOR = "#b94a48";
    this.TOL_COLOR = "#f89406";
    this.OK_COLOR = "#468847";
	this.NOT_DONE_COLOR = "#3a87ad";

    this.ACT_LOW = "act_low";
    this.TOL_LOW = "tol_low";
    this.TOL_HIGH = "tol_high";
    this.ACT_HIGH = "act_high";

    this.TOL_TYPES = [this.ACT_LOW,this.TOL_LOW,this.ACT_HIGH,this.TOL_HIGH];

    this.WITHIN_TOL = "ok";
    this.TOLERANCE = "tolerance";
    this.ACTION = "action";
	this.NOT_DONE = "not_done";

    this.WITHIN_TOL_DISP =  "OK";
    this.TOLERANCE_DISP = "TOL";
    this.ACTION_DISP = "ACT";
	this.NOT_DONE_DISP = "Not Done";

    this.PERCENT = "percent";
    this.ABSOLUTE = "absolute";

    //value equality tolerance
    this.EPSILON = 1E-10;

    this.API_VERSION = "v1";
    this.API_URL = "/qa/api/"+this.API_VERSION+"/";
	this.CHARTS_URL = "/qa/charts/";
	this.OPTION_DELIM = ":";
	this.OPTION_SEP = "&";


    this.UNREVIEWED = "unreviewed";
    this.APPROVED = "approved";
    this.SCRATCH = "scratch";
    this.REJECTED = "rejected";

    this.MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];



    /***************************************************************/
    /* Tolerance functions
    value is floating point number to be tested
    reference is a floating point number
    while tolerances must be an object with act_low, tol_low, tol_high,
    act_high and tol_type attributes.
    */
    this.percent_difference = function(measured, reference){
        //reference = 0. is a special case
        if (Math.abs(reference) < this.EPSILON){
            return absolute_difference(measured,reference);
        }
        return 100.*(measured-reference)/reference;
    };

    this.absolute_difference = function(measured,reference){
        return measured - reference;
    };

    this.test_tolerance = function(value, reference, tolerances, is_bool){
        //compare a value to a reference value and check whether it is
        //within tolerances or not.
        //Return an object with a 'diff' and 'result' value
        var diff;
        var status;
        var message;

        if (is_bool){
            return this.test_bool(value, reference)
        }

        if (!tolerances.type){
            return {
                status:this.WITHIN_TOL,
                gen_status:this.WITHIN_TOL,
                diff:"",
                message: this.WITHIN_TOL_DISP
            };
        }

        if (tolerances.type == this.PERCENT){
            diff = this.percent_difference(value,reference);
            message = "(" + diff.toFixed(1)+")";

        }else{
            diff = this.absolute_difference(value,reference);
            message = "(" + diff.toFixed(2)+")";
        }

        if ((tolerances.tol_low <= diff) && (diff <= tolerances.tol_high)){
            status = this.WITHIN_TOL;
            gen_status = this.WITHIN_TOL;
            message = this.WITHIN_TOL_DISP + message;
        }else if ((tolerances.act_low <= diff) && (diff <= tolerances.tol_low)){
            status = this.TOL_LOW;
            gen_status = this.TOLERANCE;
            message = this.TOLERANCE_DISP + message;
        }else if ((tolerances.tol_high <= diff) && (diff <= tolerances.act_high)){
            status = this.TOL_HIGH;
            message = this.TOLERANCE_DISP + message;
            gen_status = this.TOLERANCE;
        }else if (diff <= tolerances.act_low){
            status = this.ACT_LOW;
            message = this.ACTION_DISP + message;
            gen_status = this.ACTION;
        }else{
            status = this.ACT_HIGH;
            message = this.ACTION_DISP + message;
            gen_status = this.ACTION;
        }

        return {status:status, gen_status:gen_status, diff:diff, message:message};
    };

    this.test_bool = function(value,reference){
        var status, gen_status;
        var diff = value-reference;
        var message;

        if (Math.abs(diff)> this.EPSILON){
            if (reference > 0){
                status = this.ACT_LOW;
            }else{
                status = this.ACT_HIGH;
            }
            message = "FAIL";
            gen_status == this.ACTION;
        }else{
            message = "PASS";
            gen_status = this.WITHIN_TOL;
        }

        return {status:status, gen_status:gen_status, diff:diff, message:message}
    };

    //convert an percent difference to absolute based on reference
    this.convert_tol_to_abs = function(ref,tol){
        if (tol.type == this.ABSOLUTE){
            return tol;
        }
        return {
            act_low : ref*(100.+tol.act_low)/100.,
            tol_low : ref*(100.+tol.tol_low)/100.,
            tol_high : ref*(100.+tol.tol_high)/100.,
            act_high : ref*(100.+tol.act_high)/100.
        };
    };

    //return a string representation of a reference and tolerance
    this.format_ref_tol = function(reference, tolerance){
		var t,v,s;

		if ((tolerance !== null) && (reference !== null)){
			t = tolerance;
			v = reference.value;
			s = [t.act_low,t.tol_low, v, t.tol_high, t.act_high].join(" < ");
		}else if (reference !== null){
			s = reference.value.toString();
		}else{
			s = "No Reference";
		}

		return s;

    }

    //return an appropriate display for a given pass_fail status
    this.qa_displays = {};
    this.qa_displays[this.ACTION] = this.ACTION_DISP;
    this.qa_displays[this.TOLERANCE] = this.TOLERANCE_DISP;
    this.qa_displays[this.WITHIN_TOL] = this.WITHIN_TOL_DISP;
	this.qa_displays[this.NOT_DONE] = this.NOT_DONE_DISP;
    this.qa_display = function(pass_fail){
        return this.qa_displays[pass_fail.toLowerCase()] || "";
    }

    //return an appropriate colour for a given pass_fail status
    this.qa_colors = {};
    this.qa_colors[this.ACTION] = this.ACT_COLOR;
    this.qa_colors[this.TOLERANCE] = this.TOL_COLOR
    this.qa_colors[this.WITHIN_TOL] = this.OK_COLOR;
	this.qa_colors[this.NOT_DONE] = this.NOT_DONE_COLOR;
	this.qa_colors[""] = this.NOT_DONE_COLOR;
    this.qa_color = function(pass_fail){
        return this.qa_colors[pass_fail.toLowerCase()] || "";

    }
    /********************************************************************/
    //AJAX calls

    /********************************************************************/
    //API calls


    this.call_api = function(url,method,data,callback){
        $.ajax({
            type:method,
            url:url,
            data:data,
            contentType:"application/json",
            dataType:"json",
            success: function(result,status,jqXHR){
                callback(result,status, jqXHR);
            },
            error: function(error){
                console.log(error);
                var msg = "Something went wrong with your request:\n    ";
                var props = ["responseText","status","statusText"];
                var err_vals = $.map(props,function(prop){return prop+": "+error[prop]})
                msg += err_vals.join("\n    ")
                alert(msg);
            }
        });
    };

    //update all instances in instance_uris with a given status
    this.set_item_instances_status = function(instance_uris,status,callback){
        var objects = $.map(instance_uris,function(uri){
            return {resource_uri:uri,status:status}
        });

        this.call_api(
            this.API_URL+"values/",
            "PATCH",
            JSON.stringify({objects:objects}),
            callback
        )
    };

    //get resources for a given resource name
    this.get_resources = function(resource_name,callback, data){

        //make sure limit option is set
        if (data == null){
            data = {limit:0};
        }else if (!data.hasOwnProperty("limit")){
            data["limit"] = 0;
        }

        //default to json format
        if (!data.hasOwnProperty("format")){
            data["format"] = "json";
        }

        this.call_api(this.API_URL+resource_name,"GET",data,callback );
    };

    //values for a group of task_list_items
    this.task_list_item_values = function(options,callback){
        if (!options.hasOwnProperty("limit")){
            options["limit"] = 0;
        }
        this.call_api(this.API_URL+"grouped_values","GET",options,callback );
    };

    //*************************************************************
    //General
    this.zip = function(a1,a2){
        var ii;
        var zipped = [];
        for (ii=0;ii<a1.length;ii++){
            zipped.push([a1[ii],a2[ii]]);
        }
        return zipped;
    };

    this.intersection = function(a1,a2){
        return $(a1).filter(function(idx,elem){return $.inArray(elem,a2)>=0;})
    };

	this.is_number = function(n){
		return !isNaN(parseFloat(n)) && isFinite(n)
	};

	this.options_from_url_hash = function(hash){
		var options = {};
		if (hash[0] == "#"){
			hash = hash.substring(1,hash.length);
		}
		var that = this;

		$.each(hash.split(this.OPTION_SEP),function(i,elem){
			var k_v = elem.split(that.OPTION_DELIM);
			options[k_v[0]] = k_v[1];
		});
		return options;
	};


	this.unit_item_chart_url = function(unit,item){
		var unit_option = 'unit'+this.OPTION_DELIM+unit.number;
		var item_option = 'task_list_item'+this.OPTION_DELIM+item.short_name;
		return this.CHARTS_URL+'#'+[unit_option,item_option].join(this.OPTION_SEP);
	};
	this.unit_item_chart_link = function(unit,item,text,title){
		var url = this.unit_item_chart_url(unit,item);
		if (title === undefined){
			title = ["View Data for", unit.name, item.name, "data"].join(" ");
		}
		return '<a href="'+url+'" title="'+title+'">'+text+'</a>';
	};

	this.instance_has_ref_tol = function(instance){
		return (instance.reference !== null) && (instance.reference !== null);
	};

	//*********************************************************************
	//Date/Time Functions

    //taken from http://n8v.enteuxis.org/2010/12/parsing-iso-8601-dates-in-javascript/
    this.parse_iso8601_date = function(s){

        // parenthese matches:
        // year month day    hours minutes seconds
        // dotmilliseconds
        // tzstring plusminus hours minutes
        var re = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))?/;

        var d = [];
        d = s.match(re);

        // "2010-12-07T11:00:00.000-09:00" parses to:
        //  ["2010-12-07T11:00:00.000-09:00", "2010", "12", "07", "11",
        //     "00", "00", ".000", "-09:00", "-", "09", "00"]
        // "2010-12-07T11:00:00.000Z" parses to:
        //  ["2010-12-07T11:00:00.000Z",      "2010", "12", "07", "11",
        //     "00", "00", ".000", "Z", undefined, undefined, undefined]

        if (! d) {
            throw "Couldn't parse ISO 8601 date string '" + s + "'";
        }

        // parse strings, leading zeros into proper ints
        var a = [1,2,3,4,5,6,10,11];
        for (var i in a) {
            d[a[i]] = parseInt(d[a[i]], 10);
        }
        d[7] = parseFloat(d[7]);

        // Date.UTC(year, month[, date[, hrs[, min[, sec[, ms]]]]])
        // note that month is 0-11, not 1-12
        // see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/UTC
        var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);

        // if there are milliseconds, add them
        if (d[7] > 0) {
            ms += Math.round(d[7] * 1000);
        }

        // if there's a timezone, calculate it
        if (d[8] != "Z" && d[10]) {
            var offset = d[10] * 60 * 60 * 1000;
            if (d[11]) {
                offset += d[11] * 60 * 1000;
            }
            if (d[9] == "-") {
                ms -= offset;
            }
            else {
                ms += offset;
            }
        }

        return new Date(ms);
    };

    this.format_date = function(d,with_time){
        var date = [d.getDate(), this.MONTHS[d.getMonth()], d.getFullYear()];
        if (with_time){
            date.push(d.getHours()+':'+d.getMinutes());
        }
        return date.join(" ");
    };


}();
(function(app){
    const trumba = app.namespace('trumba');
    const NStemplate = 'util.template';
    const NSutil = 'util';
    const globalTemplate = app.namespace(NStemplate).getInstance();
    const trumbaTemplates = {};
        
    globalTemplate.addFormatter("trumbaUrl", function(value, context, localCalendar){
        if(localCalendar == '') {
            return value.permaLinkUrl;
        }
        return localCalendar + '?trumbaEmbed=eventid%3D' + value.eventId + '%26view%3Devent%26-childview%3D';
    });
    
    globalTemplate.addFormatter("customDateTimeFormat", function(value, context, mask){
        return app.namespace(NSutil).date.parse(value).toString(mask);
    });

    globalTemplate.addFormatter("customDateTimeRangeFormat", function(value, context, mask, date1, date2, rangeStr){
        
        // Shift second date value by one second if is midnight 
        var parsedDate1 = app.namespace(NSutil).date.parse(value[date1]);
        var parsedDate2 = app.namespace(NSutil).date.parse(value[date2]);
        if(parsedDate2.toString('HHmmss') === '000000'){
            parsedDate2 = parsedDate2.addSeconds(-1);
        }
        if(
            (parsedDate1.toString(mask) == parsedDate2.toString(mask))
            ||
            //Special state for all days events (one day events are all considered all day events)
            app.namespace(NSutil).date.parse(value[date1]).add({"days": 1}).equals(app.namespace(NSutil).date.parse(value[date2]))
        ){
            return parsedDate1.toString(mask);
        } else {
            return parsedDate1.toString(mask) + '-' + parsedDate2.toString(mask);
        }
        return '<!-- customDateTimeRange -->';

    });
    
    
    globalTemplate.addFormatter("trumbaGetFirstTopic", function(value, context){
        let returnValue = '';
        if(value.customFields && Array.isArray(value.customFields)){
            value.customFields.forEach(function(customField){
                if(customField.label === "University Event Topic") {
                    returnValue = customField.value.split(',')[0];
                }
            })
        }
        returnValue;
    });

    trumba.registerTemplate = function trumbaRegisterTemplate(name, template){
        trumbaTemplates[name] = globalTemplate(template);
    }

    trumba.applyTemplate = function(name, calendarName){
        return trumba.getJSON(calendarName).then(function(trumbaData){
            return trumbaTemplates[name](trumbaData);
        })
    }

})(emory);
prism.run([
    'plugin-customBarColumnChart.services.customBarColumnChartService',
    () => {
        const defaultTotalSortValue = 'zzzzzzTotal';
        let prevConfiguration = null;
        let prevWidgetId = null;

        // ---------------------------------------------Totals Option---------------------------------------------------
        // Execute the Show Totals customization when the selection is 'Yes'
        const executeAddTotalOption = (el, args) => {
            if (el.subtype === 'column/stackedcolumn100' || el.subtype === 'bar/stacked100') { return; }

            // Configurations
            const totalPointColor = $$get(args.widget, 'custom.barcolumnchart.totalPointColor') || 'black';
            const totalPointFontSize = $$get(args.widget, 'custom.barcolumnchart.totalPointFontSize') || '11px';
            const totalPointSize = $$get(args.widget, 'custom.barcolumnchart.totalPointSize') || '5';
            const totalPointFontFamily = $$get(args.widget, 'custom.barcolumnchart.totalPointFontFamily')
                || '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif';
            const totalAsLine = $$get(args.widget, 'custom.barcolumnchart.totalAsLine') || false;
            const totalYAxisPercentSpacing = $$get(args.widget, 'custom.barcolumnchart.totalYAxisPercentSpacing') || 6;

            let defaultLabelPadding;
            if (el.subtype === 'bar/classic' || el.subtype === 'column/stackedcolumn') {
                defaultLabelPadding = 6;
            } else if (el.subtype === 'column/classic') {
                defaultLabelPadding = 3;
            } else {
                defaultLabelPadding = undefined;
            }
            const totalLabelPadding = $$get(args.widget, 'custom.barcolumnchart.totalLabelPadding')
                || defaultLabelPadding;

            const columnTotals = []; // List to store total values
            const { queryResult } = args.widget;
            const { series } = queryResult;
            let maxValue = -999999999999999999999; // Used to update the widget xAxis.max value

            // Loop through the results and calculate the bar totals
            for (let i = 0; i < queryResult.xAxis.categories.length; i++) {
                let total = 0;
                for (let j = 0; j < series.length; j++) {
                    try { // If the widget already has totals, don't add more totals
                        if (series[j].sortData !== undefined
                            && series[j].sortData.includes(defaultTotalSortValue)) { return; }
                        if (series[j].sortData === undefined
                            && series[j].name === 'Total') { return; }
                    } catch (err) {
                        // Do nothing but catch the exception
                    }

                    if (series[j].data[i].y !== null) {
                        total += series[j].data[i].y;
                    }
                }

                if (total > maxValue) {
                    maxValue = total;
                }
                columnTotals.push(total);
            }

            const totalCategory = {
                color: totalPointColor,
                data: [],
                mask: series[0].mask,
                name: 'Total',
                sortData: defaultTotalSortValue,
                yAxis: 0,
                type: 'line',
            };

            for (let k = 0; k < queryResult.xAxis.categories.length; k++) {
                for (let a = 0; a < series.length; a++) {
                    if (series[a].data[k].selectionData !== undefined) {
                        const temp = $.extend(true, {}, series[a].data[k]);
                        temp.y = columnTotals[k];
                        temp.marker.enabled = true; // Force markers to be enabled so the total points are always shown
                        totalCategory.data.push(temp);
                        break;
                    }
                }
            }

            series.push(totalCategory);
            // Update the max value of the yAxis so the value label displays for the max total
            queryResult.yAxis[0].max = maxValue * (1 + totalYAxisPercentSpacing * 0.01);
            // Ensure that the chart doesn't waste extra white space due to highchart auto sizing.
            queryResult.yAxis[0].endOnTick = false;
            const { series: plotOptSeries } = queryResult.plotOptions;

            if (!totalAsLine) {
                plotOptSeries.lineWidth = 0.00001;
                plotOptSeries.states.hover.lineWidth = 0.00001;
                plotOptSeries.states.hover.lineWidthPlus = 0;
            }
            plotOptSeries.marker.radius = totalPointSize;
            plotOptSeries.marker.states.hover.radius = totalPointSize;
            plotOptSeries.marker.states.select.radius = totalPointSize;
            plotOptSeries.marker.fillColor = totalPointColor;
            plotOptSeries.marker.lineColor = totalPointColor;
            plotOptSeries.marker.states.hover.fillColor = 'white';

            if (el.subtype === 'column/classic' || el.subtype === 'bar/classic') {
                for (let i = 0; i < series.length; i++) {
                    try {
                        if (series[i].sortData.includes(defaultTotalSortValue)) {
                            series[i].dataLabels = {
                                enabled: true,
                                style: {
                                    color: totalPointColor,
                                    fontSize: totalPointFontSize,
                                    fontWeight: 'bold',
                                    fontFamily: totalPointFontFamily,
                                    lineHeight: 'normal',
                                    textOutline: '1px contrast',
                                },
                                padding: totalLabelPadding,
                                y: el.subtype === 'bar/classic' ? 3 : 0,
                                x: 0,
                            };
                        }
                    } catch (err) {
                        // Do nothing
                    }
                }
            } else {
                queryResult.yAxis[0].stackLabels = {
                    enabled: true,
                    color: totalPointColor,
                    mask: series[0].mask,
                    formatWithCommas(x) {
                        return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    },
                    formatter() {
                        const func1 = this.options.mask; // Use the mask if defined
                        const func2 = this.options.formatWithCommas; // Default format
                        return defined(func1) ? func1(this.total) : func2(this.total);
                    },
                    style: {
                        color: totalPointColor,
                        fontSize: totalPointFontSize,
                        fontWeight: 'bold',
                        fontFamily: totalPointFontFamily,
                        lineHeight: 'normal',
                        textOutline: '1px contrast',
                    },
                    y: el.subtype === 'column/stackedcolumn' ? -totalLabelPadding : 5,
                    x: el.subtype === 'column/stackedcolumn' ? 0 : totalLabelPadding,
                };
            }
        };


        // --------------------------------------------Category Sorts---------------------------------------------------
        // Sort Categories in Reverse Order
        const executeSortCategoryReverseOption = (el, args) => {
            const { series } = args.widget.queryResult;
            const origSeries = $.extend(true, {}, series); // Save initial series data results
            const { categories } = args.widget.queryResult.xAxis;
            const origCategories = $.extend(true, {}, categories); // Save initial categories

            try { // Check to see if the category is already reversed
                let val1;
                let val2;
                for (let i = 0; i < series.length; i++) {
                    if (series[i].data[0].selectionData !== undefined) {
                        // eslint-disable-next-line prefer-destructuring
                        val1 = series[i].data[0].selectionData[0];
                        break;
                    }
                }
                for (let i = 0; i < series.length; i++) {
                    if (series[i].data[1].selectionData !== undefined) {
                        // eslint-disable-next-line prefer-destructuring
                        val2 = series[i].data[1].selectionData[0];
                        break;
                    }
                }
                if (val1 > val2) { return; }
            } catch (err) {
                // Pass
            }

            // Reverse the Catgory data + xAxis Category
            for (let i = 0; i < categories.length; i++) {
                for (let j = 0; j < series.length; j++) {
                    series[j].data[i] = origSeries[j].data[categories.length - i - 1];
                }
                categories[i] = origCategories[categories.length - i - 1];
            }
        };


        // Sort Categories by Asc/Desc based on the totals
        const executeSortCategoriesTotalOption = (el, args, sortType) => {
            const columnTotals = []; // List to store total values
            const { series } = args.widget.queryResult;
            const origSeries = $.extend(true, {}, series); // Save initial series data results
            const { categories } = args.widget.queryResult.xAxis;
            const origCategories = $.extend(true, {}, categories); // Save initial categories

            // Loop through the results and calculate the bar totals
            for (let i = 0; i < categories.length; i++) {
                let total = 0;
                for (let j = 0; j < series.length; j++) {
                    if (series[j].data[i].y !== null) {
                        total += series[j].data[i].y;
                    }
                }
                columnTotals.push(total);
            }

            const mapped = columnTotals.map((val, ind) => ({ index: ind, value: val }));
            mapped.sort((a, b) => {
                if (sortType === 'ASC') {
                    return a.value - b.value;
                }
                return b.value - a.value;
            });

            // Update the series data/categories to reflect the sorted mapping
            for (let i = 0; i < categories.length; i++) {
                for (let j = 0; j < series.length; j++) {
                    series[j].data[i] = origSeries[j].data[mapped[i].index];
                }
                categories[i] = origCategories[mapped[i].index];
            }
        };

        // Sort the Categories based on the custom options selected in the popup
        const executeSortCategoryCustomOption = (el, args) => {
            const { series } = args.widget.queryResult;
            const origSeries = $.extend(true, {}, series); // Save initial series data results
            const { categories } = args.widget.queryResult.xAxis;
            const origCategories = $.extend(true, {}, categories); // Save initial categories
            const customList = args.widget.custom.barcolumnchart.tempCategoryConfiguration
                || args.widget.custom.barcolumnchart.customCategoryConfiguration;
            if (customList === undefined || customList.length === 0) { return; }

            const sortCategoryOrder = [];
            for (let a = 0; a < categories.length; a++) {
                for (let b = 0; b < series.length; b++) {
                    let index;
                    if (series[b].data[a].selectionData !== undefined
                        && series[b].data[a].selectionData !== null
                        && series[b].data[a].selectionData[0] !== undefined) {
                        if (series[b].data[a].selectionData[0] instanceof Date) {
                            index = customList.indexOf(series[b].data[a].selectionData[0].toISOString());
                        } else {
                            index = customList.indexOf(series[b].data[a].selectionData[0].toString());
                        }
                        if (index === -1) { // Add values to the end of the list if they are not in the customList
                            index = 100 + a;
                        }
                        sortCategoryOrder.push(index);
                        break;
                    }
                }
            }

            const mapped = sortCategoryOrder.map((val, ind) => ({ index: ind, value: val }));
            mapped.sort((a, b) => a.value - b.value);

            // Update the series data/categories to reflect the sorted mapping
            for (let i = 0; i < categories.length; i++) {
                for (let j = 0; j < series.length; j++) {
                    series[j].data[i] = origSeries[j].data[mapped[i].index];
                }
                categories[i] = origCategories[mapped[i].index];
            }
        };


        // --------------------------------------------Break By Sorts---------------------------------------------------
        // Sort the Break By in reverse order
        const executeSortBreakByReverseOption = (el, args) => {
            const delim = '|~|'; // Delimiter
            const sortDataValues = [];
            const { series } = args.widget.queryResult;
            // Sort the breakby sort values...for some reason they aren't always in order
            for (let i = 0; i < series.length; i++) {
                if (series[i].sortData === undefined) {
                    sortDataValues.push(series[i].name);
                } else if (series[i].sortData instanceof Date) { // Check if date to convert to ISO
                    sortDataValues.push(series[i].sortData.toISOString());
                } else if (series[i].sortData.lastIndexOf(delim) > 0) {
                    // If string was already sorted in reverse, strip last reverse sort values
                    sortDataValues.push(series[i].sortData
                        .substring(series[i].sortData.lastIndexOf(delim) + 3));
                } else {
                    sortDataValues.push(series[i].sortData);
                }
            }
            sortDataValues.sort().reverse();

            for (let k = 0; k < series.length; k++) {
                let indexStr;
                if (series[k].sortData === undefined) {
                    indexStr = sortDataValues.indexOf(series[k].name).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    series[k].sortData = `${indexStr}${delim}${series[k].name}`;
                } else if (series[k].sortData instanceof Date) {
                    indexStr = sortDataValues.indexOf(series[k].sortData.toISOString()).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    series[k].sortData = `${indexStr}${delim}${series[k].sortData.toISOString()}`;
                } else {
                    indexStr = sortDataValues.indexOf(series[k].sortData).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    series[k].sortData = `${indexStr}${delim}${series[k].sortData}`;
                }
            }
        };

        // Sort the Break By in Asc/Desc based on the total
        const executeSortBreakByTotalOption = (el, args, sortType) => {
            const originalSeries = args.widget.queryResult.series;
            const dict = {};
            let counter = 0;

            const getSum = (total, num) => total + num;

            originalSeries.forEach((i) => {
                const mySeries = [];
                i.data.forEach((datapoint) => { mySeries.push(datapoint.y); });
                const total = mySeries.reduce(getSum);
                dict[counter] = total;
                counter += 1;
            });

            const items = Object.keys(dict).map((key) => [key, dict[key]]);

            const OrderArray = items.sort((first, second) => {
                if (sortType === 'ASC') {
                    return first[1] - second[1];
                }
                return second[1] - first[1];
            });

            const newSeries = [];
            for (let i = 0; i < originalSeries.length; i++) {
                const SeriesIndex = parseInt(OrderArray[i][0], 10);
                newSeries.push(originalSeries[SeriesIndex]);
            }

            counter = 0;
            newSeries.forEach((item) => {
                if (counter.toString().length === 1) {
                    counter = `0${counter}`;
                }
                item.sortData = counter.toString() + item.sortData;
                counter += 1;
            });
            args.widget.queryResult.series = newSeries;
        };

        // Sort the Break By based on the custom options selected in the popup
        const executeSortBreakByCustomOption = (el, args) => {
            const { series } = args.widget.queryResult;
            const customList = args.widget.custom.barcolumnchart.tempBreakbyConfiguration
                || args.widget.custom.barcolumnchart.customBreakbyConfiguration;
            if (customList === undefined || customList.length === 0) { return; }
            for (let i = 0; i < series.length; i++) {
                let index;

                if (series[i].sortData instanceof Date) {
                    index = customList.indexOf(series[i].sortData.toISOString());
                } else if (series[i].sortData !== undefined) {
                    // If series is a Date Field, then store values in ISO
                    const match1 = series[i].sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}');
                    const match2 = series[i].sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}');

                    if (match1 !== null) { // Date is already in ISO format
                        index = customList.indexOf(series[i].sortData.substring(match1.index));
                    } else if (match2 !== null) { // Date needs to be converted to ISO Format
                        const matchRes = series[i].sortData.substring(match2.index).substring(0, 20);
                        let strMonthNum;
                        switch (matchRes.substring(0, 3)) {
                            case 'Jan':
                                strMonthNum = '01';
                                break;
                            case 'Feb':
                                strMonthNum = '02';
                                break;
                            case 'Mar':
                                strMonthNum = '03';
                                break;
                            case 'Apr':
                                strMonthNum = '04';
                                break;
                            case 'May':
                                strMonthNum = '05';
                                break;
                            case 'Jun':
                                strMonthNum = '06';
                                break;
                            case 'Jul':
                                strMonthNum = '07';
                                break;
                            case 'Aug':
                                strMonthNum = '08';
                                break;
                            case 'Sep':
                                strMonthNum = '09';
                                break;
                            case 'Oct':
                                strMonthNum = '10';
                                break;
                            case 'Nov':
                                strMonthNum = '11';
                                break;
                            case 'Dec':
                                strMonthNum = '12';
                                break;
                            default:
                                strMonthNum = '00';
                                break;
                        }
                        const isoFormatBreakby = `${matchRes.substring(7, 11)}-${strMonthNum}-`
                            + `${matchRes.substring(4, 6)}T${matchRes.substring(12)}`;
                        index = customList.indexOf(isoFormatBreakby);
                    } else { // Non-Date Field
                        index = customList.indexOf(series[i].name);
                    }
                } else { // Non-Date Field
                    index = customList.indexOf(series[i].name);
                }

                if (index === -1) {
                    series[i].sortData = `zzz${series[i].sortData}`;
                } else if (index < 10) {
                    series[i].sortData = `0${index}${series[i].sortData}`;
                } else {
                    series[i].sortData = index + series[i].sortData;
                }
            }
        };


        // ------------------------------------On Widget Render Event---------------------------------------------------
        // Envoke users selected customiations during widget render event
        const onWidgetRender = (el, args) => {
            if (args.widget.custom === undefined && prevWidgetId === args.widget.oid) { // Need to check if same widget
                args.widget.custom = prevConfiguration; // Set the config if one used to exist, or default to null
            }
            prevConfiguration = args.widget.custom; // Temporarily save the current configuration
            prevWidgetId = args.widget.oid; // Savae the current widgetID

            const isTypeValid = $$get(args.widget, 'custom.barcolumnchart.isTypeValid');
            const customMenuEnabled = $$get(args.widget, 'custom.barcolumnchart.customMenuEnabled');
            const addTotalOption = $$get(args.widget, 'custom.barcolumnchart.addTotalOption');
            const sortCategoriesOption = $$get(args.widget, 'custom.barcolumnchart.sortCategoriesOption');
            const sortBreakByOption = $$get(args.widget, 'custom.barcolumnchart.sortBreakByOption');
            const tempCategoryConfiguration = $$get(args.widget, 'custom.barcolumnchart.tempCategoryConfiguration');
            const tempBreakbyConfiguration = $$get(args.widget, 'custom.barcolumnchart.tempBreakbyConfiguration');

            // If the chart isn't valid or the option isn't enabled return
            if (!customMenuEnabled || !isTypeValid) { return; }

            try {
                // Sorting Category Options
                if (tempCategoryConfiguration !== undefined) { // Check if temp configuration is being used
                    executeSortCategoryCustomOption(el, args);
                } else if (sortCategoriesOption === 'Reverse') {
                    executeSortCategoryReverseOption(el, args);
                } else if (sortCategoriesOption === 'Asc by Total') {
                    executeSortCategoriesTotalOption(el, args, 'ASC');
                } else if (sortCategoriesOption === 'Desc by Total') {
                    executeSortCategoriesTotalOption(el, args, 'DESC');
                } else if (sortCategoriesOption === 'Custom') {
                    executeSortCategoryCustomOption(el, args);
                }
            } catch (err) {
                // Do Nothing
            }

            try {
                // Sorting Break By Options
                if (tempBreakbyConfiguration !== undefined) { // Check if temp configuration is being used
                    executeSortBreakByCustomOption(el, args);
                } else if (sortBreakByOption === 'Asc by Total') {
                    executeSortBreakByTotalOption(el, args, 'ASC');
                } else if (sortBreakByOption === 'Desc by Total') {
                    executeSortBreakByTotalOption(el, args, 'DESC');
                } else if (sortBreakByOption === 'Reverse') {
                    executeSortBreakByReverseOption(el, args);
                } else if (sortBreakByOption === 'Custom') {
                    executeSortBreakByCustomOption(el, args);
                }
            } catch (err) {
                // Do Nothing
            }

            // Show Total Options
            if (addTotalOption === 'Yes') {
                executeAddTotalOption(el, args);
            }
        };

        const registerToRenderEvent = (el, args) => {
            args.widget.on('render', onWidgetRender);
        };

        // Main functions for the plugin, envoked during the widget added + init events
        prism.on('dashboardloaded', (el, args) => {
            args.dashboard.on('widgetadded', registerToRenderEvent);
            args.dashboard.on('widgetinitialized', registerToRenderEvent);
        });
    },
]);

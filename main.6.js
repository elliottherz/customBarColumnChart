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
            const totalYAxisPercentSpacing = $$get(args.widget, 'custom.barcolumnchart.totalYAxisPercentSpacing') || 5;

            const columnTotals = []; // List to store total values
            const { queryResult: queryRes } = args.widget;
            const series = $.extend(true, {}, queryRes.series); // Save initial series
            let maxValue = -999999999999999999999; // Used to update the widget xAxis.max value

            // Loop through the results and calculate the bar totals
            for (let i = 0; i < queryRes.xAxis.categories.length; i++) {
                let total = 0;
                for (let j = 0; j < queryRes.series.length; j++) {
                    try { // If the widget already has totals, don't add more totals
                        if (queryRes.series[j].sortData.includes(defaultTotalSortValue)) { return; }
                    } catch (err) {
                        // Do nothing but catch the exception
                    }

                    if (queryRes.series[j].data[i].y !== null) {
                        total += queryRes.series[j].data[i].y;
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

            for (let k = 0; k < queryRes.xAxis.categories.length; k++) {
                for (let a = 0; a < queryRes.series.length; a++) {
                    if (queryRes.series[a].data[k].selectionData !== undefined) {
                        const temp = $.extend(true, {}, queryRes.series[a].data[k]);
                        temp.y = columnTotals[k];
                        temp.marker.enabled = true; // Force markers to be enabled so the total points are always shown
                        totalCategory.data.push(temp);
                        break;
                    }
                }
            }

            queryRes.series.push(totalCategory);
            // Update the max value of the yAxis so the value label displays for the max total
            queryRes.yAxis[0].max = maxValue * (1 + totalYAxisPercentSpacing * 0.01);
            // Ensure that the chart doesn't waste extra white space due to highchart auto sizing.
            queryRes.yAxis[0].endOnTick = false;
            const { plotOptions: plotOpt } = queryRes;

            if (!totalAsLine) {
                plotOpt.series.lineWidth = 0.00001;
                plotOpt.series.states.hover.lineWidth = 0.00001;
                plotOpt.series.states.hover.lineWidthPlus = 0;
            }
            plotOpt.series.marker.radius = totalPointSize;
            plotOpt.series.marker.states.hover.radius = totalPointSize;
            plotOpt.series.marker.states.select.radius = totalPointSize;
            plotOpt.series.marker.fillColor = totalPointColor;
            plotOpt.series.marker.lineColor = totalPointColor;
            plotOpt.series.marker.states.hover.fillColor = 'white';

            if (el.subtype === 'column/classic' || el.subtype === 'bar/classic') {
                for (let i = 0; i < queryRes.series.length; i++) {
                    try {
                        if (queryRes.series[i].sortData.includes(defaultTotalSortValue)) {
                            queryRes.series[i].dataLabels = {
                                enabled: true,
                                style: {
                                    color: totalPointColor,
                                    fontSize: totalPointFontSize,
                                    fontWeight: 'bold',
                                    fontFamily: totalPointFontFamily,
                                    lineHeight: 'normal',
                                    textOutline: '1px contrast',
                                },
                                padding: el.subtype === 'column/classic' ? 3 : 6,
                                y: 0,
                                x: 0,
                            };
                        }
                    } catch (err) {
                        // Do nothing
                    }
                }
            } else {
                queryRes.yAxis[0].stackLabels = {
                    enabled: true,
                    color: totalPointColor,
                    mask: queryRes.series[0].mask,
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
                };
            }
        };


        // --------------------------------------------Category Sorts---------------------------------------------------
        // Sort Categories in Reverse Order
        const executeSortCategoryReverseOption = (el, args) => {
            const { queryResult: queryRes } = args.widget;
            const categories = $.extend(true, {}, queryRes.xAxis.categories); // Save initial categories
            const series = $.extend(true, {}, queryRes.series); // Save initial series data results
            for (let i = 0; i < queryRes.xAxis.categories.length; i++) {
                for (let j = 0; j < queryRes.series.length; j++) {
                    queryRes.series[j].data[i] = series[j].data[queryRes.xAxis.categories.length - i - 1];
                }
                queryRes.xAxis.categories[i] = categories[queryRes.xAxis.categories.length - i - 1];
            }
        };

        // Sort Categories by Asc/Desc based on the totals
        const executeSortCategoriesOption = (el, args, sortType) => {
            const columnTotals = []; // List to store total values
            const { queryResult: queryRes } = args.widget;
            const categories = $.extend(true, {}, queryRes.xAxis.categories); // Save initial categories
            const series = $.extend(true, {}, queryRes.series); // Save initial series data results

            // Loop through the results and calculate the bar totals
            for (let i = 0; i < queryRes.xAxis.categories.length; i++) {
                let total = 0;
                for (let j = 0; j < queryRes.series.length; j++) {
                    if (queryRes.series[j].data[i].y !== null) {
                        total += queryRes.series[j].data[i].y;
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
            for (let i = 0; i < queryRes.xAxis.categories.length; i++) {
                for (let j = 0; j < queryRes.series.length; j++) {
                    queryRes.series[j].data[i] = series[j].data[mapped[i].index];
                }
                queryRes.xAxis.categories[i] = categories[mapped[i].index];
            }
        };

        // Sort the Categories based on the custom options selected in the popup
        const executeSortCategoryCustomOption = (el, args) => {
            const { queryResult: queryRes } = args.widget;
            const categories = $.extend(true, {}, queryRes.xAxis.categories); // Save initial categories
            const series = $.extend(true, {}, queryRes.series); // Save initial series data results
            const customList = args.widget.custom.barcolumnchart.customCategoryConfiguration;
            if (customList === undefined || customList.length === 0) { return; }

            const sortCategoryOrder = [];
            for (let a = 0; a < queryRes.xAxis.categories.length; a++) {
                for (let b = 0; b < queryRes.series.length; b++) {
                    let index;
                    if (queryRes.series[b].data[a].selectionData !== undefined
                        && queryRes.series[b].data[a].selectionData[0] !== undefined) {
                        if (queryRes.series[b].data[a].selectionData[0] instanceof Date) {
                            index = customList.indexOf(queryRes.series[b].data[a].selectionData[0].toISOString());
                        } else {
                            index = customList.indexOf(queryRes.series[b].data[a].selectionData[0].toString());
                        }
                        if (index === -1) {
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
            for (let i = 0; i < queryRes.xAxis.categories.length; i++) {
                for (let j = 0; j < queryRes.series.length; j++) {
                    queryRes.series[j].data[i] = series[j].data[mapped[i].index];
                }
                queryRes.xAxis.categories[i] = categories[mapped[i].index];
            }
        };


        // --------------------------------------------Break By Sorts---------------------------------------------------
        // Sort the Break By in reverse order
        const executeSortBreakByReverseOption = (el, args) => {
            const sortDataValues = [];
            const { queryResult: queryRes } = args.widget;
            // Sort the breakby sort values...for some reason they aren't always in order
            for (let i = 0; i < queryRes.series.length; i++) {
                if (queryRes.series[i].sortData === undefined) {
                    sortDataValues.push(queryRes.series[i].name);
                } else if (queryRes.series[i].sortData instanceof Date) { // Check if date to convert to ISO
                    sortDataValues.push(queryRes.series[i].sortData.toISOString());
                } else {
                    sortDataValues.push(queryRes.series[i].sortData);
                }
            }
            sortDataValues.sort().reverse();

            for (let k = 0; k < queryRes.series.length; k++) {
                let indexStr;
                if (queryRes.series[k].sortData === undefined) {
                    indexStr = sortDataValues.indexOf(queryRes.series[k].name).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    queryRes.series[k].sortData = indexStr + queryRes.series[k].name;
                } else if (queryRes.series[k].sortData instanceof Date) {
                    indexStr = sortDataValues.indexOf(queryRes.series[k].sortData.toISOString()).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    queryRes.series[k].sortData = indexStr + queryRes.series[k].sortData.toISOString();
                } else {
                    indexStr = sortDataValues.indexOf(queryRes.series[k].sortData).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    queryRes.series[k].sortData = indexStr + queryRes.series[k].sortData;
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
            const { queryResult: queryRes } = args.widget;
            const customList = args.widget.custom.barcolumnchart.customBreakbyConfiguration;
            if (customList === undefined || customList.length === 0) { return; }
            for (let i = 0; i < queryRes.series.length; i++) {
                let index;

                if (queryRes.series[i].sortData instanceof Date) {
                    index = customList.indexOf(queryRes.series[i].sortData.toISOString());
                } else {
                    // If series is a Date Field, then store values in ISO
                    const match1 = queryRes.series[i].sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}');
                    const match2 = queryRes.series[i].sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}');

                    if (match1 !== null) { // Date is already in ISO format
                        index = customList.indexOf(queryRes.series[i].sortData.substring(match1.index));
                    } else if (match2 !== null) { // Date needs to be converted to ISO Format
                        const matchRes = queryRes.series[i].sortData.substring(match2.index).substring(0, 20);
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
                        index = customList.indexOf(queryRes.series[i].name);
                    }
                }

                if (index === -1) {
                    queryRes.series[i].sortData = `zzz${queryRes.series[i].sortData}`;
                } else if (index < 10) {
                    queryRes.series[i].sortData = `0${index}${queryRes.series[i].sortData}`;
                } else {
                    queryRes.series[i].sortData = index + queryRes.series[i].sortData;
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

            // If the chart isn't valid or the option isn't enabled return
            if (!customMenuEnabled || !isTypeValid) { return; }

            // Sorting Category Options
            if (sortCategoriesOption === 'Reverse') {
                executeSortCategoryReverseOption(el, args);
            } else if (sortCategoriesOption === 'Asc by Total') {
                executeSortCategoriesOption(el, args, 'ASC');
            } else if (sortCategoriesOption === 'Desc by Total') {
                executeSortCategoriesOption(el, args, 'DESC');
            } else if (sortCategoriesOption === 'Custom') {
                executeSortCategoryCustomOption(el, args);
            }

            // Sorting Break By Options
            if (sortBreakByOption === 'Asc by Total') {
                executeSortBreakByTotalOption(el, args, 'ASC');
            } else if (sortBreakByOption === 'Desc by Total') {
                executeSortBreakByTotalOption(el, args, 'DESC');
            } else if (sortBreakByOption === 'Reverse') {
                executeSortBreakByReverseOption(el, args);
            } else if (sortBreakByOption === 'Custom') {
                executeSortBreakByCustomOption(el, args);
            }

            // Show Total Options
            if (addTotalOption === 'Yes') {
                executeAddTotalOption(el, args);
            }
        };

        const registerToRenderEvent = (el, args) => {
            args.widget.on('render', onWidgetRender);
        };

        // Main functions for the plugin, envoked during the dashboard loaded event + widget added/loaded events
        prism.on('widgetloaded', registerToRenderEvent);
        prism.on('dashboardloaded', (el, args) => {
            args.dashboard.on('widgetadded', registerToRenderEvent);
            args.dashboard.on('widgetinitialized', registerToRenderEvent);
        });
    },
]);

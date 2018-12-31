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
            const totalSeriesName = $$get(args.widget, 'custom.barcolumnchart.totalSeriesName') || 'Total';
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

            const { queryResult } = args.widget;
            const { series } = queryResult;
            let maxValue = -999999999999999999999; // Used to update the widget xAxis.max value

            const totalCategory = {
                color: totalPointColor,
                data: [],
                mask: series[0].mask,
                name: totalSeriesName,
                sortData: defaultTotalSortValue,
                yAxis: 0,
                type: 'line',
            };

            // Loop through the results and calculate the bar totals
            for (let cIndex = 0; cIndex < queryResult.xAxis.categories.length; cIndex++) {
                let total = 0;
                for (let sIndex = 0; sIndex < series.length; sIndex++) {
                    try { // If the widget already has totals, don't add more totals
                        if (series[sIndex].sortData !== undefined
                            && series[sIndex].sortData.includes(defaultTotalSortValue)) { return; }
                        if (series[sIndex].sortData === undefined
                            && series[sIndex].name === totalSeriesName) { return; }
                    } catch (err) {
                        // Do nothing but catch the exception
                    }

                    if (series[sIndex].data[cIndex].y !== null) {
                        total += series[sIndex].data[cIndex].y;
                    }
                }

                if (total > maxValue) { // Save the max value of the chart to set the yAxis.max
                    maxValue = total;
                }

                for (let sIndex = 0; sIndex < series.length; sIndex++) {
                    if (series[sIndex].data[cIndex].selectionData !== undefined) {
                        const temp = $.extend(true, {}, series[sIndex].data[cIndex]);
                        temp.y = total;
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
                plotOptSeries.lineWidth = 0.00000;
                plotOptSeries.states.hover.lineWidth = 0.00000;
                plotOptSeries.states.hover.lineWidthPlus = 0;
            }
            plotOptSeries.marker.radius = totalPointSize;
            plotOptSeries.marker.states.hover.radius = totalPointSize;
            plotOptSeries.marker.states.select.radius = totalPointSize;
            plotOptSeries.marker.fillColor = totalPointColor;
            plotOptSeries.marker.lineColor = totalPointColor;
            plotOptSeries.marker.states.hover.fillColor = 'white';

            if (el.subtype === 'column/classic' || el.subtype === 'bar/classic') {
                series.forEach((sItem) => {
                    try {
                        if (sItem.sortData.includes(defaultTotalSortValue)) {
                            sItem.dataLabels = {
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
                });
            } else {
                queryResult.yAxis[0].stackLabels = {
                    enabled: true,
                    color: totalPointColor,
                    mask: series[0].mask,
                    formatWithCommas(val) {
                        return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
                for (let index = 0; index < series.length; index++) {
                    if (series[index].data[0].selectionData !== undefined) {
                        ({ 0: val1 } = series[index].data[0].selectionData);
                    }
                    if (series[index].data[1].selectionData !== undefined) {
                        ({ 0: val2 } = series[index].data[1].selectionData);
                    }
                    if (val1 !== undefined && val2 !== undefined) {
                        break;
                    }
                }
                if (val1 > val2) { return; } // Chart is already reversed, so return
            } catch (err) {
                // Pass
            }

            // Reverse the Catgory data + xAxis Category
            categories.forEach((category, cIndex) => {
                series.forEach((sItem, sIndex) => {
                    sItem.data[cIndex] = origSeries[sIndex].data[categories.length - cIndex - 1];
                });
                categories[cIndex] = origCategories[categories.length - cIndex - 1];
            });
        };


        // Sort Categories by Asc/Desc based on the totals
        const executeSortCategoriesTotalOption = (el, args, sortType) => {
            const columnTotals = []; // List to store total values
            const { series } = args.widget.queryResult;
            const origSeries = $.extend(true, {}, series); // Save initial series data results
            const { categories } = args.widget.queryResult.xAxis;
            const origCategories = $.extend(true, {}, categories); // Save initial categories

            // Loop through the results and calculate the bar totals
            categories.forEach((category, cIndex) => {
                let total = 0;
                series.forEach((sItem) => {
                    if (sItem.data[cIndex].y !== null) {
                        total += sItem.data[cIndex].y;
                    }
                });
                columnTotals.push(total);
            });

            const mapped = columnTotals.map((val, ind) => ({ index: ind, value: val }));
            mapped.sort((elem1, elem2) => (sortType === 'ASC' ? elem1.value - elem2.value : elem2.value - elem1.value));

            // Update the series data/categories to reflect the sorted mapping
            categories.forEach((category, cIndex) => {
                series.forEach((sItem, sIndex) => {
                    sItem.data[cIndex] = origSeries[sIndex].data[mapped[cIndex].index];
                });
                categories[cIndex] = origCategories[mapped[cIndex].index];
            });
        };

        // Sort the Categories based on the custom options selected in the popup
        const executeSortCategoryCustomOption = (el, args) => {
            const { series } = args.widget.queryResult;
            const origSeries = $.extend(true, {}, series); // Save initial series data results
            const { categories } = args.widget.queryResult.xAxis;
            const origCategories = $.extend(true, {}, categories); // Save initial categories
            const customCategoryConfiguration = $$get(args.widget, 'custom.barcolumnchart.customCategoryConfiguration');
            const tempCustomList = $$get(args.widget, 'custom.barcolumnchart.tempCustomList');
            const currModalOpened = $$get(args.widget, 'custom.barcolumnchart.currModalOpened');
            let customList;
            if (currModalOpened === 'Category' && tempCustomList !== undefined) {
                customList = tempCustomList;
            } else {
                customList = customCategoryConfiguration;
            }

            if (customList === undefined || customList.length === 0) { return; }

            const sortCategoryOrder = [];
            categories.forEach((category, cIndex) => {
                for (let sIndex = 0; sIndex < series.length; sIndex++) {
                    let index;
                    if (series[sIndex].data[cIndex].selectionData !== undefined
                        && series[sIndex].data[cIndex].selectionData !== null
                        && series[sIndex].data[cIndex].selectionData[0] !== undefined) {
                        if (series[sIndex].data[cIndex].selectionData[0] instanceof Date) {
                            index = customList.indexOf(series[sIndex].data[cIndex].selectionData[0].toISOString());
                        } else {
                            index = customList.indexOf(series[sIndex].data[cIndex].selectionData[0].toString());
                        }
                        if (index === -1) { // Add values to the end of the list if they are not in the customList
                            index = categories.length + cIndex;
                        }
                        sortCategoryOrder.push(index);
                        break;
                    }
                }
            });

            const mapped = sortCategoryOrder.map((val, ind) => ({ index: ind, value: val }));
            mapped.sort((elem1, elem2) => elem1.value - elem2.value);

            // Update the series data/categories to reflect the sorted mapping
            categories.forEach((category, cIndex) => {
                series.forEach((sItem, sIndex) => {
                    sItem.data[cIndex] = origSeries[sIndex].data[mapped[cIndex].index];
                });
                categories[cIndex] = origCategories[mapped[cIndex].index];
            });
        };


        // --------------------------------------------Break By Sorts---------------------------------------------------
        // Sort the Break By in reverse order
        const executeSortBreakByReverseOption = (el, args) => {
            const delim = '|~|'; // Delimiter
            const sortDataValues = [];
            const { series } = args.widget.queryResult;
            // Sort the breakby sort values...for some reason they aren't always in order
            series.forEach((sItem) => {
                let item;
                if (sItem.sortData === undefined) {
                    item = sItem.name;
                } else if (sItem.sortData instanceof Date) { // Check if date to convert to ISO
                    item = sItem.sortData.toISOString();
                } else if (sItem.sortData.lastIndexOf(delim) > 0) {
                    // If string was already sorted in reverse, strip last reverse sort values
                    item = sItem.sortData.substring(sItem.sortData.lastIndexOf(delim) + 3);
                } else {
                    item = sItem.sortData;
                }
                sortDataValues.push(item);
            });
            sortDataValues.sort().reverse();

            series.forEach((sItem) => {
                let indexStr;
                if (sItem.sortData === undefined) {
                    indexStr = sortDataValues.indexOf(sItem.name).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    sItem.sortData = `${indexStr}${delim}${sItem.name}`;
                } else if (sItem.sortData instanceof Date) {
                    indexStr = sortDataValues.indexOf(sItem.sortData.toISOString()).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    sItem.sortData = `${indexStr}${delim}${sItem.sortData.toISOString()}`;
                } else {
                    indexStr = sortDataValues.indexOf(sItem.sortData).toString();
                    if (indexStr.length === 1) {
                        indexStr = `0${indexStr}`;
                    }
                    sItem.sortData = `${indexStr}${delim}${sItem.sortData}`;
                }
            });
        };

        // Sort the Break By in Asc/Desc based on the total
        const executeSortBreakByTotalOption = (el, args, sortType) => {
            const originalSeries = args.widget.queryResult.series;
            const dict = {};
            let counter = 0;

            const getSum = (total, num) => total + num;

            originalSeries.forEach((orig) => {
                const mySeries = [];
                orig.data.forEach((datapoint) => { mySeries.push(datapoint.y); });
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
            originalSeries.forEach((orig, sIndex) => {
                const SeriesIndex = parseInt(OrderArray[sIndex][0], 10);
                newSeries.push(originalSeries[SeriesIndex]);
            });

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
            const customBreakbyConfiguration = $$get(args.widget, 'custom.barcolumnchart.customBreakbyConfiguration');
            const tempCustomList = $$get(args.widget, 'custom.barcolumnchart.tempCustomList');
            const currModalOpened = $$get(args.widget, 'custom.barcolumnchart.currModalOpened');
            let customList;
            if (currModalOpened === 'Break By' && tempCustomList !== undefined) {
                customList = tempCustomList;
            } else {
                customList = customBreakbyConfiguration;
            }
            if (customList === undefined || customList.length === 0) { return; }
            series.forEach((sItem) => {
                let index;
                if (sItem.sortData instanceof Date) {
                    index = customList.indexOf(sItem.sortData.toISOString());
                } else if (sItem.sortData !== undefined) {
                    // If series is a Date Field, then store values in ISO
                    const match1 = sItem.sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}');
                    const match2 = sItem.sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}');

                    if (match1 !== null) { // Date is already in ISO format
                        index = customList.indexOf(sItem.sortData.substring(match1.index));
                    } else if (match2 !== null) { // Date needs to be converted to ISO Format
                        const matchRes = sItem.sortData.substring(match2.index).substring(0, 20);
                        let strMonthNum;
                        const monthDict = {
                            Jan: '01',
                            Feb: '02',
                            Mar: '03',
                            Apr: '04',
                            May: '05',
                            Jun: '06',
                            Jul: '07',
                            Aug: '08',
                            Sep: '09',
                            Oct: '10',
                            Nov: '11',
                            Dec: '12',
                        };
                        if (monthDict[matchRes.substring(0, 3)] !== undefined) {
                            strMonthNum = monthDict[matchRes.substring(0, 3)];
                        } else {
                            strMonthNum = '00';
                        }
                        const isoFormatBreakby = `${matchRes.substring(7, 11)}-${strMonthNum}-`
                            + `${matchRes.substring(4, 6)}T${matchRes.substring(12)}`;
                        index = customList.indexOf(isoFormatBreakby);
                    } else { // Non-Date Field
                        index = customList.indexOf(sItem.name);
                    }
                } else { // Non-Date Field
                    index = customList.indexOf(sItem.name);
                }

                if (index === -1) {
                    sItem.sortData = `zzz${sItem.sortData}`;
                } else if (index < 10) {
                    sItem.sortData = `0${index}${sItem.sortData}`;
                } else {
                    sItem.sortData = index + sItem.sortData;
                }
            });
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
            const customMenuEnabled = $$get(args.widget, 'custom.barcolumnchart.customMenuEnabled') || false;
            const addTotalOption = $$get(args.widget, 'custom.barcolumnchart.addTotalOption') || 'No';
            const sortCategoriesOption = $$get(args.widget, 'custom.barcolumnchart.sortCategoriesOption') || 'Default';
            const sortBreakByOption = $$get(args.widget, 'custom.barcolumnchart.sortBreakByOption') || 'Default';
            const tempCustomList = $$get(args.widget, 'custom.barcolumnchart.tempCustomList');
            const currModalOpened = $$get(args.widget, 'custom.barcolumnchart.currModalOpened');

            // If the chart isn't valid or the option isn't enabled return
            if (!customMenuEnabled || !isTypeValid) { return; }

            try {
                // Sorting Category Options
                if (tempCustomList !== undefined && currModalOpened === 'Category') { // Check if custom sort is open
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
                if (tempCustomList !== undefined && currModalOpened === 'Break By') { // Check if custom sort is open
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

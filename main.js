prism.run([
	'plugin-customBarColumnChart.services.customBarColumnChartService',
	function ($styleService) {
		
		const defaultTotalSortValue = 'zzzzzzTotal';

		prism.on("dashboardloaded", function (e, args) {
			args.dashboard.on("widgetinitialized", function (dash, ar) {
				ar.widget.on("render", onWidgetRender);
			});
		});
		
        var onWidgetRender = function (w,el) {
			var isTypeValid = $$get(el.widget, 'custom.barcolumnchart.isTypeValid');
            var customMenuEnabled = $$get(el.widget, 'custom.barcolumnchart.customMenuEnabled');
			var addTotalOption = $$get(el.widget, 'custom.barcolumnchart.addTotalOption');
			var sortCategoriesOption = $$get(el.widget, 'custom.barcolumnchart.sortCategoriesOption');
			var sortBreakByOption = $$get(el.widget, 'custom.barcolumnchart.sortBreakByOption');
			
            if (!customMenuEnabled || !isTypeValid) { return; } //if the chart isn't valid or the option isn't enabled return
            var config = $styleService.getConfig(el.widget);
			
			//Sorting Category Options
			if(sortCategoriesOption === "Reverse") {
				executeSortCategoryReverseOption(w, el);
			}
			else if(sortCategoriesOption === "Asc by Total") { 
				executeSortCategoriesOption(w, el, 'ASC'); 
			}
			else if(sortCategoriesOption === "Desc by Total") { 
				executeSortCategoriesOption(w, el, 'DESC'); 
			}
			else if(sortCategoriesOption === "Custom") {
				executeSortCategoryCustomOption(w, el);
			}
			
			//Sorting Break By Options
			if(sortBreakByOption === "Asc by Total") { 
				executeSortBreakByTotalOption(w, el, 'ASC'); 
			}
			else if(sortBreakByOption === "Desc by Total") { 
				executeSortBreakByTotalOption(w, el, 'DESC'); 
			}
			else if(sortBreakByOption === "Reverse") {
				executeSortBreakByReverseOption(w, el);
			}
			else if(sortBreakByOption === "Custom") {
				executeSortBreakByCustomOption(w, el);
			}
			
			//Show Total Options
			if (addTotalOption === "Yes") { 
				executeAddTotalOption(w, el); 
			}
        };
		
		
		//execute the Show Totals customization when the selection is "Yes"
		function executeAddTotalOption(w, args) {
			if(w.subtype === "column/stackedcolumn100" || w.subtype === "bar/stacked100") { return; }
			
			//configurations
			var totalPointColor = $$get(args.widget, 'custom.barcolumnchart.totalPointColor') || 'black';
			var totalPointFontSize = $$get(args.widget, 'custom.barcolumnchart.totalPointFontSize') || '11px';
			var totalPointSize = $$get(args.widget, 'custom.barcolumnchart.totalPointSize') || '5';
			var totalAsLine = $$get(args.widget, 'custom.barcolumnchart.totalAsLine') || false;
			var totalPointFontFamily = $$get(args.widget, 'custom.barcolumnchart.totalPointFontFamily') || '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif';
			
			var columnTotals = []; //list to store total values
			var queryResult = args.widget.queryResult;
			var series = $.extend(true, {}, queryResult.series); //save initial series data results
			var maxValue = -99999999999999999999999999999; //used to update the widget xAxis.max value
			
			//loop through the results and calculate the bar totals
			for(var i=0; i<queryResult.xAxis.categories.length; i++) {
				var total = 0;
				for(var j=0; j<queryResult.series.length; j++) {
					try { //if the widget already has totals, don't add more totals
						if(queryResult.series[j].sortData.includes(defaultTotalSortValue)) { return; } 
					} catch(e) {
						//do nothing but catch the exception
					}
					
					if(queryResult.series[j].data[i].y !== null) {
						total += queryResult.series[j].data[i].y
					}
				}
				
				if(total > maxValue) {
					maxValue = total;
				}
				columnTotals.push(total);
			}
			
			var totalCategory = {
				'color': totalPointColor,
				'data': [],
				'mask': series[0].mask,
				'name': 'Total',
				'sortData': defaultTotalSortValue,
				'yAxis': 0,
				'type': 'line'
			};
			
			for(var k=0; k<queryResult.xAxis.categories.length; k++) {
				for(var a=0; a<queryResult.series.length; a++) {
					if(queryResult.series[a].data[k].selectionData !== undefined) {
						var temp = $.extend(true, {},queryResult.series[a].data[k]);
						temp.y = columnTotals[k];
						temp.marker.enabled = true; //force markers to be enabled so the total points are always shown
						totalCategory.data.push(temp);
						break;
					}
				}
			}
			
			queryResult.series.push(totalCategory);
			queryResult.yAxis[0].max = maxValue * 1.05; //update the max value of the yAxis so the value label displays for the max total
			queryResult.yAxis[0].endOnTick = false; //ensure that the chart doesn't waste extra white space due to highchart auto sizing.
			var plotOptions = queryResult.plotOptions;

			if(totalAsLine) {}
			else {
				plotOptions.series.lineWidth = 0.00001;
				plotOptions.series.states.hover.lineWidth = 0.00001;
				plotOptions.series.states.hover.lineWidthPlus = 0;
			}
			plotOptions.series.marker.radius = totalPointSize;
			plotOptions.series.marker.states.hover.radius = totalPointSize;
			plotOptions.series.marker.fillColor = totalPointColor;
			plotOptions.series.marker.lineColor = totalPointColor;
			plotOptions.series.marker.states.hover.fillColor = 'white';
			
			if(w.subtype === "column/classic" || w.subtype === "bar/classic") {
				for(var i=0; i<queryResult.series.length; i++) {
					try {
						if(queryResult.series[i].sortData.includes(defaultTotalSortValue)) {
							queryResult.series[i].dataLabels = {
								enabled: true,
								style: {
									color: totalPointColor,
									fontSize: totalPointFontSize,
									fontWeight: "bold",
									fontFamily: totalPointFontFamily,
									lineHeight: "normal",
									textOutline: "1px contrast"
								},
								padding: w.subtype === "column/classic" ? 3:6,
								y: 0,
								x: 0
							};		
						}
					} catch(err) {
						//do nothing
					}
				}
			}
			else {
				queryResult.yAxis[0].stackLabels = {
					enabled: true,
					color: totalPointColor,
					mask: queryResult.series[0].mask,
					formatWithCommas: function(x) {	
						return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					formatter: function (){
						var func1=this.options.mask; //Use the mask if defined
						var func2=this.options.formatWithCommas; //Round to 0 decimal places and add commas by default
						return defined(func1)?func1(this.total):func2(this.total); //Apply the formatting
					},
					style: {
						color: totalPointColor,
						fontSize: totalPointFontSize,
						fontWeight: "bold",
						fontFamily: totalPointFontFamily,
						lineHeight: "normal",
						textOutline: "1px contrast"
					}
				};
			}
		}
		
		//-------------------------------------------------Category Sorts------------------------------------------------------------
		//Sort Categories in Reverse Order
		function executeSortCategoryReverseOption(w, args) {
			var queryResult = args.widget.queryResult;
			var categories = $.extend(true, {},queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},queryResult.series); //save initial series data results
			for(var i=0; i<queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<queryResult.series.length; j++) {
					queryResult.series[j].data[i] = series[j].data[queryResult.xAxis.categories.length - i - 1];
				}
				queryResult.xAxis.categories[i] = categories[queryResult.xAxis.categories.length - i - 1];
			}
		}
		
		//Sort Categories by Asc/Desc based on the totals
		function executeSortCategoriesOption(w, args, sortType) {
			var columnTotals = []; //list to store total values
			var queryResult = args.widget.queryResult;
			var categories = $.extend(true, {},queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},queryResult.series); //save initial series data results
			
			//loop through the results and calculate the bar totals
			for(var i=0; i<queryResult.xAxis.categories.length; i++) {
				var total = 0;
				for(var j=0; j<queryResult.series.length; j++) {
					if(queryResult.series[j].data[i].y !== null) {
						total += queryResult.series[j].data[i].y
					}
				}
				columnTotals.push(total);
			}
			
			var mapped = columnTotals.map(function(el, i) {
				return { index: i, value: el };
			});
			mapped.sort(function(a, b) {
				if(sortType === 'ASC') {
					return a.value - b.value;
				} else {
					return b.value - a.value;
				}
			});
			var result = mapped.map(function(el){
				return columnTotals[el.index];
			});
			
			//update the series data/categories to reflect the sorted mapping
			for(var i=0; i<queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<queryResult.series.length; j++) {
					queryResult.series[j].data[i] = series[j].data[mapped[i].index];
				}
				queryResult.xAxis.categories[i] = categories[mapped[i].index];
			}
		}

		//Sort the Categories based on the custom options selected in the popup
		function executeSortCategoryCustomOption(w, args) {
			var queryResult = args.widget.queryResult;
			var categories = $.extend(true, {},queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},queryResult.series); //save initial series data results
			var customList = args.widget.custom.barcolumnchart.customCategoryConfiguration;
			if(customList === undefined || customList.length === 0) { return; }
				
			var sortCategoryOrder = [];
			for(var a=0; a<queryResult.xAxis.categories.length; a++) {
				for(var b=0; b<queryResult.series.length; b++) {
					if(queryResult.series[b].data[a].selectionData !== undefined 
						&& queryResult.series[b].data[a].selectionData[0] !== undefined) {
						if(queryResult.series[b].data[a].selectionData[0] instanceof Date) {
							var index = customList.indexOf(queryResult.series[b].data[a].selectionData[0].toISOString());
						}
						else {
							var index = customList.indexOf(queryResult.series[b].data[a].selectionData[0].toString());
						}
						if(index === -1) {
							index = 100+a
						}
						sortCategoryOrder.push(index);
						break;
					}
				}
			}
			
			var mapped = sortCategoryOrder.map(function(el, i) {
				return { index: i, value: el };
			});
			mapped.sort(function(a, b) {
				return a.value - b.value;
			});
			var result = mapped.map(function(el) {
				return sortCategoryOrder[el.index];
			});
			
			//update the series data/categories to reflect the sorted mapping
			for(var i=0; i<queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<queryResult.series.length; j++) {
					queryResult.series[j].data[i] = series[j].data[mapped[i].index];
				}
				queryResult.xAxis.categories[i] = categories[mapped[i].index];
			}
		}
		
		
		//-------------------------------------------------Break By Sorts------------------------------------------------------------
		//Sort the Break By in reverse order
		//There is currently a bug in V7.2 where series are not in order based on their sortData order
		//This probably won't work everytime consistently...might require a page reload
		function executeSortBreakByReverseOption(w, args) {
			var sortDataValues = []
			var queryResult = args.widget.queryResult;
			//sort the breakby sort values...for some reason they aren't always in order
			for(var i=0; i<queryResult.series.length; i++) { 
				if(queryResult.series[i].sortData === undefined) {
					sortDataValues.push(queryResult.series[i].name);
				}
				else {
					sortDataValues.push(queryResult.series[i].sortData);
				}
			}
			var origSortDataValues = $.extend(true, [], sortDataValues);
			sortDataValues.sort().reverse();
			
			for(var k=0; k<queryResult.series.length; k++) {
				if(queryResult.series[k].sortData === undefined) {
					var indexStr = sortDataValues.indexOf(queryResult.series[k].name).toString();
					if(indexStr.length === 1) {
						indexStr = '0' + indexStr;
					}
					queryResult.series[k].sortData = indexStr + queryResult.series[k].name;
				}
				else {
					var indexStr = sortDataValues.indexOf(queryResult.series[k].sortData).toString();
					if(indexStr.length === 1) {
						indexStr = '0' + indexStr;
					}
					queryResult.series[k].sortData = indexStr + queryResult.series[k].sortData;
				}		
			}
		}
		
		//Sort the Break By in Asc/Desc based on the total
		function executeSortBreakByTotalOption(w, args, sortType) {
			var originalSeries = args.widget.queryResult.series;
			var dict = {};
			var counter = 0;
			
			function getSum(total, num) {
				return total + num;
			}
			
			originalSeries.forEach (function(i) {
				var mySeries = [];
				i.data.forEach(function(datapoint){mySeries.push(datapoint["y"])});
				var total = mySeries.reduce(getSum);
				dict[counter] = total;
				counter++;
			});

			var items = Object.keys(dict).map(function(key) {
				return [key, dict[key]];
			});

			var OrderArray = items.sort(function(first, second) {
				if(sortType === "ASC") {
					return first[1] - second[1];
				}
				else {
					return second[1] - first[1];
				}
			});

			var newSeries = [];
			for (var i = 0; i < originalSeries.length; i++) {
				var SeriesIndex = parseInt(OrderArray[i][0]);
				newSeries.push(originalSeries[SeriesIndex]);
			};
			
			counter = 0;
			newSeries.forEach(function(item) {
				if (counter.toString().length == 1) {
					counter = "0" + counter;
				}
				item["sortData"] = counter.toString() +  item["sortData"]; 
				counter++;
			});
			args.widget.queryResult.series = newSeries;
		}
		
		//Sort the Break By based on the custom options selected in the popup
		function executeSortBreakByCustomOption(w, args) {
			var queryResult = args.widget.queryResult;
			var customList = args.widget.custom.barcolumnchart.customBreakbyConfiguration;
			if(customList === undefined || customList.length === 0) { return; }
			for(var i=0; i<queryResult.series.length; i++) {
				var index = customList.indexOf(queryResult.series[i].name);
				if(index === -1) {
					queryResult.series[i].sortData = 'zzz' + queryResult.series[i].sortData;
				}
				else if(index < 10) {
					queryResult.series[i].sortData = '0' + index + queryResult.series[i].sortData;
				}
				else {
					queryResult.series[i].sortData = index + queryResult.series[i].sortData;
				}
			}
		}
		
    }
]);
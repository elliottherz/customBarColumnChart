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
            if (!customMenuEnabled || !isTypeValid) { return; }
            var config = $styleService.getConfig(el.widget);
			
			if(sortCategoriesOption === "Asc by Total") { 
				executeSortCategoriesOption(w,el,'ASC'); 
			}
			else if(sortCategoriesOption === "Desc by Total") { 
				executeSortCategoriesOption(w,el,'DESC'); 
			}
			else if(sortCategoriesOption === "Reverse") {
				executeSortCategoryReverseOption(w,el);
			}
			else if(sortCategoriesOption === "Custom") {
				executeSortCategoryCustomOption(w,el);
			}
			
			if(sortBreakByOption === "Asc by Total") { 
				executeSortBreakByTotalOption(w,el,'ASC'); 
			}
			else if(sortBreakByOption === "Desc by Total") { 
				executeSortBreakByTotalOption(w,el,'DESC'); 
			}
			else if(sortBreakByOption === "Reverse") {
				executeSortBreakByReverseOption(w,el);
			}
			else if(sortBreakByOption === "Custom") {
				executeSortBreakByCustomOption(w,el);
			}
			
			if (addTotalOption === "Yes") { 
				executeAddTotalOption(w,el); 
			}
			prism.activeDashboard.$dashboard.updateWidget(el.widget);
        };
		
		
		
		
		function executeAddTotalOption(w, args) {
			if(w.subtype === "column/stackedcolumn100" || w.subtype === "bar/stacked100") { return; }
			
			var columnTotals = []; //list to store total values
			var series = $.extend(true, {},args.widget.queryResult.series); //save initial series data results
			var maxValue = -99999999999999999999999999999; //used to update the widget xAxis.max value
			
			//loop through the results and calculate the bar totals
			for(var i=0; i<args.widget.queryResult.xAxis.categories.length; i++) {
				var total = 0;
				for(var j=0; j<args.widget.queryResult.series.length; j++) {
					//if the widget already has totals, don't add more totals
					try {
						if(args.widget.queryResult.series[j].sortData.includes(defaultTotalSortValue)) { return; } 
					} catch(e) {
						//do nothing but catch the exception
					}
					
					if(args.widget.queryResult.series[j].data[i].y !== null) {
						total += args.widget.queryResult.series[j].data[i].y
					}
				}
				
				if(total > maxValue) {
					maxValue = total;
				}
				columnTotals.push(total);
			}
			
			var totalCategory = {
				'color': 'black',
				'data': [],
				'mask': series[0].mask,
				'name': 'Total',
				'sortData': defaultTotalSortValue,
				'yAxis': 0,
				'type': 'line'
			};
			
			for(var k=0; k<args.widget.queryResult.xAxis.categories.length; k++) {
				for(var a=0; a<args.widget.queryResult.series.length; a++) {
					if(args.widget.queryResult.series[a].data[k].selectionData !== undefined) {
						var temp = $.extend(true, {},args.widget.queryResult.series[a].data[k]);
						temp.y = columnTotals[k];
						temp.marker.enabled = true; //force markers to be enabled so the total points are always shown
						totalCategory.data.push(temp);
						break;
					}
				}
			}
			
			args.widget.queryResult.series.push(totalCategory);
			args.widget.queryResult.yAxis[0].max = maxValue * 1.05; //update the max value of the yAxis so the value label displays for the max total
			args.widget.queryResult.yAxis[0].endOnTick = false; //ensure that the chart doesn't waste extra white space due to highchart auto sizing.
			
			args.widget.queryResult.plotOptions.series.lineWidth = 0.00001;
			args.widget.queryResult.plotOptions.series.states.hover.lineWidth = 0.00001;
			args.widget.queryResult.plotOptions.series.marker.radius = 5;
			args.widget.queryResult.plotOptions.series.states.hover.lineWidthPlus = 0;
			args.widget.queryResult.plotOptions.series.marker.states.hover.fillColor = 'white';
			args.widget.queryResult.plotOptions.series.marker.states.hover.radius = 5;
			args.widget.queryResult.plotOptions.series.marker.fillColor = 'black';
			args.widget.queryResult.plotOptions.series.marker.lineColor = 'black';
			
			
			if(w.subtype === "column/classic" || w.subtype === "bar/classic") {
				for(var i=0; i<args.widget.queryResult.series.length; i++) {
					try {
						if(args.widget.queryResult.series[i].sortData.includes(defaultTotalSortValue)) {
							args.widget.queryResult.series[i].dataLabels = {
								enabled: true,
								style: {
									color: "black",
									fontSize: "11px",
									fontWeight: "bold",
									fontFamily: '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif',
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
				args.widget.queryResult.yAxis[0].stackLabels = {
					enabled: true,
					color: 'black',
					mask: args.widget.queryResult.series[0].mask,
					formatWithCommas: function(x) {	
						return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
					},
					formatter: function (){
						//	Use the mask if defined
						var func1=this.options.mask;
						//	Round to 0 decimal places and add commas by default
						var func2=this.options.formatWithCommas;
						//	Apply the formatting
						return defined(func1)?func1(this.total):func2(this.total);
					}
				};
			}
		}
		
		
		
		function executeSortCategoriesOption(w, args, sortType) {
			var columnTotals = []; //list to store total values
			var categories = $.extend(true, {},args.widget.queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},args.widget.queryResult.series); //save initial series data results
			
			//loop through the results and calculate the bar totals
			for(var i=0; i<args.widget.queryResult.xAxis.categories.length; i++) {
				var total = 0;
				for(var j=0; j<args.widget.queryResult.series.length; j++) {
					if(args.widget.queryResult.series[j].data[i].y !== null) {
						total += args.widget.queryResult.series[j].data[i].y
					}
				}
				columnTotals.push(total);
			}
			
			// temporary array holds objects with position and sort-value
			var mapped = columnTotals.map(function(el, i) {
				return { index: i, value: el };
			})

			// sorting the mapped array containing the reduced values
			mapped.sort(function(a, b) {
				if(sortType === 'ASC') {
					return a.value - b.value;
				} else {
					return b.value - a.value;
				}
			});

			// container for the resulting order
			var result = mapped.map(function(el){
				return columnTotals[el.index];
			});
			
			//update the series data/categories to reflect the sorted mapping
			for(var i=0; i<args.widget.queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<args.widget.queryResult.series.length; j++) {
					args.widget.queryResult.series[j].data[i] = series[j].data[mapped[i].index];
				}
				args.widget.queryResult.xAxis.categories[i] = categories[mapped[i].index];
			}
		}
		
		
		
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
		
		
		
		//There is currently a bug in V7.2 where series are not in order based on their sortData order
		//This probably won't work everytime consistently...might require a page reload
		function executeSortBreakByReverseOption(w, args) {
			var sortDataValues = []
			for(var i=0; i<args.widget.queryResult.series.length; i++) { //sort the breakby sort values...for some reason they aren't always in order
				if(args.widget.queryResult.series[i].sortData === undefined) {
					sortDataValues.push(args.widget.queryResult.series[i].name);
				}
				else {
					sortDataValues.push(args.widget.queryResult.series[i].sortData);
				}
			}
			var origSortDataValues = $.extend(true, [], sortDataValues);
			sortDataValues.sort().reverse();
			
			for(var k=0; k<args.widget.queryResult.series.length; k++) {
				if(args.widget.queryResult.series[k].sortData === undefined) {
					var indexStr = sortDataValues.indexOf(args.widget.queryResult.series[k].name).toString();
					if(indexStr.length === 1) {
						indexStr = '0' + indexStr;
					}
					args.widget.queryResult.series[k].sortData = indexStr + args.widget.queryResult.series[k].name;
				}
				else {
					var indexStr = sortDataValues.indexOf(args.widget.queryResult.series[k].sortData).toString();
					if(indexStr.length === 1) {
						indexStr = '0' + indexStr;
					}
					args.widget.queryResult.series[k].sortData = indexStr + args.widget.queryResult.series[k].sortData;
				}
				
			}
		}
		
		
		
		function executeSortBreakByCustomOption(w, args) {
			var customList = args.widget.custom.barcolumnchart.customBreakbyConfiguration;
			if(customList === undefined || customList.length === 0) { return; }
			for(var i=0; i<args.widget.queryResult.series.length; i++) {
				var index = customList.indexOf(args.widget.queryResult.series[i].name);
				if(index === -1) {
					args.widget.queryResult.series[i].sortData = 'zzz' + args.widget.queryResult.series[i].sortData;
				}
				else if(index < 10) {
					args.widget.queryResult.series[i].sortData = '0' + index + args.widget.queryResult.series[i].sortData;
				}
				else {
					args.widget.queryResult.series[i].sortData = index + args.widget.queryResult.series[i].sortData;
				}
			}
		}
		
		
		function executeSortCategoryCustomOption(w, args) {
			var categories = $.extend(true, {},args.widget.queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},args.widget.queryResult.series); //save initial series data results
			var customList = args.widget.custom.barcolumnchart.customCategoryConfiguration;
			if(customList === undefined || customList.length === 0) { return; }
				
			var sortCategoryOrder = [];
			for(var a=0; a<args.widget.queryResult.xAxis.categories.length; a++) {
				for(var b=0; b<args.widget.queryResult.series.length; b++) {
					if(args.widget.queryResult.series[b].data[a].selectionData !== undefined && args.widget.queryResult.series[b].data[a].selectionData[0] !== undefined) {
						var index = customList.indexOf(args.widget.queryResult.series[b].data[a].selectionData[0]);
						if(index === -1) {
							index = 100+a
						}
						sortCategoryOrder.push(index);
						break;
					}
				}
			}
			
			// temporary array holds objects with position and sort-value
			var mapped = sortCategoryOrder.map(function(el, i) {
				return { index: i, value: el };
			})

			// sorting the mapped array containing the reduced values
			mapped.sort(function(a, b) {
				return a.value - b.value;
			});

			// container for the resulting order
			var result = mapped.map(function(el){
				return sortCategoryOrder[el.index];
			});
			
			//update the series data/categories to reflect the sorted mapping
			for(var i=0; i<args.widget.queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<args.widget.queryResult.series.length; j++) {
					args.widget.queryResult.series[j].data[i] = series[j].data[mapped[i].index];
				}
				args.widget.queryResult.xAxis.categories[i] = categories[mapped[i].index];
			}
		}
		
		
		
		function executeSortCategoryReverseOption(w, args) {
			var categories = $.extend(true, {},args.widget.queryResult.xAxis.categories); //save initial categories
			var series = $.extend(true, {},args.widget.queryResult.series); //save initial series data results
			for(var i=0; i<args.widget.queryResult.xAxis.categories.length; i++) {
				for(var j=0; j<args.widget.queryResult.series.length; j++) {
					args.widget.queryResult.series[j].data[i] = series[j].data[args.widget.queryResult.xAxis.categories.length - i - 1];
				}
				args.widget.queryResult.xAxis.categories[i] = categories[args.widget.queryResult.xAxis.categories.length - i - 1];
			}
		}
		
		
    }
]);
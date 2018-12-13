mod.controller('customBarColumnChartController', [
	'$scope',
	function ($scope) {
		// Sets default values for Design menu or gets values from widget.custom
		var widget = $scope.widget;
		$scope.customMenuEnabled = $$get(widget, 'custom.barcolumnchart.customMenuEnabled') || false;
		$scope.addTotalOption = $$get(widget, 'custom.barcolumnchart.addTotalOption') || 'No';
		$scope.sortCategoriesOption = $$get(widget, 'custom.barcolumnchart.sortCategoriesOption') || 'Default';
		$scope.sortBreakByOption = $$get(widget, 'custom.barcolumnchart.sortBreakByOption') || 'Default';
		$scope.customBreakbyConfiguration = $$get(widget, 'custom.barcolumnchart.customBreakbyConfiguration') || [];
		$scope.customCategoryConfiguration = $$get(widget, 'custom.barcolumnchart.customCategoryConfiguration') || [];
		//total point customizations
		$scope.totalPointColor = $$get(widget, 'custom.barcolumnchart.totalPointColor') || 'black';
		$scope.totalPointFontSize = $$get(widget, 'custom.barcolumnchart.totalPointFontSize') || '11px';
		$scope.totalPointSize = $$get(widget, 'custom.barcolumnchart.totalPointSize') || '5';
		$scope.totalPointFontFamily = $$get(widget, 'custom.barcolumnchart.totalPointFontFamily') || '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif';
		$scope.totalAsLine = $$get(widget, 'custom.barcolumnchart.totalAsLine') || false;
		
		var customModal = $('#custom-modal-overlay');
		var customModalHeaderTitle = $("#custom-modal-header-title");
		var customCategoryBtn = $("#customCategoryButton");
		var customBreakbyBtn = $("#customBreakbyButton");
		var customModalBodyList = $('#custom-modal-body-list');
		var customResetButton = $('#resetButton');
		var customSaveButton = $("#saveButton");
		var customCancelButton = $("#cancelButton");
		var dragSrcEl = null;
		var lastModalOpened = null;
		const defaultTotalSortValue = 'zzzzzzTotal';

		
		customResetButton.click(function() {
			if(lastModalOpened === 'Category') {
				var categoryNames = getCategoryNames().sort();
				customModalBodyList.empty(); //clear out configuration page, and redisplay current configuration
				for(var k=0; k<categoryNames.length; k++) {
					var item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text(categoryNames[k]);
					customModalBodyList.append(item);
				}
				var cols = document.querySelectorAll('.custom-modal-body-list-item');
				[].forEach.call(cols, addDnDHandlers);
			}
			else if(lastModalOpened === 'BreakBy') {
				var resetResult = getBreakbyNames().sort();
				customModalBodyList.empty(); //clear out configuration page, and redisplay current configuration
				for(var k=0; k<resetResult.length; k++) {
					var item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text(resetResult[k]);
					customModalBodyList.append(item);
				}
				var cols = document.querySelectorAll('.custom-modal-body-list-item');
				[].forEach.call(cols, addDnDHandlers);
			}
		});
		
		customCategoryBtn.click(function() {
			lastModalOpened = 'Category';
			$(customModal).css('display', 'block');
			$('.trillapser-container').css('display', 'none');
			$(customModalHeaderTitle).text("Custom Category Sort - Configuration Page");
			var categoryNames = getCategoryNames();
			
			//if first time clicking the button, then no configuration has been specified. Default to the current order of the breakby.
			if($scope.customCategoryConfiguration === undefined || $scope.customCategoryConfiguration.length === 0) {
				$scope.customCategoryConfiguration = categoryNames;
				$$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
			}
			else { //check to see if there are any new values in the breakby, if there are, add them to the end of the configuration
				for(var j=0; j<categoryNames.length; j++) {
					if(!$scope.customCategoryConfiguration.includes(categoryNames[j])) {
						$scope.customCategoryConfiguration.push(categoryNames[j]);
					}
				}
				$$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);			
			}
			
			customModalBodyList.empty(); //clear out configuration page, and redisplay current configuration
			for(var k=0; k<$scope.customCategoryConfiguration.length; k++) {
				var item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text($scope.customCategoryConfiguration[k]);
				customModalBodyList.append(item);
			}
			var cols = document.querySelectorAll('.custom-modal-body-list-item');
			[].forEach.call(cols, addDnDHandlers);
		});
		
		
		customBreakbyBtn.click(function() {
			lastModalOpened = 'BreakBy';
			$(customModal).css('display', 'block');
			$('.trillapser-container').css('display', 'none');
			$(customModalHeaderTitle).text("Custom Break By Sort - Configuration Page");
			var seriesNames = getBreakbyNames();
			
			//if first time clicking the button, then no configuration has been specified. Default to the current order of the breakby.
			if($scope.customBreakbyConfiguration === undefined || $scope.customBreakbyConfiguration.length === 0) {
				$scope.customBreakbyConfiguration = seriesNames;
				$$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
			}
			else { //check to see if there are any new values in the breakby, if there are, add them to the end of the configuration
				for(var j=0; j<seriesNames.length; j++) {
					if(!$scope.customBreakbyConfiguration.includes(seriesNames[j])) {
						$scope.customBreakbyConfiguration.push(seriesNames[j]);
					}
				}
				$$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);			
			}
			
			customModalBodyList.empty(); //clear out configuration page, and redisplay current configuration
			for(var k=0; k<$scope.customBreakbyConfiguration.length; k++) {
				var item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text($scope.customBreakbyConfiguration[k]);
				customModalBodyList.append(item);
			}
			var cols = document.querySelectorAll('.custom-modal-body-list-item');
			[].forEach.call(cols, addDnDHandlers);
		});
		
		customCancelButton.click(function() {
			$(customModal).css('display', 'none');
			$('.trillapser-container').css('display', 'block');
			widget.redraw();
		});
		
		customSaveButton.click(function() {
			if(lastModalOpened === 'Category') {
				saveCustomCateogry();
			}
			else if(lastModalOpened === 'BreakBy') {
				saveCustomBreakBy();
			}
		});
		
		window.onclick = function(event) { // When the user clicks anywhere outside of the modal, close it
			if (event.target == customModal[0]) {
				if(lastModalOpened === 'Category') {
					saveCustomCateogry();
				}
				else if(lastModalOpened === 'BreakBy') {
					saveCustomBreakBy();
				}
			}
		}
		
		$scope.$watch('widget', function (val) {
            $scope.type = $$get($scope, 'widget.type');
			$$set(widget, 'custom.barcolumnchart.type', $scope.type);
			$scope.isTypeValid = $scope.type === "chart/bar" || $scope.type === "chart/column";
			$$set(widget, 'custom.barcolumnchart.isTypeValid', $scope.isTypeValid);
			//widget.refresh();
			//can't reload the widget to render the customizations during a switch of a chart.
        });

        $scope.enabledChanged = function (customMenuEnabled) { //triggers on customMenuEnabled changed
            $scope.customMenuEnabled = !$scope.customMenuEnabled;
            $$set(widget, 'custom.barcolumnchart.customMenuEnabled', $scope.customMenuEnabled);
			widget.redraw();
        };

        $scope.changeAddTotal = function (addTotal) {
            $$set(widget, 'custom.barcolumnchart.addTotalOption', addTotal);
            $scope.addTotalOption = addTotal;
			widget.redraw();
        };
		
		$scope.changeSortCategories = function (sortCategories) {
            $$set(widget, 'custom.barcolumnchart.sortCategoriesOption', sortCategories);
            $scope.sortCategoriesOption = sortCategories;
			widget.redraw();
        };
		
		$scope.changeSortBreakBy = function (sortBreakBy) {
            $$set(widget, 'custom.barcolumnchart.sortBreakByOption', sortBreakBy);
            $scope.sortBreakByOption = sortBreakBy;
			widget.redraw();
        };
		

		function handleDragStart(e) {
			this.style.opacity = '0.4';
			dragSrcEl = this;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', this.innerHTML);
		}
		function handleDragOver(e) {
			if (e.preventDefault) {
				e.preventDefault(); // Necessary. Allows us to drop.
			}
			e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
			return false;
		}
		function handleDragEnter(e) {
			this.classList.add('active'); // this / e.target is the current hover target.
		}
		function handleDragLeave(e) {
			this.classList.remove('active');  // this / e.target is previous target element.
		}
		function handleDrop(e) {
			if (e.stopPropagation) {
				e.stopPropagation(); // Stops some browsers from redirecting.
			}
			if (dragSrcEl != this) { // Don't do anything if dropping the same column we're dragging.
				var placeItemBefore = findLargerModalItemIndex(dragSrcEl, this); //need to figure out if element is above or below other element.
				this.parentNode.removeChild(dragSrcEl);
				var item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text(dragSrcEl.textContent);
				addDnDHandlers(item[0]);
				if(placeItemBefore) { $(this).before(item[0]); } //bug in jquery 1.9
				else { $(this).after(item[0]); }
		  }
		  return false;
		}
		function handleDragEnd(e) {
			var cols = document.querySelectorAll('.custom-modal-body-list-item');
			[].forEach.call(cols, function (col) {
				col.classList.remove('active');
				col.style.opacity = '1';
			});
		}
		function addDnDHandlers(e) {
		  e.addEventListener('dragstart', handleDragStart, false);
		  e.addEventListener('dragenter', handleDragEnter, false)
		  e.addEventListener('dragover', handleDragOver, false);
		  e.addEventListener('dragleave', handleDragLeave, false);
		  e.addEventListener('drop', handleDrop, false);
		  e.addEventListener('dragend', handleDragEnd, false);
		}
		function findLargerModalItemIndex(elem1, elem2) {
			var index1 = -1;
			var index2 = 0;
			for(var i=0; i<elem1.parentNode.childNodes.length; i++) {
				if(elem1.textContent === elem1.parentNode.childNodes[i].textContent) {
					index1 = i;
				}
				if(elem2.textContent === elem1.parentNode.childNodes[i].textContent) {
					index2 = i;
				}
			}
			return index1 > index2;
		}
		
		
		function saveCustomBreakBy() {
			$(customModal).css('display', 'none');
			$('.trillapser-container').css('display', 'block');
			
			var items = $('.custom-modal-body-list-item');
			var breakByValues = []
			for(var i=0; i<items.length; i++) {
				breakByValues.push(items[i].textContent);
			}
			$scope.customBreakbyConfiguration = breakByValues;
			$$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
			widget.redraw();
		}

		
		function saveCustomCateogry() {
			$(customModal).css('display', 'none');
			$('.trillapser-container').css('display', 'block');
			
			var items = $('.custom-modal-body-list-item');
			var categoryValues = []
			for(var i=0; i<items.length; i++) {
				categoryValues.push(items[i].textContent);
			}
			$scope.customCategoryConfiguration = categoryValues;
			$$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
			widget.redraw();
		}
		
		
		function getCategoryNames() {
			var categoryNames = [];
			for(var a=0; a<widget.queryResult.xAxis.categories.length; a++) {
				for(var b=0; b<widget.queryResult.series.length; b++) {
					if(widget.queryResult.series[b].data[a].selectionData !== undefined && widget.queryResult.series[b].data[a].selectionData[0] !== undefined) {
						if(prism.$ngscope.widget.queryResult.series[b].data[a].selectionData[0] instanceof Date) {
							categoryNames.push(widget.queryResult.series[b].data[a].selectionData[0].toISOString());
						}
						else {
							categoryNames.push(widget.queryResult.series[b].data[a].selectionData[0].toString());
						}
						break;
					}
				}
			}
			return categoryNames;
		}
		
		
		function getBreakbyNames() {
			var seriesNames = []; //gets current order of the BreakBy
			for(var i=0; i<widget.queryResult.series.length; i++) {
				if(!widget.queryResult.series[i].sortData.includes(defaultTotalSortValue)) {
					seriesNames.push(widget.queryResult.series[i].name);
				}				
			}
			return seriesNames
		}
		
    }
]);
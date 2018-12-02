mod.controller('customBarColumnChartController', [
    '$scope',
    function ($scope) {
		$scope.$watch('widget', function (val) {
            $scope.type = $$get($scope, 'widget.type');
			$$set(widget, 'custom.barcolumnchart.type', $scope.type);
			$scope.isTypeValid = $scope.type === "chart/bar" || $scope.type === "chart/column";
			$$set(widget, 'custom.barcolumnchart.isTypeValid', $scope.isTypeValid);
			//widget.refresh();
			//can't reload the widget to render the customizations during a switch of a chart.
        });
		
        // Sets default values for Design menu or gets values from widget.style
		var widget = $scope.widget;
        $scope.customMenuEnabled = $$get(widget, 'custom.barcolumnchart.customMenuEnabled') || false;
		$scope.addTotalOption = $$get(widget, 'custom.barcolumnchart.addTotalOption') || 'No';
		$scope.sortCategoriesOption = $$get(widget, 'custom.barcolumnchart.sortCategoriesOption') || 'None';
		$scope.sortBreakByOption = $$get(widget, 'custom.barcolumnchart.sortBreakByOption') || 'None';

        // triggers on customMenuEnabled changed
        $scope.enabledChanged = function (customMenuEnabled) {
            $scope.customMenuEnabled = !$scope.customMenuEnabled;
            $$set(widget, 'custom.barcolumnchart.customMenuEnabled', $scope.customMenuEnabled);
			prism.activeDashboard.$dashboard.updateWidget(widget);
			widget.redraw();
        };

        $scope.changeAddTotal = function (addTotal) {
            $$set(widget, 'custom.barcolumnchart.addTotalOption', addTotal);
            $scope.addTotalOption = addTotal;
			prism.activeDashboard.$dashboard.updateWidget(widget);
			widget.redraw();
        };
		
		$scope.changeSortCategories = function (sortCategories) {
            $$set(widget, 'custom.barcolumnchart.sortCategoriesOption', sortCategories);
            $scope.sortCategoriesOption = sortCategories;
			prism.activeDashboard.$dashboard.updateWidget(widget);
			widget.redraw();
        };
		
		$scope.changeSortBreakBy = function (sortBreakBy) {
            $$set(widget, 'custom.barcolumnchart.sortBreakByOption', sortBreakBy);
            $scope.sortBreakByOption = sortBreakBy;
			prism.activeDashboard.$dashboard.updateWidget(widget);
			widget.redraw();
        };
    }
]);
mod.service('customBarColumnChartService', [
    "$compile",
    function ($compile) {
        //get predefined values
        this.getConfig = function (widget) {
            var config = {};
            config.addTotalOption = $$get(widget, 'custom.barcolumnchart.addTotalOption') || 'No';
			config.sortCategoriesOption = $$get(widget, 'custom.barcolumnchart.sortCategoriesOption') || 'None';
			config.sortBreakByOption = $$get(widget, 'custom.barcolumnchart.sortBreakByOption') || 'None';
            return config;
        };

        // builds menu for menu in design panel
        this.createMenu = function () {
			var $scope = prism.$ngscope.$new();
			$scope.widget.displayMenu = $scope.widget.type === "chart/bar" || $scope.widget.type === "chart/column";
			var customBarColumnChartMenu = '<div class="customBarColumnChartMenu" data-ng-show="widget.displayMenu"></div>';
			
            //creates menu only on widget edit mode
            if (prism.$ngscope.appstate === 'widget') {
                if (!$('.customBarColumnChartMenu').length)
                    $(".settings-pane-host").closest(".content").append($compile($(customBarColumnChartMenu))($scope));
            }
        };
    }
]);
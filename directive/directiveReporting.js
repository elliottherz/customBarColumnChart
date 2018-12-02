//create menu in a widget edit mode
mod.directive('settingsPaneHost', [
    'plugin-customBarColumnChart.services.customBarColumnChartService',
    function ($styleService) {
        return {
            restrict: 'C',
            link: function ($scope, lmnt, attrs) {
                if (prism.$ngscope.appstate === 'widget') {
					$styleService.createMenu();
                }
            }
        }
    }
]);
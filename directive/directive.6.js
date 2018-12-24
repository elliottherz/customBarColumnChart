mod.directive('customBarColumnChartMenu', [
    () => ({
        restrict: 'C',
        templateUrl: '/plugins/customBarColumnChart/customBarColumnChartMenu.html',
        link: () => {
        },
    }),
]);

// Create menu in a widget edit mode
mod.directive('settingsPaneHost', [
    'plugin-customBarColumnChart.services.customBarColumnChartService',
    ($styleService) => ({
        restrict: 'C',
        link: () => {
            if (prism.$ngscope.appstate === 'widget') {
                $styleService.createMenu();
            }
        },
    }),
]);

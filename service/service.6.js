/* eslint-disable func-names */
mod.service('customBarColumnChartService', [
    '$compile',
    function ($compile) { // Can't use ES6 syntax due to invalid reference to this
        // Builds menu for menu in design panel
        this.createMenu = () => {
            const $scope = prism.$ngscope.$new();
            $scope.widget.displayMenu = $scope.widget.type === 'chart/bar' || $scope.widget.type === 'chart/column';
            const customBarColumnChartMenu = ''
                + '<div class="customBarColumnChartMenu" data-ng-show="widget.displayMenu"></div>';

            // Creates menu only on widget edit mode
            if (prism.$ngscope.appstate === 'widget') {
                if (!$('.customBarColumnChartMenu').length) {
                    $('.settings-pane-host').closest('.content').append($compile($(customBarColumnChartMenu))($scope));
                }
            }
        };
    },
]);

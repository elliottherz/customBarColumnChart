mod.controller('customBarColumnChartController', [
    '$scope',
    ($scope) => {
        // Sets default values for Design menu or gets values from widget.custom
        const { widget } = $scope;
        $scope.customMenuEnabled = $$get(widget, 'custom.barcolumnchart.customMenuEnabled') || false;
        $scope.addTotalOption = $$get(widget, 'custom.barcolumnchart.addTotalOption') || 'No';
        $scope.sortCategoriesOption = $$get(widget, 'custom.barcolumnchart.sortCategoriesOption') || 'Default';
        $scope.sortBreakByOption = $$get(widget, 'custom.barcolumnchart.sortBreakByOption') || 'Default';
        $scope.customBreakbyConfiguration = $$get(widget, 'custom.barcolumnchart.customBreakbyConfiguration') || [];
        $scope.customCategoryConfiguration = $$get(widget, 'custom.barcolumnchart.customCategoryConfiguration') || [];

        // Total point customizations
        $scope.totalPointColor = $$get(widget, 'custom.barcolumnchart.totalPointColor') || 'black';
        $scope.totalPointFontSize = $$get(widget, 'custom.barcolumnchart.totalPointFontSize') || '11px';
        $scope.totalPointSize = $$get(widget, 'custom.barcolumnchart.totalPointSize') || '5';
        $scope.totalPointFontFamily = $$get(widget, 'custom.barcolumnchart.totalPointFontFamily')
            || '"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif';
        $scope.totalAsLine = $$get(widget, 'custom.barcolumnchart.totalAsLine') || false;
        $scope.totalYAxisPercentSpacing = $$get(widget, 'custom.barcolumnchart.totalYAxisPercentSpacing') || 6;

        let defaultLabelPadding;
        if (widget.subtype === 'bar/classic' || widget.subtype === 'column/stackedcolumn') {
            defaultLabelPadding = 6;
        } else if (widget.subtype === 'column/classic') {
            defaultLabelPadding = 3;
        } else {
            defaultLabelPadding = undefined;
        }
        $scope.totalLabelPadding = $$get(widget, 'custom.barcolumnchart.totalLabelPadding') || defaultLabelPadding;

        const customModal = $('#custom-modal-overlay');
        const customModalHeaderTitle = $('#custom-modal-header-title');
        const customCategoryBtn = $('#customCategoryButton');
        const customBreakbyBtn = $('#customBreakbyButton');
        const customModalBodyList = $('#custom-modal-body-list');
        const customResetButton = $('#resetButton');
        const customSaveButton = $('#saveButton');
        const customCancelButton = $('#cancelButton');
        let dragSrcEl = null;
        let lastModalOpened = null;
        const defaultTotalSortValue = 'zzzzzzTotal';


        const getPopupItemList = () => {
            const itemList = [];
            $('.custom-modal-body-list-item').each((index, item) => itemList.push(item.textContent));
            return itemList;
        };


        // -------------------------------------------------------------------------------------------------------------
        // Functions used for drag and dropping elements within the modal popup
        // Can't use ES6 syntax due to differently scoped reference to this
        function findLargerModalItemIndex(elem1, elem2) {
            let index1 = -1;
            let index2 = 0;
            for (let i = 0; i < elem1.parentNode.childNodes.length; i++) {
                if (elem1.textContent === elem1.parentNode.childNodes[i].textContent) {
                    index1 = i;
                }
                if (elem2.textContent === elem1.parentNode.childNodes[i].textContent) {
                    index2 = i;
                }
            }
            return index1 > index2;
        }

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
            e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
            return false;
        }

        function handleDragEnter() {
            this.classList.add('active'); // This / e.target is the current hover target.
        }

        function handleDragLeave() {
            this.classList.remove('active'); // This / e.target is previous target element.
        }

        function handleDragEnd() {
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, (col) => {
                col.classList.remove('active');
                col.style.opacity = '1';
            });
        }

        function addDnDHandlers(e) {
            e.addEventListener('dragstart', handleDragStart, false);
            e.addEventListener('dragenter', handleDragEnter, false);
            e.addEventListener('dragover', handleDragOver, false);
            e.addEventListener('dragleave', handleDragLeave, false);
            // eslint-disable-next-line no-use-before-define
            e.addEventListener('drop', handleDrop, false);
            e.addEventListener('dragend', handleDragEnd, false);
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation(); // Stops some browsers from redirecting.
            }
            if (dragSrcEl !== this) { // Don't do anything if dropping the same column we're dragging.
                // Need to figure out if element is above or below other element.
                const placeItemBefore = findLargerModalItemIndex(dragSrcEl, this);
                this.parentNode.removeChild(dragSrcEl);
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text(dragSrcEl.textContent);
                addDnDHandlers(item[0]);
                if (placeItemBefore) {
                    $(this).before(item[0]);
                } else {
                    $(this).after(item[0]);
                }
                const listItems = getPopupItemList();
                if (lastModalOpened === 'Category') {
                    $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', listItems);
                } else {
                    $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', listItems);
                }
                $scope.widget.redraw();
            }
            return false;
        }


        // -------------------------------Saves the Custom Breakby Settings---------------------------------------------
        const saveCustomBreakBy = () => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            const breakByValues = getPopupItemList();
            $scope.customBreakbyConfiguration = breakByValues;
            $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
            $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', undefined);
            $scope.widget.redraw();
        };


        // ---------------------------------Saves the Custom Category Settings------------------------------------------
        const saveCustomCateogry = () => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            const categoryValues = getPopupItemList();
            $scope.customCategoryConfiguration = categoryValues;
            $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
            $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', undefined);
            $scope.widget.redraw();
        };


        // ----------------------------------Returns the Categories of the widget---------------------------------------
        const getCategoryNames = () => {
            const categoryNames = [];
            for (let a = 0; a < widget.queryResult.xAxis.categories.length; a++) {
                for (let b = 0; b < widget.queryResult.series.length; b++) {
                    if (widget.queryResult.series[b].data[a].selectionData !== undefined
                        && widget.queryResult.series[b].data[a].selectionData[0] !== undefined) {
                        if (widget.queryResult.series[b].data[a].selectionData[0] instanceof Date) {
                            categoryNames.push(widget.queryResult.series[b].data[a].selectionData[0].toISOString());
                        } else {
                            categoryNames.push(widget.queryResult.series[b].data[a].selectionData[0].toString());
                        }
                        break;
                    }
                }
            }
            return categoryNames;
        };


        // -----------------------------------Returns the BreakBy of the widget-----------------------------------------
        const getBreakbyNames = () => {
            const seriesNames = []; // Gets current order of the BreakBy
            for (let i = 0; i < widget.queryResult.series.length; i++) {
                if (widget.queryResult.series[i].sortData instanceof Date) {
                    seriesNames.push(widget.queryResult.series[i].sortData.toISOString());
                } else if (widget.queryResult.series[i].sortData !== undefined
                    && !widget.queryResult.series[i].sortData.includes(defaultTotalSortValue)) {
                    // If series is a Date Field, then store values in ISO
                    const match1 = widget.queryResult.series[i].sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'); // 2018-12-19T00:00:00
                    const match2 = widget.queryResult.series[i].sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}'); // Dec 19 2018 00:00:00

                    if (match1 !== null) { // Date is already in ISO format
                        seriesNames.push(widget.queryResult.series[i].sortData.substring(match1.index));
                    } else if (match2 !== null) { // Date needs to be converted to ISO Format
                        const matchRes = widget.queryResult.series[i].sortData
                            .substring(match2.index).substring(0, 20);
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
                        seriesNames.push(`${matchRes.substring(7, 11)}-${strMonthNum}-${matchRes.substring(4, 6)}`
                            + `T${matchRes.substring(12)}`);
                    } else { // Non-Date Field
                        seriesNames.push(widget.queryResult.series[i].name);
                    }
                }
            }
            return seriesNames;
        };


        // --------------------------------------Custom Category Button Clicked-----------------------------------------
        customCategoryBtn.click(() => {
            lastModalOpened = 'Category';
            $(customModal).css('display', 'block');
            $('.trillapser-container').css('display', 'none');
            $(customModalHeaderTitle).text('Custom Category');
            const categoryNames = getCategoryNames();

            // If first time clicking the button, then no configuration has been specified.
            // Default to the current order of the breakby.
            if ($scope.customCategoryConfiguration === undefined || $scope.customCategoryConfiguration.length === 0) {
                $scope.customCategoryConfiguration = categoryNames;
                $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
            } else { // If there are new values in the category, then add them to the end of the configuration
                for (let j = 0; j < categoryNames.length; j++) {
                    if (!$scope.customCategoryConfiguration.includes(categoryNames[j])) {
                        $scope.customCategoryConfiguration.push(categoryNames[j]);
                    }
                }
                $$set(widget, 'custom.barcolumnchart.customCategoryConfiguration', $scope.customCategoryConfiguration);
            }

            customModalBodyList.empty(); // Clear out configuration page, and redisplay current configuration
            for (let k = 0; k < $scope.customCategoryConfiguration.length; k++) {
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text($scope.customCategoryConfiguration[k]);
                customModalBodyList.append(item);
            }
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, addDnDHandlers);
            $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', getPopupItemList());
            $scope.widget.redraw();
        });


        // -----------------------------------Custom BreakBy Button Clicked---------------------------------------------
        customBreakbyBtn.click(() => {
            lastModalOpened = 'BreakBy';
            $(customModal).css('display', 'block');
            $('.trillapser-container').css('display', 'none');
            $(customModalHeaderTitle).text('Custom Break By');
            const breakbyNames = getBreakbyNames();

            // If first time clicking the button, then no configuration has been specified.
            // Default to the current order of the breakby.
            if ($scope.customBreakbyConfiguration === undefined || $scope.customBreakbyConfiguration.length === 0) {
                $scope.customBreakbyConfiguration = breakbyNames;
                $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
            } else { // If there are new values in the breakby, then add them to the end of the configuration
                for (let j = 0; j < breakbyNames.length; j++) {
                    if (!$scope.customBreakbyConfiguration.includes(breakbyNames[j])) {
                        $scope.customBreakbyConfiguration.push(breakbyNames[j]);
                    }
                }
                $$set(widget, 'custom.barcolumnchart.customBreakbyConfiguration', $scope.customBreakbyConfiguration);
            }

            customModalBodyList.empty(); // Clear out configuration page, and redisplay current configuration
            for (let k = 0; k < $scope.customBreakbyConfiguration.length; k++) {
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text($scope.customBreakbyConfiguration[k]);
                customModalBodyList.append(item);
            }
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, addDnDHandlers);
            $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', getPopupItemList());
            $scope.widget.redraw();
        });


        // ------------------------------Modal Popup is closed by clicking off the side---------------------------------
        window.onclick = (event) => { // When the user clicks anywhere outside of the modal, close it
            if (event.target === customModal[0]) {
                if (lastModalOpened === 'Category') {
                    saveCustomCateogry();
                } else if (lastModalOpened === 'BreakBy') {
                    saveCustomBreakBy();
                }
            }
        };


        // -------------------------------------Save Config Button Clicked----------------------------------------------
        customSaveButton.click(() => {
            if (lastModalOpened === 'Category') {
                saveCustomCateogry();
            } else if (lastModalOpened === 'BreakBy') {
                saveCustomBreakBy();
            }
        });


        // ---------------------------------------Cancel Button Clicked-------------------------------------------------
        customCancelButton.click(() => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', undefined);
            $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', undefined);
            $scope.widget.redraw();
        });


        // -----------------------------------------Reset Button Clicked------------------------------------------------
        customResetButton.click(() => {
            if (lastModalOpened === 'Category') {
                const categoryNames = getCategoryNames().sort();
                customModalBodyList.empty(); // Clear out configuration page, and redisplay current configuration
                for (let k = 0; k < categoryNames.length; k++) {
                    const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                        .text(categoryNames[k]);
                    customModalBodyList.append(item);
                }
                const cols = document.querySelectorAll('.custom-modal-body-list-item');
                [].forEach.call(cols, addDnDHandlers);
                $$set(widget, 'custom.barcolumnchart.tempCategoryConfiguration', getPopupItemList());
                $scope.widget.redraw();
            } else if (lastModalOpened === 'BreakBy') {
                const breakbyNames = getBreakbyNames().sort();
                customModalBodyList.empty(); // Clear out configuration page, and redisplay current configuration
                for (let k = 0; k < breakbyNames.length; k++) {
                    const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                        .text(breakbyNames[k]);
                    customModalBodyList.append(item);
                }
                const cols = document.querySelectorAll('.custom-modal-body-list-item');
                [].forEach.call(cols, addDnDHandlers);
                $$set(widget, 'custom.barcolumnchart.tempBreakbyConfiguration', getPopupItemList());
                $scope.widget.redraw();
            }
        });


        // -----------------------------------Watch when the widget type changes----------------------------------------
        $scope.$watch('widget', () => {
            $scope.type = $$get($scope, 'widget.type');
            $$set(widget, 'custom.barcolumnchart.type', $scope.type);
            $scope.isTypeValid = $scope.type === 'chart/bar' || $scope.type === 'chart/column';
            $$set(widget, 'custom.barcolumnchart.isTypeValid', $scope.isTypeValid);
        });


        // ---------------------------------Triggers on customMenuEnabled changed---------------------------------------
        $scope.enabledChanged = () => {
            $scope.customMenuEnabled = !$scope.customMenuEnabled;
            $$set(widget, 'custom.barcolumnchart.customMenuEnabled', $scope.customMenuEnabled);
            $scope.widget.redraw();
        };


        // -----------------------------Triggers on showTotals radio selection changed----------------------------------
        $scope.changeAddTotal = (addTotal) => {
            $$set(widget, 'custom.barcolumnchart.addTotalOption', addTotal);
            $scope.addTotalOption = addTotal;
            $scope.widget.redraw();
        };


        // ----------------------------Triggers on sortCategories radio selection changed-------------------------------
        $scope.changeSortCategories = (sortCategories) => {
            $$set(widget, 'custom.barcolumnchart.sortCategoriesOption', sortCategories);
            $scope.sortCategoriesOption = sortCategories;
            $scope.widget.redraw();
        };


        // -------------------------------Triggers on sortBreakBy radio selection changed-------------------------------
        $scope.changeSortBreakBy = (sortBreakBy) => {
            $$set(widget, 'custom.barcolumnchart.sortBreakByOption', sortBreakBy);
            $scope.sortBreakByOption = sortBreakBy;
            $scope.widget.redraw();
        };
    },
]);

mod.controller('customBarColumnChartController', [
    '$scope',
    ($scope) => {
        // Sets object references to $scope.widget.custom.barcolumnchart + $scope
        const $$setObj = (widgetReference, saveObj) => {
            $$set($scope, widgetReference, saveObj); // Set to custom barcolumnchart obj
            $$set($scope, widgetReference.split('.').pop(), saveObj); // Set to $scope
        };

        // Gets object references from $scope.widget.custom.barcolumnchart, also sets this obj to $scope
        const $$getObj = (widgetReference) => {
            const obj = $$get($scope, widgetReference); // Retrieve object from custom barcolumnchart
            $$set($scope, widgetReference.split('.').pop(), obj); // Set to $scope
            return obj;
        };

        // Gets the object from the scope and sets it to the custom object
        const $$setFromScopeToCustom = (widgetReference) => {
            $$set($scope, widgetReference, $$get($scope, widgetReference.split('.').pop()));
        };

        // Custom Bar/Column Chart Widget References (wr)
        const wrCustomObj = 'widget.custom.barcolumnchart';
        const wrType = `${wrCustomObj}.type`;
        const wrIsTypeValid = `${wrCustomObj}.isTypeValid`;
        const wrCustomMenuEnabled = `${wrCustomObj}.customMenuEnabled`;
        const wrUpdateOnEveryChange = `${wrCustomObj}.updateOnEveryChange`;
        const wrAddTotalOption = `${wrCustomObj}.addTotalOption`;
        const wrSortCategoriesOption = `${wrCustomObj}.sortCategoriesOption`;
        const wrSortBreakByOption = `${wrCustomObj}.sortBreakByOption`;
        const wrCustomCategoryConfiguration = `${wrCustomObj}.customCategoryConfiguration`;
        const wrCustomBreakbyConfiguration = `${wrCustomObj}.customBreakbyConfiguration`;
        const wrTotalSeriesName = `${wrCustomObj}.totalSeriesName`;
        const wrTempCustomList = `${wrCustomObj}.tempCustomList`;
        const wrCurrModalOpened = `${wrCustomObj}.currModalOpened`;

        // Custom Modal Popup DOM Object
        const customModal = $('#custom-modal-overlay');

        // Temporary Objects
        const defaultTotalSortValue = 'zzzzzzTotal';
        let dragSrcEl = null;
        let origDragSrcElIndex = -1;
        let origListItems;
        let listItems;

        // Set default values if they don't exist
        if ($$getObj(wrCustomMenuEnabled) === undefined) { $$setObj(wrCustomMenuEnabled, false); }
        if ($$getObj(wrUpdateOnEveryChange) === undefined) { $$setObj(wrUpdateOnEveryChange, true); }
        if ($$getObj(wrAddTotalOption) === undefined) { $$setObj(wrAddTotalOption, 'No'); }
        if ($$getObj(wrSortCategoriesOption) === undefined) { $$setObj(wrSortCategoriesOption, 'Default'); }
        if ($$getObj(wrSortBreakByOption) === undefined) { $$setObj(wrSortBreakByOption, 'Default'); }
        if ($$getObj(wrCurrModalOpened) === undefined) { $$setObj(wrCurrModalOpened, 'None'); }
        if ($$getObj(wrTotalSeriesName) === undefined) { $$setObj(wrTotalSeriesName, 'Total'); }
        $$getObj(wrCustomCategoryConfiguration); // Get the obj to set to scope
        $$getObj(wrCustomBreakbyConfiguration); // Get the obj to set to scope

        // -------------------------------------------------------------------------------------------------------------
        // Functions used for drag and dropping elements within the modal popup
        const findLargerModalItemIndex = (elem1, elem2) => {
            let index1 = -1;
            let index2 = 0;
            elem1.parentNode.childNodes.forEach((elem, index) => {
                if (elem1.textContent === elem.textContent) {
                    index1 = index;
                }
                if (elem2.textContent === elem.textContent) {
                    index2 = index;
                }
            });
            return index1 > index2;
        };

        const handleDragStart = (elem) => {
            elem.target.style.opacity = '0.4';
            dragSrcEl = elem.target;
            origDragSrcElIndex = listItems.indexOf(dragSrcEl.textContent);
            origListItems = $.extend(true, [], listItems);
            elem.dataTransfer.effectAllowed = 'move';
            elem.dataTransfer.setData('text/html', elem.target.innerHTML);
        };

        const handleDragOver = (elem) => {
            if (elem.preventDefault) {
                elem.preventDefault(); // Necessary. Allows us to drop.
            }
            elem.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
            return false;
        };

        const handleDragEnter = (elem) => {
            const index1 = listItems.indexOf(dragSrcEl.textContent);
            const index2 = listItems.indexOf(elem.target.textContent);
            if (index1 > index2 && origDragSrcElIndex > index2) {
                listItems.splice(index1, 1);
                listItems.splice(index2, 0, dragSrcEl.textContent);
                elem.target.classList.add('activeAbove');
            } else if (index1 < index2 && origDragSrcElIndex >= index2) {
                listItems.splice(index1, 1);
                listItems.splice(index2 - 1, 0, dragSrcEl.textContent);
                elem.target.classList.add('activeAbove');
            } else if (index1 > index2 && origDragSrcElIndex <= index2) {
                listItems.splice(index1, 1);
                listItems.splice(index2 + 1, 0, dragSrcEl.textContent);
                elem.target.classList.add('activeBelow');
            } else if (index1 < index2 && origDragSrcElIndex <= index2) {
                listItems.splice(index1, 1);
                listItems.splice(index2, 0, dragSrcEl.textContent);
                elem.target.classList.add('activeBelow');
            } else {
                listItems = $.extend(true, [], origListItems);
            }
            $$setObj(wrTempCustomList, $.extend(true, [], listItems));

            if ($$getObj(wrUpdateOnEveryChange)) { // Toggle to update on every change
                $scope.widget.redraw();
            }
        };

        const handleDragLeave = (elem) => {
            elem.target.classList.remove('activeAbove');
            elem.target.classList.remove('activeBelow');
        };

        const handleDragEnd = () => {
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, (col) => {
                col.classList.remove('activeAbove');
                col.classList.remove('activeBelow');
                col.style.opacity = '1';
            });
        };

        const addDnDHandlers = (elem) => {
            elem.addEventListener('dragstart', handleDragStart, false);
            elem.addEventListener('dragenter', handleDragEnter, false);
            elem.addEventListener('dragover', handleDragOver, false);
            elem.addEventListener('dragleave', handleDragLeave, false);
            // eslint-disable-next-line no-use-before-define
            elem.addEventListener('drop', handleDrop, false);
            elem.addEventListener('dragend', handleDragEnd, false);
        };

        const handleDrop = (elem) => {
            if (elem.stopPropagation) {
                elem.stopPropagation(); // Stops some browsers from redirecting.
            }
            if (dragSrcEl !== elem.target) { // Don't do anything if dropping the same column we're dragging.
                // Need to figure out if element is above or below other element.
                const placeItemBefore = findLargerModalItemIndex(dragSrcEl, elem.target);
                elem.target.parentNode.removeChild(dragSrcEl);
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>")
                    .text(dragSrcEl.textContent);
                addDnDHandlers(item[0]);
                if (placeItemBefore) {
                    $(elem.target).before(item[0]);
                } else {
                    $(elem.target).after(item[0]);
                }
                listItems = [];
                $('.custom-modal-body-list-item').each((index, elemItem) => listItems.push(elemItem.textContent));
            } else {
                listItems = $.extend(true, [], origListItems);
            }
            $$setObj(wrTempCustomList, $.extend(true, [], listItems));
            $scope.widget.redraw();
            return false;
        };

        // ----------------------------------Returns the Categories of the widget---------------------------------------
        const getCategoryNames = () => {
            const categoryNames = [];
            const { categories } = $scope.widget.queryResult.xAxis;
            const { series } = $scope.widget.queryResult;
            categories.forEach((category, categoryIndex) => {
                for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex++) {
                    try {
                        if (series[seriesIndex].data[categoryIndex].selectionData !== undefined
                            && series[seriesIndex].data[categoryIndex].selectionData[0] !== undefined) {
                            let item;
                            if (series[seriesIndex].data[categoryIndex].selectionData[0] instanceof Date) {
                                item = series[seriesIndex].data[categoryIndex].selectionData[0].toISOString();
                            } else {
                                item = series[seriesIndex].data[categoryIndex].selectionData[0].toString();
                            }
                            categoryNames.push(item);
                            break;
                        }
                    } catch (err) {
                        // Do Nothing
                    }
                }
            });
            return categoryNames;
        };

        // -----------------------------------Returns the BreakBy of the widget-----------------------------------------
        const getBreakbyNames = () => {
            const { series } = $scope.widget.queryResult;
            const seriesNames = []; // Gets current order of the BreakBy
            series.forEach((sItem) => {
                if (sItem.sortData instanceof Date) {
                    seriesNames.push(sItem.sortData.toISOString());
                } else if (sItem.sortData !== undefined
                    && !Number.isNaN(sItem.sortData)
                    && !sItem.sortData.includes(defaultTotalSortValue)) {
                    // If series is a Date Field, then store values in ISO
                    const match1 = sItem.sortData
                        .match('[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'); // 2018-12-19T00:00:00
                    const match2 = sItem.sortData
                        .match('[A-Za-z]{3} [0-9]{2} [0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2}'); // Dec 19 2018 00:00:00

                    if (match1 !== null) { // Date is already in ISO format
                        seriesNames.push(sItem.sortData.substring(match1.index));
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
                        seriesNames.push(`${matchRes.substring(7, 11)}-${strMonthNum}-${matchRes.substring(4, 6)}`
                            + `T${matchRes.substring(12)}`);
                    } else { // Non-Date Field
                        seriesNames.push(sItem.name);
                    }
                } else if (sItem.name !== $$getObj(wrTotalSeriesName)) { // No sort data populated
                    seriesNames.push(sItem.name);
                }
            });
            return seriesNames;
        };

        // ------------------------------Saves the Custom Category/Breakby Settings-------------------------------------
        const saveCustomSort = () => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            if ($$getObj(wrCurrModalOpened) === 'Category') {
                $$setObj(wrCustomCategoryConfiguration, $.extend(true, [], listItems));
            } else if ($$getObj(wrCurrModalOpened) === 'Break By') {
                $$setObj(wrCustomBreakbyConfiguration, $.extend(true, [], listItems));
            }
            listItems = undefined;
            $$setObj(wrTempCustomList, listItems);
            $$setObj(wrCurrModalOpened, 'None');
            $scope.widget.redraw();
        };

        // ------------------------------Modal Popup is closed by clicking off the side---------------------------------
        window.onclick = (event) => { // When the user clicks anywhere outside of the modal, close it
            if (event.target === customModal[0]) {
                saveCustomSort();
            }
        };

        // -------------------------------------Save Config Button Clicked----------------------------------------------
        $('#saveButton').click(() => {
            saveCustomSort();
        });

        // ---------------------------------------Cancel Button Clicked-------------------------------------------------
        $('#cancelButton').click(() => {
            $(customModal).css('display', 'none');
            $('.trillapser-container').css('display', 'block');
            listItems = undefined;
            $$setObj(wrTempCustomList, listItems);
            $$setObj(wrCurrModalOpened, 'None');
            $scope.widget.redraw();
        });

        // ------------------------------------------Reset Modal Popup--------------------------------------------------
        const resetModalPopup = (popupList) => {
            $('#custom-modal-body-list').empty(); // Clear out configuration page, and redisplay current configuration
            popupList.forEach((value) => {
                const item = $("<li class='custom-modal-body-list-item' draggable='true'></li>").text(value);
                $('#custom-modal-body-list').append(item);
            });
            const cols = document.querySelectorAll('.custom-modal-body-list-item');
            [].forEach.call(cols, addDnDHandlers);
            listItems = popupList;
        };

        // -----------------------------------------Reset Button Clicked------------------------------------------------
        $('#resetButton').click(() => {
            if ($$getObj(wrCurrModalOpened) === 'Category') {
                resetModalPopup(getCategoryNames().sort());
            } else if ($$getObj(wrCurrModalOpened) === 'Break By') {
                resetModalPopup(getBreakbyNames().sort());
            }
            $$setObj(wrTempCustomList, $.extend(true, [], listItems));
            $scope.widget.redraw();
        });

        // --------------------------------------------Set Modal Popup--------------------------------------------------
        const setModalPopup = (customList, widgetReference) => {
            const customConfig = $$getObj(widgetReference) || [];
            // If first time clicking the button, then no configuration has been specified.
            if (customConfig === undefined || customConfig.length === 0) {
                $$setObj(widgetReference, $.extend(true, [], customList));
            } else { // If there are new values in the category, then add them to the end of the configuration
                customList.forEach((item) => {
                    if (!customConfig.includes(item)) {
                        customConfig.push(item);
                    }
                });
                $$setObj(widgetReference, $.extend(true, [], customConfig));
            }
            resetModalPopup(customConfig);
        };

        // ------------------------------------------Custom Button Clicked----------------------------------------------
        const customBtnClicked = (name, widgetReference, customList) => {
            $$setObj(wrCurrModalOpened, name);
            $(customModal).css('display', 'block');
            $('.trillapser-container').css('display', 'none');
            $('#custom-modal-header-title').text(`Custom ${name}`);
            setModalPopup(customList, widgetReference);
            $$setObj(wrTempCustomList, $.extend(true, [], listItems));
            $scope.widget.redraw();
        };

        // --------------------------------------Custom Category Button Clicked-----------------------------------------
        $('#customCategoryButton').click(() => {
            customBtnClicked('Category', wrCustomCategoryConfiguration, getCategoryNames());
        });

        // ---------------------------------------Custom BreakBy Button Clicked-----------------------------------------
        $('#customBreakbyButton').click(() => {
            customBtnClicked('Break By', wrCustomBreakbyConfiguration, getBreakbyNames());
        });

        // -----------------------------------Watch when the widget type changes----------------------------------------
        $scope.$watch('widget', () => {
            // Custom Object is re-created and has no custom settings, so take the settings from scope and apply to obj
            const type = $$get($scope, 'widget.type');
            $$setObj(wrType, type);
            $$setObj(wrIsTypeValid, type === 'chart/bar' || type === 'chart/column');
            $$setFromScopeToCustom(wrCustomMenuEnabled);
            $$setFromScopeToCustom(wrUpdateOnEveryChange);
            $$setFromScopeToCustom(wrAddTotalOption);
            $$setFromScopeToCustom(wrSortCategoriesOption);
            $$setFromScopeToCustom(wrSortBreakByOption);
            $$setFromScopeToCustom(wrCustomCategoryConfiguration);
            $$setFromScopeToCustom(wrCustomBreakbyConfiguration);
        });

        // ---------------------------------Triggers on customMenuEnabled changed---------------------------------------
        $scope.enabledChanged = () => {
            $$setObj(wrCustomMenuEnabled, !($$getObj(wrCustomMenuEnabled) || false));
            $scope.widget.redraw();
        };

        // -----------------------------Triggers on showTotals radio selection changed----------------------------------
        $scope.changeAddTotal = (addTotal) => {
            $$setObj(wrAddTotalOption, addTotal);
            $scope.widget.redraw();
        };

        // ----------------------------Triggers on sortCategories radio selection changed-------------------------------
        $scope.changeSortCategories = (sortCategories) => {
            $$setObj(wrSortCategoriesOption, sortCategories);
            $scope.widget.redraw();
        };

        // -------------------------------Triggers on sortBreakBy radio selection changed-------------------------------
        $scope.changeSortBreakBy = (sortBreakBy) => {
            $$setObj(wrSortBreakByOption, sortBreakBy);
            $scope.widget.redraw();
        };

        // ---------------------------------Triggers on updateOnEveryChange changed-------------------------------------
        $scope.toggleUpdateOnEveryChange = () => {
            $$setObj(wrUpdateOnEveryChange, !$$getObj(wrUpdateOnEveryChange));
        };
    },
]);

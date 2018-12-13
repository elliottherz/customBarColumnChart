#############################################################################################################################################
#  	Plugin for showing total points + sorting of categories/breakbys in column/bar charts
#	Created on Nov-27-2018 by Elliott Herz
#	Last Modified on Dec-12-2018 by Elliott Herz
#	Current Version: V2.2.1
#############################################################################################################################################


IF YOU FIND ANY ISSUES, PLEASE EMAIL: Elliott.Herz@sisense.com


# Example of usage:
1) Put plugin in /plugins folder and make sure the folder is called: customBarColumnChart
2) Create column/bar chart and hit apply
3) Edit widget and on the Design Panel activate "CUSTOMIZE CHART" option
4) Play around with a few options
5) EASY SUCCESS! =D


*****************************************CURRENT KNOWN ISSUES (Categorized as Minor)*********************************************************
1) Breakby reverse sort can be problematic with dates (due to minor bug in the product). Page refresh solves it.
2) Custom breakby reset button doesn't work well with dates, they will be sorted alphabetically instead of by date equivalent
3) Can't scroll most of the time in the modal popup.
4) Plugin won't take effect when switching chart types (including during the intial creation of the widget). Just hit apply and then refresh.
5) During the export, the total points are connected with a line (this is due to the phantom process being run in IE10).
6) Currently doesn't support more than 1 field in the Categories Section. Doesn't work with a combination of different charts (such as a column with a line)
*********************************************************************************************************************************************
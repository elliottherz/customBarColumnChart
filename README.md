########################################################################################################################
#  	Plugin for showing total points + sorting of categories/breakbys in column/bar charts
#	Created on Nov-27-2018 by Elliott Herz
#	Last Modified on Dec-20-2018 by Elliott Herz
#	Current Version: V2.4.2
########################################################################################################################


IF YOU FIND ANY ISSUES, PLEASE EMAIL: Elliott.Herz@sisense.com


# Example of usage:
1) Put plugin in /plugins folder and make sure the folder is called: customBarColumnChart
2) Create column/bar chart and hit apply
3) Edit widget and on the Design Panel activate "CUSTOMIZE CHART" option
4) Play around with a few options
5) EASY SUCCESS! =D


# Limitations
1) Doesn't support more than 1 field in the Categories Section.
2) Doesn't work with a combination of different charts series (such as a column + line in the same chart).


# Currently Known Minor Issues
1) Can't scroll most of the time in the modal popup.
2) During the export, the total points are connected with a line (this is due to the phantom process being run in IE10).    
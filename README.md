###################################################################################################
#  	Plugin for showing total points + sorting of categories/breakbys in column/bar charts
#	Created on Nov-27-2018 by Elliott Herz
#	Last Modified on Sept-29-2019 by Elliott Herz
#	Current Version: V2.9.0
#   Tested Sisense Version: V8.0.1.10112
###################################################################################################


IF YOU FIND ANY ISSUES, PLEASE EMAIL: Elliott.Herz@sisense.com


# Description: 
When you add a breakby to a bar or column chart, you lose the ability to see the total value for
the bar/column, you lose the ability to sort the category based on the total amount in each 
bar/column, and you never had the ability to sort the breakby. This plugin allows you to do all 3
in an easy to use way. In addition, you can also sort a column/bar chart in any custom predefined 
configuration.


# Example Usage:
1) Put plugin in /plugins folder and make sure the folder is called: customBarColumnChart
2) Create/Edit column/bar chart
3) Activate "CUSTOMIZE CHART" option on the Design Panel.
4) Play around with a few options
5) EASY SUCCESS! =D


# Limitations
1) Doesn't support more than 1 field in the Categories Section.
2) Breakby Sort By Category doesn't work when you update filters.
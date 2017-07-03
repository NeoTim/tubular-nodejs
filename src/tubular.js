// Load the full build.
var _ = require('lodash');


const CompareOperators = {
    none: 'None',
    auto: 'Auto',
    equals: 'Equals',
    notEquals: 'NotEquals',
    contains: 'Contains',
    startsWith: 'StartsWith',
    endsWith: 'EndsWith',
    gte: 'Gte',
    gt: 'Gt',
    lte: 'Lte',
    lt: 'Lt',
    multiple: 'Multiple',
    between: 'Between',
    notContains: 'NotContains',
    notStartsWith: 'NotStartsWith',
    notEndsWith: 'NotEndsWith'
}

function getCompareOperator(operator) {
    switch (op) {
        case CompareOperators.Equals:
            return "=";
        case CompareOperators.NotEquals:
            return "!=";
        case CompareOperators.Gte:
            return ">=";
        case CompareOperators.Gt:
            return ">";
        case CompareOperators.Lte:
            return "<=";
        case CompareOperators.Lt:
            return "<";
        default:
            return null;
    }
}

class Tubular {
    static createGridResponse(request, knexQueryBuilder) {
        if (request.Columns == null || request.Columns.length == 0)
            throw 'No Columns specified on the request';


        let response = {
            Counter: request.Counter,
            TotalRecordCount: dataSource.count('TODO: id should be defined here'),
            FilteredRecordCount: dataSource.count('TODO: id should be defined here'),
        };

        subset = Tubular.applyFreeTextSearch(request, subset, response);

        subset = Tubular.applyFiltering(request, subset, response);

        subset = Tubular.applySorting(request, subset);


    }

    static applySorting(request, subset) {
        let sortedColumns = _.filter(request.Columns, column => column.SortOrder > 0);

        if (sortedColumns.length > 0) {
            sortedColumns = _.sortBy(sortedColumns, ['SortOrder']);

            _.forEachRight(sortedColumns, column => subset.orderBy(column.Name, (column.SortDirection == 'Ascending' ? "asc" : "desc")));
        } else {
            // Default sorting
            subset.orderBy(request.Columns[0].Name, 'asc');
        }

        return subset;
    }

    static applyFreeTextSearch(request, subset, response) {
        // Free text-search 
        if (request.Search && request.Search.Operator) {


            switch (request.Search.Operator) {

                case CompareOperators.auto:

                    let searchableColumns = _.filter(request.Columns, column => column.Searchable);

                    if (searchableColumns.length > 0) {
                        subset = subset.where(function () {
                            let isFirst = true;
                            let _subset = this;
                            searchableColumns.forEach((column) => {
                                if (isFirst) {
                                    _subset.where(column.Name, 'LIKE', '%' + request.Search.Text + '%');
                                    isFirst = false;
                                }
                                else
                                    _subset.orWhere(column.Name, 'LIKE', '%' + request.Search.Text + '%');
                            });
                        })
                    }
                    break;
            }
        }

        return subset;
    }

    static applyFiltering(request, subset, response) {
        // Filter by columns
        let filteredColumns = request.Columns.filter((column) => column.Filter && (column.Filter.Text || column.Filter.Argument));

        let filtersToApply = [];

        filteredColumns.forEach(filterableColumn => {

            request.Columns.find(column => column.Name == filterableColumn.Name).HasFilter = true;

            switch (filterableColumn.Filter.Operator) {
                case CompareOperators.equals:
                    subset = subset.where(filterableColumn.Name, filterableColumn.Filter.Text);
                    break;
                case CompareOperators.notEquals:
                    subset = subset.whereNot(filterableColumn.Name, filterableColumn.Filter.Text);
                    break;
                case CompareOperators.contains:
                    subset = subset.where(filterableColumn.Name, 'LIKE', `%${filterableColumn.Filter.Text}%`);
                    break;
                case CompareOperators.notContains:
                    subset = subset.whereNot(filterableColumn.Name, 'LIKE', `%${filterableColumn.Filter.Text}%`);
                    break;
                case CompareOperators.startsWith:
                    subset = subset.where(filterableColumn.Name, 'LIKE', `${filterableColumn.Filter.Text}%`);
                    break;
                case CompareOperators.notStartsWith:
                    subset = subset.whereNot(filterableColumn.Name, 'LIKE', `${filterableColumn.Filter.Text}%`);
                    break;
                case CompareOperators.endsWith:
                    subset = subset.where(filterableColumn.Name, 'LIKE', `%${filterableColumn.Filter.Text}`);
                    break;
                case CompareOperators.notEndsWith:
                    subset = subset.whereNot(filterableColumn.Name, 'LIKE', `%${filterableColumn.Filter.Text}`);
                    break;
                case CompareOperators.gt:
                case CompareOperators.gte:
                case CompareOperators.lt:
                case CompareOperators.lte:
                    subset = subset.where(filterableColumn.Name, getCompareOperator(filterableColumn.Filter.Operator), filterableColumn.Filter.Text);
                    break;
                case CompareOperators.between:
                    subset = subset.whereBetween(filterableColumn.Name, [filterableColumn.Filter.Text, filterableColumn.Filter.Argument[0]]);
                    break;
            }
        });

        return subset;
    }
}

module.exports = Tubular;
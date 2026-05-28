<feature>
  <meta>
    <id>table_sort_filter</id>
    <title>Sort & Filter</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    User sorts and filters table data by columns. Supports multi-sort,
    multi-filter with AND/OR logic conditions.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "Sort" → select column and ASC/DESC order</action>
      <benefit>arrange data by desired criteria</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>click "Filter" → add filter conditions by column</action>
      <benefit>only display matching rows</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET .../rows supports query: ?sort=col&order=asc&filter=[...]&filterLogic=and
- [x] Filter operators: is, is not, contains, >, <, is empty, is not empty

## Web
- [x] "Sort" button on toolbar → dropdown to select column + ASC/DESC
- [x] Multi-sort: add multiple sort levels
- [x] "Filter" button → form: column, operator, value
- [x] Multi-filter: AND/OR logic between conditions
- [x] Filter/Sort applied in real-time on change
- [x] Badge showing number of active sort/filters

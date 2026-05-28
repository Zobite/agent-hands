<feature>
  <meta>
    <id>table_column_types</id>
    <title>Column data types</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    System supports multiple data types (column types) for table columns,
    similar to Notion properties. Each type has its own UI input and validation logic.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>choose data type when adding or changing column type</action>
      <benefit>each data type has an appropriate UI (datepicker, dropdown, checkbox...)</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Supported column types: Text, Number, Select, Multi-select, Date, Checkbox, URL, Email
- [x] Validate value by type when inserting/updating rows
- [x] Changing column type → existing data is converted or cleared if incompatible

## Web
- [x] Text: standard text input, supports multi-line
- [x] Number: number input, display format (integer, decimal, currency, percent)
- [x] Select: single-choice dropdown, user can create options with colors
- [x] Multi-select: multi-choice dropdown, tags displayed in cell
- [x] Date: datepicker, option to include time
- [x] Checkbox: boolean toggle
- [x] URL: text input, click → opens new tab
- [x] Email: text input, validates email format
- [x] Changing type → confirm dialog if data is incompatible

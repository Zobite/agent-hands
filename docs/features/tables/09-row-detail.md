<feature>
  <meta>
    <id>table_row_detail</id>
    <title>Row detail dialog</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Click "Open" on a row → detail dialog shows all properties as a form.
    Similar to Notion page view for a database record.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click row title or "Open" from context menu</action>
      <benefit>view and edit all fields of a record in full</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] GET .../rows/:rowId returns full data + column metadata

## Web
- [ ] Click row title or "Open" → dialog/drawer opens
- [ ] Display all properties as form (label: value), matching column type
- [ ] Inline editing on dialog, auto-save on blur
- [ ] Delete row button on dialog
- [ ] Close button (X) or click outside → close

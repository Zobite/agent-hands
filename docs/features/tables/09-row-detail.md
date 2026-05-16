<feature>
  <meta>
    <id>table_row_detail</id>
    <title>Row detail dialog</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Click "Open" trên một row → dialog detail hiển thị tất cả properties
    dạng form. Giống Notion page view cho database record.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click vào row title hoặc "Open" từ context menu</action>
      <benefit>xem và chỉnh sửa đầy đủ tất cả fields của record</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] GET .../rows/:rowId trả đầy đủ data + column metadata

## Web
- [ ] Click row title hoặc "Open" → dialog/drawer mở ra
- [ ] Hiển thị tất cả properties dạng form (label: value), theo đúng column type
- [ ] Chỉnh sửa inline trên dialog, auto-save khi blur
- [ ] Nút Delete row trên dialog
- [ ] Nút đóng (X) hoặc click outside → đóng

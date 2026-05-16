<feature>
  <meta>
    <id>doc_icon_cover</id>
    <title>Document icon & cover</title>
    <group>Documents</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Mỗi document có thể có icon (emoji) và cover image, giống Notion.
    Hiển thị trên sidebar tree và editor header.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click icon area trên editor → chọn emoji</action>
      <benefit>dễ nhận diện document trong sidebar và khi browse</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Document schema hỗ trợ fields: icon (emoji string), cover (URL hoặc preset)
- [ ] PATCH endpoint nhận icon, cover

## Web
- [ ] Click icon placeholder → emoji picker
- [ ] Chọn emoji → lưu, hiển thị trên sidebar + editor header
- [ ] Hover cover area → nút "Add cover"
- [ ] Cover: upload image hoặc chọn từ preset gradients/colors
- [ ] Cover hiển thị dạng banner ở đầu editor
- [ ] Nút "Remove" để xoá icon/cover

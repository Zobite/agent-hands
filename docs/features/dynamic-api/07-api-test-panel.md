<feature>
  <meta>
    <id>dynamic_api_test_panel</id>
    <title>API test panel</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Integrated test panel in the editor that allows sending test requests to
    dynamic endpoints and viewing responses. Like a mini Postman. Also displays
    captured console logs from handler execution.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>press "Test" on editor → send test request</action>
      <benefit>test API directly in app without needing Postman/curl</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] "Send" button → send request to endpoint.
- [x] Console output: displays captured console.log/error/warn from handler.

## Web
- [x] Test panel on the right or below code editor.
- [x] Form inputs: Method (auto-fill), URL (auto-fill), Headers (editable), Query params, Body (JSON editor).
- [x] Response display: Status code (colored), Headers, Body (JSON formatted), Execution time.
- [x] History: saves last 10 requests.
- [x] Copy cURL command.

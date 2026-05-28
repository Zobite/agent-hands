<feature>
  <meta>
    <id>user_roles</id>
    <title>Roles (authorization)</title>
    <group>Users</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Role-based authorization system: superadmin, admin, member.
    Each role has different permission sets, checked at both API and UI levels.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Super Admin</actor>
      <action>assign role to user</action>
      <benefit>control access permissions for each user</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] 3 roles: superadmin (full access), admin (manage users + all features), member (use features, cannot manage users)
- [x] API middleware checks role before processing request
- [x] superadmin role cannot be assigned or revoked via API — only exists from seed. Zod schema only accepts admin/member
- [x] Return 403 Forbidden if user lacks permission

## Web
- [x] UI hides/disables buttons/menus that user doesn't have permission for
- [x] Role dropdown when create/edit user only shows admin/member (no superadmin)

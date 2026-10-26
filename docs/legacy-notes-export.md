# Legacy notes export (pre-0.12 upgrade)

Palander **0.12.0** removes `daily_notes` and `notes` tables. If you still have note data on **0.11.x**, export it **before** running migration `008`.

## Export (API 0.11.x only)

```bash
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/export/legacy-notes \
  -o palander-legacy-notes.json
```

Verify the JSON file includes `payload_sha256` and expected row counts. Archive the file outside the database before upgrading.

## Upgrade

```bash
alembic upgrade head   # applies revision 008
```

After 0.12, note APIs and export endpoints are removed.

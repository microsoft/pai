/* This init script will be run every time when the database container is started. */

CREATE TABLE IF NOT EXISTS fc_objectsnapshots (
   tag Text,
   time Timestamptz,
   record JsonB
);
CREATE INDEX IF NOT EXISTS uidindex ON fc_objectsnapshots USING gin ((record -> 'objectSnapshot' -> 'metadata' -> 'uid'));

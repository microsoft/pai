CREATE TABLE IF NOT EXISTS fc_objectsnapshots (
   tag Text,
   time Timestamptz,
   record JsonB
);
CREATE INDEX uidindex ON fc_objectsnapshots USING gin ((record -> 'objectSnapshot' -> 'metadata' -> 'uid'));

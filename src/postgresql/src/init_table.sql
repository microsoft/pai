CREATE TABLE IF NOT EXISTS fc_objectsnapshots (
   tag Text,
   time Timestamptz,
   record JsonB
);
CREATE INDEX recordgin ON fc_objectsnapshots USING gin (record);

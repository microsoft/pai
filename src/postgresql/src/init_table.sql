/* This init script will be run every time when the database container is started. */

CREATE TABLE IF NOT EXISTS framework_history (
   insertedAt Timestamptz,
   uid SERIAL,
   frameworkName VARCHAR(64), 
   attemptIndex INTEGER,
   historyType VARCHAR(16),
   snapshot TEXT
);
CREATE TABLE IF NOT EXISTS pods (
   insertedAt Timestamptz,
   updatedAt Timestamptz, uid VARCHAR(36),
   frameworkName VARCHAR(64),
   attemptIndex INTEGER,
   taskroleName VARCHAR(256),
   taskroleIndex INTEGER,
   taskAttemptIndex INTEGER,
   snapshot TEXT
);
CREATE INDEX IF NOT EXISTS uidindex ON fc_objectsnapshots USING gin ((record -> 'objectSnapshot' -> 'metadata' -> 'uid'));

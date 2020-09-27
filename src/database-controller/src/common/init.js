const logger = require('@dbc/common/logger');

// We doesn't allow unhandled promise rejection.
// It will make the watcher stop all actions (in some rare cases).
process.on('unhandledRejection', function(reason, p) {
  logger.error(
    `Encounter unhandled rejection of promise, reason: ${reason}`,
    function() {
      process.exit(1);
    },
  );
});

import os
import logging
import logging.handlers
import subprocess


class Logger(object):

    def __init__(self):
        self._logger = logging.getLogger(__name__)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(levelname)s - %(asctime)s - [%(name)s:%(lineno)s] - %(message)s ')
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)

        if os.path.exists('log') is False:
            os.makedirs('log', exist_ok=True)
            
        handler = logging.handlers.TimedRotatingFileHandler('log/autoscaler.log', when='D', interval=1, backupCount=10)
        formatter = logging.Formatter('%(levelname)s - %(asctime)s - [%(name)s:%(lineno)s] - %(message)s ')
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)
        self._logger.setLevel(logging.INFO)
        self.info('Log is ready!')
    
    def info(self, message):
        self._logger.info(message)
    
    def debug(self, message):
        self._logger.debug(message)
    
    def warning(self, message):
        self._logger.warning(message)
    
    def error(self, message):
        self._logger.error(message)
    
    def critical(self, message):
        self._logger.critical(message)


class Shell(object):

    def __init__(self, logger: Logger):
        self._logger = logger

    def execute(self, command: str):
        '''
        If any error happens or the exit code is not zero, will throw it.
        '''
        self._logger.critical('Execute: {}'.format(command))
        pipe = subprocess.Popen(command.split(' '), stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        # if pipe.returncode != 0:
        #     raise Exception('Return code is non-zero!')
        stdout, stderr = pipe.communicate()
        stdout = stdout and stdout.decode('utf-8')
        stderr = stderr and stderr.decode('utf-8')
        return stdout, stderr

from enum import Enum
import queue
import time
import threading

MAX_QUEUE_SIZE = 10000


class EventType(Enum):
    DELETE_ORPHAN_PRIOPRITY_CLASS = 1,
    DELETE_HANG_POD = 2


class Event:
    def __init__(self, event_type, handler, *args, **kargs):
        self.event_type = event_type
        self.handler = handler
        self.args = args
        self.kargs = kargs


class EventProssesor:
    def __init__(self):
        self._queue = queue.Queue(MAX_QUEUE_SIZE)
        self._stop = False

    def push_event(self, event):
        self._queue.put_nowait(event)

    def _handle_event(self):
        event = self._queue.get_nowait()
        event.handler(*event.args, **event.kargs)

    def _process_events(self):
        while True:
            if self._stop:
                break
            try:
                self._handle_event()
            except queue.Empty:
                time.sleep(1)

    def start(self):
        threading.Thread(target=self._process_events,
                         name="process events",
                         args=(self, ))

    def stop(self):
        self._stop = True

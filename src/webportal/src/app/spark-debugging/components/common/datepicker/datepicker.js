import cuid from "cuid";
export default class DatepickerProperty {
  constructor(
    onChange = null,
    defaultDate = new Date(),
    defaultDate2 = new Date(),
    maxDate = "",
    minDate = "",
    dateFormat = "Y-m-d H:i:s",
    containerSelector = ".content-wrapper .spark-streaming",
    enableTime = true,
    enableSeconds = true,
    allowInput = false,
    minuteIncrement = 1,
    defaultHour = 12,
    id = cuid(),
    id2 = cuid(),
    time_24hr = true
  ) {
    this.onChange = onChange;
    this.defaultDate = defaultDate;
    this.defaultDate2 = defaultDate2;
    this.maxDate = maxDate;
    this.minDate = minDate;
    this.dateFormat = dateFormat;
    this.containerSelector = containerSelector;
    this.enableTime = enableTime;
    this.enableSeconds = enableSeconds;
    this.allowInput = allowInput;
    this.minuteIncrement = minuteIncrement;
    this.defaultHour = defaultHour;
    this.id = id;
    this.id2 = id2;
    this.time_24hr = time_24hr;
  }
}

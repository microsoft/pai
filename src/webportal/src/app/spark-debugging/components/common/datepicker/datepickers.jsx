import React, { Component } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { debounce } from "Lodash";

export class Timepicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: null,
      debounceTime: 1500
    };
    this.renderdatepickers = this.renderdatepickers.bind(this);
    this.insideOnChange = this.insideOnChange.bind(this);
  }

  renderdatepickers({
    id,
    allowInput,
    enableSeconds,
    enableTime,
    dateFormat,
    defaultDate,
    minuteIncrement,
    maxDate,
    minDate
  }) {
    const detepicker = flatpickr(`#${id}`, {
      allowInput: allowInput,
      enableSeconds: enableSeconds,
      defaultDate: defaultDate,
      enableTime: enableTime,
      maxDate: maxDate,
      minDate: minDate,
      time_24hr: true,
      dateFormat: dateFormat,
      onChange: debounce(this.insideOnChange, 1000),
      minuteIncrement: minuteIncrement
    });
    this.setState({
      valid: detepicker
    });
  }
  insideOnChange(e, t, cur) {
    const { valid } = this.state;
    const { onChange } = this.props.datepickerProperty;
    if (valid.selectedDates && valid._input)
      onChange({ Time: valid.selectedDates }, cur);
  }

  componentDidMount() {
    this.renderdatepickers(datepickerProperty);
  }
  render() {
    const { id } = this.props.datepickerProperty;
    return (
      <div className="datetimepicker-single">
        <input style={{height: 30}} id={id} type="text" />
      </div>
    );
  }
}
export default class TimepickerMultiple extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valid: null,
      valid1: null
    };
    this.renderdatepickers = this.renderdatepickers.bind(this);
    this.renderdatepickers1 = this.renderdatepickers1.bind(this);
    this.insideOnChange = this.insideOnChange.bind(this);
  }

  insideOnChange(e, t, cur) {
    const { valid, valid1 } = this.state;
    const { onChange, id } = this.props.datepickerProperty;
    if (valid && cur.element.id == id) {
      this.renderdatepickers1(valid);
    }
    if (valid.selectedDates && valid1.selectedDates) {
      onChange(
        { startTime: valid.selectedDates, endTime: valid1.selectedDates },
        cur
      );
    }
  }

  componentDidMount() {
    const {
      datepickerProperty,
      datepickerProperty: { id }
    } = this.props;
    const datepicker = this.renderdatepickers(datepickerProperty);
    this.renderdatepickers1(datepicker);
    this.setState({ firstInputId: id });
  }

  renderdatepickers({
    id,
    allowInput,
    enableSeconds,
    enableTime,
    dateFormat,
    defaultDate,
    minuteIncrement,
    maxDate,
    minDate
  }) {
    const detepicker = flatpickr(`#${id}`, {
      allowInput: allowInput,
      enableSeconds: enableSeconds,
      defaultDate: defaultDate,
      enableTime: enableTime,
      maxDate: maxDate,
      minDate: minDate,
      dateFormat: dateFormat,
      time_24hr: true,
      onChange: debounce(this.insideOnChange, this.state.debounceTime),
      minuteIncrement: minuteIncrement
    });
    this.setState({
      valid: detepicker
    });
    return detepicker;
  }

  renderdatepickers1(datepicker) {
    const {
      id2,
      allowInput,
      enableSeconds,
      enableTime,
      dateFormat,
      defaultDate2,
      minuteIncrement,
      maxDate
    } = this.props.datepickerProperty;
    const detepicker1 = flatpickr(`#${id2}`, {
      allowInput: allowInput,
      enableSeconds: enableSeconds,
      defaultDate: defaultDate2,
      maxDate: maxDate,
      minDate: Date.parse(datepicker.selectedDates),
      enableTime: enableTime,
      dateFormat: dateFormat,
      time_24hr: true,
      onChange: debounce(this.insideOnChange, this.state.debounceTime),
      minuteIncrement: minuteIncrement
    });
    this.setState({
      valid1: detepicker1
    });
  }
  render() {
    const { id, id2 } = this.props.datepickerProperty;

    return (
      <div className="datepicker-multiple">
        <input style={{height: 30, width: 145}} id={id} type="text" />
        <span>&nbsp;&nbsp;&nbsp;&nbsp;to&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <input style={{height: 30, width: 145}} id={id2} type="text" />
      </div>
    );
  }
}

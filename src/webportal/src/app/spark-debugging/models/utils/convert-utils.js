export default class Convert {
    static formatDuration(milliseconds) {
        if (milliseconds < 100) {
            return milliseconds + " ms";
        }
        var seconds = milliseconds * 1.0 / 1000;
        if (seconds < 1) {
            return seconds.toFixed(1) + " s";
        }
        if (seconds < 60) {
            return seconds.toFixed(0) + " s";
        }
        var minutes = seconds / 60;
        if (minutes < 10) {
            return minutes.toFixed(1) + " min";
        } else if (minutes < 60) {
            return minutes.toFixed(0) + " min";
        }
        var hours = minutes / 60;
        return hours.toFixed(1) + " h";
    }

    static formatBytes(bytes, type, dm = 1) {
        if (type !== 'display') return bytes;
        bytes = parseFloat(bytes);
        if (bytes == 0) {
            return bytes.toFixed(dm) + ' Bytes';
        }
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    static formatNumber(num, forDisplay = true, dm = 1) {
        if (!forDisplay) {
            return num;
        }
        num = parseFloat(num);
        let k = 1000;
        let units = ['', 'K', 'M', 'B'];
        let values = [Math.pow(k, 0), Math.pow(k, 1), Math.pow(k, 2), Math.pow(k, 3)];
        for (let i = units.length - 1; i >= 0; i--) {
            if (num / values[i] >= 1) {
                return (num / values[i]).toFixed(dm) + ' ' + units[i];
            }
        }
        return num.toFixed(dm) + ' ' + units[0];
    }

    static padZeroes(num) {
        return ("0" + num).slice(-2);
    }

    static formatTimeMillis(timeMillis) {
        if (timeMillis <= 0) {
            return "-";
        } else {
            var dt = new Date(timeMillis);
            return dt.getFullYear() + "-" +
                padZeroes(dt.getMonth() + 1) + "-" +
                padZeroes(dt.getDate()) + " " +
                padZeroes(dt.getHours()) + ":" +
                padZeroes(dt.getMinutes()) + ":" +
                padZeroes(dt.getSeconds());
        }
    }

    static getTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (ex) {
            // Get time zone from a string representing the date,
            // eg. "Thu Nov 16 2017 01:13:32 GMT+0800 (CST)" -> "CST"
            return new Date().toString().match(/\((.*)\)/)[1];
        }
    }

    static getBytesUnitName(bytes) {
        if (bytes == 0)
            return 'Bytes';
        var bytesUnitNames = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        return bytesUnitNames[Math.floor(Math.log(bytes) / Math.log(1000))];
    }

    static formatBytesByUnitName(bytes, name) {
        var bytesUnitNames = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        for (var i = 0; i < bytesUnitNames.length; i++) {
            if (name != bytesUnitNames[i])
                continue;
            return parseFloat((bytes / Math.pow(1000, i)).toFixed(2));
        }

    }

    static getNumberUnitName(num) {
        let k = 1000;
        let units = ['', 'K', 'M'];
        let values = [Math.pow(k, 0), Math.pow(k, 1), Math.pow(k, 2)];
        for (let i = units.length - 1; i >= 0; i--) {
            if (num >= values[i]) {
                return units[i];
            }
        }
        return units[0];
    }

    static formatNumberByUnitName(num, unitName, dm = 1) {
        let k = 1000;
        let units = ['', 'K', 'M'];
        let values = [Math.pow(k, 0), Math.pow(k, 1), Math.pow(k, 2)];
        for (let i = 0; i < units.length; i++) {
            if (unitName == units[i]) {
                return (num / values[i]).toFixed(dm) * 1;
            }
        }
        return parseFloat(num).toFixed(dm) * 1;
    }
    static getTimeUnitName(time) {
        if (!time || time == 0) return 0;
        if (time < 1000)
            return 'MS';
        else if (time < 1000 * 60)
            return 'S';
        else if (time < 1000 * 60 * 60)
            return 'MIN';
        else
            return 'H';
    }
    static formatTimeByUnitName(time, name) {
        if (!time || time == 0) return 0;
        switch (name) {
            case 'MS':
                return parseFloat(time.toFixed(2));
            case 'S':
                return parseFloat((time / 1000).toFixed(2));
            case 'MIN':
                return parseFloat((time / 1000 / 60).toFixed(3));
            default:
                return parseFloat((time / 1000 / 60 / 60).toFixed(2));
        }
    }
    static timeString2MillSec(date) {
        if (!date) {
            return null;
        }
        if (date.indexOf(".") != -1) {
            date = date.substr(0, date.indexOf("."));
        }
        // the data is the utc time, need convert it to local time.
        let timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
        return new Date(date).getTime() - timeZoneOffset;
    }
    static getMax(axis, item) {
        if (!item || !Array.isArray(item)) return;
        return item.reduce((a, b) => {
            if (axis = 'x') {
                if (a == 0) {
                    return 8
                } else {
                    return a > b ? a : b
                }
            } else {
                return a > b ? a : b
            }
        });
    }
    static getUnitName(unitFun, value) {
        return unitFun(value);
    }
    static getChartArguments(data) {
        if (!Array.isArray(data)) [data];
        const xData = data.map((d) => d.x);
        const yData = data.map((d) => d.y);
        const xMax = this.getMax('x', xData);
        const yMax = this.getMax('y', yData);
        const xUnitName = this.getUnitName(Convert.getBytesUnitName, xMax);
        const yUnitName = this.getUnitName(Convert.getTimeUnitName, yMax);
        return { xMax, yMax, xUnitName, yUnitName }
    }
    /** 
     * Timestamp formatting function 
     * @param {string} format
     * @param {int} timestamp  
     * @return {string} 
     */
    static date(format, timestamp) {
        var a, jsdate = ((timestamp) ? new Date(timestamp) : new Date());
        var pad = function (n, c) {
            if ((n = n + "").length < c) {
                return new Array(++c - n.length).join("0") + n;
            } else {
                return n;
            }
        };
        var txt_weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var txt_ordin = { 1: "st", 2: "nd", 3: "rd", 21: "st", 22: "nd", 23: "rd", 31: "st" };
        var txt_months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var f = {
            // Day 
            d: function () { return pad(f.j(), 2) },
            D: function () { return f.l().substr(0, 3) },
            j: function () { return jsdate.getDate() },
            l: function () { return txt_weekdays[f.w()] },
            N: function () { return f.w() + 1 },
            S: function () { return txt_ordin[f.j()] ? txt_ordin[f.j()] : 'th' },
            w: function () { return jsdate.getDay() },
            z: function () { return (jsdate - new Date(jsdate.getFullYear() + "/1/1")) / 864e5 >> 0 },

            // Week 
            W: function () {
                var a = f.z(), b = 364 + f.L() - a;
                var nd2, nd = (new Date(jsdate.getFullYear() + "/1/1").getDay() || 7) - 1;
                if (b <= 2 && ((jsdate.getDay() || 7) - 1) <= 2 - b) {
                    return 1;
                } else {
                    if (a <= 2 && nd >= 4 && a >= (6 - nd)) {
                        nd2 = new Date(jsdate.getFullYear() - 1 + "/12/31");
                        return date("W", Math.round(nd2.getTime() / 1000));
                    } else {
                        return (1 + (nd <= 3 ? ((a + nd) / 7) : (a - (7 - nd)) / 7) >> 0);
                    }
                }
            },

            // Month 
            F: function () { return txt_months[f.n()] },
            m: function () { return pad(f.n(), 2) },
            M: function () { return f.F().substr(0, 3) },
            n: function () { return jsdate.getMonth() + 1 },
            t: function () {
                var n;
                if ((n = jsdate.getMonth() + 1) == 2) {
                    return 28 + f.L();
                } else {
                    if (n & 1 && n < 8 || !(n & 1) && n > 7) {
                        return 31;
                    } else {
                        return 30;
                    }
                }
            },

            // Year 
            L: function () { var y = f.Y(); return (!(y & 3) && (y % 1e2 || !(y % 4e2))) ? 1 : 0 },
            //o not supported yet 
            Y: function () { return jsdate.getFullYear() },
            y: function () { return (jsdate.getFullYear() + "").slice(2) },

            // Time 
            a: function () { return jsdate.getHours() > 11 ? "pm" : "am" },
            A: function () { return f.a().toUpperCase() },
            B: function () {
                // peter paul koch: 
                var off = (jsdate.getTimezoneOffset() + 60) * 60;
                var theSeconds = (jsdate.getHours() * 3600) + (jsdate.getMinutes() * 60) + jsdate.getSeconds() + off;
                var beat = Math.floor(theSeconds / 86.4);
                if (beat > 1000) beat -= 1000;
                if (beat < 0) beat += 1000;
                if ((String(beat)).length == 1) beat = "00" + beat;
                if ((String(beat)).length == 2) beat = "0" + beat;
                return beat;
            },
            g: function () { return jsdate.getHours() % 12 || 12 },
            G: function () { return jsdate.getHours() },
            h: function () { return pad(f.g(), 2) },
            H: function () { return pad(jsdate.getHours(), 2) },
            i: function () { return pad(jsdate.getMinutes(), 2) },
            s: function () { return pad(jsdate.getSeconds(), 2) },
            //u not supported yet 

            // Timezone 
            //e not supported yet 
            //I not supported yet 
            O: function () {
                var t = pad(Math.abs(jsdate.getTimezoneOffset() / 60 * 100), 4);
                if (jsdate.getTimezoneOffset() > 0) t = "-" + t; else t = "+" + t;
                return t;
            },
            P: function () { var O = f.O(); return (O.substr(0, 3) + ":" + O.substr(3, 2)) },
            //T not supported yet 
            //Z not supported yet 

            // Full Date/Time 
            c: function () { return f.Y() + "-" + f.m() + "-" + f.d() + "T" + f.h() + ":" + f.i() + ":" + f.s() + f.P() },
            //r not supported yet 
            U: function () { return Math.round(jsdate.getTime() / 1000) }
        };

        return format.replace(/([a-zA-Z])/g, function (t, s) {
            let ret;
            if (t != s) {
                // escaped 
                ret = s;
            } else if (f[s]) {
                // a date function exists 
                ret = f[s]();
            } else {
                // nothing special 
                ret = s;
            }
            return ret;
        });
    }
    static getTruncatedString(str) {
        if (typeof str !== 'string') return;
        if (str.length > 36) {
            return str.slice(0, 36) + '...';
        } else {
            return str;
        }
    };
    static nameConvert(dataType) {
        let formatter;
        let nameGetter;
        switch (dataType) {
            case 'Records':
                formatter = Convert.formatNumberByUnitName;
                nameGetter = Convert.getNumberUnitName;
                break;
            case 'Data':
                formatter = Convert.formatBytesByUnitName;
                nameGetter = Convert.getBytesUnitName;
                break;
            case 'Time':
                formatter = Convert.formatTimeByUnitName;
                nameGetter = Convert.getTimeUnitName;
                break;
        }
        return { formatter, nameGetter };
    }
    /**
 * 
 * @param {number}
 * @returns {number}
 */
    static handleMax(number) {
        const getArr = number.toString().split('');
        getArr.splice(0, 1, (getArr[0] * 1) + 1);
        return getArr.join('') * 1;
    };

    static isNotEmptyArray(data) {
        return Array.isArray(data) && data.length > 0;
    };


    static median(array) {
        array = array.sort();
        if (array.length % 2 === 0) { // array with even number elements
            return (array[array.length / 2] + array[(array.length / 2) - 1]) / 2;
        }
        else {
            return array[(array.length - 1) / 2]; // array with odd number elements
        }
    };
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateFormatTime = void 0;
/// 格式化时间
/// format
/// yyyy 年
/// MM 月,带0
/// dd 日，带0
/// hh 时，带0
/// mm 分，带0
/// ss 秒,带0
function dateFormatTime(dateTime, fmt) {
    var o = {
        'M+': dateTime.getMonth() + 1,
        'd+': dateTime.getDate(),
        'h+': dateTime.getHours(),
        'm+': dateTime.getMinutes(),
        's+': dateTime.getSeconds(),
        'q+': Math.floor((dateTime.getMonth() + 3) / 3),
        'S': dateTime.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (dateTime.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
}
exports.dateFormatTime = dateFormatTime;
//# sourceMappingURL=DateUtils.js.map
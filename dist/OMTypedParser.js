"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OMTypedParser = void 0;
const tslib_1 = require("tslib");
//peg与peggy又什么区别？
const peggy_1 = (0, tslib_1.__importDefault)(require("peggy"));
const parser = peggy_1.default.generate("start = ('a' / 'b')+");
parser.parse("abba");
class OMTypedParser {
    static parseString(inputstring) {
        throw new Error("Method not implemented.");
    }
}
exports.OMTypedParser = OMTypedParser;

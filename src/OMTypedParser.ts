//peg与peggy又什么区别？
import peggy from 'peggy';

const parser = peggy.generate("start = ('a' / 'b')+");
parser.parse("abba");
class OMTypedParser {
  static parseString(inputstring: String | undefined): string | undefined {
    throw new Error("Method not implemented.");
  }
}
export { OMTypedParser };

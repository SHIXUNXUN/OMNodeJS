/// <reference types="node" />
/****************************************************************
 * OMNodeJS is a Node interface to Openmodelica.
 ****************************************************************/
import { ChildProcess } from 'child_process';
import fs from 'fs';
import zmq from 'zeromq';
/**
 * @description
 * @author 胡旭鹏
 * @date 14/01/2022
 * @class OMCSessionHelper
 */
declare class OMCSessionHelper {
    omc_env_home: string;
    omhome: string;
    path_to_omc: string | undefined;
    constructor();
    _get_omc_path(): string;
}
declare class OMCsessionBase extends OMCSessionHelper {
    readonly: true | false | undefined;
    omc_cache: Array<object> | undefined;
    _omc_process: ChildProcess | null;
    _omc_command: Array<string> | undefined;
    _omc: zmq.Request | undefined;
    _dockerCid: null | undefined;
    _serverIPAddress: string | undefined;
    _interactivePort: null | undefined;
    _temp_dir: string | undefined;
    _random_string: string | undefined;
    _omc_log_file: fs.WriteStream | undefined;
    _currentUser: string | undefined;
    extraFlags: string[] | undefined;
    /**
     * @description omc.exe进程变量
     * @author 胡旭鹏
     * @date 17/01/2022
     * @type {Array<string>}
     * @memberof OMCsessionBase
     */
    omcCommand: Array<string>;
    omhome_bin: string | undefined;
    my_env: object;
    constructor(readonly?: boolean);
    __del__(): void;
    _create_omc_log_file(suffix: string): void;
    _start_omc_process(timeout: number): ChildProcess;
    /**
     * @description 方法废弃
     * @author 胡旭鹏
     * @date 14/01/2022
     * @memberof OMCsessionBase
     */
    _connect_to_omc(timeout: number): void;
    /**
     * @description 设置omc命令，里面的docker部分有问题，目前不可用，核心为改变_omc_command
     * @author 胡旭鹏
     * @date 14/01/2022
     * @param {Array<object>} omc_path_and_args_list
     * @memberof OMCsessionBase
     */
    _set_omc_command(omc_path_and_args_list: Array<string>): void;
    /**
     * @description 向omc发送表达式
     * @author 胡旭鹏
     * @date 13/01/2022
     * @param {string} command
     * @param {boolean} [parsed=true]
     * @memberof OMCsessionBase
     */
    sendExpression(command: string, parsed?: boolean): object;
    /**
     * @description 发送请求字符串
     * @author 胡旭鹏
     * @date 13/01/2022
     * @param {string} question
     * @param {*} [opt=null]
     * @param {boolean} [parsed=true]
     * @memberof OMCsessionBase
     */
    ask(question: string, opt?: any, parsed?: boolean): object;
}
/**
 * @description 目前使用该方式进行通讯
 * @author 胡旭鹏
 * @date 13/01/2022
 * @class OMCSessionZMQ
 */
declare class OMCSessionZMQ extends OMCsessionBase {
    _port_file: string;
    _docker: string | null;
    _dockerContainer: string | null;
    _dockerExtraArgs: Array<string> | null;
    _dockerOpenModelicaPath: string | null;
    _dockerNetwork: string | null;
    _timeout: number;
    constructor(OMCsessionBase: {
        constructor: (arg0: boolean) => void;
    }, readonly?: boolean, timeout?: number, docker?: null, dockerContainer?: null, dockerExtraArgs?: never[], dockerOpenModelicaPath?: string, dockerNetwork?: null, port?: null);
    /** OMCSessionZMQ的_connect_to_omc方法，需要与OMCsessionBase的加以区分
     * @description
     * @author 胡旭鹏
     * @date 14/01/2022
     * @memberof OMCSessionZMQ
     */
    _connect_to_omc(timeout: number): void;
    sendExpression(command: string, parsed?: boolean): Promise<string | undefined>;
}
declare const _default: {
    OMCSessionZMQ: typeof OMCSessionZMQ;
};
export default _default;

/// <reference types="node" />
import { ChildProcess } from 'child_process';
import fs from 'fs';
import { Request } from 'zeromq';
/****************************************************************
 * OMNodeJS is a Node interface to Openmodelica.
 ****************************************************************/
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
    _omc: Request | any | undefined;
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
    omcCommand: string;
    omhome_bin: string | undefined;
    my_env: object;
    constructor(readonly?: boolean);
    __del__(): void;
    _create_omc_log_file(suffix: string): void;
    /**
     * @description 基类的开启omc进程方法
     * @author 胡旭鹏
     * @date 25/01/2022
     * @param {number} timeout
     * @param {number} argv
     * @return {*}  {ChildProcess}
     * @memberof OMCsessionBase
     */
    _start_omc_process(timeout: number, argv: string[]): Promise<ChildProcess>;
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
    _set_omc_command(omc_path_and_args_list?: Array<string>): void;
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
 * @description 这个方法有问题，目前先不要使用
 * @author 胡旭鹏
 * @date 13/01/2022
 * @class OMCSession
 */
/****
class OMCSession extends OMCsessionBase {
  _port_file: string;
  _docker: string | null;
  _dockerContainer: string | null;
  _dockerExtraArgs: Array<string> | null;
  _dockerOpenModelicaPath: string | null;
  _dockerNetwork: string | null;
  _timeout: number;
  _port: any;
  _poa: any;
  _obj_reference: any;
  constructor(
    OMCsessionBase: { constructor: (arg0: boolean) => void },
    readonly = false,
    serverFlag = "--interactive=corba",
    timeout = 10.0,
    docker = null,
    dockerContainer = null,
    dockerExtraArgs = [],
    dockerOpenModelicaPath = "omc",
    dockerNetwork = null,
    port = null
  ) {
    super();
    this._create_omc_log_file("objid");
    if (os.platform() != "win32" || docker || dockerContainer) {
      this._port_file =
        "openmodelica." + this._currentUser + ".objid." + this._random_string;
    } else {
      this._port_file = "openmodelica.objid." + this._random_string;
    }
    this._port_file = String(
      Path.join(
        docker || dockerContainer ? "/tmp" : this._temp_dir!,
        this._port_file
      )
    ).replace("\\\\", "/");
    this._docker = docker;
    this._dockerContainer = dockerContainer;
    this._dockerExtraArgs = dockerExtraArgs;
    this._dockerOpenModelicaPath = dockerOpenModelicaPath;
    this._dockerNetwork = dockerNetwork;
    this._timeout = timeout;
    this._create_omc_log_file("port");
    this._set_omc_command();
    this._start_omc_process(timeout, [
      "--interactive=corba",
      "--locale=C",
      `-z=${this._random_string}`,
    ]);
    this._connect_to_omc(timeout);
  }

  _connect_to_omc (timeout: number) {
    Path.join(this.omhome, 'lib', 'python');
    try {
    }
    catch {
      this._omc_process?.kill();
      throw new Error;
    }
    const _omc_corba_uri = "file:///" + this._port_file;
    let attempts = 0;
    let _ior: string = "";
    let _port: string = "";
    let contents: Buffer;
    const _port_file_createReadStream = fs.createReadStream(this._port_file);
    while (true) {
      if (this._dockerCid) {
        //docker部分
      }
      const f_p = readline.createInterface({
        input: _port_file_createReadStream,
      });
      if (existsSync(this._port_file)) {
        f_p.on("line", (line: string) => {
          _ior = line;
        });
        break;
      }
      attempts += 1;
      if (attempts == 80) {
        const name = this._omc_log_file?.Path;
        this._omc_log_file?.close;
        contents = fs.readFileSync(name as string);
        this._omc_process?.kill;
        throw new Error("OMC Server is down (timeout=${timeout}). Please start it! If the OMC version is old, try OMCSession(..., serverFlag='-d=interactiveCorba') or +d=interactiveCorba. Log-file says:\n${contents}");
      }
    }

    while (true) {
      if (this._dockerCid) {
        // docker部分，待后续开发
      }
      else {
        const f_p = fs.createReadStream(this._port_file);
        if (existsSync(this._port_file)) {
          f_p.on("line", (line: string) => {
            _port = line;
          });
          fs.unlinkSync(this._port_file);
          break
        }
      }
      attempts += 1;
      if (attempts == 80.0) {
        let name = this._omc_log_file?.Path;
        this._omc_log_file?.close;
        console.error('OMC Server is down (timeout=${fs.readFileSync(name as string)}). Please start it! Log-file says:\n${fs.readFileSync(name as string)}');
        throw new Error("OMC Server is down. Could not open file  ${timeout} ${self._port_file}");
      }
      sleep(timeout / 80.0);
    }
    console.info("OMC Server is up and running at ${_omc_corba_uri} pid=${this._omc_process?.pid}");

    this._orb.registerStubClass(stub.Server)
    // connect to the WebSocket server
    this._orb.connect("ws://somehostname:8000/");

    // find the object registered as "MyServer"
    this._obj_reference = this._orb.resolve(this._ior);
    this._omc = stub.Server.narrow(_OMCIDL.OmcCommunication);

    //Find the root POA
    this._poa = this._orb.resolve_initial_references("RootPOA");
    //Convert the IOR into an object reference
    this._obj_reference = this._orb.string_to_object(this._ior);
    //Narrow the reference to the OmcCommunication object
    this._omc = this._obj_reference._narrow(_OMCIDL.OmcCommunication);
    //Check if we are using the right object
    if (this._omc == null)
      console.error("Object reference is not valid");
    throw new Error;
  }
}
 */
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
    lq_port: any;
    constructor(timeout?: number, docker?: null, dockerContainer?: null, dockerExtraArgs?: never[], dockerOpenModelicaPath?: string, dockerNetwork?: null, port?: null);
    /** OMCSessionZMQ的_connect_to_omc方法，需要与OMCsessionBase的加以区分
     * @description
     * @author 胡旭鹏
     * @date 14/01/2022
     * @memberof OMCSessionZMQ
     */
    _connect_to_omc(timeout: number): Promise<void>;
    sendExpression(command: string, parsed?: boolean): Promise<any>;
}
export default OMCSessionZMQ;

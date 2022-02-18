import { ChildProcess, spawn } from 'child_process';
import { ORB } from 'corba.js';
import fs, { existsSync } from 'fs';
import uuid from 'node-uuid';
import os from 'os';
import path from 'path';
import process from 'process';
import * as zmq from 'zeromq';
import { WsProtocol } from "corba.js/net/browser"

import { OMTypedParser } from './OMTypedParser';

//import readline from 'readline';
// let zmq = require("zeromq");
/****************************************************************
 * OMNodeJS is a Node interface to Openmodelica.
 ****************************************************************/
/**
 * @description
 * @author 胡旭鹏
 * @date 14/01/2022
 * @class OMCSessionHelper
 */
class OMCSessionHelper {
  omc_env_home: string;
  omhome: string;
  path_to_omc: string | undefined;
  constructor() {
    this.omc_env_home = process.env.OPENMODELICAHOME!;
    if (this.omc_env_home) {
      this.omhome = this.omc_env_home;
    } else {
      this.path_to_omc = this._get_omc_path();
      throw new Error(
        `could not find environment variable ${this.omc_env_home}`
      );
    }
  }
  _get_omc_path(): string {
    try {
      return path.join(this.omc_env_home, `bin`, `omc`);
    } catch (BaseException) {
      throw new Error(
        `The OpenModelica compiler is missing in the System path ${
          this.omc_env_home
        },please install it ${path.join(this.omhome, `bin`, `omc`)}`
      );
    }
  }
}
class OMCsessionBase extends OMCSessionHelper {
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
  omcCommand: string;
  omhome_bin: string | undefined;
  my_env: object;
  constructor(readonly = true) {
    super();
    this.readonly = readonly;
    this.omc_cache = [];
    this._omc_process = null;
    this._omc_command = undefined;
    this._omc = undefined;
    this._dockerCid = null;
    this._serverIPAddress = "127.0.0.1";
    this._interactivePort = null;
    this._temp_dir = os.tmpdir();
    this._random_string = uuid.v4();
    this._omc_log_file = undefined;
    this.extraFlags = undefined;
    this.omcCommand = "";
    this.omhome_bin = undefined;
    this.my_env = {};
    try {
      this._currentUser = os.userInfo().username;
      if (!this._currentUser) {
        this._currentUser = "nobody";
      }
    } catch (KeyError) {
      this._currentUser = "nobody";
    }
  }
  __del__() {
    try {
      this.sendExpression(`quit()`);
    } catch {}
    this._omc_log_file!.end();

    if (this._omc_process) {
      setTimeout(() => {
        process.exit(0);
      }, 200);
      this._omc_process.kill;
    }
  }
  _create_omc_log_file(suffix: string): void {
    if (os.platform() === "win32") {
      this._omc_log_file = fs.createWriteStream(
        path.join(
          this._temp_dir!,
          `openmodelica.${suffix}.${this._random_string}`
        ),
        { flags: "w+" }
      );
    } else {
      this._omc_log_file = fs.createWriteStream(
        path.join(
          this._temp_dir!,
          `openmodelica.${suffix}.${this._random_string}`
        ),
        { flags: "w+" }
      );
    }
  }
  /**
   * @description 基类的开启omc进程方法
   * @author 胡旭鹏
   * @date 25/01/2022
   * @param {number} timeout
   * @param {number} argv
   * @return {*}  {ChildProcess}
   * @memberof OMCsessionBase
   */
  _start_omc_process(timeout: number, argv: string[]): ChildProcess {
    if (os.platform() === "win32") {
      this.omhome_bin = path.join(this.omhome, "bin").replace("\\", "/");
      const my_env = process.env;
      my_env["PATH"] = this.omhome_bin + path.sep + my_env["PATH"];
      //这一块需要修改
      this._omc_process = spawn(this.omcCommand, argv, {
        env: my_env,
        // stdio: [this._omc_log_file, this._omc_log_file, this._omc_log_file],
        shell: os.platform() === "win32",
      });
    } else {
      this._omc_process = spawn(String(this.omcCommand), argv, {
        // stdio: [this._omc_log_file, this._omc_log_file, this._omc_log_file],
        shell: os.platform() === "win32",
      });
    }
    // this._omc_process.stdin?.pipe(this._omc_log_file!);
    // this._omc_process.stdout?.pipe(this._omc_log_file!);
    // this._omc_process.stderr?.pipe(this._omc_log_file!);
    this._omc_process.stdout?.on("data", (data: string) => {
      console.log(`stdout: ${data}`);
    });

    this._omc_process.stderr?.on("data", (data: string) => {
      console.error(`stderr: ${data}`);
    });
    this._omc_process.on("close", (code) => {
      if (code !== 0) {
        console.log(`_omc_process exited with code ${code}`);
      }
    });
    return this._omc_process;
  }

  /**
   * @description 方法废弃
   * @author 胡旭鹏
   * @date 14/01/2022
   * @memberof OMCsessionBase
   */
  _connect_to_omc(timeout: number) {}
  /**
   * @description 设置omc命令，里面的docker部分有问题，目前不可用，核心为改变_omc_command
   * @author 胡旭鹏
   * @date 14/01/2022
   * @param {Array<object>} omc_path_and_args_list
   * @memberof OMCsessionBase
   */
  _set_omc_command(omc_path_and_args_list: Array<string> = []) {
    // 此处省略docker部分判断
    if (os.platform() === "win32") {
      this.extraFlags = ["-d=zmqDangerousAcceptConnectionsFromAnywhere"];
      if (this._interactivePort) {
        throw new Error(
          "docker on Windows requires knowing which port to connect to. For dockerContainer=..., the container needs to have already manually exposed this port when it was started (-p 127.0.0.1:n:n) or you get an error later."
        );
      }
    } else {
      this.extraFlags = [];
    }
    if (false) {
      // docker部分后续加入
    } else {
      this.omcCommand = this._get_omc_path();
    }
    if (this._interactivePort) {
      this.extraFlags.push(`--interactivePort=${this._interactivePort}`);
    }
    omc_path_and_args_list = omc_path_and_args_list!.concat(this.extraFlags);
    if (os.platform() === "win32") {
      this._omc_command = omc_path_and_args_list;
    } else {
      // 非win32平台后续加入
    }
  }
  /**
   * @description 向omc发送表达式
   * @author 胡旭鹏
   * @date 13/01/2022
   * @param {string} command
   * @param {boolean} [parsed=true]
   * @memberof OMCsessionBase
   */
  sendExpression(command: string, parsed: boolean = true): object {
    throw new Error("Function not implemented.");
  }

  /**
   * @description 发送请求字符串
   * @author 胡旭鹏
   * @date 13/01/2022
   * @param {string} question
   * @param {*} [opt=null]
   * @param {boolean} [parsed=true]
   * @memberof OMCsessionBase
   */
  ask(question: string, opt: any = null, parsed: boolean = true): object {
    let expression: string;
    let res = {};
    const p = { question, opt, parsed };
    const _p_index = this.omc_cache?.indexOf(p);
    if (this.readonly && question !== "getErrorString") {
      if (_p_index) {
        return this.omc_cache![_p_index];
      }
    }
    if (opt) {
      expression = `${question}(${opt})`;
    } else {
      expression = question;
    }
    console.log(`OMC ask: ${expression}  - parsed: ${parsed}`);
    try {
      if (parsed) {
        res = execute(expression);
      } else {
        res = this.sendExpression(expression, (parsed = false));
      }
    } catch {
      console.error(`OMC failed: ${question}, ${opt}, parsed=${parsed}`);
    }
    this.omc_cache![_p_index!] = res;
    return res;
  }
}

/**
 * @description 这个方法有问题，目前先不要使用
 * @author 胡旭鹏
 * @date 13/01/2022
 * @class OMCSession
 */
class OMCSession extends OMCsessionBase {
  _port_file: string;
  _docker: string | null;
  _dockerContainer: string | null;
  _dockerExtraArgs: Array<string> | null;
  _dockerOpenModelicaPath: string | null;
  _dockerNetwork: string | null;
  _timeout: number;
  _port: any;
  _orb: ORB | undefined;
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
      path.join(
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
    path.join(this.omhome, 'lib', 'python');
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
        const name = this._omc_log_file?.path;
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
        let name = this._omc_log_file?.path;
        this._omc_log_file?.close;
        console.error('OMC Server is down (timeout=${fs.readFileSync(name as string)}). Please start it! Log-file says:\n${fs.readFileSync(name as string)}');
        throw new Error("OMC Server is down. Could not open file  ${timeout} ${self._port_file}");
      }
      sleep(timeout / 80.0);
    }
    console.info("OMC Server is up and running at ${_omc_corba_uri} pid=${this._omc_process?.pid}");
    this._orb = new ORB();

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

/**
 * @description 目前使用该方式进行通讯
 * @author 胡旭鹏
 * @date 13/01/2022
 * @class OMCSessionZMQ
 */
class OMCSessionZMQ extends OMCsessionBase {
  _port_file: string;
  _docker: string | null;
  _dockerContainer: string | null;
  _dockerExtraArgs: Array<string> | null;
  _dockerOpenModelicaPath: string | null;
  _dockerNetwork: string | null;
  _timeout: number;
  constructor(
    timeout = 10.0,
    docker = null,
    dockerContainer = null,
    dockerExtraArgs = [],
    dockerOpenModelicaPath = "omc",
    dockerNetwork = null,
    port = null
  ) {
    super();
    // OMCSessionHelper.constructor();
    // OMCsessionBase.constructor(readonly);
    if (os.platform() != "win32" || docker || dockerContainer) {
      this._port_file =
        "openmodelica." + this._currentUser + ".port." + this._random_string;
    } else {
      this._port_file = "openmodelica.port." + this._random_string;
    }
    this._docker = docker;
    this._dockerContainer = dockerContainer;
    this._dockerExtraArgs = dockerExtraArgs;
    this._dockerOpenModelicaPath = dockerOpenModelicaPath;
    this._dockerNetwork = dockerNetwork;
    //this._create_omc_log_file("port");
    this._timeout = timeout;
    this._port_file = String(
      path.join(docker ? "/tmp" : this._temp_dir!, this._port_file)
    );
    this._interactivePort = port;
    this._set_omc_command();
    this._start_omc_process(timeout, [
      "--interactive=zmq",
      "--locale=C",
      `-z=${this._random_string}`,
    ]);
    this._connect_to_omc(timeout);
  }

  /** OMCSessionZMQ的_connect_to_omc方法，需要与OMCsessionBase的加以区分
   * @description
   * @author 胡旭鹏
   * @date 14/01/2022
   * @memberof OMCSessionZMQ
   */
  _connect_to_omc(timeout: number) {
    const _omc_zeromq_uri = "file:///" + this._port_file;
    let attempts = 0;
    let _port: string = "";
    while (true) {
      attempts += 1;
      if (existsSync(this._port_file)) {
        try {
          _port = fs.readFileSync(this._port_file, "utf8");
          break;
        } catch (err) {
          console.error(
            `_port_file read fail,name: ${this._port_file}, try again, times: ${attempts}`
          );
        }
      }
      sleep(timeout / 80);
      if (attempts == 80) {
        const temname = this._omc_log_file?.path;
        this._omc_log_file?.close();
        console.error(
          `OMC Server did not start (timeout=${timeout}). Please start it! Log-file says:\n${fs.readFileSync(
            temname as string
          )}`
        );
      }
    }
    _port = _port.replace("0.0.0.0", this._serverIPAddress!);
    console.info(
      `OMC Server is up and running at ${_omc_zeromq_uri} pid=${this._omc_process?.pid}`
    );
    // this._omc = new zmq.Request({ linger: 0 }); //linger:Dismisses pending messages if closed
    this._omc = new zmq.Request();
    this._omc?.connect(_port);
    console.info("OMC Client is up and running");
    // this._omc.on("message", (msg: string) => {
    //   console.log(`OMC_Client read: ${msg}`);
    // });
  }

  async sendExpression(command: string, parsed: boolean = true) {
    const p = this._omc_process?.exitCode; //如果还在运行就是null
    if (p == null) {
      let attempts = 0;
      while (true) {
        try {
          //发送command字符串
          await this._omc?.send(String(command));
          let result = await this._omc?.receive();
          if (parsed) {
            let result_str = OMTypedParser.parseString(String(result));
            return result_str;
          } else {
            return result?.toString();
          }
        } catch (err) {}
        attempts++;
        if (attempts == 50.0) {
          let name = this._omc_log_file?.path;
          this._omc_log_file?.close();
          throw new Error(
            `No connection with OMC (timeout=${this._timeout}). Log-file says: \n${name}`
          );
        }
        sleep(this._timeout / 50.0);
      }
    } else {
      throw new Error(
        `Process Exited, No connection with OMC. Create a new instance of OMCSession`
      );
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}
function execute(expression: string): {} {
  throw new Error("Function not implemented.");
}
export default OMCSessionZMQ;

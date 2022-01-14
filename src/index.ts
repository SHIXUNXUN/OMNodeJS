/****************************************************************
 * OMNode is a Node interface to Openmodelica.
 ****************************************************************/
import { ChildProcess } from 'child_process';
import fs from 'fs';
import uuid from 'node-uuid';
import os from 'os';
import path from 'path';
import process from 'process';

process.on("beforeExit", (code) => {
  console.log("Process beforeExit event with code: ", code);
});

/**
 * @class OMCSessionHelper
 * @description Get the path to the OMC executable, if not installed this will be None
 */
class OMCSessionHelper {
  omc_env_home: string;
  omhome: string;
  constructor() {
    this.omc_env_home = process.env.OPENMODELICAHOME!;
    if (this.omc_env_home) {
      this.omhome = this.omc_env_home;
    } else {
      path_to_omc = fs.statSync();
      throw new Error(
        `could not find environment variable ${this.omc_env_home}`
      );
    }
  }
  _get_omc_path(this: any): string {
    try {
      return path.join(this.omc_env_home, `bin`, `omc`);
    } catch (BaseException) {
      throw new Error(
        `The OpenModelica compiler is missing in the System path ${
          this.omc_env_home
        },please install it ${path.join(this.omc_env, `bin`, `omc`)}`
      );
    }
  }
}
class OMCsessionBase extends OMCSessionHelper {
  readonly: true | false | undefined;
  omc_cache: Array<object> | undefined;
  _omc_process: ChildProcess | null;
  _omc_command: Array<string> | null | undefined;
  _omc: null | undefined;
  _dockerCid: null | undefined;
  _serverIPAddress: string | undefined;
  _interactivePort: null | undefined;
  _temp_dir: string | undefined;
  _random_string: string | undefined;
  _omc_log_file: fs.WriteStream | undefined;
  _currentUser: string | undefined;
  extraFlags: string[] | undefined;
  omcCommand: Array<string>;
  omhome_bin: string | undefined;
  constructor(readonly = false) {
    super();
    this.readonly = readonly;
    this.omc_cache = [];
    this._omc_process = null;
    this._omc_command = null;
    this._omc = null;
    this._dockerCid = null;
    this._serverIPAddress = "127.0.0.1";
    this._interactivePort = null;
    this._temp_dir = os.tmpdir();
    this._random_string = uuid.v4();
    this._omc_log_file = undefined;
    this.extraFlags = undefined;
    this.omcCommand = [];
    this.omhome_bin = undefined;
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
          `openmodelica.${this._currentUser}.${suffix}.${this._random_string}.log`
        )
      );
    } else {
      this._omc_log_file = fs.createWriteStream(
        path.join(
          this._temp_dir!,
          `openmodelica.${suffix}.${this._random_string}.log`
        )
      );
    }
  }
  _start_omc_process(timeout: number) {
    if (os.platform() === "win32") {
      this.omhome_bin = path.join(this.omhome, "bin");
    }
  }

  /**
   * @description 设置omc命令，里面的docker部分有问题，目前不可用
   * @author 胡旭鹏
   * @date 14/01/2022
   * @param {Array<object>} omc_path_and_args_list
   * @memberof OMCsessionBase
   */
  _set_omc_command(omc_path_and_args_list: Array<string>) {
    // 此处省略docker部分判断
    if (os.platform() === "win32") {
      this.extraFlags = ["-d=zmqDangerousAcceptConnectionsFromAnywhere"];
      if (!this._interactivePort) {
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
      this.omcCommand = [this._get_omc_path()];
    }
    if (this._interactivePort) {
      this.extraFlags.push(`--interactivePort=${this._interactivePort}`);
    }
    omc_path_and_args_list = this.omcCommand.concat(
      omc_path_and_args_list,
      this.extraFlags
    );
    if (os.platform() === "win32") {
      this._omc_command = omc_path_and_args_list;
    } else {
      // 非win32平台后续加入
    }
    return this._omc_command;
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
class OMCSession {
  OMCSessionHelper = new OMCSessionHelper();
  OMCsessionBase = new OMCsessionBase();
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
    OMCsessionBase: { constructor: (arg0: boolean) => void },
    readonly = false,
    timeout = 10.0,
    docker = null,
    dockerContainer = null,
    dockerExtraArgs = [],
    dockerOpenModelicaPath = "omc",
    dockerNetwork = null,
    port = null
  ) {
    super();
    OMCSessionHelper.constructor();
    OMCsessionBase.constructor(readonly);
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
    this._create_omc_log_file("port");
    this._timeout = timeout;
    this._port_file = String(
      path
        .join(docker ? "/tmp" : this._temp_dir!, this._port_file)
        .replace("\\", "/")
    );
    this._interactivePort = port;
    this._set_omc_command([
      "--interactive=zmq",
      "--locale=C",
      `-z=${this._random_string}`,
    ]);
    self._start_omc_process(timeout);
    self._connect_to_omc(timeout);
  }
}

function execute(expression: string): object {
  throw new Error("Function not implemented.");
}
function sleep(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

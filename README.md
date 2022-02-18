# OMNodeJS
coded by hxp(胡旭鹏) 445767397@qq.com
OMNodeJS is a NodeJS interface that uses ZeroMQ or CORBA (omniORB) to communicate with OpenModelica.
___
## Usage Examples
```typescript
import OMNodeJS from 'OMNodeJS'
const OMNodeJS = new OMNodeJS

//'your command is OpenModelica interface'
OMNodeJS.sendExpression('your command')
```
___
## Methods
**_connect_to_omc**
**sendExpression**
___
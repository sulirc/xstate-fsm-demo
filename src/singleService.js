
/**
 * Single service
 */
import { interpret } from '@xstate/fsm';
import { appMachine } from './App';
import { getId } from './utils';

// 将纯函数的状态机编译为服务，用户表达副作用
const appService = interpret(appMachine).start();

// 订阅服务
appService.subscribe(currentState => {
  if(currentState.changed) {
    // 监听状态变化，干点什么都行
    console.log(currentState);
  }
});

// 通过发送事件，修改应用状态
// LOAD 发送前，服务处于 idle 状态。发送后，就会使得应用的状态从 idle 转换为 loading 状态。
appService.send({ type: 'LOAD', id: getId() });

// 因为已经处于 loading 状态。loading 状态没有注册 LOAD 的事件，因此什么事情也不干
appService.send({ type: 'LOAD', id: getId() });

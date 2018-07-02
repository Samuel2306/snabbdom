/**
 * snabbdom中对事件处理做了一层包装，真实DOM的事件触发的是对vnode的操作
 * 主要途径：
 *    createListner => 返回handler作事件监听生成器 =>handler上绑定vnode =>将handler作真实DOM的事件处理器
 *    真实DOM事件触发后 => handler获得真实DOM的事件对象 => 将真实DOM事件对象传入handleEvent => handleEvent找到对应的vnode事件处理器，然后调用这个处理器从而修改vnode
 */

import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type On = {
  [N in keyof HTMLElementEventMap]?: (ev: HTMLElementEventMap[N]) => void
} & {
  [event: string]: EventListener
};


// 对vnode进行事件处理
function invokeHandler(handler: any, vnode?: VNode, event?: Event): void {
  if (typeof handler === "function") {
    // call function handler
    // 将事件处理器的上下文设置为vnode
    handler.call(vnode, event, vnode);
  }
  //存在事件绑定数据或者存在多事件处理器
  else if (typeof handler === "object") {
    // call handler with arguments
    // 说明只有一个事件处理器
    if (typeof handler[0] === "function") {
      // special case for single argument for performance
      //如果绑定数据只有一个，则直接将数据用call的方式调用，提高性能
      //形如on:{click:[handler,1]}
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        //如果存在多个绑定数据，则要转化为数组，用apply的方式调用，而apply性能比call差
        //形如:on:{click:[handler,1,2,3]}
        var args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      // call multiple handlers
      //如果存在多个相同事件的不同处理器，则递归调用
      //如on：{click:[[handeler1,1],[handler,2]]}
      for (var i = 0; i < handler.length; i++) {
        invokeHandler(handler[i]);
      }
    }
  }
}
/**
 *
 * @param event 真实dom的事件对象
 * @param vnode
 */
function handleEvent(event: Event, vnode: VNode) {
  var name = event.type,
      on = (vnode.data as VNodeData).on;

  // call event handler(s) if exists
  // 如果找到对应的vnode事件处理器，则调用
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}
//事件监听器生成器，用于处理真实DOM事件
function createListener() {
  return function handler(event: Event) {
    handleEvent(event, (handler as any).vnode);
  }
}
//更新事件监听
function updateEventListeners(oldVnode: VNode, vnode?: VNode): void {
  var oldOn = (oldVnode.data as VNodeData).on,
      oldListener = (oldVnode as any).listener,
      oldElm: Element = oldVnode.elm as Element,
      on = vnode && (vnode.data as VNodeData).on,
      elm: Element = (vnode && vnode.elm) as Element,
      name: string;

  // optimization for reused immutable handlers
  // 如果新旧事件监听器一样，则直接返回
  if (oldOn === on) {
    return;
  }

  // remove existing listeners which no longer used
  //如果新节点上没有事件监听，则将旧节点上的事件监听都删除
  if (oldOn && oldListener) {
    // if element changed or deleted we remove all existing listeners unconditionally
    if (!on) {
      for (name in oldOn) {
        // remove listener if element was changed or existing listeners removed
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      //删除旧节点中新节点不存在的事件监听
      for (name in oldOn) {
        // remove listener if existing listener removed
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (on) {
    // reuse existing listener or create new
    //如果oldvnode上已经有listener，则vnode直接复用，否则则新建事件处理器
    var listener = (vnode as any).listener = (oldVnode as any).listener || createListener();
    // update vnode for listener
    //在事件处理器上绑定vnode
    listener.vnode = vnode;

    // if element changed or added we add all needed listeners unconditionally
    //如果oldvnode上没有事件处理器
    if (!oldOn) {
      for (name in on) {
        // add listener if element was changed or new listeners added
        //直接将vnode上的事件处理器添加到elm上
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (name in on) {
        // add listener if new listener added
        //否则添加oldvnode上没有的事件处理器
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}

export const eventListenersModule = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners
} as Module;
export default eventListenersModule;
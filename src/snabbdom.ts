/* global module, document, Node */
/**
 * snabbdom 核心，包含diff，patch等操作
 * https://segmentfault.com/a/1190000009017349
 */
import {Module} from './modules/module';
import {Hooks} from './hooks';
import vnode, {VNode, VNodeData, Key} from './vnode';
import * as is from './is';
import htmlDomApi, {DOMAPI} from './htmldomapi';

function isUndef(s: any): boolean { return s === undefined; }
function isDef(s: any): boolean { return s !== undefined; }

type VNodeQueue = Array<VNode>;

const emptyNode = vnode('', {}, [], undefined, undefined);

// 用于同层次的oldvnode与vnode的比较，如果同层次节点的key和sel都相同我们就可以保留这个节点，否则直接替换节点
function sameVnode(vnode1: VNode, vnode2: VNode): boolean {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function isVnode(vnode: any): vnode is VNode {
  return vnode.sel !== undefined;
}

type KeyToIndexMap = {[key: string]: number};

type ArraysOf<T> = {
  [K in keyof T]: (T[K])[];
}

type ModuleHooks = ArraysOf<Module>;

// 将oldvnode数组中位置对oldvnode.key的映射转换为oldvnode.key对位置的映射
function createKeyToOldIdx(children: Array<VNode>, beginIdx: number, endIdx: number): KeyToIndexMap {
  let i: number, map: KeyToIndexMap = {}, key: Key | undefined, ch;
  for (i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];
    if (ch != null) {
      key = ch.key;
      if (key !== undefined) map[key] = i;
    }
  }
  return map;
}

// 钩子函数：https://segmentfault.com/a/1190000009017349
// 以下这六个是全局钩子
const hooks: (keyof Module)[] = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

export {h} from './h';
export {thunk} from './thunk';

/**
 *
 * @param modules：init依赖的模块，如attribute、props、eventlistener这些模块
 * @param domApi：对封装真实DOM操作的工具函数库，如果我们没有传入，则默认
 使用snabbdom提供的htmldomapi
 * @returns {function((VNode|Element), VNode): VNode}
 * init还包含了许多vnode和真实DOM之间的操作和注册全局钩子，
 还有patchVnode和updateChildren这两个重要功能，然后返回一个patch函数
 */
export function init(modules: Array<Partial<Module>>, domApi?: DOMAPI) {
  let i: number, j: number, cbs = ({} as ModuleHooks);

  const api: DOMAPI = domApi !== undefined ? domApi : htmlDomApi;

  //注册钩子的回调，在发生状态变更时，触发对应属性变更
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      const hook = modules[j][hooks[i]];
      if (hook !== undefined) {
        (cbs[hooks[i]] as Array<any>).push(hook);
      }
    }
  }

  // 本函数主要的功能是将一个真实DOM节点转化成vnode形式
  // 如<div id='a' class='b c'></div>将转换为{sel:'div#a.b.c',data:{},children:[],text:undefined,elm:<div id='a' class='b c'>}
  function emptyNodeAt(elm: Element) {
    const id = elm.id ? '#' + elm.id : '';
    const c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
    return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
  }

  // 当我们需要remove一个vnode时，会触发remove钩子作拦截器，只有在所有remove钩子回调函数都触发完才会将节点从父节点删除，而这个函数提供的就是对remove钩子回调操作的计数功能
  function createRmCb(childElm: Node, listeners: number) {
    return function rmCb() {
      if (--listeners === 0) {
        const parent = api.parentNode(childElm);
        api.removeChild(parent, childElm);
      }
    };
  }

  /**
   * 主要功能如下：
   *    初始化vnode，调用init钩子
   *    创建对应tagname的DOM element节点，并将vnode.sel中的id名和class名挂载上去
   *    如果有子vnode，递归创建DOM element节点，并添加到父vnode对应的element节点上去，否则如果有text属性，则创建text节点，并添加到父vnode对应的element节点上去
   *    vnode转换成dom节点操作完成后，调用create钩子
   *    如果vnode上有insert钩子，那么就将这个vnode放入insertedVnodeQueue中作记录，到时再在全局批量调用insert钩子回调
   */
  function createElm(vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
    let i: any, data = vnode.data;
    if (data !== undefined) {
      //当节点上存在hook而且hook中有init钩子时，先调用init回调，对刚创建的vnode进行处理
      if (isDef(i = data.hook) && isDef(i = i.init)) {
        i(vnode);
        //获取init钩子修改后的数据
        data = vnode.data;
      }
    }
    let children = vnode.children, sel = vnode.sel;
    if (sel === '!') {
      if (isUndef(vnode.text)) {
        vnode.text = '';
      }
      vnode.elm = api.createComment(vnode.text as string);
    } else if (sel !== undefined) {
      // Parse selector
      const hashIdx = sel.indexOf('#');
      //先id后class
      const dotIdx = sel.indexOf('.', hashIdx);
      const hash = hashIdx > 0 ? hashIdx : sel.length;
      const dot = dotIdx > 0 ? dotIdx : sel.length;
      const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      //创建一个DOM节点引用，并对其属性实例化
      const elm = vnode.elm = isDef(data) && isDef(i = (data as VNodeData).ns) ? api.createElementNS(i, tag)
                                                                               : api.createElement(tag);
      //获取id名 #a --> a
      if (hash < dot) elm.setAttribute('id', sel.slice(hash + 1, dot));
      //获取类名，并格式化  .a.b --> a b
      if (dotIdx > 0) elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      //如果存在子元素Vnode节点，则递归将子元素节点插入到当前Vnode节点中，并将已插入的子元素节点在insertedVnodeQueue中作记录
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          const ch = children[i];
          if (ch != null) {
            api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue));
          }
        }
      }
      // 如果存在子文本节点，则直接将其插入到当前Vnode节点
      else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text));
      }
      i = (vnode.data as VNodeData).hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        //如果有insert钩子，则推进insertedVnodeQueue中作记录，从而实现批量插入触发insert回调
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    }
    // 如果没声明选择器，则说明这个是一个text节点
    else {
      vnode.elm = api.createTextNode(vnode.text as string);
    }
    return vnode.elm;
  }
  // 将vnode转换后的dom节点插入到dom树的指定位置中去
  function addVnodes(parentElm: Node,
                     before: Node | null,
                     vnodes: Array<VNode>,
                     startIdx: number,
                     endIdx: number,
                     insertedVnodeQueue: VNodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx];
      if (ch != null) {
        api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
      }
    }
  }
  // 用于手动触发destory钩子回调
  function invokeDestroyHook(vnode: VNode) {
    let i: any, j: number, data = vnode.data;
    if (data !== undefined) {
      //先触发该节点上的destory回调
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode);
      //在触发全局下的destory回调
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      //递归触发子节点的destory回调
      if (vnode.children !== undefined) {
        for (j = 0; j < vnode.children.length; ++j) {
          i = vnode.children[j];
          if (i != null && typeof i !== "string") {
            invokeDestroyHook(i);
          }
        }
      }
    }
  }
  // 主要功能是批量删除DOM节点，需要配合invokeDestoryHook和createRmCb服用，效果更佳
  /**
   *
   * @param parentElm 父节点
   * @param vnodes  删除节点数组
   * @param startIdx  删除起始坐标
   * @param endIdx  删除结束坐标
   */
  function removeVnodes(parentElm: Node,
                        vnodes: Array<VNode>,
                        startIdx: number,
                        endIdx: number): void {
    for (; startIdx <= endIdx; ++startIdx) {
      let i: any, listeners: number, rm: () => void, ch = vnodes[startIdx];
      if (ch != null) {
        if (isDef(ch.sel)) {
          //调用destroy钩子
          invokeDestroyHook(ch);
          //对全局remove钩子进行计数
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm as Node, listeners);
          //调用全局remove回调函数，并每次减少一个remove钩子计数
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          //调用内部vnode.data.hook中的remove钩子（只有一个）
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            //如果没有内部remove钩子，需要调用rm，确保能够remove节点
            rm();
          }
        } else { // Text node
          api.removeChild(parentElm, ch.elm as Node);
        }
      }
    }
  }

  function updateChildren(parentElm: Node,
                          oldCh: Array<VNode>,
                          newCh: Array<VNode>,
                          insertedVnodeQueue: VNodeQueue) {
    let oldStartIdx = 0, newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1;
    let oldStartVnode = oldCh[0];
    let oldEndVnode = oldCh[oldEndIdx];
    let newEndIdx = newCh.length - 1;
    let newStartVnode = newCh[0];
    let newEndVnode = newCh[newEndIdx];
    let oldKeyToIdx: any;
    let idxInOld: number;
    let elmToMove: VNode;
    let before: any;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVnode == null) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
      } else if (oldEndVnode == null) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (newStartVnode == null) {
        newStartVnode = newCh[++newStartIdx];
      } else if (newEndVnode == null) {
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm as Node, api.nextSibling(oldEndVnode.elm as Node));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm as Node, oldStartVnode.elm as Node);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        }
        idxInOld = oldKeyToIdx[newStartVnode.key as string];
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          if (elmToMove.sel !== newStartVnode.sel) {
            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          } else {
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined as any;
            api.insertBefore(parentElm, (elmToMove.elm as Node), oldStartVnode.elm as Node);
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      if (oldStartIdx > oldEndIdx) {
        before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm;
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
      }
    }
  }

  function patchVnode(oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
    let i: any, hook: any;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    const elm = vnode.elm = (oldVnode.elm as Node);
    let oldCh = oldVnode.children;
    let ch = vnode.children;
    if (oldVnode === vnode) return;
    if (vnode.data !== undefined) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh as Array<VNode>, ch as Array<VNode>, insertedVnodeQueue);
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        addVnodes(elm, null, ch as Array<VNode>, 0, (ch as Array<VNode>).length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh as Array<VNode>, 0, (oldCh as Array<VNode>).length - 1);
      } else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text as string);
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
    let i: number, elm: Node, parent: Node;
    const insertedVnodeQueue: VNodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode);
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      elm = oldVnode.elm as Node;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm as Node, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      (((insertedVnodeQueue[i].data as VNodeData).hook as Hooks).insert as any)(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

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

// 定义一种全部由VNode组成的数组
type VNodeQueue = Array<VNode>;

// 定义一个创建空node的方法
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

  // 对于同层的子节点，snabbdom是主要有删除、创建的操作，同时通过移位的方法，达到最大复用存在节点的目的其中需要维护四个索引，分别是：
  /*
    oldStartIdx => 旧头索引
    oldEndIdx => 旧尾索引
    newStartIdx => 新头索引
    newEndIdx => 新尾索引
  */
  // 然后开始将旧子节点组和新子节点组进行逐一比对，直到遍历完任一子节点组，比对策略有5种：
  /**
   * oldStartVnode和newStartVnode进行比对，如果相似，则进行patch，然后新旧头索引都后移
   * oldEndVnode和newEndVnode进行比对，如果相似，则进行patch，然后新旧尾索引前移
   * oldStartVnode和newEndVnode进行比对，如果相似，则进行patch，将旧节点移位到最后
   *    然后旧头索引后移，尾索引前移，为什么要这样做呢？我们思考一种情况，如旧节点为【5,1,2,3,4】
        ，新节点为【1,2,3,4,5】，如果缺乏这种判断，意味着需要先将5->1,1->2,2->3,3->4,4->5五
        次删除插入操作，即使是有了key-index来复用，也会出现也会出现【5,1,2,3,4】->
        【1,5,2,3,4】->【1,2,5,3,4】->【1,2,3,5,4】->【1,2,3,4,5】共4次操作，如果
        有了这种判断，我们只需要将5插入到旧尾索引后面即可，从而实现右移
   * oldEndVnode和newStartVnode进行比对，处理和上面类似，只不过改为左移
   * 如果以上情况都失败了，我们就只能复用key相同的节点了。首先我们要通过createKeyToOldIdx
   *    创建key-index的映射，如果新节点在旧节点中不存在，我们将它插入到旧头索引节点前，
        然后新头索引向后；如果新节点在就旧节点组中存在，先找到对应的旧节点，然后patch，并将
        旧节点组中对应节点设置为undefined,代表已经遍历过了，不再遍历，否则可能存在重复
        插入的问题，最后将节点移位到旧头索引节点之前，新头索引向后
   * 遍历完之后，将剩余的新Vnode添加到最后一个新节点的位置后或者删除多余的旧节点
     */
  /**
   *
   * @param parentElm 父节点
   * @param oldCh 旧节点数组
   * @param newCh 新节点数组
   * @param insertedVnodeQueue
     */
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
      }
      // 如果旧头索引节点和新头索引节点相同
      else if (sameVnode(oldStartVnode, newStartVnode)) {
        //对旧头索引节点和新头索引节点进行diff更新， 从而达到复用节点效果
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        //旧头索引向后
        oldStartVnode = oldCh[++oldStartIdx];
        //新头索引向后
        newStartVnode = newCh[++newStartIdx];
      }
      //如果旧尾索引节点和新尾索引节点相似，可以复用
      else if (sameVnode(oldEndVnode, newEndVnode)) {
        //旧尾索引节点和新尾索引节点进行更新
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        //旧尾索引向前
        oldEndVnode = oldCh[--oldEndIdx];
        //新尾索引向前
        newEndVnode = newCh[--newEndIdx];
      }
      //如果旧头索引节点和新头索引节点相似，可以通过移动来复用
      //如旧节点为【5,1,2,3,4】，新节点为【1,2,3,4,5】，如果缺乏这种判断，意味着
      //那样需要先将5->1,1->2,2->3,3->4,4->5五次删除插入操作，即使是有了key-index来复用，
      // 也会出现【5,1,2,3,4】->【1,5,2,3,4】->【1,2,5,3,4】->【1,2,3,5,4】->【1,2,3,4,5】
      // 共4次操作，如果有了这种判断，我们只需要将5插入到最后一次操作即可
      else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm as Node, api.nextSibling(oldEndVnode.elm as Node));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      }
      //原理与上面相同
      else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm as Node, oldStartVnode.elm as Node);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      }
      //如果上面的判断都不通过，我们就需要key-index表来达到最大程度复用了
      else {
        //如果不存在旧节点的key-index表，则创建
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        }
        //找到新节点在旧节点组中对应节点的位置
        idxInOld = oldKeyToIdx[newStartVnode.key as string];
        //如果新节点在旧节点中不存在，我们将它插入到旧头索引节点前，然后新头索引向后
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          newStartVnode = newCh[++newStartIdx];
        } else {
          //如果新节点在就旧节点组中存在，先找到对应的旧节点
          elmToMove = oldCh[idxInOld];
          if (elmToMove.sel !== newStartVnode.sel) {
            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm as Node);
          } else {
            //先将新节点和对应旧节点作更新
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
            //然后将旧节点组中对应节点设置为undefined,代表已经遍历过了，不在遍历，否则可能存在重复插入的问题

            oldCh[idxInOld] = undefined as any;
            //插入到旧头索引节点之前
            api.insertBefore(parentElm, (elmToMove.elm as Node), oldStartVnode.elm as Node);
          }
          //新头索引向后
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      //当旧头索引大于旧尾索引时，代表旧节点组已经遍历完，将剩余的新Vnode添加到最后一个新节点的位置后
      if (oldStartIdx > oldEndIdx) {
        before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm;
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      }
      //如果新节点组先遍历完，那么代表旧节点组中剩余节点都不需要，所以直接删除
      else {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
      }
    }
  }

  function patchVnode(oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
    let i: any, hook: any;
    // 在patch之前，先调用vnode.data的prepatch钩子
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    const elm = vnode.elm = (oldVnode.elm as Node);
    let oldCh = oldVnode.children;
    let ch = vnode.children;
    // 如果oldvnode和vnode的引用相同，说明没发生任何变化直接返回，避免性能浪费
    if (oldVnode === vnode) return;
    // 如果vnode和oldvnode相似，那么我们要对oldvnode本身进行更新
    if (vnode.data !== undefined) {
      // 首先调用全局的update钩子，对vnode.elm本身属性进行更新
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      // 然后调用vnode.data里面的update钩子,再次对vnode.elm更新
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    // 如果vnode不是text节点
    if (isUndef(vnode.text)) {
      // 如果vnode和oldVnode都有子节点
      if (isDef(oldCh) && isDef(ch)) {
        // 当Vnode和oldvnode的子节点不同时，调用updatechilren函数，diff子节点
        if (oldCh !== ch) updateChildren(elm, oldCh as Array<VNode>, ch as Array<VNode>, insertedVnodeQueue);
      }
      // 如果vnode有子节点，oldvnode没子节点
      else if (isDef(ch)) {
        //oldvnode是text节点，则将elm的text清除
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        //并添加vnode的children
        addVnodes(elm, null, ch as Array<VNode>, 0, (ch as Array<VNode>).length - 1, insertedVnodeQueue);
      }
      // 如果oldvnode有children，而vnode没children，则移除elm的children
      else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh as Array<VNode>, 0, (oldCh as Array<VNode>).length - 1);
      }
      // 如果vnode和oldvnode都没chidlren，且vnode没text，则删除oldvnode的text
      else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    }
    // 如果oldvnode的text和vnode的text不同，则更新为vnode的text
    else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text as string);
    }
    // patch完，触发postpatch钩子
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }
  // 我们需要明确的一个是，如果按照传统的diff算法，那么为了找到最小变化，需要逐层逐层的去搜索比较，这样时间复杂度将会达到 O(n^3)的级别，代价十分高
  // vdom采取的是一种简化的思路，只比较同层节点，如果不同，那么即使该节点的子节点没变化，我们也不复用，直接将从父节点开始的子树全部删除，然后再重新创建节点添加到新的位置。如果父节点没变化，我们就比较所有同层的子节点，对这些子节点进行删除、创建、移位操作
  // patch只需要对两个vnode进行判断是否相似，如果相似，则对他们进行patchVnode操作，否则直接用vnode替换oldvnode
  return function patch(oldVnode: VNode | Element, vnode: VNode): VNode {
    let i: number, elm: Node, parent: Node;
    // 记录被插入的vnode队列，用于批触发insert
    const insertedVnodeQueue: VNodeQueue = [];
    //调用全局pre钩子
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
    // 如果oldvnode是dom节点，转化为oldvnode
    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode);
    }
    // 如果oldvnode与vnode相似，进行更新
    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      // 否则，将vnode插入，并将oldvnode从其父节点上直接删除
      elm = oldVnode.elm as Node;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm as Node, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }
    // 插入完后，调用被插入的vnode的insert钩子
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      (((insertedVnodeQueue[i].data as VNodeData).hook as Hooks).insert as any)(insertedVnodeQueue[i]);
    }
    // 然后调用全局下的post钩子
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    // 返回vnode用作下次patch的oldvnode
    return vnode;
  };
}

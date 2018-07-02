import {vnode, VNode, VNodeData} from './vnode';
export type VNodes = Array<VNode>;
export type VNodeChildElement = VNode | string | number | undefined | null;
export type ArrayOrElement<T> = T | T[];
export type VNodeChildren = ArrayOrElement<VNodeChildElement>
import * as is from './is';

// 添加命名空间（svg才需要）
function addNS(data: any, children: VNodes | undefined, sel: string | undefined): void {
  data.ns = 'http://www.w3.org/2000/svg';
  if (sel !== 'foreignObject' && children !== undefined) {
    // 递归为子节点添加命名空间
    for (let i = 0; i < children.length; ++i) {
      let childData = children[i].data;
      if (childData !== undefined) {
        addNS(childData, (children[i] as VNode).children as VNodes, children[i].sel);
      }
    }
  }
}

export function h(sel: string): VNode;
export function h(sel: string, data: VNodeData): VNode;
export function h(sel: string, children: VNodeChildren): VNode;
export function h(sel: string, data: VNodeData, children: VNodeChildren): VNode;
// h是一个包装函数，主要是在vnode上再做一层包装：
  // 如果是svg，则为其添加命名空间
  // 将children中的text包装成vnode形式
//将VNode渲染为VDOM
/**
 * @param sel 选择器
 * @param b    数据
 * @param c    子节点
 * @returns {{sel, data, children, text, elm, key}}
 */
export function h(sel: any, b?: any, c?: any): VNode {
  var data: VNodeData = {}, children: any, text: any, i: number;
  // 如果存在子节点
  if (c !== undefined) {
    // 那么h的第二项就是data
    data = b;
    // 如果c是数组，那么存在子element节点
    if (is.array(c)) { children = c; }
    // 否则为子text节点
    else if (is.primitive(c)) { text = c; }
    else if (c && c.sel) { children = [c]; }
  }
  // 如果c不存在，只存在b，那么说明需要渲染的vdom不存在data部分，只存在子节点部分
  else if (b !== undefined) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else if (b && b.sel) { children = [b]; }
    else { data = b; }
  }
  if (children !== undefined) {
    for (i = 0; i < children.length; ++i) {
      // 如果子节点数组中，存在节点是原始类型，说明该节点是text节点，因此我们将它渲染为一个只包含text的VNode
      if (is.primitive(children[i])) children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
    }
  }
  //如果是svg，需要为节点添加命名空间
  if (
    sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
    (sel.length === 3 || sel[3] === '.' || sel[3] === '#')
  ) {
    addNS(data, children, sel);
  }
  return vnode(sel, data, children, text, undefined);
};
export default h;

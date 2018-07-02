/**
 * 主要功能如下：
 *    从elm的熟悉各种删除vnode中国不存在的属性（包括那些boolean类属性，如果新的vnode设置为false，同样删除）
 *    如果oldvnode与vnode用同名属性，则在elm上更新对应属性值
 *    如果vnode有新属性，则添加到elm中
 *    如果存在命名空间，则用setAttributeNS设置
 */

import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

// because those in TypeScript are too restrictive: https://github.com/Microsoft/TSJS-lib-generator/pull/237
declare global {
  interface Element {
    setAttribute(name: string, value: string | number | boolean): void;
    setAttributeNS(namespaceURI: string, qualifiedName: string, value: string | number | boolean): void;
  }
}

export type Attrs = Record<string, string | number | boolean>

const xlinkNS = 'http://www.w3.org/1999/xlink';
const xmlNS = 'http://www.w3.org/XML/1998/namespace';
const colonChar = 58; // :
const xChar = 120; // x

function updateAttrs(oldVnode: VNode, vnode: VNode): void {
  var key: string, elm: Element = vnode.elm as Element,
      oldAttrs = (oldVnode.data as VNodeData).attrs,
      attrs = (vnode.data as VNodeData).attrs;
  // 如果旧节点和新节点都不包含属性，立刻返回
  if (!oldAttrs && !attrs) return;
  if (oldAttrs === attrs) return;
  oldAttrs = oldAttrs || {};
  attrs = attrs || {};

  // update modified attributes, add new attributes
  // 更新改变了的属性，添加新的属性
  for (key in attrs) {
    const cur = attrs[key];
    const old = oldAttrs[key];
    // 如果旧的属性和新的属性不同
    if (old !== cur) {
      // 先判断cur是不是值为布尔值的属性
      if (cur === true) {
        elm.setAttribute(key, "");
      } else if (cur === false) {
        elm.removeAttribute(key);
      } else {
        if (key.charCodeAt(0) !== xChar) {
          elm.setAttribute(key, cur);
        } else if (key.charCodeAt(3) === colonChar) {
          // Assume xml namespace
          elm.setAttributeNS(xmlNS, key, cur);
        } else if (key.charCodeAt(5) === colonChar) {
          // Assume xlink namespace
          elm.setAttributeNS(xlinkNS, key, cur);
        } else {
          elm.setAttribute(key, cur);
        }
      }
    }
  }
  // remove removed attributes
  // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
  // the other option is to remove all attributes with value == undefined
  // 删除不在新节点属性中的旧节点的属性
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      elm.removeAttribute(key);
    }
  }
}

export const attributesModule = {create: updateAttrs, update: updateAttrs} as Module;
export default attributesModule;

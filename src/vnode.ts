import {Hooks} from './hooks';
import {AttachData} from './helpers/attachto'
import {VNodeStyle} from './modules/style'
import {On} from './modules/eventlisteners'
import {Attrs} from './modules/attributes'
import {Classes} from './modules/class'
import {Props} from './modules/props'
import {Dataset} from './modules/dataset'
import {Hero} from './modules/hero'

export type Key = string | number;

export interface VNode {
  sel: string | undefined;
  data: VNodeData | undefined;
  children: Array<VNode | string> | undefined;
  elm: Node | undefined;
  text: string | undefined;
  key: Key | undefined;
}
// 定义了每个vnode的数据格式
export interface VNodeData {
  props?: Props;
  attrs?: Attrs;
  class?: Classes;
  style?: VNodeStyle;
  dataset?: Dataset;
  on?: On;
  hero?: Hero;
  attachData?: AttachData;
  hook?: Hooks;
  key?: Key;
  ns?: string; // for SVGs
  fn?: () => VNode; // for thunks
  args?: Array<any>; // for thunks
  [key: string]: any; // for any other 3rd party module
}

/**
 * @param sel：选择器，可以是custom tag, 可以是'div','span',etc,代表这个virtual dom的tag name
 * @param data：virtual dom数据,它们与dom element的prop、attr的语义类似。但是virtual dom包含的数据可以更灵活
 * @param children：子节点数组,但是这是vdom的children. vdom的实现重点就是对children的patch上
 * @param text：对应element.textContent,在children里定义一个string,那么我们会为这个string创建一个textNode
 * @param elm：对真实dom element的引用
 * key：用于提示children patch过程
 * @returns {{sel: (string|undefined), data: (any|undefined), children: (Array<VNode|string>|undefined), text: (string|undefined), elm: (Element|Text|undefined), key: any}}
 * key属性用于不同vnode之间的对比
 */
// vnode构造函数
export function vnode(sel: string | undefined,
                      data: any | undefined,
                      children: Array<VNode | string> | undefined,
                      text: string | undefined,
                      elm: Element | Text | undefined): VNode {
  let key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
}

export default vnode;

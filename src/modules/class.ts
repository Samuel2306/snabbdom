import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type Classes = Record<string, boolean>

/**
 * 从elm中删除vnode中不存在的或者值为false的类
 * 将vnode中新的class添加到elm上去
 * @param oldVnode
 * @param vnode
 */
function updateClass(oldVnode: VNode, vnode: VNode): void {
  var cur: any, name: string, elm: Element = vnode.elm as Element,
      oldClass = (oldVnode.data as VNodeData).class,
      klass = (vnode.data as VNodeData).class;
  // 如果旧节点和新节点都没有class，直接返回
  if (!oldClass && !klass) return;
  if (oldClass === klass) return;
  oldClass = oldClass || {};
  klass = klass || {};
  //从旧节点中删除新节点不存在的类
  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }
  // 如果新节点中对应旧节点的类设置为false，则删除该类，如果新设置为true，则添加该类
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      (elm.classList as any)[cur ? 'add' : 'remove'](name);
    }
  }
}

export const classModule = {create: updateClass, update: updateClass} as Module;
export default classModule;

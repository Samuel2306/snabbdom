/**
 * 从elm上删除vnode中不存在的属性
 * 更新elm上的属性
 */
import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type Props = Record<string, any>;

function updateProps(oldVnode: VNode, vnode: VNode): void {
  var key: string, cur: any, old: any, elm = vnode.elm,
      oldProps = (oldVnode.data as VNodeData).props,
      props = (vnode.data as VNodeData).props;
  //如果新旧节点都不存在属性，则直接返回
  if (!oldProps && !props) return;
  if (oldProps === props) return;
  oldProps = oldProps || {};
  props = props || {};
  //删除旧节点中新节点没有的属性
  for (key in oldProps) {
    if (!props[key]) {
      delete (elm as any)[key];
    }
  }
  //更新属性
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    //如果新旧节点属性不同，且对比的属性不是value或者elm上对应属性和新属性也不同，那么就需要更新
    if (old !== cur && (key !== 'value' || (elm as any)[key] !== cur)) {
      (elm as any)[key] = cur;
    }
  }
}

export const propsModule = {create: updateProps, update: updateProps} as Module;
export default propsModule;
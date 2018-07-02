/**
 * 将elem上存在于oldvnode中但不存在于vnode的style置空
 * 如果vnode.style中的delayed与oldvnode的不同，则更新delayed的属性值，并在下一帧将elm的style设置为该值，从而实现动画过渡效果
 * 非delayed和remove的style直接更新
 * vnode被destroy时，直接将对应style更新为vnode.data.style.destory的值
 * vnode被reomve时，如果style.remove不存在，直接调用全局remove钩子进入下一个remove过程
 如果style.remove存在，那么我们就需要设置remove动画过渡效果，等到过渡效果结束之后，才调用
 下一个remove过程
 */

import {VNode, VNodeData} from '../vnode';
import {Module} from './module';

export type VNodeStyle = Record<string, string> & {
  delayed?: Record<string, string>
  remove?: Record<string, string>
}
//如果存在requestAnimationFrame，则直接使用，以优化性能，否则用setTimeout
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function(fn: any) { raf(function() { raf(fn); }); };

//通过nextFrame来实现动画效果
function setNextFrame(obj: any, prop: string, val: any): void {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode: VNode, vnode: VNode): void {
  var cur: any, name: string, elm = vnode.elm,
      oldStyle = (oldVnode.data as VNodeData).style,
      style = (vnode.data as VNodeData).style;
  //如果oldvnode和vnode都没有style，直接返回
  if (!oldStyle && !style) return;
  if (oldStyle === style) return;
  oldStyle = oldStyle || {} as VNodeStyle;
  style = style || {} as VNodeStyle;
  var oldHasDel = 'delayed' in oldStyle;
  //遍历oldvnode的style
  for (name in oldStyle) {
    //如果vnode中无该style，则置空
    if (!style[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (elm as any).style.removeProperty(name);
      } else {
        (elm as any).style[name] = '';
      }
    }
  }
  for (name in style) {
    cur = style[name];
    //如果vnode的style中有delayed且与oldvnode中的不同，则在下一帧设置delayed的参数
    if (name === 'delayed' && style.delayed) {
      for (let name2 in style.delayed) {
        cur = style.delayed[name2];
        if (!oldHasDel || cur !== (oldStyle.delayed as any)[name2]) {
          setNextFrame((elm as any).style, name2, cur);
        }
      }
    }
    //如果不是delayed和remove的style，且不同于oldvnode的值，则直接设置新值
    else if (name !== 'remove' && cur !== oldStyle[name]) {
      if (name[0] === '-' && name[1] === '-') {
        (elm as any).style.setProperty(name, cur);
      } else {
        (elm as any).style[name] = cur;
      }
    }
  }
}
//设置节点被destory时的style
function applyDestroyStyle(vnode: VNode): void {
  var style: any, name: string, elm = vnode.elm, s = (vnode.data as VNodeData).style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    (elm as any).style[name] = style[name];
  }
}
//删除效果，当我们删除一个元素时，先回调用删除过度效果，过渡完才会将节点remove
function applyRemoveStyle(vnode: VNode, rm: () => void): void {
  var s = (vnode.data as VNodeData).style;
  //如果没有style或没有style.remove
  if (!s || !s.remove) {
    //直接调用rm，即实际上是调用全局的remove钩子
    rm();
    return;
  }
  var name: string, elm = vnode.elm, i = 0, compStyle: CSSStyleDeclaration,
      style = s.remove, amount = 0, applied: Array<string> = [];
  //设置并记录remove动作后删除节点前的样式
  for (name in style) {
    applied.push(name);
    (elm as any).style[name] = style[name];
  }
  compStyle = getComputedStyle(elm as Element);
  //拿到所有需要过渡的属性
  var props = (compStyle as any)['transition-property'].split(', ');
  //对过渡属性计数，这里applied.length >=amount，因为有些属性是不需要过渡的
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  //当过渡效果的完成后，才remove节点，调用下一个remove过程
  (elm as Element).addEventListener('transitionend', function (ev: TransitionEvent) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

export const styleModule = {
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle
} as Module;
export default styleModule;

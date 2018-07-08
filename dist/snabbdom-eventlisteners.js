(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.snabbdom_eventlisteners = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * snabbdom中对事件处理做了一层包装，真实DOM的事件触发的是对vnode的操作
 * 主要途径：
 *    createListner => 返回handler作事件监听生成器 =>handler上绑定vnode =>将handler作真实DOM的事件处理器
 *    真实DOM事件触发后 => handler获得真实DOM的事件对象 => 将真实DOM事件对象传入handleEvent => handleEvent找到对应的vnode事件处理器，然后调用这个处理器从而修改vnode
 */
Object.defineProperty(exports, "__esModule", { value: true });
// 对vnode进行事件处理
function invokeHandler(handler, vnode, event) {
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
            }
            else {
                //如果存在多个绑定数据，则要转化为数组，用apply的方式调用，而apply性能比call差
                //形如:on:{click:[handler,1,2,3]}
                var args = handler.slice(1);
                args.push(event);
                args.push(vnode);
                handler[0].apply(vnode, args);
            }
        }
        else {
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
function handleEvent(event, vnode) {
    var name = event.type, on = vnode.data.on;
    // call event handler(s) if exists
    // 如果找到对应的vnode事件处理器，则调用
    if (on && on[name]) {
        invokeHandler(on[name], vnode, event);
    }
}
//事件监听器生成器，用于处理真实DOM事件
function createListener() {
    return function handler(event) {
        handleEvent(event, handler.vnode);
    };
}
//更新事件监听
function updateEventListeners(oldVnode, vnode) {
    var oldOn = oldVnode.data.on, oldListener = oldVnode.listener, oldElm = oldVnode.elm, on = vnode && vnode.data.on, elm = (vnode && vnode.elm), name;
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
        }
        else {
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
        var listener = vnode.listener = oldVnode.listener || createListener();
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
        }
        else {
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
exports.eventListenersModule = {
    create: updateEventListeners,
    update: updateEventListeners,
    destroy: updateEventListeners
};
exports.default = exports.eventListenersModule;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtb2R1bGVzL2V2ZW50bGlzdGVuZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcclxuLyoqXHJcbiAqIHNuYWJiZG9t5Lit5a+55LqL5Lu25aSE55CG5YGa5LqG5LiA5bGC5YyF6KOF77yM55yf5a6eRE9N55qE5LqL5Lu26Kem5Y+R55qE5piv5a+5dm5vZGXnmoTmk43kvZxcclxuICog5Li76KaB6YCU5b6E77yaXHJcbiAqICAgIGNyZWF0ZUxpc3RuZXIgPT4g6L+U5ZueaGFuZGxlcuS9nOS6i+S7tuebkeWQrOeUn+aIkOWZqCA9PmhhbmRsZXLkuIrnu5Hlrpp2bm9kZSA9PuWwhmhhbmRsZXLkvZznnJ/lrp5ET03nmoTkuovku7blpITnkIblmahcclxuICogICAg55yf5a6eRE9N5LqL5Lu26Kem5Y+R5ZCOID0+IGhhbmRsZXLojrflvpfnnJ/lrp5ET03nmoTkuovku7blr7nosaEgPT4g5bCG55yf5a6eRE9N5LqL5Lu25a+56LGh5Lyg5YWlaGFuZGxlRXZlbnQgPT4gaGFuZGxlRXZlbnTmib7liLDlr7nlupTnmoR2bm9kZeS6i+S7tuWkhOeQhuWZqO+8jOeEtuWQjuiwg+eUqOi/meS4quWkhOeQhuWZqOS7juiAjOS/ruaUuXZub2RlXHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8vIOWvuXZub2Rl6L+b6KGM5LqL5Lu25aSE55CGXHJcbmZ1bmN0aW9uIGludm9rZUhhbmRsZXIoaGFuZGxlciwgdm5vZGUsIGV2ZW50KSB7XHJcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgIC8vIGNhbGwgZnVuY3Rpb24gaGFuZGxlclxyXG4gICAgICAgIC8vIOWwhuS6i+S7tuWkhOeQhuWZqOeahOS4iuS4i+aWh+iuvue9ruS4unZub2RlXHJcbiAgICAgICAgaGFuZGxlci5jYWxsKHZub2RlLCBldmVudCwgdm5vZGUpO1xyXG4gICAgfVxyXG4gICAgLy/lrZjlnKjkuovku7bnu5HlrprmlbDmja7miJbogIXlrZjlnKjlpJrkuovku7blpITnkIblmahcclxuICAgIGVsc2UgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgLy8gY2FsbCBoYW5kbGVyIHdpdGggYXJndW1lbnRzXHJcbiAgICAgICAgLy8g6K+05piO5Y+q5pyJ5LiA5Liq5LqL5Lu25aSE55CG5ZmoXHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyWzBdID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBzaW5nbGUgYXJndW1lbnQgZm9yIHBlcmZvcm1hbmNlXHJcbiAgICAgICAgICAgIC8v5aaC5p6c57uR5a6a5pWw5o2u5Y+q5pyJ5LiA5Liq77yM5YiZ55u05o6l5bCG5pWw5o2u55SoY2FsbOeahOaWueW8j+iwg+eUqO+8jOaPkOmrmOaAp+iDvVxyXG4gICAgICAgICAgICAvL+W9ouWmgm9uOntjbGljazpbaGFuZGxlciwxXX1cclxuICAgICAgICAgICAgaWYgKGhhbmRsZXIubGVuZ3RoID09PSAyKSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVyWzBdLmNhbGwodm5vZGUsIGhhbmRsZXJbMV0sIGV2ZW50LCB2bm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL+WmguaenOWtmOWcqOWkmuS4que7keWumuaVsOaNru+8jOWImeimgei9rOWMluS4uuaVsOe7hO+8jOeUqGFwcGx555qE5pa55byP6LCD55So77yM6ICMYXBwbHnmgKfog73mr5RjYWxs5beuXHJcbiAgICAgICAgICAgICAgICAvL+W9ouWmgjpvbjp7Y2xpY2s6W2hhbmRsZXIsMSwyLDNdfVxyXG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBoYW5kbGVyLnNsaWNlKDEpO1xyXG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaCh2bm9kZSk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVyWzBdLmFwcGx5KHZub2RlLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gY2FsbCBtdWx0aXBsZSBoYW5kbGVyc1xyXG4gICAgICAgICAgICAvL+WmguaenOWtmOWcqOWkmuS4quebuOWQjOS6i+S7tueahOS4jeWQjOWkhOeQhuWZqO+8jOWImemAkuW9kuiwg+eUqFxyXG4gICAgICAgICAgICAvL+Wmgm9u77yae2NsaWNrOltbaGFuZGVsZXIxLDFdLFtoYW5kbGVyLDJdXX1cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpbnZva2VIYW5kbGVyKGhhbmRsZXJbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbi8qKlxyXG4gKlxyXG4gKiBAcGFyYW0gZXZlbnQg55yf5a6eZG9t55qE5LqL5Lu25a+56LGhXHJcbiAqIEBwYXJhbSB2bm9kZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlRXZlbnQoZXZlbnQsIHZub2RlKSB7XHJcbiAgICB2YXIgbmFtZSA9IGV2ZW50LnR5cGUsIG9uID0gdm5vZGUuZGF0YS5vbjtcclxuICAgIC8vIGNhbGwgZXZlbnQgaGFuZGxlcihzKSBpZiBleGlzdHNcclxuICAgIC8vIOWmguaenOaJvuWIsOWvueW6lOeahHZub2Rl5LqL5Lu25aSE55CG5Zmo77yM5YiZ6LCD55SoXHJcbiAgICBpZiAob24gJiYgb25bbmFtZV0pIHtcclxuICAgICAgICBpbnZva2VIYW5kbGVyKG9uW25hbWVdLCB2bm9kZSwgZXZlbnQpO1xyXG4gICAgfVxyXG59XHJcbi8v5LqL5Lu255uR5ZCs5Zmo55Sf5oiQ5Zmo77yM55So5LqO5aSE55CG55yf5a6eRE9N5LqL5Lu2XHJcbmZ1bmN0aW9uIGNyZWF0ZUxpc3RlbmVyKCkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcclxuICAgICAgICBoYW5kbGVFdmVudChldmVudCwgaGFuZGxlci52bm9kZSk7XHJcbiAgICB9O1xyXG59XHJcbi8v5pu05paw5LqL5Lu255uR5ZCsXHJcbmZ1bmN0aW9uIHVwZGF0ZUV2ZW50TGlzdGVuZXJzKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgdmFyIG9sZE9uID0gb2xkVm5vZGUuZGF0YS5vbiwgb2xkTGlzdGVuZXIgPSBvbGRWbm9kZS5saXN0ZW5lciwgb2xkRWxtID0gb2xkVm5vZGUuZWxtLCBvbiA9IHZub2RlICYmIHZub2RlLmRhdGEub24sIGVsbSA9ICh2bm9kZSAmJiB2bm9kZS5lbG0pLCBuYW1lO1xyXG4gICAgLy8gb3B0aW1pemF0aW9uIGZvciByZXVzZWQgaW1tdXRhYmxlIGhhbmRsZXJzXHJcbiAgICAvLyDlpoLmnpzmlrDml6fkuovku7bnm5HlkKzlmajkuIDmoLfvvIzliJnnm7TmjqXov5Tlm55cclxuICAgIGlmIChvbGRPbiA9PT0gb24pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyByZW1vdmUgZXhpc3RpbmcgbGlzdGVuZXJzIHdoaWNoIG5vIGxvbmdlciB1c2VkXHJcbiAgICAvL+WmguaenOaWsOiKgueCueS4iuayoeacieS6i+S7tuebkeWQrO+8jOWImeWwhuaXp+iKgueCueS4iueahOS6i+S7tuebkeWQrOmDveWIoOmZpFxyXG4gICAgaWYgKG9sZE9uICYmIG9sZExpc3RlbmVyKSB7XHJcbiAgICAgICAgLy8gaWYgZWxlbWVudCBjaGFuZ2VkIG9yIGRlbGV0ZWQgd2UgcmVtb3ZlIGFsbCBleGlzdGluZyBsaXN0ZW5lcnMgdW5jb25kaXRpb25hbGx5XHJcbiAgICAgICAgaWYgKCFvbikge1xyXG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gb2xkT24pIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBlbGVtZW50IHdhcyBjaGFuZ2VkIG9yIGV4aXN0aW5nIGxpc3RlbmVycyByZW1vdmVkXHJcbiAgICAgICAgICAgICAgICBvbGRFbG0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBvbGRMaXN0ZW5lciwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvL+WIoOmZpOaXp+iKgueCueS4reaWsOiKgueCueS4jeWtmOWcqOeahOS6i+S7tuebkeWQrFxyXG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gb2xkT24pIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBleGlzdGluZyBsaXN0ZW5lciByZW1vdmVkXHJcbiAgICAgICAgICAgICAgICBpZiAoIW9uW25hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2xkRWxtLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgb2xkTGlzdGVuZXIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIGFkZCBuZXcgbGlzdGVuZXJzIHdoaWNoIGhhcyBub3QgYWxyZWFkeSBhdHRhY2hlZFxyXG4gICAgaWYgKG9uKSB7XHJcbiAgICAgICAgLy8gcmV1c2UgZXhpc3RpbmcgbGlzdGVuZXIgb3IgY3JlYXRlIG5ld1xyXG4gICAgICAgIC8v5aaC5p6cb2xkdm5vZGXkuIrlt7Lnu4/mnIlsaXN0ZW5lcu+8jOWImXZub2Rl55u05o6l5aSN55So77yM5ZCm5YiZ5YiZ5paw5bu65LqL5Lu25aSE55CG5ZmoXHJcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gdm5vZGUubGlzdGVuZXIgPSBvbGRWbm9kZS5saXN0ZW5lciB8fCBjcmVhdGVMaXN0ZW5lcigpO1xyXG4gICAgICAgIC8vIHVwZGF0ZSB2bm9kZSBmb3IgbGlzdGVuZXJcclxuICAgICAgICAvL+WcqOS6i+S7tuWkhOeQhuWZqOS4iue7keWumnZub2RlXHJcbiAgICAgICAgbGlzdGVuZXIudm5vZGUgPSB2bm9kZTtcclxuICAgICAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgYWRkZWQgd2UgYWRkIGFsbCBuZWVkZWQgbGlzdGVuZXJzIHVuY29uZGl0aW9uYWxseVxyXG4gICAgICAgIC8v5aaC5p6cb2xkdm5vZGXkuIrmsqHmnInkuovku7blpITnkIblmahcclxuICAgICAgICBpZiAoIW9sZE9uKSB7XHJcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBvbikge1xyXG4gICAgICAgICAgICAgICAgLy8gYWRkIGxpc3RlbmVyIGlmIGVsZW1lbnQgd2FzIGNoYW5nZWQgb3IgbmV3IGxpc3RlbmVycyBhZGRlZFxyXG4gICAgICAgICAgICAgICAgLy/nm7TmjqXlsIZ2bm9kZeS4iueahOS6i+S7tuWkhOeQhuWZqOa3u+WKoOWIsGVsbeS4ilxyXG4gICAgICAgICAgICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZm9yIChuYW1lIGluIG9uKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgbmV3IGxpc3RlbmVyIGFkZGVkXHJcbiAgICAgICAgICAgICAgICAvL+WQpuWImea3u+WKoG9sZHZub2Rl5LiK5rKh5pyJ55qE5LqL5Lu25aSE55CG5ZmoXHJcbiAgICAgICAgICAgICAgICBpZiAoIW9sZE9uW25hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmV2ZW50TGlzdGVuZXJzTW9kdWxlID0ge1xyXG4gICAgY3JlYXRlOiB1cGRhdGVFdmVudExpc3RlbmVycyxcclxuICAgIHVwZGF0ZTogdXBkYXRlRXZlbnRMaXN0ZW5lcnMsXHJcbiAgICBkZXN0cm95OiB1cGRhdGVFdmVudExpc3RlbmVyc1xyXG59O1xyXG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmV2ZW50TGlzdGVuZXJzTW9kdWxlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1ldmVudGxpc3RlbmVycy5qcy5tYXAiXX0=

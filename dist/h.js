(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.h = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
// 添加命名空间（svg才需要）
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        // 递归为子节点添加命名空间
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
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
function h(sel, b, c) {
    var data = {}, children, text, i;
    // 如果存在子节点
    if (c !== undefined) {
        // 那么h的第二项就是data
        data = b;
        // 如果c是数组，那么存在子element节点
        if (is.array(c)) {
            children = c;
        }
        // 否则为子text节点
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    // 如果c不存在，只存在b，那么说明需要渲染的vdom不存在data部分，只存在子节点部分
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            // 如果子节点数组中，存在节点是原始类型，说明该节点是text节点，因此我们将它渲染为一个只包含text的VNode
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
        }
    }
    //如果是svg，需要为节点添加命名空间
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    // 创建并返回一个vnode
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports.default = h;

},{"./is":2,"./vnode":3}],2:[function(require,module,exports){
"use strict";
/**
 * 类型判断相关的文件
 * @type {function(any): boolean}
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJoLmpzIiwiaXMuanMiLCJ2bm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcclxudmFyIGlzID0gcmVxdWlyZShcIi4vaXNcIik7XHJcbi8vIOa3u+WKoOWRveWQjeepuumXtO+8iHN2Z+aJjemcgOimge+8iVxyXG5mdW5jdGlvbiBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKSB7XHJcbiAgICBkYXRhLm5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcclxuICAgIGlmIChzZWwgIT09ICdmb3JlaWduT2JqZWN0JyAmJiBjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8g6YCS5b2S5Li65a2Q6IqC54K55re75Yqg5ZG95ZCN56m66Ze0XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGREYXRhID0gY2hpbGRyZW5baV0uZGF0YTtcclxuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBhZGROUyhjaGlsZERhdGEsIGNoaWxkcmVuW2ldLmNoaWxkcmVuLCBjaGlsZHJlbltpXS5zZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbi8vIGjmmK/kuIDkuKrljIXoo4Xlh73mlbDvvIzkuLvopoHmmK/lnKh2bm9kZeS4iuWGjeWBmuS4gOWxguWMheijhe+8mlxyXG4vLyDlpoLmnpzmmK9zdmfvvIzliJnkuLrlhbbmt7vliqDlkb3lkI3nqbrpl7RcclxuLy8g5bCGY2hpbGRyZW7kuK3nmoR0ZXh05YyF6KOF5oiQdm5vZGXlvaLlvI9cclxuLy/lsIZWTm9kZea4suafk+S4ulZET01cclxuLyoqXHJcbiAqIEBwYXJhbSBzZWwg6YCJ5oup5ZmoXHJcbiAqIEBwYXJhbSBiICAgIOaVsOaNrlxyXG4gKiBAcGFyYW0gYyAgICDlrZDoioLngrlcclxuICogQHJldHVybnMge3tzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0sIGtleX19XHJcbiAqL1xyXG5mdW5jdGlvbiBoKHNlbCwgYiwgYykge1xyXG4gICAgdmFyIGRhdGEgPSB7fSwgY2hpbGRyZW4sIHRleHQsIGk7XHJcbiAgICAvLyDlpoLmnpzlrZjlnKjlrZDoioLngrlcclxuICAgIGlmIChjICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyDpgqPkuYho55qE56ys5LqM6aG55bCx5pivZGF0YVxyXG4gICAgICAgIGRhdGEgPSBiO1xyXG4gICAgICAgIC8vIOWmguaenGPmmK/mlbDnu4TvvIzpgqPkuYjlrZjlnKjlrZBlbGVtZW506IqC54K5XHJcbiAgICAgICAgaWYgKGlzLmFycmF5KGMpKSB7XHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5ZCm5YiZ5Li65a2QdGV4dOiKgueCuVxyXG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkge1xyXG4gICAgICAgICAgICB0ZXh0ID0gYztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYyAmJiBjLnNlbCkge1xyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtjXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDlpoLmnpxj5LiN5a2Y5Zyo77yM5Y+q5a2Y5ZyoYu+8jOmCo+S5iOivtOaYjumcgOimgea4suafk+eahHZkb23kuI3lrZjlnKhkYXRh6YOo5YiG77yM5Y+q5a2Y5Zyo5a2Q6IqC54K56YOo5YiGXHJcbiAgICBlbHNlIGlmIChiICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAoaXMuYXJyYXkoYikpIHtcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYikpIHtcclxuICAgICAgICAgICAgdGV4dCA9IGI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGIgJiYgYi5zZWwpIHtcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBbYl07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkYXRhID0gYjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAvLyDlpoLmnpzlrZDoioLngrnmlbDnu4TkuK3vvIzlrZjlnKjoioLngrnmmK/ljp/lp4vnsbvlnovvvIzor7TmmI7or6XoioLngrnmmK90ZXh06IqC54K577yM5Zug5q2k5oiR5Lus5bCG5a6D5riy5p+T5Li65LiA5Liq5Y+q5YyF5ZCrdGV4dOeahFZOb2RlXHJcbiAgICAgICAgICAgIGlmIChpcy5wcmltaXRpdmUoY2hpbGRyZW5baV0pKVxyXG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0gPSB2bm9kZV8xLnZub2RlKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNoaWxkcmVuW2ldLCB1bmRlZmluZWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8v5aaC5p6c5pivc3Zn77yM6ZyA6KaB5Li66IqC54K55re75Yqg5ZG95ZCN56m66Ze0XHJcbiAgICBpZiAoc2VsWzBdID09PSAncycgJiYgc2VsWzFdID09PSAndicgJiYgc2VsWzJdID09PSAnZycgJiZcclxuICAgICAgICAoc2VsLmxlbmd0aCA9PT0gMyB8fCBzZWxbM10gPT09ICcuJyB8fCBzZWxbM10gPT09ICcjJykpIHtcclxuICAgICAgICBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKTtcclxuICAgIH1cclxuICAgIC8vIOWIm+W7uuW5tui/lOWbnuS4gOS4qnZub2RlXHJcbiAgICByZXR1cm4gdm5vZGVfMS52bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCB1bmRlZmluZWQpO1xyXG59XHJcbmV4cG9ydHMuaCA9IGg7XHJcbjtcclxuZXhwb3J0cy5kZWZhdWx0ID0gaDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuLyoqXHJcbiAqIOexu+Wei+WIpOaWreebuOWFs+eahOaWh+S7tlxyXG4gKiBAdHlwZSB7ZnVuY3Rpb24oYW55KTogYm9vbGVhbn1cclxuICovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XHJcbmZ1bmN0aW9uIHByaW1pdGl2ZShzKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHMgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzID09PSAnbnVtYmVyJztcclxufVxyXG5leHBvcnRzLnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIEBwYXJhbSBzZWzvvJrpgInmi6nlmajvvIzlj6/ku6XmmK9jdXN0b20gdGFnLCDlj6/ku6XmmK8nZGl2Jywnc3BhbicsZXRjLOS7o+ihqOi/meS4qnZpcnR1YWwgZG9t55qEdGFnIG5hbWVcclxuICogQHBhcmFtIGRhdGHvvJp2aXJ0dWFsIGRvbeaVsOaNrizlroPku6zkuI5kb20gZWxlbWVudOeahHByb3DjgIFhdHRy55qE6K+t5LmJ57G75Ly844CC5L2G5pivdmlydHVhbCBkb23ljIXlkKvnmoTmlbDmja7lj6/ku6Xmm7TngbXmtLtcclxuICogQHBhcmFtIGNoaWxkcmVu77ya5a2Q6IqC54K55pWw57uELOS9huaYr+i/meaYr3Zkb23nmoRjaGlsZHJlbi4gdmRvbeeahOWunueOsOmHjeeCueWwseaYr+WvuWNoaWxkcmVu55qEcGF0Y2jkuIpcclxuICogQHBhcmFtIHRleHTvvJrlr7nlupRlbGVtZW50LnRleHRDb250ZW50LOWcqGNoaWxkcmVu6YeM5a6a5LmJ5LiA5Liqc3RyaW5nLOmCo+S5iOaIkeS7rOS8muS4uui/meS4qnN0cmluZ+WIm+W7uuS4gOS4qnRleHROb2RlXHJcbiAqIEBwYXJhbSBlbG3vvJrlr7nnnJ/lrp5kb20gZWxlbWVudOeahOW8leeUqFxyXG4gKiBrZXnvvJrnlKjkuo7mj5DnpLpjaGlsZHJlbiBwYXRjaOi/h+eoi1xyXG4gKiBAcmV0dXJucyB7e3NlbDogKHN0cmluZ3x1bmRlZmluZWQpLCBkYXRhOiAoYW55fHVuZGVmaW5lZCksIGNoaWxkcmVuOiAoQXJyYXk8Vk5vZGV8c3RyaW5nPnx1bmRlZmluZWQpLCB0ZXh0OiAoc3RyaW5nfHVuZGVmaW5lZCksIGVsbTogKEVsZW1lbnR8VGV4dHx1bmRlZmluZWQpLCBrZXk6IGFueX19XHJcbiAqIGtleeWxnuaAp+eUqOS6juS4jeWQjHZub2Rl5LmL6Ze055qE5a+55q+UXHJcbiAqL1xyXG4vLyB2bm9kZeaehOmAoOWHveaVsFxyXG5mdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcclxuICAgIHZhciBrZXkgPSBkYXRhID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBkYXRhLmtleTtcclxuICAgIHJldHVybiB7IHNlbDogc2VsLCBkYXRhOiBkYXRhLCBjaGlsZHJlbjogY2hpbGRyZW4sXHJcbiAgICAgICAgdGV4dDogdGV4dCwgZWxtOiBlbG0sIGtleToga2V5IH07XHJcbn1cclxuZXhwb3J0cy52bm9kZSA9IHZub2RlO1xyXG5leHBvcnRzLmRlZmF1bHQgPSB2bm9kZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dm5vZGUuanMubWFwIl19

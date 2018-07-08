(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.snabbdom = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./is":3,"./vnode":12}],2:[function(require,module,exports){
"use strict";
/**
 * 改文件就是对原生DOM操作做了一层抽象
 */
Object.defineProperty(exports, "__esModule", { value: true });
function createElement(tagName) {
    return document.createElement(tagName);
}
function createElementNS(namespaceURI, qualifiedName) {
    return document.createElementNS(namespaceURI, qualifiedName);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function createComment(text) {
    return document.createComment(text);
}
function insertBefore(parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
    node.removeChild(child);
}
function appendChild(node, child) {
    node.appendChild(child);
}
function parentNode(node) {
    return node.parentNode;
}
function nextSibling(node) {
    return node.nextSibling;
}
function tagName(elm) {
    return elm.tagName;
}
function setTextContent(node, text) {
    node.textContent = text;
}
function getTextContent(node) {
    return node.textContent;
}
function isElement(node) {
    return node.nodeType === 1;
}
function isText(node) {
    return node.nodeType === 3;
}
function isComment(node) {
    return node.nodeType === 8;
}
exports.htmlDomApi = {
    createElement: createElement,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    getTextContent: getTextContent,
    isElement: isElement,
    isText: isText,
    isComment: isComment,
};
exports.default = exports.htmlDomApi;

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";
/**
 * 主要功能如下：
 *    从elm的熟悉各种删除vnode中国不存在的属性（包括那些boolean类属性，如果新的vnode设置为false，同样删除）
 *    如果oldvnode与vnode用同名属性，则在elm上更新对应属性值
 *    如果vnode有新属性，则添加到elm中
 *    如果存在命名空间，则用setAttributeNS设置
 */
Object.defineProperty(exports, "__esModule", { value: true });
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var colonChar = 58; // :
var xChar = 120; // x
function updateAttrs(oldVnode, vnode) {
    var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
    // 如果旧节点和新节点都不包含属性，立刻返回
    if (!oldAttrs && !attrs)
        return;
    if (oldAttrs === attrs)
        return;
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    // update modified attributes, add new attributes
    // 更新改变了的属性，添加新的属性
    for (key in attrs) {
        var cur = attrs[key];
        var old = oldAttrs[key];
        // 如果旧的属性和新的属性不同
        if (old !== cur) {
            // 先判断cur是不是值为布尔值的属性
            if (cur === true) {
                elm.setAttribute(key, "");
            }
            else if (cur === false) {
                elm.removeAttribute(key);
            }
            else {
                if (key.charCodeAt(0) !== xChar) {
                    elm.setAttribute(key, cur);
                }
                else if (key.charCodeAt(3) === colonChar) {
                    // Assume xml namespace
                    elm.setAttributeNS(xmlNS, key, cur);
                }
                else if (key.charCodeAt(5) === colonChar) {
                    // Assume xlink namespace
                    elm.setAttributeNS(xlinkNS, key, cur);
                }
                else {
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
exports.attributesModule = { create: updateAttrs, update: updateAttrs };
exports.default = exports.attributesModule;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 从elm中删除vnode中不存在的或者值为false的类
 * 将vnode中新的class添加到elm上去
 * @param oldVnode
 * @param vnode
 */
function updateClass(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldClass = oldVnode.data.class, klass = vnode.data.class;
    // 如果旧节点和新节点都没有class，直接返回
    if (!oldClass && !klass)
        return;
    if (oldClass === klass)
        return;
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
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
exports.classModule = { create: updateClass, update: updateClass };
exports.default = exports.classModule;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateProps(oldVnode, vnode) {
    var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
    //如果新旧节点都不存在属性，则直接返回
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    //删除旧节点中新节点没有的属性
    for (key in oldProps) {
        if (!props[key]) {
            delete elm[key];
        }
    }
    //更新属性
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        //如果新旧节点属性不同，且对比的属性不是value或者elm上对应属性和新属性也不同，那么就需要更新
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
exports.propsModule = { create: updateProps, update: updateProps };
exports.default = exports.propsModule;

},{}],8:[function(require,module,exports){
"use strict";
/**
 * 将elem上存在于oldvnode中但不存在于vnode的style置空
 * 如果vnode.style中的delayed与oldvnode的不同，则更新delayed的属性值，并在下一帧将elm的style设置为该值，从而实现动画过渡效果
 * 非delayed和remove的style直接更新
 * vnode被destroy时，直接将对应style更新为vnode.data.style.destory的值
 * vnode被reomve时，如果style.remove不存在，直接调用全局remove钩子进入下一个remove过程
 如果style.remove存在，那么我们就需要设置remove动画过渡效果，等到过渡效果结束之后，才调用
 下一个remove过程
 */
Object.defineProperty(exports, "__esModule", { value: true });
//如果存在requestAnimationFrame，则直接使用，以优化性能，否则用setTimeout
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function (fn) { raf(function () { raf(fn); }); };
//通过nextFrame来实现动画效果
function setNextFrame(obj, prop, val) {
    nextFrame(function () { obj[prop] = val; });
}
function updateStyle(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldStyle = oldVnode.data.style, style = vnode.data.style;
    //如果oldvnode和vnode都没有style，直接返回
    if (!oldStyle && !style)
        return;
    if (oldStyle === style)
        return;
    oldStyle = oldStyle || {};
    style = style || {};
    var oldHasDel = 'delayed' in oldStyle;
    //遍历oldvnode的style
    for (name in oldStyle) {
        //如果vnode中无该style，则置空
        if (!style[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.removeProperty(name);
            }
            else {
                elm.style[name] = '';
            }
        }
    }
    for (name in style) {
        cur = style[name];
        //如果vnode的style中有delayed且与oldvnode中的不同，则在下一帧设置delayed的参数
        if (name === 'delayed' && style.delayed) {
            for (var name2 in style.delayed) {
                cur = style.delayed[name2];
                if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                    setNextFrame(elm.style, name2, cur);
                }
            }
        }
        //如果不是delayed和remove的style，且不同于oldvnode的值，则直接设置新值
        else if (name !== 'remove' && cur !== oldStyle[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.setProperty(name, cur);
            }
            else {
                elm.style[name] = cur;
            }
        }
    }
}
//设置节点被destory时的style
function applyDestroyStyle(vnode) {
    var style, name, elm = vnode.elm, s = vnode.data.style;
    if (!s || !(style = s.destroy))
        return;
    for (name in style) {
        elm.style[name] = style[name];
    }
}
//删除效果，当我们删除一个元素时，先回调用删除过度效果，过渡完才会将节点remove
function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    //如果没有style或没有style.remove
    if (!s || !s.remove) {
        //直接调用rm，即实际上是调用全局的remove钩子
        rm();
        return;
    }
    var name, elm = vnode.elm, i = 0, compStyle, style = s.remove, amount = 0, applied = [];
    //设置并记录remove动作后删除节点前的样式
    for (name in style) {
        applied.push(name);
        elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    //拿到所有需要过渡的属性
    var props = compStyle['transition-property'].split(', ');
    //对过渡属性计数，这里applied.length >=amount，因为有些属性是不需要过渡的
    for (; i < props.length; ++i) {
        if (applied.indexOf(props[i]) !== -1)
            amount++;
    }
    //当过渡效果的完成后，才remove节点，调用下一个remove过程
    elm.addEventListener('transitionend', function (ev) {
        if (ev.target === elm)
            --amount;
        if (amount === 0)
            rm();
    });
}
exports.styleModule = {
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
exports.default = exports.styleModule;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * snabbdom本身依赖打包
 */
var snabbdom_1 = require("./snabbdom");
var attributes_1 = require("./modules/attributes"); // for setting attributes on DOM elements
var class_1 = require("./modules/class"); // makes it easy to toggle classes
var props_1 = require("./modules/props"); // for setting properties on DOM elements
var style_1 = require("./modules/style"); // handles styling on elements with support for animations
var eventlisteners_1 = require("./modules/eventlisteners"); // attaches event listeners
var h_1 = require("./h"); // helper function for creating vnodes
var patch = snabbdom_1.init([
    attributes_1.attributesModule,
    class_1.classModule,
    props_1.propsModule,
    style_1.styleModule,
    eventlisteners_1.eventListenersModule
]);
exports.snabbdomBundle = { patch: patch, h: h_1.h };
exports.default = exports.snabbdomBundle;

},{"./h":1,"./modules/attributes":4,"./modules/class":5,"./modules/eventlisteners":6,"./modules/props":7,"./modules/style":8,"./snabbdom":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
var htmldomapi_1 = require("./htmldomapi");
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
// 定义一个创建空node的方法
var emptyNode = vnode_1.default('', {}, [], undefined, undefined);
// 用于同层次的oldvnode与vnode的比较，如果同层次节点的key和sel都相同我们就可以保留这个节点，否则直接替换节点
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
// 将oldvnode数组中位置对oldvnode.key的映射转换为oldvnode.key对位置的映射
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
// 钩子函数：https://segmentfault.com/a/1190000009017349
// 以下这六个是全局钩子
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
var h_1 = require("./h");
exports.h = h_1.h;
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
/**
 *
 * @param modules：init依赖的模块，如attribute、props、eventlistener这些模块
 * @param domApi：对封装真实DOM操作的工具函数库，如果我们没有传入，则默认
 使用snabbdom提供的htmldomapi
 * @returns {function((VNode|Element), VNode): VNode}
 * init还包含了许多vnode和真实DOM之间的操作和注册全局钩子，
 还有patchVnode和updateChildren这两个重要功能，然后返回一个patch函数
 */
function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    //注册钩子的回调，在发生状态变更时，触发对应属性变更
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    // 本函数主要的功能是将一个真实DOM节点转化成vnode形式
    // 如<div id='a' class='b c'></div>将转换为{sel:'div#a.b.c',data:{},children:[],text:undefined,elm:<div id='a' class='b c'>}
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode_1.default(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    // 当我们需要remove一个vnode时，会触发remove钩子作拦截器，只有在所有remove钩子回调函数都触发完才会将节点从父节点删除，而这个函数提供的就是对remove钩子回调操作的计数功能
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
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
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        if (data !== undefined) {
            //当节点上存在hook而且hook中有init钩子时，先调用init回调，对刚创建的vnode进行处理
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                //获取init钩子修改后的数据
                data = vnode.data;
            }
        }
        var children = vnode.children, sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            //先id后class
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            //创建一个DOM节点引用，并对其属性实例化
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            //获取id名 #a --> a
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            //获取类名，并格式化  .a.b --> a b
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            //如果存在子元素Vnode节点，则递归将子元素节点插入到当前Vnode节点中，并将已插入的子元素节点在insertedVnodeQueue中作记录
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            // 如果存在子文本节点，则直接将其插入到当前Vnode节点
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                //如果有insert钩子，则推进insertedVnodeQueue中作记录，从而实现批量插入触发insert回调
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        // 如果没声明选择器，则说明这个是一个text节点
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    // 将vnode转换后的dom节点插入到dom树的指定位置中去
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    // 用于手动触发destory钩子回调
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            //先触发该节点上的destory回调
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            //在触发全局下的destory回调
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
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
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    //调用destroy钩子
                    invokeDestroyHook(ch);
                    //对全局remove钩子进行计数
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    //调用全局remove回调函数，并每次减少一个remove钩子计数
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    //调用内部vnode.data.hook中的remove钩子（只有一个）
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        //如果没有内部remove钩子，需要调用rm，确保能够remove节点
                        rm();
                    }
                }
                else { // Text node
                    api.removeChild(parentElm, ch.elm);
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
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0, newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
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
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            //原理与上面相同
            else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
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
                idxInOld = oldKeyToIdx[newStartVnode.key];
                //如果新节点在旧节点中不存在，我们将它插入到旧头索引节点前，然后新头索引向后
                if (isUndef(idxInOld)) { // New element
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    //如果新节点在就旧节点组中存在，先找到对应的旧节点
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        //先将新节点和对应旧节点作更新
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        //然后将旧节点组中对应节点设置为undefined,代表已经遍历过了，不在遍历，否则可能存在重复插入的问题
                        oldCh[idxInOld] = undefined;
                        //插入到旧头索引节点之前
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    //新头索引向后
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            //当旧头索引大于旧尾索引时，代表旧节点组已经遍历完，将剩余的新Vnode添加到最后一个新节点的位置后
            if (oldStartIdx > oldEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            //如果新节点组先遍历完，那么代表旧节点组中剩余节点都不需要，所以直接删除
            else {
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        // 在patch之前，先调用vnode.data的prepatch钩子
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        var elm = vnode.elm = oldVnode.elm;
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        // 如果oldvnode和vnode的引用相同，说明没发生任何变化直接返回，避免性能浪费
        if (oldVnode === vnode)
            return;
        // 如果vnode和oldvnode相似，那么我们要对oldvnode本身进行更新
        if (vnode.data !== undefined) {
            // 首先调用全局的update钩子，对vnode.elm本身属性进行更新
            for (i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            // 然后调用vnode.data里面的update钩子,再次对vnode.elm更新
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update))
                i(oldVnode, vnode);
        }
        // 如果vnode不是text节点
        if (isUndef(vnode.text)) {
            // 如果vnode和oldVnode都有子节点
            if (isDef(oldCh) && isDef(ch)) {
                // 当Vnode和oldvnode的子节点不同时，调用updatechilren函数，diff子节点
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            // 如果vnode有子节点，oldvnode没子节点
            else if (isDef(ch)) {
                //oldvnode是text节点，则将elm的text清除
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                //并添加vnode的children
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            // 如果oldvnode有children，而vnode没children，则移除elm的children
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 如果vnode和oldvnode都没chidlren，且vnode没text，则删除oldvnode的text
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        // 如果oldvnode的text和vnode的text不同，则更新为vnode的text
        else if (oldVnode.text !== vnode.text) {
            api.setTextContent(elm, vnode.text);
        }
        // patch完，触发postpatch钩子
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    // 我们需要明确的一个是，如果按照传统的diff算法，那么为了找到最小变化，需要逐层逐层的去搜索比较，这样时间复杂度将会达到 O(n^3)的级别，代价十分高
    // vdom采取的是一种简化的思路，只比较同层节点，如果不同，那么即使该节点的子节点没变化，我们也不复用，直接将从父节点开始的子树全部删除，然后再重新创建节点添加到新的位置。如果父节点没变化，我们就比较所有同层的子节点，对这些子节点进行删除、创建、移位操作
    // patch只需要对两个vnode进行判断是否相似，如果相似，则对他们进行patchVnode操作，否则直接用vnode替换oldvnode
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        // 记录被插入的vnode队列，用于批触发insert
        var insertedVnodeQueue = [];
        //调用全局pre钩子
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        // 如果oldvnode是dom节点，转化为oldvnode
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        // 如果oldvnode与vnode相似，进行更新
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            // 否则，将vnode插入，并将oldvnode从其父节点上直接删除
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        // 插入完后，调用被插入的vnode的insert钩子
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        // 然后调用全局下的post钩子
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        // 返回vnode用作下次patch的oldvnode
        return vnode;
    };
}
exports.init = init;

},{"./h":1,"./htmldomapi":2,"./is":3,"./thunk":11,"./vnode":12}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("./h");
function copyToThunk(vnode, thunk) {
    thunk.elm = vnode.elm;
    vnode.data.fn = thunk.data.fn;
    vnode.data.args = thunk.data.args;
    thunk.data = vnode.data;
    thunk.children = vnode.children;
    thunk.text = vnode.text;
    thunk.elm = vnode.elm;
}
function init(thunk) {
    var cur = thunk.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunk);
}
function prepatch(oldVnode, thunk) {
    var i, old = oldVnode.data, cur = thunk.data;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunk);
        return;
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunk);
            return;
        }
    }
    copyToThunk(oldVnode, thunk);
}
exports.thunk = function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args
    });
};
exports.default = exports.thunk;

},{"./h":1}],12:[function(require,module,exports){
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

},{}]},{},[9])(9)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJoLmpzIiwiaHRtbGRvbWFwaS5qcyIsImlzLmpzIiwibW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibW9kdWxlcy9jbGFzcy5qcyIsIm1vZHVsZXMvZXZlbnRsaXN0ZW5lcnMuanMiLCJtb2R1bGVzL3Byb3BzLmpzIiwibW9kdWxlcy9zdHlsZS5qcyIsInNuYWJiZG9tLmJ1bmRsZS5qcyIsInNuYWJiZG9tLmpzIiwidGh1bmsuanMiLCJ2bm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xyXG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcclxuLy8g5re75Yqg5ZG95ZCN56m66Ze077yIc3Zn5omN6ZyA6KaB77yJXHJcbmZ1bmN0aW9uIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpIHtcclxuICAgIGRhdGEubnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xyXG4gICAgaWYgKHNlbCAhPT0gJ2ZvcmVpZ25PYmplY3QnICYmIGNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyDpgJLlvZLkuLrlrZDoioLngrnmt7vliqDlkb3lkI3nqbrpl7RcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xyXG4gICAgICAgICAgICBpZiAoY2hpbGREYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGFkZE5TKGNoaWxkRGF0YSwgY2hpbGRyZW5baV0uY2hpbGRyZW4sIGNoaWxkcmVuW2ldLnNlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy8gaOaYr+S4gOS4quWMheijheWHveaVsO+8jOS4u+imgeaYr+WcqHZub2Rl5LiK5YaN5YGa5LiA5bGC5YyF6KOF77yaXHJcbi8vIOWmguaenOaYr3N2Z++8jOWImeS4uuWFtua3u+WKoOWRveWQjeepuumXtFxyXG4vLyDlsIZjaGlsZHJlbuS4reeahHRleHTljIXoo4XmiJB2bm9kZeW9ouW8j1xyXG4vL+WwhlZOb2Rl5riy5p+T5Li6VkRPTVxyXG4vKipcclxuICogQHBhcmFtIHNlbCDpgInmi6nlmahcclxuICogQHBhcmFtIGIgICAg5pWw5o2uXHJcbiAqIEBwYXJhbSBjICAgIOWtkOiKgueCuVxyXG4gKiBAcmV0dXJucyB7e3NlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSwga2V5fX1cclxuICovXHJcbmZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XHJcbiAgICB2YXIgZGF0YSA9IHt9LCBjaGlsZHJlbiwgdGV4dCwgaTtcclxuICAgIC8vIOWmguaenOWtmOWcqOWtkOiKgueCuVxyXG4gICAgaWYgKGMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIOmCo+S5iGjnmoTnrKzkuozpobnlsLHmmK9kYXRhXHJcbiAgICAgICAgZGF0YSA9IGI7XHJcbiAgICAgICAgLy8g5aaC5p6cY+aYr+aVsOe7hO+8jOmCo+S5iOWtmOWcqOWtkGVsZW1lbnToioLngrlcclxuICAgICAgICBpZiAoaXMuYXJyYXkoYykpIHtcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBjO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDlkKbliJnkuLrlrZB0ZXh06IqC54K5XHJcbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGMpKSB7XHJcbiAgICAgICAgICAgIHRleHQgPSBjO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChjICYmIGMuc2VsKSB7XHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2NdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIOWmguaenGPkuI3lrZjlnKjvvIzlj6rlrZjlnKhi77yM6YKj5LmI6K+05piO6ZyA6KaB5riy5p+T55qEdmRvbeS4jeWtmOWcqGRhdGHpg6jliIbvvIzlj6rlrZjlnKjlrZDoioLngrnpg6jliIZcclxuICAgIGVsc2UgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGlmIChpcy5hcnJheShiKSkge1xyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShiKSkge1xyXG4gICAgICAgICAgICB0ZXh0ID0gYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYiAmJiBiLnNlbCkge1xyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSBiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIC8vIOWmguaenOWtkOiKgueCueaVsOe7hOS4re+8jOWtmOWcqOiKgueCueaYr+WOn+Wni+exu+Wei++8jOivtOaYjuivpeiKgueCueaYr3RleHToioLngrnvvIzlm6DmraTmiJHku6zlsIblroPmuLLmn5PkuLrkuIDkuKrlj6rljIXlkKt0ZXh055qEVk5vZGVcclxuICAgICAgICAgICAgaWYgKGlzLnByaW1pdGl2ZShjaGlsZHJlbltpXSkpXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXSA9IHZub2RlXzEudm5vZGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2hpbGRyZW5baV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy/lpoLmnpzmmK9zdmfvvIzpnIDopoHkuLroioLngrnmt7vliqDlkb3lkI3nqbrpl7RcclxuICAgIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJyAmJlxyXG4gICAgICAgIChzZWwubGVuZ3RoID09PSAzIHx8IHNlbFszXSA9PT0gJy4nIHx8IHNlbFszXSA9PT0gJyMnKSkge1xyXG4gICAgICAgIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpO1xyXG4gICAgfVxyXG4gICAgLy8g5Yib5bu65bm26L+U5Zue5LiA5Liqdm5vZGVcclxuICAgIHJldHVybiB2bm9kZV8xLnZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XHJcbn1cclxuZXhwb3J0cy5oID0gaDtcclxuO1xyXG5leHBvcnRzLmRlZmF1bHQgPSBoO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1oLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICog5pS55paH5Lu25bCx5piv5a+55Y6f55SfRE9N5pON5L2c5YGa5LqG5LiA5bGC5oq96LGhXHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbn1cclxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpO1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHRleHQpIHtcclxuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVDb21tZW50KHRleHQpIHtcclxuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpO1xyXG59XHJcbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKSB7XHJcbiAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCByZWZlcmVuY2VOb2RlKTtcclxufVxyXG5mdW5jdGlvbiByZW1vdmVDaGlsZChub2RlLCBjaGlsZCkge1xyXG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbn1cclxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpIHtcclxuICAgIG5vZGUuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG59XHJcbmZ1bmN0aW9uIHBhcmVudE5vZGUobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZTtcclxufVxyXG5mdW5jdGlvbiBuZXh0U2libGluZyhub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZS5uZXh0U2libGluZztcclxufVxyXG5mdW5jdGlvbiB0YWdOYW1lKGVsbSkge1xyXG4gICAgcmV0dXJuIGVsbS50YWdOYW1lO1xyXG59XHJcbmZ1bmN0aW9uIHNldFRleHRDb250ZW50KG5vZGUsIHRleHQpIHtcclxuICAgIG5vZGUudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG59XHJcbmZ1bmN0aW9uIGdldFRleHRDb250ZW50KG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlLnRleHRDb250ZW50O1xyXG59XHJcbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTtcclxufVxyXG5mdW5jdGlvbiBpc1RleHQobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDM7XHJcbn1cclxuZnVuY3Rpb24gaXNDb21tZW50KG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSA4O1xyXG59XHJcbmV4cG9ydHMuaHRtbERvbUFwaSA9IHtcclxuICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXHJcbiAgICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcclxuICAgIGNyZWF0ZVRleHROb2RlOiBjcmVhdGVUZXh0Tm9kZSxcclxuICAgIGNyZWF0ZUNvbW1lbnQ6IGNyZWF0ZUNvbW1lbnQsXHJcbiAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcclxuICAgIHJlbW92ZUNoaWxkOiByZW1vdmVDaGlsZCxcclxuICAgIGFwcGVuZENoaWxkOiBhcHBlbmRDaGlsZCxcclxuICAgIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXHJcbiAgICBuZXh0U2libGluZzogbmV4dFNpYmxpbmcsXHJcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxyXG4gICAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxyXG4gICAgZ2V0VGV4dENvbnRlbnQ6IGdldFRleHRDb250ZW50LFxyXG4gICAgaXNFbGVtZW50OiBpc0VsZW1lbnQsXHJcbiAgICBpc1RleHQ6IGlzVGV4dCxcclxuICAgIGlzQ29tbWVudDogaXNDb21tZW50LFxyXG59O1xyXG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmh0bWxEb21BcGk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWh0bWxkb21hcGkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKiDnsbvlnovliKTmlq3nm7jlhbPnmoTmlofku7ZcclxuICogQHR5cGUge2Z1bmN0aW9uKGFueSk6IGJvb2xlYW59XHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbmV4cG9ydHMuYXJyYXkgPSBBcnJheS5pc0FycmF5O1xyXG5mdW5jdGlvbiBwcmltaXRpdmUocykge1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgcyA9PT0gJ251bWJlcic7XHJcbn1cclxuZXhwb3J0cy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICog5Li76KaB5Yqf6IO95aaC5LiL77yaXHJcbiAqICAgIOS7jmVsbeeahOeGn+aCieWQhOenjeWIoOmZpHZub2Rl5Lit5Zu95LiN5a2Y5Zyo55qE5bGe5oCn77yI5YyF5ous6YKj5LqbYm9vbGVhbuexu+WxnuaAp++8jOWmguaenOaWsOeahHZub2Rl6K6+572u5Li6ZmFsc2XvvIzlkIzmoLfliKDpmaTvvIlcclxuICogICAg5aaC5p6cb2xkdm5vZGXkuI52bm9kZeeUqOWQjOWQjeWxnuaAp++8jOWImeWcqGVsbeS4iuabtOaWsOWvueW6lOWxnuaAp+WAvFxyXG4gKiAgICDlpoLmnpx2bm9kZeacieaWsOWxnuaAp++8jOWImea3u+WKoOWIsGVsbeS4rVxyXG4gKiAgICDlpoLmnpzlrZjlnKjlkb3lkI3nqbrpl7TvvIzliJnnlKhzZXRBdHRyaWJ1dGVOU+iuvue9rlxyXG4gKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG52YXIgeGxpbmtOUyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcclxudmFyIHhtbE5TID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XHJcbnZhciBjb2xvbkNoYXIgPSA1ODsgLy8gOlxyXG52YXIgeENoYXIgPSAxMjA7IC8vIHhcclxuZnVuY3Rpb24gdXBkYXRlQXR0cnMob2xkVm5vZGUsIHZub2RlKSB7XHJcbiAgICB2YXIga2V5LCBlbG0gPSB2bm9kZS5lbG0sIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycywgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xyXG4gICAgLy8g5aaC5p6c5pen6IqC54K55ZKM5paw6IqC54K56YO95LiN5YyF5ZCr5bGe5oCn77yM56uL5Yi76L+U5ZueXHJcbiAgICBpZiAoIW9sZEF0dHJzICYmICFhdHRycylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBpZiAob2xkQXR0cnMgPT09IGF0dHJzKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XHJcbiAgICBhdHRycyA9IGF0dHJzIHx8IHt9O1xyXG4gICAgLy8gdXBkYXRlIG1vZGlmaWVkIGF0dHJpYnV0ZXMsIGFkZCBuZXcgYXR0cmlidXRlc1xyXG4gICAgLy8g5pu05paw5pS55Y+Y5LqG55qE5bGe5oCn77yM5re75Yqg5paw55qE5bGe5oCnXHJcbiAgICBmb3IgKGtleSBpbiBhdHRycykge1xyXG4gICAgICAgIHZhciBjdXIgPSBhdHRyc1trZXldO1xyXG4gICAgICAgIHZhciBvbGQgPSBvbGRBdHRyc1trZXldO1xyXG4gICAgICAgIC8vIOWmguaenOaXp+eahOWxnuaAp+WSjOaWsOeahOWxnuaAp+S4jeWQjFxyXG4gICAgICAgIGlmIChvbGQgIT09IGN1cikge1xyXG4gICAgICAgICAgICAvLyDlhYjliKTmlq1jdXLmmK/kuI3mmK/lgLzkuLrluIPlsJTlgLznmoTlsZ7mgKdcclxuICAgICAgICAgICAgaWYgKGN1ciA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGN1ciA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChrZXkuY2hhckNvZGVBdCgwKSAhPT0geENoYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDMpID09PSBjb2xvbkNoYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeG1sIG5hbWVzcGFjZVxyXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bWxOUywga2V5LCBjdXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoNSkgPT09IGNvbG9uQ2hhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZSB4bGluayBuYW1lc3BhY2VcclxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeGxpbmtOUywga2V5LCBjdXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyByZW1vdmUgcmVtb3ZlZCBhdHRyaWJ1dGVzXHJcbiAgICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXHJcbiAgICAvLyB0aGUgb3RoZXIgb3B0aW9uIGlzIHRvIHJlbW92ZSBhbGwgYXR0cmlidXRlcyB3aXRoIHZhbHVlID09IHVuZGVmaW5lZFxyXG4gICAgLy8g5Yig6Zmk5LiN5Zyo5paw6IqC54K55bGe5oCn5Lit55qE5pen6IqC54K555qE5bGe5oCnXHJcbiAgICBmb3IgKGtleSBpbiBvbGRBdHRycykge1xyXG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykpIHtcclxuICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLmF0dHJpYnV0ZXNNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQXR0cnMsIHVwZGF0ZTogdXBkYXRlQXR0cnMgfTtcclxuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdHRyaWJ1dGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKlxyXG4gKiDku45lbG3kuK3liKDpmaR2bm9kZeS4reS4jeWtmOWcqOeahOaIluiAheWAvOS4umZhbHNl55qE57G7XHJcbiAqIOWwhnZub2Rl5Lit5paw55qEY2xhc3Pmt7vliqDliLBlbG3kuIrljrtcclxuICogQHBhcmFtIG9sZFZub2RlXHJcbiAqIEBwYXJhbSB2bm9kZVxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlQ2xhc3Mob2xkVm5vZGUsIHZub2RlKSB7XHJcbiAgICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIG9sZENsYXNzID0gb2xkVm5vZGUuZGF0YS5jbGFzcywga2xhc3MgPSB2bm9kZS5kYXRhLmNsYXNzO1xyXG4gICAgLy8g5aaC5p6c5pen6IqC54K55ZKM5paw6IqC54K56YO95rKh5pyJY2xhc3PvvIznm7TmjqXov5Tlm55cclxuICAgIGlmICghb2xkQ2xhc3MgJiYgIWtsYXNzKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIGlmIChvbGRDbGFzcyA9PT0ga2xhc3MpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcclxuICAgIGtsYXNzID0ga2xhc3MgfHwge307XHJcbiAgICAvL+S7juaXp+iKgueCueS4reWIoOmZpOaWsOiKgueCueS4jeWtmOWcqOeahOexu1xyXG4gICAgZm9yIChuYW1lIGluIG9sZENsYXNzKSB7XHJcbiAgICAgICAgaWYgKCFrbGFzc1tuYW1lXSkge1xyXG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDlpoLmnpzmlrDoioLngrnkuK3lr7nlupTml6foioLngrnnmoTnsbvorr7nva7kuLpmYWxzZe+8jOWImeWIoOmZpOivpeexu++8jOWmguaenOaWsOiuvue9ruS4unRydWXvvIzliJnmt7vliqDor6XnsbtcclxuICAgIGZvciAobmFtZSBpbiBrbGFzcykge1xyXG4gICAgICAgIGN1ciA9IGtsYXNzW25hbWVdO1xyXG4gICAgICAgIGlmIChjdXIgIT09IG9sZENsYXNzW25hbWVdKSB7XHJcbiAgICAgICAgICAgIGVsbS5jbGFzc0xpc3RbY3VyID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmV4cG9ydHMuY2xhc3NNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3MgfTtcclxuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5jbGFzc01vZHVsZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKiBzbmFiYmRvbeS4reWvueS6i+S7tuWkhOeQhuWBmuS6huS4gOWxguWMheijhe+8jOecn+WunkRPTeeahOS6i+S7tuinpuWPkeeahOaYr+WvuXZub2Rl55qE5pON5L2cXHJcbiAqIOS4u+imgemAlOW+hO+8mlxyXG4gKiAgICBjcmVhdGVMaXN0bmVyID0+IOi/lOWbnmhhbmRsZXLkvZzkuovku7bnm5HlkKznlJ/miJDlmaggPT5oYW5kbGVy5LiK57uR5a6adm5vZGUgPT7lsIZoYW5kbGVy5L2c55yf5a6eRE9N55qE5LqL5Lu25aSE55CG5ZmoXHJcbiAqICAgIOecn+WunkRPTeS6i+S7tuinpuWPkeWQjiA9PiBoYW5kbGVy6I635b6X55yf5a6eRE9N55qE5LqL5Lu25a+56LGhID0+IOWwhuecn+WunkRPTeS6i+S7tuWvueixoeS8oOWFpWhhbmRsZUV2ZW50ID0+IGhhbmRsZUV2ZW505om+5Yiw5a+55bqU55qEdm5vZGXkuovku7blpITnkIblmajvvIznhLblkI7osIPnlKjov5nkuKrlpITnkIblmajku47ogIzkv67mlLl2bm9kZVxyXG4gKi9cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vLyDlr7l2bm9kZei/m+ihjOS6i+S7tuWkhOeQhlxyXG5mdW5jdGlvbiBpbnZva2VIYW5kbGVyKGhhbmRsZXIsIHZub2RlLCBldmVudCkge1xyXG4gICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAvLyBjYWxsIGZ1bmN0aW9uIGhhbmRsZXJcclxuICAgICAgICAvLyDlsIbkuovku7blpITnkIblmajnmoTkuIrkuIvmloforr7nva7kuLp2bm9kZVxyXG4gICAgICAgIGhhbmRsZXIuY2FsbCh2bm9kZSwgZXZlbnQsIHZub2RlKTtcclxuICAgIH1cclxuICAgIC8v5a2Y5Zyo5LqL5Lu257uR5a6a5pWw5o2u5oiW6ICF5a2Y5Zyo5aSa5LqL5Lu25aSE55CG5ZmoXHJcbiAgICBlbHNlIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgIC8vIGNhbGwgaGFuZGxlciB3aXRoIGFyZ3VtZW50c1xyXG4gICAgICAgIC8vIOivtOaYjuWPquacieS4gOS4quS6i+S7tuWkhOeQhuWZqFxyXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlclswXSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3Igc2luZ2xlIGFyZ3VtZW50IGZvciBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICAvL+WmguaenOe7keWumuaVsOaNruWPquacieS4gOS4qu+8jOWImeebtOaOpeWwhuaVsOaNrueUqGNhbGznmoTmlrnlvI/osIPnlKjvvIzmj5Dpq5jmgKfog71cclxuICAgICAgICAgICAgLy/lvaLlpoJvbjp7Y2xpY2s6W2hhbmRsZXIsMV19XHJcbiAgICAgICAgICAgIGlmIChoYW5kbGVyLmxlbmd0aCA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlclswXS5jYWxsKHZub2RlLCBoYW5kbGVyWzFdLCBldmVudCwgdm5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzlrZjlnKjlpJrkuKrnu5HlrprmlbDmja7vvIzliJnopoHovazljJbkuLrmlbDnu4TvvIznlKhhcHBseeeahOaWueW8j+iwg+eUqO+8jOiAjGFwcGx55oCn6IO95q+UY2FsbOW3rlxyXG4gICAgICAgICAgICAgICAgLy/lvaLlpoI6b246e2NsaWNrOltoYW5kbGVyLDEsMiwzXX1cclxuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gaGFuZGxlci5zbGljZSgxKTtcclxuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChldmVudCk7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2godm5vZGUpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlclswXS5hcHBseSh2bm9kZSwgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGNhbGwgbXVsdGlwbGUgaGFuZGxlcnNcclxuICAgICAgICAgICAgLy/lpoLmnpzlrZjlnKjlpJrkuKrnm7jlkIzkuovku7bnmoTkuI3lkIzlpITnkIblmajvvIzliJnpgJLlvZLosIPnlKhcclxuICAgICAgICAgICAgLy/lpoJvbu+8mntjbGljazpbW2hhbmRlbGVyMSwxXSxbaGFuZGxlciwyXV19XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaW52b2tlSGFuZGxlcihoYW5kbGVyW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vKipcclxuICpcclxuICogQHBhcmFtIGV2ZW50IOecn+WunmRvbeeahOS6i+S7tuWvueixoVxyXG4gKiBAcGFyYW0gdm5vZGVcclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUV2ZW50KGV2ZW50LCB2bm9kZSkge1xyXG4gICAgdmFyIG5hbWUgPSBldmVudC50eXBlLCBvbiA9IHZub2RlLmRhdGEub247XHJcbiAgICAvLyBjYWxsIGV2ZW50IGhhbmRsZXIocykgaWYgZXhpc3RzXHJcbiAgICAvLyDlpoLmnpzmib7liLDlr7nlupTnmoR2bm9kZeS6i+S7tuWkhOeQhuWZqO+8jOWImeiwg+eUqFxyXG4gICAgaWYgKG9uICYmIG9uW25hbWVdKSB7XHJcbiAgICAgICAgaW52b2tlSGFuZGxlcihvbltuYW1lXSwgdm5vZGUsIGV2ZW50KTtcclxuICAgIH1cclxufVxyXG4vL+S6i+S7tuebkeWQrOWZqOeUn+aIkOWZqO+8jOeUqOS6juWkhOeQhuecn+WunkRPTeS6i+S7tlxyXG5mdW5jdGlvbiBjcmVhdGVMaXN0ZW5lcigpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAgICAgaGFuZGxlRXZlbnQoZXZlbnQsIGhhbmRsZXIudm5vZGUpO1xyXG4gICAgfTtcclxufVxyXG4vL+abtOaWsOS6i+S7tuebkeWQrFxyXG5mdW5jdGlvbiB1cGRhdGVFdmVudExpc3RlbmVycyhvbGRWbm9kZSwgdm5vZGUpIHtcclxuICAgIHZhciBvbGRPbiA9IG9sZFZub2RlLmRhdGEub24sIG9sZExpc3RlbmVyID0gb2xkVm5vZGUubGlzdGVuZXIsIG9sZEVsbSA9IG9sZFZub2RlLmVsbSwgb24gPSB2bm9kZSAmJiB2bm9kZS5kYXRhLm9uLCBlbG0gPSAodm5vZGUgJiYgdm5vZGUuZWxtKSwgbmFtZTtcclxuICAgIC8vIG9wdGltaXphdGlvbiBmb3IgcmV1c2VkIGltbXV0YWJsZSBoYW5kbGVyc1xyXG4gICAgLy8g5aaC5p6c5paw5pen5LqL5Lu255uR5ZCs5Zmo5LiA5qC377yM5YiZ55u05o6l6L+U5ZueXHJcbiAgICBpZiAob2xkT24gPT09IG9uKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gcmVtb3ZlIGV4aXN0aW5nIGxpc3RlbmVycyB3aGljaCBubyBsb25nZXIgdXNlZFxyXG4gICAgLy/lpoLmnpzmlrDoioLngrnkuIrmsqHmnInkuovku7bnm5HlkKzvvIzliJnlsIbml6foioLngrnkuIrnmoTkuovku7bnm5HlkKzpg73liKDpmaRcclxuICAgIGlmIChvbGRPbiAmJiBvbGRMaXN0ZW5lcikge1xyXG4gICAgICAgIC8vIGlmIGVsZW1lbnQgY2hhbmdlZCBvciBkZWxldGVkIHdlIHJlbW92ZSBhbGwgZXhpc3RpbmcgbGlzdGVuZXJzIHVuY29uZGl0aW9uYWxseVxyXG4gICAgICAgIGlmICghb24pIHtcclxuICAgICAgICAgICAgZm9yIChuYW1lIGluIG9sZE9uKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgaWYgZWxlbWVudCB3YXMgY2hhbmdlZCBvciBleGlzdGluZyBsaXN0ZW5lcnMgcmVtb3ZlZFxyXG4gICAgICAgICAgICAgICAgb2xkRWxtLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgb2xkTGlzdGVuZXIsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy/liKDpmaTml6foioLngrnkuK3mlrDoioLngrnkuI3lrZjlnKjnmoTkuovku7bnm5HlkKxcclxuICAgICAgICAgICAgZm9yIChuYW1lIGluIG9sZE9uKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgaWYgZXhpc3RpbmcgbGlzdGVuZXIgcmVtb3ZlZFxyXG4gICAgICAgICAgICAgICAgaWYgKCFvbltuYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9sZEVsbS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIG9sZExpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBhZGQgbmV3IGxpc3RlbmVycyB3aGljaCBoYXMgbm90IGFscmVhZHkgYXR0YWNoZWRcclxuICAgIGlmIChvbikge1xyXG4gICAgICAgIC8vIHJldXNlIGV4aXN0aW5nIGxpc3RlbmVyIG9yIGNyZWF0ZSBuZXdcclxuICAgICAgICAvL+WmguaenG9sZHZub2Rl5LiK5bey57uP5pyJbGlzdGVuZXLvvIzliJl2bm9kZeebtOaOpeWkjeeUqO+8jOWQpuWImeWImeaWsOW7uuS6i+S7tuWkhOeQhuWZqFxyXG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHZub2RlLmxpc3RlbmVyID0gb2xkVm5vZGUubGlzdGVuZXIgfHwgY3JlYXRlTGlzdGVuZXIoKTtcclxuICAgICAgICAvLyB1cGRhdGUgdm5vZGUgZm9yIGxpc3RlbmVyXHJcbiAgICAgICAgLy/lnKjkuovku7blpITnkIblmajkuIrnu5Hlrpp2bm9kZVxyXG4gICAgICAgIGxpc3RlbmVyLnZub2RlID0gdm5vZGU7XHJcbiAgICAgICAgLy8gaWYgZWxlbWVudCBjaGFuZ2VkIG9yIGFkZGVkIHdlIGFkZCBhbGwgbmVlZGVkIGxpc3RlbmVycyB1bmNvbmRpdGlvbmFsbHlcclxuICAgICAgICAvL+WmguaenG9sZHZub2Rl5LiK5rKh5pyJ5LqL5Lu25aSE55CG5ZmoXHJcbiAgICAgICAgaWYgKCFvbGRPbikge1xyXG4gICAgICAgICAgICBmb3IgKG5hbWUgaW4gb24pIHtcclxuICAgICAgICAgICAgICAgIC8vIGFkZCBsaXN0ZW5lciBpZiBlbGVtZW50IHdhcyBjaGFuZ2VkIG9yIG5ldyBsaXN0ZW5lcnMgYWRkZWRcclxuICAgICAgICAgICAgICAgIC8v55u05o6l5bCGdm5vZGXkuIrnmoTkuovku7blpITnkIblmajmt7vliqDliLBlbG3kuIpcclxuICAgICAgICAgICAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGZvciAobmFtZSBpbiBvbikge1xyXG4gICAgICAgICAgICAgICAgLy8gYWRkIGxpc3RlbmVyIGlmIG5ldyBsaXN0ZW5lciBhZGRlZFxyXG4gICAgICAgICAgICAgICAgLy/lkKbliJnmt7vliqBvbGR2bm9kZeS4iuayoeacieeahOS6i+S7tuWkhOeQhuWZqFxyXG4gICAgICAgICAgICAgICAgaWYgKCFvbGRPbltuYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuZXhwb3J0cy5ldmVudExpc3RlbmVyc01vZHVsZSA9IHtcclxuICAgIGNyZWF0ZTogdXBkYXRlRXZlbnRMaXN0ZW5lcnMsXHJcbiAgICB1cGRhdGU6IHVwZGF0ZUV2ZW50TGlzdGVuZXJzLFxyXG4gICAgZGVzdHJveTogdXBkYXRlRXZlbnRMaXN0ZW5lcnNcclxufTtcclxuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5ldmVudExpc3RlbmVyc01vZHVsZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXZlbnRsaXN0ZW5lcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZnVuY3Rpb24gdXBkYXRlUHJvcHMob2xkVm5vZGUsIHZub2RlKSB7XHJcbiAgICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLCBvbGRQcm9wcyA9IG9sZFZub2RlLmRhdGEucHJvcHMsIHByb3BzID0gdm5vZGUuZGF0YS5wcm9wcztcclxuICAgIC8v5aaC5p6c5paw5pen6IqC54K56YO95LiN5a2Y5Zyo5bGe5oCn77yM5YiZ55u05o6l6L+U5ZueXHJcbiAgICBpZiAoIW9sZFByb3BzICYmICFwcm9wcylcclxuICAgICAgICByZXR1cm47XHJcbiAgICBpZiAob2xkUHJvcHMgPT09IHByb3BzKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIG9sZFByb3BzID0gb2xkUHJvcHMgfHwge307XHJcbiAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xyXG4gICAgLy/liKDpmaTml6foioLngrnkuK3mlrDoioLngrnmsqHmnInnmoTlsZ7mgKdcclxuICAgIGZvciAoa2V5IGluIG9sZFByb3BzKSB7XHJcbiAgICAgICAgaWYgKCFwcm9wc1trZXldKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBlbG1ba2V5XTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL+abtOaWsOWxnuaAp1xyXG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIG9sZCA9IG9sZFByb3BzW2tleV07XHJcbiAgICAgICAgLy/lpoLmnpzmlrDml6foioLngrnlsZ7mgKfkuI3lkIzvvIzkuJTlr7nmr5TnmoTlsZ7mgKfkuI3mmK92YWx1ZeaIluiAhWVsbeS4iuWvueW6lOWxnuaAp+WSjOaWsOWxnuaAp+S5n+S4jeWQjO+8jOmCo+S5iOWwsemcgOimgeabtOaWsFxyXG4gICAgICAgIGlmIChvbGQgIT09IGN1ciAmJiAoa2V5ICE9PSAndmFsdWUnIHx8IGVsbVtrZXldICE9PSBjdXIpKSB7XHJcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5leHBvcnRzLnByb3BzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZVByb3BzLCB1cGRhdGU6IHVwZGF0ZVByb3BzIH07XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMucHJvcHNNb2R1bGU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3BzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICog5bCGZWxlbeS4iuWtmOWcqOS6jm9sZHZub2Rl5Lit5L2G5LiN5a2Y5Zyo5LqOdm5vZGXnmoRzdHlsZee9ruepulxyXG4gKiDlpoLmnpx2bm9kZS5zdHlsZeS4reeahGRlbGF5ZWTkuI5vbGR2bm9kZeeahOS4jeWQjO+8jOWImeabtOaWsGRlbGF5ZWTnmoTlsZ7mgKflgLzvvIzlubblnKjkuIvkuIDluKflsIZlbG3nmoRzdHlsZeiuvue9ruS4uuivpeWAvO+8jOS7juiAjOWunueOsOWKqOeUu+i/h+a4oeaViOaenFxyXG4gKiDpnZ5kZWxheWVk5ZKMcmVtb3Zl55qEc3R5bGXnm7TmjqXmm7TmlrBcclxuICogdm5vZGXooqtkZXN0cm955pe277yM55u05o6l5bCG5a+55bqUc3R5bGXmm7TmlrDkuLp2bm9kZS5kYXRhLnN0eWxlLmRlc3RvcnnnmoTlgLxcclxuICogdm5vZGXooqtyZW9tdmXml7bvvIzlpoLmnpxzdHlsZS5yZW1vdmXkuI3lrZjlnKjvvIznm7TmjqXosIPnlKjlhajlsYByZW1vdmXpkqnlrZDov5vlhaXkuIvkuIDkuKpyZW1vdmXov4fnqItcclxuIOWmguaenHN0eWxlLnJlbW92ZeWtmOWcqO+8jOmCo+S5iOaIkeS7rOWwsemcgOimgeiuvue9rnJlbW92ZeWKqOeUu+i/h+a4oeaViOaenO+8jOetieWIsOi/h+a4oeaViOaenOe7k+adn+S5i+WQju+8jOaJjeiwg+eUqFxyXG4g5LiL5LiA5LiqcmVtb3Zl6L+H56iLXHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8v5aaC5p6c5a2Y5ZyocmVxdWVzdEFuaW1hdGlvbkZyYW1l77yM5YiZ55u05o6l5L2/55So77yM5Lul5LyY5YyW5oCn6IO977yM5ZCm5YiZ55Soc2V0VGltZW91dFxyXG52YXIgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHx8IHNldFRpbWVvdXQ7XHJcbnZhciBuZXh0RnJhbWUgPSBmdW5jdGlvbiAoZm4pIHsgcmFmKGZ1bmN0aW9uICgpIHsgcmFmKGZuKTsgfSk7IH07XHJcbi8v6YCa6L+HbmV4dEZyYW1l5p2l5a6e546w5Yqo55S75pWI5p6cXHJcbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xyXG4gICAgbmV4dEZyYW1lKGZ1bmN0aW9uICgpIHsgb2JqW3Byb3BdID0gdmFsOyB9KTtcclxufVxyXG5mdW5jdGlvbiB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpIHtcclxuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlLCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XHJcbiAgICAvL+WmguaenG9sZHZub2Rl5ZKMdm5vZGXpg73msqHmnIlzdHlsZe+8jOebtOaOpei/lOWbnlxyXG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgaWYgKG9sZFN0eWxlID09PSBzdHlsZSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBvbGRTdHlsZSA9IG9sZFN0eWxlIHx8IHt9O1xyXG4gICAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcclxuICAgIHZhciBvbGRIYXNEZWwgPSAnZGVsYXllZCcgaW4gb2xkU3R5bGU7XHJcbiAgICAvL+mBjeWOhm9sZHZub2Rl55qEc3R5bGVcclxuICAgIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xyXG4gICAgICAgIC8v5aaC5p6cdm5vZGXkuK3ml6Dor6VzdHlsZe+8jOWImee9ruepulxyXG4gICAgICAgIGlmICghc3R5bGVbbmFtZV0pIHtcclxuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9ICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XHJcbiAgICAgICAgY3VyID0gc3R5bGVbbmFtZV07XHJcbiAgICAgICAgLy/lpoLmnpx2bm9kZeeahHN0eWxl5Lit5pyJZGVsYXllZOS4lOS4jm9sZHZub2Rl5Lit55qE5LiN5ZCM77yM5YiZ5Zyo5LiL5LiA5bin6K6+572uZGVsYXllZOeahOWPguaVsFxyXG4gICAgICAgIGlmIChuYW1lID09PSAnZGVsYXllZCcgJiYgc3R5bGUuZGVsYXllZCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lMiBpbiBzdHlsZS5kZWxheWVkKSB7XHJcbiAgICAgICAgICAgICAgICBjdXIgPSBzdHlsZS5kZWxheWVkW25hbWUyXTtcclxuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXROZXh0RnJhbWUoZWxtLnN0eWxlLCBuYW1lMiwgY3VyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL+WmguaenOS4jeaYr2RlbGF5ZWTlkoxyZW1vdmXnmoRzdHlsZe+8jOS4lOS4jeWQjOS6jm9sZHZub2Rl55qE5YC877yM5YiZ55u05o6l6K6+572u5paw5YC8XHJcbiAgICAgICAgZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xyXG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy/orr7nva7oioLngrnooqtkZXN0b3J55pe255qEc3R5bGVcclxuZnVuY3Rpb24gYXBwbHlEZXN0cm95U3R5bGUodm5vZGUpIHtcclxuICAgIHZhciBzdHlsZSwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBzID0gdm5vZGUuZGF0YS5zdHlsZTtcclxuICAgIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcclxuICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcclxuICAgIH1cclxufVxyXG4vL+WIoOmZpOaViOaenO+8jOW9k+aIkeS7rOWIoOmZpOS4gOS4quWFg+e0oOaXtu+8jOWFiOWbnuiwg+eUqOWIoOmZpOi/h+W6puaViOaenO+8jOi/h+a4oeWujOaJjeS8muWwhuiKgueCuXJlbW92ZVxyXG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xyXG4gICAgdmFyIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xyXG4gICAgLy/lpoLmnpzmsqHmnIlzdHlsZeaIluayoeaciXN0eWxlLnJlbW92ZVxyXG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xyXG4gICAgICAgIC8v55u05o6l6LCD55Socm3vvIzljbPlrp7pmYXkuIrmmK/osIPnlKjlhajlsYDnmoRyZW1vdmXpkqnlrZBcclxuICAgICAgICBybSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIGkgPSAwLCBjb21wU3R5bGUsIHN0eWxlID0gcy5yZW1vdmUsIGFtb3VudCA9IDAsIGFwcGxpZWQgPSBbXTtcclxuICAgIC8v6K6+572u5bm26K6w5b2VcmVtb3Zl5Yqo5L2c5ZCO5Yig6Zmk6IqC54K55YmN55qE5qC35byPXHJcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcclxuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XHJcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XHJcbiAgICB9XHJcbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XHJcbiAgICAvL+aLv+WIsOaJgOaciemcgOimgei/h+a4oeeahOWxnuaAp1xyXG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XHJcbiAgICAvL+Wvuei/h+a4oeWxnuaAp+iuoeaVsO+8jOi/memHjGFwcGxpZWQubGVuZ3RoID49YW1vdW5077yM5Zug5Li65pyJ5Lqb5bGe5oCn5piv5LiN6ZyA6KaB6L+H5rih55qEXHJcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgaWYgKGFwcGxpZWQuaW5kZXhPZihwcm9wc1tpXSkgIT09IC0xKVxyXG4gICAgICAgICAgICBhbW91bnQrKztcclxuICAgIH1cclxuICAgIC8v5b2T6L+H5rih5pWI5p6c55qE5a6M5oiQ5ZCO77yM5omNcmVtb3Zl6IqC54K577yM6LCD55So5LiL5LiA5LiqcmVtb3Zl6L+H56iLXHJcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgIGlmIChldi50YXJnZXQgPT09IGVsbSlcclxuICAgICAgICAgICAgLS1hbW91bnQ7XHJcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcclxuICAgICAgICAgICAgcm0oKTtcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc3R5bGVNb2R1bGUgPSB7XHJcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGVTdHlsZSxcclxuICAgIGRlc3Ryb3k6IGFwcGx5RGVzdHJveVN0eWxlLFxyXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXHJcbn07XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuc3R5bGVNb2R1bGU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8qKlxyXG4gKiBzbmFiYmRvbeacrOi6q+S+nei1luaJk+WMhVxyXG4gKi9cclxudmFyIHNuYWJiZG9tXzEgPSByZXF1aXJlKFwiLi9zbmFiYmRvbVwiKTtcclxudmFyIGF0dHJpYnV0ZXNfMSA9IHJlcXVpcmUoXCIuL21vZHVsZXMvYXR0cmlidXRlc1wiKTsgLy8gZm9yIHNldHRpbmcgYXR0cmlidXRlcyBvbiBET00gZWxlbWVudHNcclxudmFyIGNsYXNzXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzL2NsYXNzXCIpOyAvLyBtYWtlcyBpdCBlYXN5IHRvIHRvZ2dsZSBjbGFzc2VzXHJcbnZhciBwcm9wc18xID0gcmVxdWlyZShcIi4vbW9kdWxlcy9wcm9wc1wiKTsgLy8gZm9yIHNldHRpbmcgcHJvcGVydGllcyBvbiBET00gZWxlbWVudHNcclxudmFyIHN0eWxlXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzL3N0eWxlXCIpOyAvLyBoYW5kbGVzIHN0eWxpbmcgb24gZWxlbWVudHMgd2l0aCBzdXBwb3J0IGZvciBhbmltYXRpb25zXHJcbnZhciBldmVudGxpc3RlbmVyc18xID0gcmVxdWlyZShcIi4vbW9kdWxlcy9ldmVudGxpc3RlbmVyc1wiKTsgLy8gYXR0YWNoZXMgZXZlbnQgbGlzdGVuZXJzXHJcbnZhciBoXzEgPSByZXF1aXJlKFwiLi9oXCIpOyAvLyBoZWxwZXIgZnVuY3Rpb24gZm9yIGNyZWF0aW5nIHZub2Rlc1xyXG52YXIgcGF0Y2ggPSBzbmFiYmRvbV8xLmluaXQoW1xyXG4gICAgYXR0cmlidXRlc18xLmF0dHJpYnV0ZXNNb2R1bGUsXHJcbiAgICBjbGFzc18xLmNsYXNzTW9kdWxlLFxyXG4gICAgcHJvcHNfMS5wcm9wc01vZHVsZSxcclxuICAgIHN0eWxlXzEuc3R5bGVNb2R1bGUsXHJcbiAgICBldmVudGxpc3RlbmVyc18xLmV2ZW50TGlzdGVuZXJzTW9kdWxlXHJcbl0pO1xyXG5leHBvcnRzLnNuYWJiZG9tQnVuZGxlID0geyBwYXRjaDogcGF0Y2gsIGg6IGhfMS5oIH07XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuc25hYmJkb21CdW5kbGU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYWJiZG9tLmJ1bmRsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xyXG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcclxudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XHJcbmZ1bmN0aW9uIGlzVW5kZWYocykgeyByZXR1cm4gcyA9PT0gdW5kZWZpbmVkOyB9XHJcbmZ1bmN0aW9uIGlzRGVmKHMpIHsgcmV0dXJuIHMgIT09IHVuZGVmaW5lZDsgfVxyXG4vLyDlrprkuYnkuIDkuKrliJvlu7rnqbpub2Rl55qE5pa55rOVXHJcbnZhciBlbXB0eU5vZGUgPSB2bm9kZV8xLmRlZmF1bHQoJycsIHt9LCBbXSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xyXG4vLyDnlKjkuo7lkIzlsYLmrKHnmoRvbGR2bm9kZeS4jnZub2Rl55qE5q+U6L6D77yM5aaC5p6c5ZCM5bGC5qyh6IqC54K555qEa2V55ZKMc2Vs6YO955u45ZCM5oiR5Lus5bCx5Y+v5Lul5L+d55WZ6L+Z5Liq6IqC54K577yM5ZCm5YiZ55u05o6l5pu/5o2i6IqC54K5XHJcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xyXG4gICAgcmV0dXJuIHZub2RlMS5rZXkgPT09IHZub2RlMi5rZXkgJiYgdm5vZGUxLnNlbCA9PT0gdm5vZGUyLnNlbDtcclxufVxyXG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XHJcbiAgICByZXR1cm4gdm5vZGUuc2VsICE9PSB1bmRlZmluZWQ7XHJcbn1cclxuLy8g5bCGb2xkdm5vZGXmlbDnu4TkuK3kvY3nva7lr7lvbGR2bm9kZS5rZXnnmoTmmKDlsITovazmjaLkuLpvbGR2bm9kZS5rZXnlr7nkvY3nva7nmoTmmKDlsIRcclxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcclxuICAgIHZhciBpLCBtYXAgPSB7fSwga2V5LCBjaDtcclxuICAgIGZvciAoaSA9IGJlZ2luSWR4OyBpIDw9IGVuZElkeDsgKytpKSB7XHJcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcclxuICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBrZXkgPSBjaC5rZXk7XHJcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgIG1hcFtrZXldID0gaTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWFwO1xyXG59XHJcbi8vIOmSqeWtkOWHveaVsO+8mmh0dHBzOi8vc2VnbWVudGZhdWx0LmNvbS9hLzExOTAwMDAwMDkwMTczNDlcclxuLy8g5Lul5LiL6L+Z5YWt5Liq5piv5YWo5bGA6ZKp5a2QXHJcbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xyXG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcclxuZXhwb3J0cy5oID0gaF8xLmg7XHJcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XHJcbmV4cG9ydHMudGh1bmsgPSB0aHVua18xLnRodW5rO1xyXG4vKipcclxuICpcclxuICogQHBhcmFtIG1vZHVsZXPvvJppbml05L6d6LWW55qE5qih5Z2X77yM5aaCYXR0cmlidXRl44CBcHJvcHPjgIFldmVudGxpc3RlbmVy6L+Z5Lqb5qih5Z2XXHJcbiAqIEBwYXJhbSBkb21BcGnvvJrlr7nlsIHoo4XnnJ/lrp5ET03mk43kvZznmoTlt6Xlhbflh73mlbDlupPvvIzlpoLmnpzmiJHku6zmsqHmnInkvKDlhaXvvIzliJnpu5jorqRcclxuIOS9v+eUqHNuYWJiZG9t5o+Q5L6b55qEaHRtbGRvbWFwaVxyXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb24oKFZOb2RlfEVsZW1lbnQpLCBWTm9kZSk6IFZOb2RlfVxyXG4gKiBpbml06L+Y5YyF5ZCr5LqG6K645aSadm5vZGXlkoznnJ/lrp5ET03kuYvpl7TnmoTmk43kvZzlkozms6jlhozlhajlsYDpkqnlrZDvvIxcclxuIOi/mOaciXBhdGNoVm5vZGXlkox1cGRhdGVDaGlsZHJlbui/meS4pOS4qumHjeimgeWKn+iDve+8jOeEtuWQjui/lOWbnuS4gOS4qnBhdGNo5Ye95pWwXHJcbiAqL1xyXG5mdW5jdGlvbiBpbml0KG1vZHVsZXMsIGRvbUFwaSkge1xyXG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xyXG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XHJcbiAgICAvL+azqOWGjOmSqeWtkOeahOWbnuiwg++8jOWcqOWPkeeUn+eKtuaAgeWPmOabtOaXtu+8jOinpuWPkeWvueW6lOWxnuaAp+WPmOabtFxyXG4gICAgZm9yIChpID0gMDsgaSA8IGhvb2tzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgY2JzW2hvb2tzW2ldXSA9IFtdO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgIHZhciBob29rID0gbW9kdWxlc1tqXVtob29rc1tpXV07XHJcbiAgICAgICAgICAgIGlmIChob29rICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIOacrOWHveaVsOS4u+imgeeahOWKn+iDveaYr+WwhuS4gOS4quecn+WunkRPTeiKgueCuei9rOWMluaIkHZub2Rl5b2i5byPXHJcbiAgICAvLyDlpoI8ZGl2IGlkPSdhJyBjbGFzcz0nYiBjJz48L2Rpdj7lsIbovazmjaLkuLp7c2VsOidkaXYjYS5iLmMnLGRhdGE6e30sY2hpbGRyZW46W10sdGV4dDp1bmRlZmluZWQsZWxtOjxkaXYgaWQ9J2EnIGNsYXNzPSdiIGMnPn1cclxuICAgIGZ1bmN0aW9uIGVtcHR5Tm9kZUF0KGVsbSkge1xyXG4gICAgICAgIHZhciBpZCA9IGVsbS5pZCA/ICcjJyArIGVsbS5pZCA6ICcnO1xyXG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcclxuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KGFwaS50YWdOYW1lKGVsbSkudG9Mb3dlckNhc2UoKSArIGlkICsgYywge30sIFtdLCB1bmRlZmluZWQsIGVsbSk7XHJcbiAgICB9XHJcbiAgICAvLyDlvZPmiJHku6zpnIDopoFyZW1vdmXkuIDkuKp2bm9kZeaXtu+8jOS8muinpuWPkXJlbW92ZemSqeWtkOS9nOaLpuaIquWZqO+8jOWPquacieWcqOaJgOaciXJlbW92ZemSqeWtkOWbnuiwg+WHveaVsOmDveinpuWPkeWujOaJjeS8muWwhuiKgueCueS7jueItuiKgueCueWIoOmZpO+8jOiAjOi/meS4quWHveaVsOaPkOS+m+eahOWwseaYr+WvuXJlbW92ZemSqeWtkOWbnuiwg+aTjeS9nOeahOiuoeaVsOWKn+iDvVxyXG4gICAgZnVuY3Rpb24gY3JlYXRlUm1DYihjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XHJcbiAgICAgICAgICAgIGlmICgtLWxpc3RlbmVycyA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudF8xID0gYXBpLnBhcmVudE5vZGUoY2hpbGRFbG0pO1xyXG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiDkuLvopoHlip/og73lpoLkuIvvvJpcclxuICAgICAqICAgIOWIneWni+WMlnZub2Rl77yM6LCD55SoaW5pdOmSqeWtkFxyXG4gICAgICogICAg5Yib5bu65a+55bqUdGFnbmFtZeeahERPTSBlbGVtZW506IqC54K577yM5bm25bCGdm5vZGUuc2Vs5Lit55qEaWTlkI3lkoxjbGFzc+WQjeaMgui9veS4iuWOu1xyXG4gICAgICogICAg5aaC5p6c5pyJ5a2Qdm5vZGXvvIzpgJLlvZLliJvlu7pET00gZWxlbWVudOiKgueCue+8jOW5tua3u+WKoOWIsOeItnZub2Rl5a+55bqU55qEZWxlbWVudOiKgueCueS4iuWOu++8jOWQpuWImeWmguaenOaciXRleHTlsZ7mgKfvvIzliJnliJvlu7p0ZXh06IqC54K577yM5bm25re75Yqg5Yiw54i2dm5vZGXlr7nlupTnmoRlbGVtZW506IqC54K55LiK5Y67XHJcbiAgICAgKiAgICB2bm9kZei9rOaNouaIkGRvbeiKgueCueaTjeS9nOWujOaIkOWQju+8jOiwg+eUqGNyZWF0ZemSqeWtkFxyXG4gICAgICogICAg5aaC5p6cdm5vZGXkuIrmnIlpbnNlcnTpkqnlrZDvvIzpgqPkuYjlsLHlsIbov5nkuKp2bm9kZeaUvuWFpWluc2VydGVkVm5vZGVRdWV1ZeS4reS9nOiusOW9le+8jOWIsOaXtuWGjeWcqOWFqOWxgOaJuemHj+iwg+eUqGluc2VydOmSqeWtkOWbnuiwg1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xyXG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcclxuICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8v5b2T6IqC54K55LiK5a2Y5ZyoaG9va+iAjOS4lGhvb2vkuK3mnIlpbml06ZKp5a2Q5pe277yM5YWI6LCD55SoaW5pdOWbnuiwg++8jOWvueWImuWIm+W7uueahHZub2Rl6L+b6KGM5aSE55CGXHJcbiAgICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5pbml0KSkge1xyXG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XHJcbiAgICAgICAgICAgICAgICAvL+iOt+WPlmluaXTpkqnlrZDkv67mlLnlkI7nmoTmlbDmja5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSB2bm9kZS5kYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLCBzZWwgPSB2bm9kZS5zZWw7XHJcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XHJcbiAgICAgICAgICAgICAgICB2bm9kZS50ZXh0ID0gJyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZUNvbW1lbnQodm5vZGUudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIFBhcnNlIHNlbGVjdG9yXHJcbiAgICAgICAgICAgIHZhciBoYXNoSWR4ID0gc2VsLmluZGV4T2YoJyMnKTtcclxuICAgICAgICAgICAgLy/lhYhpZOWQjmNsYXNzXHJcbiAgICAgICAgICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xyXG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgPyBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOiBzZWw7XHJcbiAgICAgICAgICAgIC8v5Yib5bu65LiA5LiqRE9N6IqC54K55byV55So77yM5bm25a+55YW25bGe5oCn5a6e5L6L5YyWXHJcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcclxuICAgICAgICAgICAgICAgIDogYXBpLmNyZWF0ZUVsZW1lbnQodGFnKTtcclxuICAgICAgICAgICAgLy/ojrflj5ZpZOWQjSAjYSAtLT4gYVxyXG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcclxuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2lkJywgc2VsLnNsaWNlKGhhc2ggKyAxLCBkb3QpKTtcclxuICAgICAgICAgICAgLy/ojrflj5bnsbvlkI3vvIzlubbmoLzlvI/ljJYgIC5hLmIgLS0+IGEgYlxyXG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcclxuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpKTtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xyXG4gICAgICAgICAgICAvL+WmguaenOWtmOWcqOWtkOWFg+e0oFZub2Rl6IqC54K577yM5YiZ6YCS5b2S5bCG5a2Q5YWD57Sg6IqC54K55o+S5YWl5Yiw5b2T5YmNVm5vZGXoioLngrnkuK3vvIzlubblsIblt7Lmj5LlhaXnmoTlrZDlhYPntKDoioLngrnlnKhpbnNlcnRlZFZub2RlUXVldWXkuK3kvZzorrDlvZVcclxuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoID0gY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g5aaC5p6c5a2Y5Zyo5a2Q5paH5pys6IqC54K577yM5YiZ55u05o6l5bCG5YW25o+S5YWl5Yiw5b2T5YmNVm5vZGXoioLngrlcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKHZub2RlLnRleHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7IC8vIFJldXNlIHZhcmlhYmxlXHJcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkuY3JlYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgIGkuY3JlYXRlKGVtcHR5Tm9kZSwgdm5vZGUpO1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzmnIlpbnNlcnTpkqnlrZDvvIzliJnmjqjov5tpbnNlcnRlZFZub2RlUXVldWXkuK3kvZzorrDlvZXvvIzku47ogIzlrp7njrDmibnph4/mj5LlhaXop6blj5FpbnNlcnTlm57osINcclxuICAgICAgICAgICAgICAgIGlmIChpLmluc2VydClcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5aaC5p6c5rKh5aOw5piO6YCJ5oup5Zmo77yM5YiZ6K+05piO6L+Z5Liq5piv5LiA5LiqdGV4dOiKgueCuVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2bm9kZS5lbG07XHJcbiAgICB9XHJcbiAgICAvLyDlsIZ2bm9kZei9rOaNouWQjueahGRvbeiKgueCueaPkuWFpeWIsGRvbeagkeeahOaMh+WumuS9jee9ruS4reWOu1xyXG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xyXG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcclxuICAgICAgICAgICAgdmFyIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcclxuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0oY2gsIGluc2VydGVkVm5vZGVRdWV1ZSksIGJlZm9yZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDnlKjkuo7miYvliqjop6blj5FkZXN0b3J56ZKp5a2Q5Zue6LCDXHJcbiAgICBmdW5jdGlvbiBpbnZva2VEZXN0cm95SG9vayh2bm9kZSkge1xyXG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcclxuICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8v5YWI6Kem5Y+R6K+l6IqC54K55LiK55qEZGVzdG9yeeWbnuiwg1xyXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuZGVzdHJveSkpXHJcbiAgICAgICAgICAgICAgICBpKHZub2RlKTtcclxuICAgICAgICAgICAgLy/lnKjop6blj5HlhajlsYDkuIvnmoRkZXN0b3J55Zue6LCDXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuZGVzdHJveS5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcclxuICAgICAgICAgICAgLy/pgJLlvZLop6blj5HlrZDoioLngrnnmoRkZXN0b3J55Zue6LCDXHJcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgdm5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2opIHtcclxuICAgICAgICAgICAgICAgICAgICBpID0gdm5vZGUuY2hpbGRyZW5bal07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDkuLvopoHlip/og73mmK/mibnph4/liKDpmaRET03oioLngrnvvIzpnIDopoHphY3lkIhpbnZva2VEZXN0b3J5SG9va+WSjGNyZWF0ZVJtQ2LmnI3nlKjvvIzmlYjmnpzmm7TkvbNcclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJlbnRFbG0g54i26IqC54K5XHJcbiAgICAgKiBAcGFyYW0gdm5vZGVzICDliKDpmaToioLngrnmlbDnu4RcclxuICAgICAqIEBwYXJhbSBzdGFydElkeCAg5Yig6Zmk6LW35aeL5Z2Q5qCHXHJcbiAgICAgKiBAcGFyYW0gZW5kSWR4ICDliKDpmaTnu5PmnZ/lnZDmoIdcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XHJcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xyXG4gICAgICAgICAgICB2YXIgaV8xID0gdm9pZCAwLCBsaXN0ZW5lcnMgPSB2b2lkIDAsIHJtID0gdm9pZCAwLCBjaCA9IHZub2Rlc1tzdGFydElkeF07XHJcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYoY2guc2VsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6LCD55SoZGVzdHJveemSqeWtkFxyXG4gICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGNoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL+WvueWFqOWxgHJlbW92ZemSqeWtkOi/m+ihjOiuoeaVsFxyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGNicy5yZW1vdmUubGVuZ3RoICsgMTtcclxuICAgICAgICAgICAgICAgICAgICBybSA9IGNyZWF0ZVJtQ2IoY2guZWxtLCBsaXN0ZW5lcnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6LCD55So5YWo5bGAcmVtb3Zl5Zue6LCD5Ye95pWw77yM5bm25q+P5qyh5YeP5bCR5LiA5LiqcmVtb3Zl6ZKp5a2Q6K6h5pWwXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpXzEgPSAwOyBpXzEgPCBjYnMucmVtb3ZlLmxlbmd0aDsgKytpXzEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNicy5yZW1vdmVbaV8xXShjaCwgcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgIC8v6LCD55So5YaF6YOodm5vZGUuZGF0YS5ob29r5Lit55qEcmVtb3Zl6ZKp5a2Q77yI5Y+q5pyJ5LiA5Liq77yJXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzRGVmKGlfMSA9IGNoLmRhdGEpICYmIGlzRGVmKGlfMSA9IGlfMS5ob29rKSAmJiBpc0RlZihpXzEgPSBpXzEucmVtb3ZlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpXzEoY2gsIHJtKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5aaC5p6c5rKh5pyJ5YaF6YOocmVtb3Zl6ZKp5a2Q77yM6ZyA6KaB6LCD55Socm3vvIznoa7kv53og73lpJ9yZW1vdmXoioLngrlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHsgLy8gVGV4dCBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIOWvueS6juWQjOWxgueahOWtkOiKgueCue+8jHNuYWJiZG9t5piv5Li76KaB5pyJ5Yig6Zmk44CB5Yib5bu655qE5pON5L2c77yM5ZCM5pe26YCa6L+H56e75L2N55qE5pa55rOV77yM6L6+5Yiw5pyA5aSn5aSN55So5a2Y5Zyo6IqC54K555qE55uu55qE5YW25Lit6ZyA6KaB57u05oqk5Zub5Liq57Si5byV77yM5YiG5Yir5piv77yaXHJcbiAgICAvKlxyXG4gICAgICBvbGRTdGFydElkeCA9PiDml6flpLTntKLlvJVcclxuICAgICAgb2xkRW5kSWR4ID0+IOaXp+Wwvue0ouW8lVxyXG4gICAgICBuZXdTdGFydElkeCA9PiDmlrDlpLTntKLlvJVcclxuICAgICAgbmV3RW5kSWR4ID0+IOaWsOWwvue0ouW8lVxyXG4gICAgKi9cclxuICAgIC8vIOeEtuWQjuW8gOWni+WwhuaXp+WtkOiKgueCuee7hOWSjOaWsOWtkOiKgueCuee7hOi/m+ihjOmAkOS4gOavlOWvue+8jOebtOWIsOmBjeWOhuWujOS7u+S4gOWtkOiKgueCuee7hO+8jOavlOWvueetlueVpeaciTXnp43vvJpcclxuICAgIC8qKlxyXG4gICAgICogb2xkU3RhcnRWbm9kZeWSjG5ld1N0YXJ0Vm5vZGXov5vooYzmr5Tlr7nvvIzlpoLmnpznm7jkvLzvvIzliJnov5vooYxwYXRjaO+8jOeEtuWQjuaWsOaXp+WktOe0ouW8lemDveWQjuenu1xyXG4gICAgICogb2xkRW5kVm5vZGXlkoxuZXdFbmRWbm9kZei/m+ihjOavlOWvue+8jOWmguaenOebuOS8vO+8jOWImei/m+ihjHBhdGNo77yM54S25ZCO5paw5pen5bC+57Si5byV5YmN56e7XHJcbiAgICAgKiBvbGRTdGFydFZub2Rl5ZKMbmV3RW5kVm5vZGXov5vooYzmr5Tlr7nvvIzlpoLmnpznm7jkvLzvvIzliJnov5vooYxwYXRjaO+8jOWwhuaXp+iKgueCueenu+S9jeWIsOacgOWQjlxyXG4gICAgICogICAg54S25ZCO5pen5aS057Si5byV5ZCO56e777yM5bC+57Si5byV5YmN56e777yM5Li65LuA5LmI6KaB6L+Z5qC35YGa5ZGi77yf5oiR5Lus5oCd6ICD5LiA56eN5oOF5Ya177yM5aaC5pen6IqC54K55Li644CQNSwxLDIsMyw044CRXHJcbiAgICAgICAgICDvvIzmlrDoioLngrnkuLrjgJAxLDIsMyw0LDXjgJHvvIzlpoLmnpznvLrkuY/ov5nnp43liKTmlq3vvIzmhI/lkbPnnYDpnIDopoHlhYjlsIY1LT4xLDEtPjIsMi0+MywzLT40LDQtPjXkupRcclxuICAgICAgICAgIOasoeWIoOmZpOaPkuWFpeaTjeS9nO+8jOWNs+S9v+aYr+acieS6hmtleS1pbmRleOadpeWkjeeUqO+8jOS5n+S8muWHuueOsOS5n+S8muWHuueOsOOAkDUsMSwyLDMsNOOAkS0+XHJcbiAgICAgICAgICDjgJAxLDUsMiwzLDTjgJEtPuOAkDEsMiw1LDMsNOOAkS0+44CQMSwyLDMsNSw044CRLT7jgJAxLDIsMyw0LDXjgJHlhbE05qyh5pON5L2c77yM5aaC5p6cXHJcbiAgICAgICAgICDmnInkuobov5nnp43liKTmlq3vvIzmiJHku6zlj6rpnIDopoHlsIY15o+S5YWl5Yiw5pen5bC+57Si5byV5ZCO6Z2i5Y2z5Y+v77yM5LuO6ICM5a6e546w5Y+z56e7XHJcbiAgICAgKiBvbGRFbmRWbm9kZeWSjG5ld1N0YXJ0Vm5vZGXov5vooYzmr5Tlr7nvvIzlpITnkIblkozkuIrpnaLnsbvkvLzvvIzlj6rkuI3ov4fmlLnkuLrlt6bnp7tcclxuICAgICAqIOWmguaenOS7peS4iuaDheWGtemDveWksei0peS6hu+8jOaIkeS7rOWwseWPquiDveWkjeeUqGtleeebuOWQjOeahOiKgueCueS6huOAgummluWFiOaIkeS7rOimgemAmui/h2NyZWF0ZUtleVRvT2xkSWR4XHJcbiAgICAgKiAgICDliJvlu7prZXktaW5kZXjnmoTmmKDlsITvvIzlpoLmnpzmlrDoioLngrnlnKjml6foioLngrnkuK3kuI3lrZjlnKjvvIzmiJHku6zlsIblroPmj5LlhaXliLDml6flpLTntKLlvJXoioLngrnliY3vvIxcclxuICAgICAgICAgIOeEtuWQjuaWsOWktOe0ouW8leWQkeWQju+8m+WmguaenOaWsOiKgueCueWcqOWwseaXp+iKgueCuee7hOS4reWtmOWcqO+8jOWFiOaJvuWIsOWvueW6lOeahOaXp+iKgueCue+8jOeEtuWQjnBhdGNo77yM5bm25bCGXHJcbiAgICAgICAgICDml6foioLngrnnu4TkuK3lr7nlupToioLngrnorr7nva7kuLp1bmRlZmluZWQs5Luj6KGo5bey57uP6YGN5Y6G6L+H5LqG77yM5LiN5YaN6YGN5Y6G77yM5ZCm5YiZ5Y+v6IO95a2Y5Zyo6YeN5aSNXHJcbiAgICAgICAgICDmj5LlhaXnmoTpl67popjvvIzmnIDlkI7lsIboioLngrnnp7vkvY3liLDml6flpLTntKLlvJXoioLngrnkuYvliY3vvIzmlrDlpLTntKLlvJXlkJHlkI5cclxuICAgICAqIOmBjeWOhuWujOS5i+WQju+8jOWwhuWJqeS9meeahOaWsFZub2Rl5re75Yqg5Yiw5pyA5ZCO5LiA5Liq5paw6IqC54K555qE5L2N572u5ZCO5oiW6ICF5Yig6Zmk5aSa5L2Z55qE5pen6IqC54K5XHJcbiAgICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHBhcmVudEVsbSDniLboioLngrlcclxuICAgICAqIEBwYXJhbSBvbGRDaCDml6foioLngrnmlbDnu4RcclxuICAgICAqIEBwYXJhbSBuZXdDaCDmlrDoioLngrnmlbDnu4RcclxuICAgICAqIEBwYXJhbSBpbnNlcnRlZFZub2RlUXVldWVcclxuICAgICAgICovXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVDaGlsZHJlbihwYXJlbnRFbG0sIG9sZENoLCBuZXdDaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XHJcbiAgICAgICAgdmFyIG9sZFN0YXJ0SWR4ID0gMCwgbmV3U3RhcnRJZHggPSAwO1xyXG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xyXG4gICAgICAgIHZhciBvbGRTdGFydFZub2RlID0gb2xkQ2hbMF07XHJcbiAgICAgICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcclxuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcclxuICAgICAgICB2YXIgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWzBdO1xyXG4gICAgICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XHJcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xyXG4gICAgICAgIHZhciBpZHhJbk9sZDtcclxuICAgICAgICB2YXIgZWxtVG9Nb3ZlO1xyXG4gICAgICAgIHZhciBiZWZvcmU7XHJcbiAgICAgICAgd2hpbGUgKG9sZFN0YXJ0SWR4IDw9IG9sZEVuZElkeCAmJiBuZXdTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcclxuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0Vm5vZGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG9sZEVuZFZub2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0Vm5vZGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld0VuZFZub2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOWmguaenOaXp+WktOe0ouW8leiKgueCueWSjOaWsOWktOe0ouW8leiKgueCueebuOWQjFxyXG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcclxuICAgICAgICAgICAgICAgIC8v5a+55pen5aS057Si5byV6IqC54K55ZKM5paw5aS057Si5byV6IqC54K56L+b6KGMZGlmZuabtOaWsO+8jCDku47ogIzovr7liLDlpI3nlKjoioLngrnmlYjmnpxcclxuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgICAgIC8v5pen5aS057Si5byV5ZCR5ZCOXHJcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XHJcbiAgICAgICAgICAgICAgICAvL+aWsOWktOe0ouW8leWQkeWQjlxyXG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5pen5bC+57Si5byV6IqC54K55ZKM5paw5bC+57Si5byV6IqC54K555u45Ly877yM5Y+v5Lul5aSN55SoXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICAvL+aXp+Wwvue0ouW8leiKgueCueWSjOaWsOWwvue0ouW8leiKgueCuei/m+ihjOabtOaWsFxyXG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgICAgICAgICAvL+aXp+Wwvue0ouW8leWQkeWJjVxyXG4gICAgICAgICAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XHJcbiAgICAgICAgICAgICAgICAvL+aWsOWwvue0ouW8leWQkeWJjVxyXG4gICAgICAgICAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/lpoLmnpzml6flpLTntKLlvJXoioLngrnlkozmlrDlpLTntKLlvJXoioLngrnnm7jkvLzvvIzlj6/ku6XpgJrov4fnp7vliqjmnaXlpI3nlKhcclxuICAgICAgICAgICAgLy/lpoLml6foioLngrnkuLrjgJA1LDEsMiwzLDTjgJHvvIzmlrDoioLngrnkuLrjgJAxLDIsMyw0LDXjgJHvvIzlpoLmnpznvLrkuY/ov5nnp43liKTmlq3vvIzmhI/lkbPnnYBcclxuICAgICAgICAgICAgLy/pgqPmoLfpnIDopoHlhYjlsIY1LT4xLDEtPjIsMi0+MywzLT40LDQtPjXkupTmrKHliKDpmaTmj5LlhaXmk43kvZzvvIzljbPkvb/mmK/mnInkuoZrZXktaW5kZXjmnaXlpI3nlKjvvIxcclxuICAgICAgICAgICAgLy8g5Lmf5Lya5Ye6546w44CQNSwxLDIsMyw044CRLT7jgJAxLDUsMiwzLDTjgJEtPuOAkDEsMiw1LDMsNOOAkS0+44CQMSwyLDMsNSw044CRLT7jgJAxLDIsMyw0LDXjgJFcclxuICAgICAgICAgICAgLy8g5YWxNOasoeaTjeS9nO+8jOWmguaenOacieS6hui/meenjeWIpOaWre+8jOaIkeS7rOWPqumcgOimgeWwhjXmj5LlhaXliLDmnIDlkI7kuIDmrKHmk43kvZzljbPlj69cclxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCByaWdodFxyXG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKG9sZEVuZFZub2RlLmVsbSkpO1xyXG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xyXG4gICAgICAgICAgICAgICAgbmV3RW5kVm5vZGUgPSBuZXdDaFstLW5ld0VuZElkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/ljp/nkIbkuI7kuIrpnaLnm7jlkIxcclxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCBsZWZ0XHJcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xyXG4gICAgICAgICAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XHJcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/lpoLmnpzkuIrpnaLnmoTliKTmlq3pg73kuI3pgJrov4fvvIzmiJHku6zlsLHpnIDopoFrZXktaW5kZXjooajmnaXovr7liLDmnIDlpKfnqIvluqblpI3nlKjkuoZcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL+WmguaenOS4jeWtmOWcqOaXp+iKgueCueeahGtleS1pbmRleOihqO+8jOWImeWIm+W7ulxyXG4gICAgICAgICAgICAgICAgaWYgKG9sZEtleVRvSWR4ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvbGRLZXlUb0lkeCA9IGNyZWF0ZUtleVRvT2xkSWR4KG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8v5om+5Yiw5paw6IqC54K55Zyo5pen6IqC54K557uE5Lit5a+55bqU6IqC54K555qE5L2N572uXHJcbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcclxuICAgICAgICAgICAgICAgIC8v5aaC5p6c5paw6IqC54K55Zyo5pen6IqC54K55Lit5LiN5a2Y5Zyo77yM5oiR5Lus5bCG5a6D5o+S5YWl5Yiw5pen5aS057Si5byV6IqC54K55YmN77yM54S25ZCO5paw5aS057Si5byV5ZCR5ZCOXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHsgLy8gTmV3IGVsZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvL+WmguaenOaWsOiKgueCueWcqOWwseaXp+iKgueCuee7hOS4reWtmOWcqO+8jOWFiOaJvuWIsOWvueW6lOeahOaXp+iKgueCuVxyXG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxtVG9Nb3ZlLnNlbCAhPT0gbmV3U3RhcnRWbm9kZS5zZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL+WFiOWwhuaWsOiKgueCueWSjOWvueW6lOaXp+iKgueCueS9nOabtOaWsFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaFZub2RlKGVsbVRvTW92ZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/nhLblkI7lsIbml6foioLngrnnu4TkuK3lr7nlupToioLngrnorr7nva7kuLp1bmRlZmluZWQs5Luj6KGo5bey57uP6YGN5Y6G6L+H5LqG77yM5LiN5Zyo6YGN5Y6G77yM5ZCm5YiZ5Y+v6IO95a2Y5Zyo6YeN5aSN5o+S5YWl55qE6Zeu6aKYXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/mj5LlhaXliLDml6flpLTntKLlvJXoioLngrnkuYvliY1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy/mlrDlpLTntKLlvJXlkJHlkI5cclxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9sZFN0YXJ0SWR4IDw9IG9sZEVuZElkeCB8fCBuZXdTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcclxuICAgICAgICAgICAgLy/lvZPml6flpLTntKLlvJXlpKfkuo7ml6flsL7ntKLlvJXml7bvvIzku6Pooajml6foioLngrnnu4Tlt7Lnu4/pgY3ljoblrozvvIzlsIbliankvZnnmoTmlrBWbm9kZea3u+WKoOWIsOacgOWQjuS4gOS4quaWsOiKgueCueeahOS9jee9ruWQjlxyXG4gICAgICAgICAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcclxuICAgICAgICAgICAgICAgIGJlZm9yZSA9IG5ld0NoW25ld0VuZElkeCArIDFdID09IG51bGwgPyBudWxsIDogbmV3Q2hbbmV3RW5kSWR4ICsgMV0uZWxtO1xyXG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL+WmguaenOaWsOiKgueCuee7hOWFiOmBjeWOhuWujO+8jOmCo+S5iOS7o+ihqOaXp+iKgueCuee7hOS4reWJqeS9meiKgueCuemDveS4jemcgOimge+8jOaJgOS7peebtOaOpeWIoOmZpFxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcclxuICAgICAgICB2YXIgaSwgaG9vaztcclxuICAgICAgICAvLyDlnKhwYXRjaOS5i+WJje+8jOWFiOiwg+eUqHZub2RlLmRhdGHnmoRwcmVwYXRjaOmSqeWtkFxyXG4gICAgICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XHJcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IG9sZFZub2RlLmVsbTtcclxuICAgICAgICB2YXIgb2xkQ2ggPSBvbGRWbm9kZS5jaGlsZHJlbjtcclxuICAgICAgICB2YXIgY2ggPSB2bm9kZS5jaGlsZHJlbjtcclxuICAgICAgICAvLyDlpoLmnpxvbGR2bm9kZeWSjHZub2Rl55qE5byV55So55u45ZCM77yM6K+05piO5rKh5Y+R55Sf5Lu75L2V5Y+Y5YyW55u05o6l6L+U5Zue77yM6YG/5YWN5oCn6IO95rWq6LS5XHJcbiAgICAgICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIOWmguaenHZub2Rl5ZKMb2xkdm5vZGXnm7jkvLzvvIzpgqPkuYjmiJHku6zopoHlr7lvbGR2bm9kZeacrOi6q+i/m+ihjOabtOaWsFxyXG4gICAgICAgIGlmICh2bm9kZS5kYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8g6aaW5YWI6LCD55So5YWo5bGA55qEdXBkYXRl6ZKp5a2Q77yM5a+5dm5vZGUuZWxt5pys6Lqr5bGe5oCn6L+b6KGM5pu05pawXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICAgICAgY2JzLnVwZGF0ZVtpXShvbGRWbm9kZSwgdm5vZGUpO1xyXG4gICAgICAgICAgICAvLyDnhLblkI7osIPnlKh2bm9kZS5kYXRh6YeM6Z2i55qEdXBkYXRl6ZKp5a2QLOWGjeasoeWvuXZub2RlLmVsbeabtOaWsFxyXG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xyXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkgJiYgaXNEZWYoaSA9IGkudXBkYXRlKSlcclxuICAgICAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5aaC5p6cdm5vZGXkuI3mmK90ZXh06IqC54K5XHJcbiAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcclxuICAgICAgICAgICAgLy8g5aaC5p6cdm5vZGXlkoxvbGRWbm9kZemDveacieWtkOiKgueCuVxyXG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpICYmIGlzRGVmKGNoKSkge1xyXG4gICAgICAgICAgICAgICAgLy8g5b2TVm5vZGXlkoxvbGR2bm9kZeeahOWtkOiKgueCueS4jeWQjOaXtu+8jOiwg+eUqHVwZGF0ZWNoaWxyZW7lh73mlbDvvIxkaWZm5a2Q6IqC54K5XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkQ2ggIT09IGNoKVxyXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOWmguaenHZub2Rl5pyJ5a2Q6IqC54K577yMb2xkdm5vZGXmsqHlrZDoioLngrlcclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICAvL29sZHZub2Rl5pivdGV4dOiKgueCue+8jOWImeWwhmVsbeeahHRleHTmuIXpmaRcclxuICAgICAgICAgICAgICAgIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSlcclxuICAgICAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XHJcbiAgICAgICAgICAgICAgICAvL+W5tua3u+WKoHZub2Rl55qEY2hpbGRyZW5cclxuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOWmguaenG9sZHZub2Rl5pyJY2hpbGRyZW7vvIzogIx2bm9kZeayoWNoaWxkcmVu77yM5YiZ56e76ZmkZWxt55qEY2hpbGRyZW5cclxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMoZWxtLCBvbGRDaCwgMCwgb2xkQ2gubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8g5aaC5p6cdm5vZGXlkoxvbGR2bm9kZemDveayoWNoaWRscmVu77yM5LiUdm5vZGXmsqF0ZXh077yM5YiZ5Yig6Zmkb2xkdm5vZGXnmoR0ZXh0XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSB7XHJcbiAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5aaC5p6cb2xkdm5vZGXnmoR0ZXh05ZKMdm5vZGXnmoR0ZXh05LiN5ZCM77yM5YiZ5pu05paw5Li6dm5vZGXnmoR0ZXh0XHJcbiAgICAgICAgZWxzZSBpZiAob2xkVm5vZGUudGV4dCAhPT0gdm5vZGUudGV4dCkge1xyXG4gICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCB2bm9kZS50ZXh0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGF0Y2jlrozvvIzop6blj5Fwb3N0cGF0Y2jpkqnlrZBcclxuICAgICAgICBpZiAoaXNEZWYoaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucG9zdHBhdGNoKSkge1xyXG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5oiR5Lus6ZyA6KaB5piO56Gu55qE5LiA5Liq5piv77yM5aaC5p6c5oyJ54Wn5Lyg57uf55qEZGlmZueul+azle+8jOmCo+S5iOS4uuS6huaJvuWIsOacgOWwj+WPmOWMlu+8jOmcgOimgemAkOWxgumAkOWxgueahOWOu+aQnOe0ouavlOi+g++8jOi/meagt+aXtumXtOWkjeadguW6puWwhuS8mui+vuWIsCBPKG5eMynnmoTnuqfliKvvvIzku6Pku7fljYHliIbpq5hcclxuICAgIC8vIHZkb23ph4flj5bnmoTmmK/kuIDnp43nroDljJbnmoTmgJ3ot6/vvIzlj6rmr5TovoPlkIzlsYLoioLngrnvvIzlpoLmnpzkuI3lkIzvvIzpgqPkuYjljbPkvb/or6XoioLngrnnmoTlrZDoioLngrnmsqHlj5jljJbvvIzmiJHku6zkuZ/kuI3lpI3nlKjvvIznm7TmjqXlsIbku47niLboioLngrnlvIDlp4vnmoTlrZDmoJHlhajpg6jliKDpmaTvvIznhLblkI7lho3ph43mlrDliJvlu7roioLngrnmt7vliqDliLDmlrDnmoTkvY3nva7jgILlpoLmnpzniLboioLngrnmsqHlj5jljJbvvIzmiJHku6zlsLHmr5TovoPmiYDmnInlkIzlsYLnmoTlrZDoioLngrnvvIzlr7nov5nkupvlrZDoioLngrnov5vooYzliKDpmaTjgIHliJvlu7rjgIHnp7vkvY3mk43kvZxcclxuICAgIC8vIHBhdGNo5Y+q6ZyA6KaB5a+55Lik5Liqdm5vZGXov5vooYzliKTmlq3mmK/lkKbnm7jkvLzvvIzlpoLmnpznm7jkvLzvvIzliJnlr7nku5bku6zov5vooYxwYXRjaFZub2Rl5pON5L2c77yM5ZCm5YiZ55u05o6l55Sodm5vZGXmm7/mjaJvbGR2bm9kZVxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgICAgIHZhciBpLCBlbG0sIHBhcmVudDtcclxuICAgICAgICAvLyDorrDlvZXooqvmj5LlhaXnmoR2bm9kZemYn+WIl++8jOeUqOS6juaJueinpuWPkWluc2VydFxyXG4gICAgICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcclxuICAgICAgICAvL+iwg+eUqOWFqOWxgHByZemSqeWtkFxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucHJlLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICBjYnMucHJlW2ldKCk7XHJcbiAgICAgICAgLy8g5aaC5p6cb2xkdm5vZGXmmK9kb23oioLngrnvvIzovazljJbkuLpvbGR2bm9kZVxyXG4gICAgICAgIGlmICghaXNWbm9kZShvbGRWbm9kZSkpIHtcclxuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOWmguaenG9sZHZub2Rl5LiOdm5vZGXnm7jkvLzvvIzov5vooYzmm7TmlrBcclxuICAgICAgICBpZiAoc2FtZVZub2RlKG9sZFZub2RlLCB2bm9kZSkpIHtcclxuICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAvLyDlkKbliJnvvIzlsIZ2bm9kZeaPkuWFpe+8jOW5tuWwhm9sZHZub2Rl5LuO5YW254i26IqC54K55LiK55u05o6l5Yig6ZmkXHJcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcclxuICAgICAgICAgICAgcGFyZW50ID0gYXBpLnBhcmVudE5vZGUoZWxtKTtcclxuICAgICAgICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudCwgdm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcoZWxtKSk7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50LCBbb2xkVm5vZGVdLCAwLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDmj5LlhaXlrozlkI7vvIzosIPnlKjooqvmj5LlhaXnmoR2bm9kZeeahGluc2VydOmSqeWtkFxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldLmRhdGEuaG9vay5pbnNlcnQoaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g54S25ZCO6LCD55So5YWo5bGA5LiL55qEcG9zdOmSqeWtkFxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucG9zdC5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcclxuICAgICAgICAvLyDov5Tlm552bm9kZeeUqOS9nOS4i+asoXBhdGNo55qEb2xkdm5vZGVcclxuICAgICAgICByZXR1cm4gdm5vZGU7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMuaW5pdCA9IGluaXQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYWJiZG9tLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbnZhciBoXzEgPSByZXF1aXJlKFwiLi9oXCIpO1xyXG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspIHtcclxuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcclxuICAgIHZub2RlLmRhdGEuZm4gPSB0aHVuay5kYXRhLmZuO1xyXG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmsuZGF0YS5hcmdzO1xyXG4gICAgdGh1bmsuZGF0YSA9IHZub2RlLmRhdGE7XHJcbiAgICB0aHVuay5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xyXG4gICAgdGh1bmsudGV4dCA9IHZub2RlLnRleHQ7XHJcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XHJcbn1cclxuZnVuY3Rpb24gaW5pdCh0aHVuaykge1xyXG4gICAgdmFyIGN1ciA9IHRodW5rLmRhdGE7XHJcbiAgICB2YXIgdm5vZGUgPSBjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBjdXIuYXJncyk7XHJcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspO1xyXG59XHJcbmZ1bmN0aW9uIHByZXBhdGNoKG9sZFZub2RlLCB0aHVuaykge1xyXG4gICAgdmFyIGksIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rLmRhdGE7XHJcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XHJcbiAgICBpZiAob2xkLmZuICE9PSBjdXIuZm4gfHwgb2xkQXJncy5sZW5ndGggIT09IGFyZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XHJcbiAgICAgICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVuayk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmspO1xyXG59XHJcbmV4cG9ydHMudGh1bmsgPSBmdW5jdGlvbiB0aHVuayhzZWwsIGtleSwgZm4sIGFyZ3MpIHtcclxuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBhcmdzID0gZm47XHJcbiAgICAgICAgZm4gPSBrZXk7XHJcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhfMS5oKHNlbCwge1xyXG4gICAgICAgIGtleToga2V5LFxyXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXHJcbiAgICAgICAgZm46IGZuLFxyXG4gICAgICAgIGFyZ3M6IGFyZ3NcclxuICAgIH0pO1xyXG59O1xyXG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnRodW5rO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG4vKipcclxuICogQHBhcmFtIHNlbO+8mumAieaLqeWZqO+8jOWPr+S7peaYr2N1c3RvbSB0YWcsIOWPr+S7peaYrydkaXYnLCdzcGFuJyxldGMs5Luj6KGo6L+Z5LiqdmlydHVhbCBkb23nmoR0YWcgbmFtZVxyXG4gKiBAcGFyYW0gZGF0Ye+8mnZpcnR1YWwgZG9t5pWw5o2uLOWug+S7rOS4jmRvbSBlbGVtZW5055qEcHJvcOOAgWF0dHLnmoTor63kuYnnsbvkvLzjgILkvYbmmK92aXJ0dWFsIGRvbeWMheWQq+eahOaVsOaNruWPr+S7peabtOeBtea0u1xyXG4gKiBAcGFyYW0gY2hpbGRyZW7vvJrlrZDoioLngrnmlbDnu4Qs5L2G5piv6L+Z5pivdmRvbeeahGNoaWxkcmVuLiB2ZG9t55qE5a6e546w6YeN54K55bCx5piv5a+5Y2hpbGRyZW7nmoRwYXRjaOS4ilxyXG4gKiBAcGFyYW0gdGV4dO+8muWvueW6lGVsZW1lbnQudGV4dENvbnRlbnQs5ZyoY2hpbGRyZW7ph4zlrprkuYnkuIDkuKpzdHJpbmcs6YKj5LmI5oiR5Lus5Lya5Li66L+Z5Liqc3RyaW5n5Yib5bu65LiA5LiqdGV4dE5vZGVcclxuICogQHBhcmFtIGVsbe+8muWvueecn+WunmRvbSBlbGVtZW5055qE5byV55SoXHJcbiAqIGtlee+8mueUqOS6juaPkOekumNoaWxkcmVuIHBhdGNo6L+H56iLXHJcbiAqIEByZXR1cm5zIHt7c2VsOiAoc3RyaW5nfHVuZGVmaW5lZCksIGRhdGE6IChhbnl8dW5kZWZpbmVkKSwgY2hpbGRyZW46IChBcnJheTxWTm9kZXxzdHJpbmc+fHVuZGVmaW5lZCksIHRleHQ6IChzdHJpbmd8dW5kZWZpbmVkKSwgZWxtOiAoRWxlbWVudHxUZXh0fHVuZGVmaW5lZCksIGtleTogYW55fX1cclxuICoga2V55bGe5oCn55So5LqO5LiN5ZCMdm5vZGXkuYvpl7TnmoTlr7nmr5RcclxuICovXHJcbi8vIHZub2Rl5p6E6YCg5Ye95pWwXHJcbmZ1bmN0aW9uIHZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSkge1xyXG4gICAgdmFyIGtleSA9IGRhdGEgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGRhdGEua2V5O1xyXG4gICAgcmV0dXJuIHsgc2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcclxuICAgICAgICB0ZXh0OiB0ZXh0LCBlbG06IGVsbSwga2V5OiBrZXkgfTtcclxufVxyXG5leHBvcnRzLnZub2RlID0gdm5vZGU7XHJcbmV4cG9ydHMuZGVmYXVsdCA9IHZub2RlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD12bm9kZS5qcy5tYXAiXX0=

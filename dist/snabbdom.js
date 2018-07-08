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

},{"./is":3,"./vnode":6}],2:[function(require,module,exports){
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

},{"./h":1,"./htmldomapi":2,"./is":3,"./thunk":5,"./vnode":6}],5:[function(require,module,exports){
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

},{"./h":1}],6:[function(require,module,exports){
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

},{}]},{},[4])(4)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJoLmpzIiwiaHRtbGRvbWFwaS5qcyIsImlzLmpzIiwic25hYmJkb20uanMiLCJ0aHVuay5qcyIsInZub2RlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XHJcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xyXG4vLyDmt7vliqDlkb3lkI3nqbrpl7TvvIhzdmfmiY3pnIDopoHvvIlcclxuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xyXG4gICAgZGF0YS5ucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XHJcbiAgICBpZiAoc2VsICE9PSAnZm9yZWlnbk9iamVjdCcgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIOmAkuW9kuS4uuWtkOiKgueCuea3u+WKoOWRveWQjeepuumXtFxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkRGF0YSA9IGNoaWxkcmVuW2ldLmRhdGE7XHJcbiAgICAgICAgICAgIGlmIChjaGlsZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4vLyBo5piv5LiA5Liq5YyF6KOF5Ye95pWw77yM5Li76KaB5piv5Zyodm5vZGXkuIrlho3lgZrkuIDlsYLljIXoo4XvvJpcclxuLy8g5aaC5p6c5pivc3Zn77yM5YiZ5Li65YW25re75Yqg5ZG95ZCN56m66Ze0XHJcbi8vIOWwhmNoaWxkcmVu5Lit55qEdGV4dOWMheijheaIkHZub2Rl5b2i5byPXHJcbi8v5bCGVk5vZGXmuLLmn5PkuLpWRE9NXHJcbi8qKlxyXG4gKiBAcGFyYW0gc2VsIOmAieaLqeWZqFxyXG4gKiBAcGFyYW0gYiAgICDmlbDmja5cclxuICogQHBhcmFtIGMgICAg5a2Q6IqC54K5XHJcbiAqIEByZXR1cm5zIHt7c2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgZWxtLCBrZXl9fVxyXG4gKi9cclxuZnVuY3Rpb24gaChzZWwsIGIsIGMpIHtcclxuICAgIHZhciBkYXRhID0ge30sIGNoaWxkcmVuLCB0ZXh0LCBpO1xyXG4gICAgLy8g5aaC5p6c5a2Y5Zyo5a2Q6IqC54K5XHJcbiAgICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8g6YKj5LmIaOeahOesrOS6jOmhueWwseaYr2RhdGFcclxuICAgICAgICBkYXRhID0gYjtcclxuICAgICAgICAvLyDlpoLmnpxj5piv5pWw57uE77yM6YKj5LmI5a2Y5Zyo5a2QZWxlbWVudOiKgueCuVxyXG4gICAgICAgIGlmIChpcy5hcnJheShjKSkge1xyXG4gICAgICAgICAgICBjaGlsZHJlbiA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOWQpuWImeS4uuWtkHRleHToioLngrlcclxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYykpIHtcclxuICAgICAgICAgICAgdGV4dCA9IGM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGMgJiYgYy5zZWwpIHtcclxuICAgICAgICAgICAgY2hpbGRyZW4gPSBbY107XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5aaC5p6cY+S4jeWtmOWcqO+8jOWPquWtmOWcqGLvvIzpgqPkuYjor7TmmI7pnIDopoHmuLLmn5PnmoR2ZG9t5LiN5a2Y5ZyoZGF0YemDqOWIhu+8jOWPquWtmOWcqOWtkOiKgueCuemDqOWIhlxyXG4gICAgZWxzZSBpZiAoYiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XHJcbiAgICAgICAgICAgIHRleHQgPSBiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XHJcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2JdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGF0YSA9IGI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKGNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgLy8g5aaC5p6c5a2Q6IqC54K55pWw57uE5Lit77yM5a2Y5Zyo6IqC54K55piv5Y6f5aeL57G75Z6L77yM6K+05piO6K+l6IqC54K55pivdGV4dOiKgueCue+8jOWboOatpOaIkeS7rOWwhuWug+a4suafk+S4uuS4gOS4quWPquWMheWQq3RleHTnmoRWTm9kZVxyXG4gICAgICAgICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSlcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldID0gdm5vZGVfMS52bm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL+WmguaenOaYr3N2Z++8jOmcgOimgeS4uuiKgueCuea3u+WKoOWRveWQjeepuumXtFxyXG4gICAgaWYgKHNlbFswXSA9PT0gJ3MnICYmIHNlbFsxXSA9PT0gJ3YnICYmIHNlbFsyXSA9PT0gJ2cnICYmXHJcbiAgICAgICAgKHNlbC5sZW5ndGggPT09IDMgfHwgc2VsWzNdID09PSAnLicgfHwgc2VsWzNdID09PSAnIycpKSB7XHJcbiAgICAgICAgYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCk7XHJcbiAgICB9XHJcbiAgICAvLyDliJvlu7rlubbov5Tlm57kuIDkuKp2bm9kZVxyXG4gICAgcmV0dXJuIHZub2RlXzEudm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgdW5kZWZpbmVkKTtcclxufVxyXG5leHBvcnRzLmggPSBoO1xyXG47XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGg7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbi8qKlxyXG4gKiDmlLnmlofku7blsLHmmK/lr7nljp/nlJ9ET03mk43kvZzlgZrkuobkuIDlsYLmir3osaFcclxuICovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWdOYW1lKSB7XHJcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKSB7XHJcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XHJcbn1cclxuZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodGV4dCkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xyXG59XHJcbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQodGV4dCkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dCk7XHJcbn1cclxuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudE5vZGUsIG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpIHtcclxuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpO1xyXG59XHJcbmZ1bmN0aW9uIHJlbW92ZUNoaWxkKG5vZGUsIGNoaWxkKSB7XHJcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcclxufVxyXG5mdW5jdGlvbiBhcHBlbmRDaGlsZChub2RlLCBjaGlsZCkge1xyXG4gICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XHJcbn1cclxuZnVuY3Rpb24gcGFyZW50Tm9kZShub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xyXG59XHJcbmZ1bmN0aW9uIG5leHRTaWJsaW5nKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xyXG59XHJcbmZ1bmN0aW9uIHRhZ05hbWUoZWxtKSB7XHJcbiAgICByZXR1cm4gZWxtLnRhZ05hbWU7XHJcbn1cclxuZnVuY3Rpb24gc2V0VGV4dENvbnRlbnQobm9kZSwgdGV4dCkge1xyXG4gICAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XHJcbn1cclxuZnVuY3Rpb24gZ2V0VGV4dENvbnRlbnQobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XHJcbn1cclxuZnVuY3Rpb24gaXNFbGVtZW50KG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xyXG59XHJcbmZ1bmN0aW9uIGlzVGV4dChub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMztcclxufVxyXG5mdW5jdGlvbiBpc0NvbW1lbnQobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDg7XHJcbn1cclxuZXhwb3J0cy5odG1sRG9tQXBpID0ge1xyXG4gICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcclxuICAgIGNyZWF0ZUVsZW1lbnROUzogY3JlYXRlRWxlbWVudE5TLFxyXG4gICAgY3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxyXG4gICAgY3JlYXRlQ29tbWVudDogY3JlYXRlQ29tbWVudCxcclxuICAgIGluc2VydEJlZm9yZTogaW5zZXJ0QmVmb3JlLFxyXG4gICAgcmVtb3ZlQ2hpbGQ6IHJlbW92ZUNoaWxkLFxyXG4gICAgYXBwZW5kQ2hpbGQ6IGFwcGVuZENoaWxkLFxyXG4gICAgcGFyZW50Tm9kZTogcGFyZW50Tm9kZSxcclxuICAgIG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcclxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXHJcbiAgICBzZXRUZXh0Q29udGVudDogc2V0VGV4dENvbnRlbnQsXHJcbiAgICBnZXRUZXh0Q29udGVudDogZ2V0VGV4dENvbnRlbnQsXHJcbiAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcclxuICAgIGlzVGV4dDogaXNUZXh0LFxyXG4gICAgaXNDb21tZW50OiBpc0NvbW1lbnQsXHJcbn07XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuaHRtbERvbUFwaTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHRtbGRvbWFwaS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuLyoqXHJcbiAqIOexu+Wei+WIpOaWreebuOWFs+eahOaWh+S7tlxyXG4gKiBAdHlwZSB7ZnVuY3Rpb24oYW55KTogYm9vbGVhbn1cclxuICovXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XHJcbmZ1bmN0aW9uIHByaW1pdGl2ZShzKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHMgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzID09PSAnbnVtYmVyJztcclxufVxyXG5leHBvcnRzLnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcclxudmFyIGlzID0gcmVxdWlyZShcIi4vaXNcIik7XHJcbnZhciBodG1sZG9tYXBpXzEgPSByZXF1aXJlKFwiLi9odG1sZG9tYXBpXCIpO1xyXG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxyXG5mdW5jdGlvbiBpc0RlZihzKSB7IHJldHVybiBzICE9PSB1bmRlZmluZWQ7IH1cclxuLy8g5a6a5LmJ5LiA5Liq5Yib5bu656m6bm9kZeeahOaWueazlVxyXG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcclxuLy8g55So5LqO5ZCM5bGC5qyh55qEb2xkdm5vZGXkuI52bm9kZeeahOavlOi+g++8jOWmguaenOWQjOWxguasoeiKgueCueeahGtleeWSjHNlbOmDveebuOWQjOaIkeS7rOWwseWPr+S7peS/neeVmei/meS4quiKgueCue+8jOWQpuWImeebtOaOpeabv+aNouiKgueCuVxyXG5mdW5jdGlvbiBzYW1lVm5vZGUodm5vZGUxLCB2bm9kZTIpIHtcclxuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XHJcbn1cclxuZnVuY3Rpb24gaXNWbm9kZSh2bm9kZSkge1xyXG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xyXG59XHJcbi8vIOWwhm9sZHZub2Rl5pWw57uE5Lit5L2N572u5a+5b2xkdm5vZGUua2V555qE5pig5bCE6L2s5o2i5Li6b2xkdm5vZGUua2V55a+55L2N572u55qE5pig5bCEXHJcbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XHJcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XHJcbiAgICBmb3IgKGkgPSBiZWdpbklkeDsgaSA8PSBlbmRJZHg7ICsraSkge1xyXG4gICAgICAgIGNoID0gY2hpbGRyZW5baV07XHJcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAga2V5ID0gY2gua2V5O1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hcDtcclxufVxyXG4vLyDpkqnlrZDlh73mlbDvvJpodHRwczovL3NlZ21lbnRmYXVsdC5jb20vYS8xMTkwMDAwMDA5MDE3MzQ5XHJcbi8vIOS7peS4i+i/meWFreS4quaYr+WFqOWxgOmSqeWtkFxyXG52YXIgaG9va3MgPSBbJ2NyZWF0ZScsICd1cGRhdGUnLCAncmVtb3ZlJywgJ2Rlc3Ryb3knLCAncHJlJywgJ3Bvc3QnXTtcclxudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XHJcbmV4cG9ydHMuaCA9IGhfMS5oO1xyXG52YXIgdGh1bmtfMSA9IHJlcXVpcmUoXCIuL3RodW5rXCIpO1xyXG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSBtb2R1bGVz77yaaW5pdOS+nei1lueahOaooeWdl++8jOWmgmF0dHJpYnV0ZeOAgXByb3Bz44CBZXZlbnRsaXN0ZW5lcui/meS6m+aooeWdl1xyXG4gKiBAcGFyYW0gZG9tQXBp77ya5a+55bCB6KOF55yf5a6eRE9N5pON5L2c55qE5bel5YW35Ye95pWw5bqT77yM5aaC5p6c5oiR5Lus5rKh5pyJ5Lyg5YWl77yM5YiZ6buY6K6kXHJcbiDkvb/nlKhzbmFiYmRvbeaPkOS+m+eahGh0bWxkb21hcGlcclxuICogQHJldHVybnMge2Z1bmN0aW9uKChWTm9kZXxFbGVtZW50KSwgVk5vZGUpOiBWTm9kZX1cclxuICogaW5pdOi/mOWMheWQq+S6huiuuOWkmnZub2Rl5ZKM55yf5a6eRE9N5LmL6Ze055qE5pON5L2c5ZKM5rOo5YaM5YWo5bGA6ZKp5a2Q77yMXHJcbiDov5jmnIlwYXRjaFZub2Rl5ZKMdXBkYXRlQ2hpbGRyZW7ov5nkuKTkuKrph43opoHlip/og73vvIznhLblkI7ov5Tlm57kuIDkuKpwYXRjaOWHveaVsFxyXG4gKi9cclxuZnVuY3Rpb24gaW5pdChtb2R1bGVzLCBkb21BcGkpIHtcclxuICAgIHZhciBpLCBqLCBjYnMgPSB7fTtcclxuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xyXG4gICAgLy/ms6jlhozpkqnlrZDnmoTlm57osIPvvIzlnKjlj5HnlJ/nirbmgIHlj5jmm7Tml7bvvIzop6blj5Hlr7nlupTlsZ7mgKflj5jmm7RcclxuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgIGNic1tob29rc1tpXV0gPSBbXTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xyXG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xyXG4gICAgICAgICAgICBpZiAoaG9vayAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBjYnNbaG9va3NbaV1dLnB1c2goaG9vayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDmnKzlh73mlbDkuLvopoHnmoTlip/og73mmK/lsIbkuIDkuKrnnJ/lrp5ET03oioLngrnovazljJbmiJB2bm9kZeW9ouW8j1xyXG4gICAgLy8g5aaCPGRpdiBpZD0nYScgY2xhc3M9J2IgYyc+PC9kaXY+5bCG6L2s5o2i5Li6e3NlbDonZGl2I2EuYi5jJyxkYXRhOnt9LGNoaWxkcmVuOltdLHRleHQ6dW5kZWZpbmVkLGVsbTo8ZGl2IGlkPSdhJyBjbGFzcz0nYiBjJz59XHJcbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcclxuICAgICAgICB2YXIgaWQgPSBlbG0uaWQgPyAnIycgKyBlbG0uaWQgOiAnJztcclxuICAgICAgICB2YXIgYyA9IGVsbS5jbGFzc05hbWUgPyAnLicgKyBlbG0uY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbignLicpIDogJyc7XHJcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xyXG4gICAgfVxyXG4gICAgLy8g5b2T5oiR5Lus6ZyA6KaBcmVtb3Zl5LiA5Liqdm5vZGXml7bvvIzkvJrop6blj5FyZW1vdmXpkqnlrZDkvZzmi6bmiKrlmajvvIzlj6rmnInlnKjmiYDmnIlyZW1vdmXpkqnlrZDlm57osIPlh73mlbDpg73op6blj5HlrozmiY3kvJrlsIboioLngrnku47niLboioLngrnliKDpmaTvvIzogIzov5nkuKrlh73mlbDmj5DkvpvnmoTlsLHmmK/lr7lyZW1vdmXpkqnlrZDlm57osIPmk43kvZznmoTorqHmlbDlip/og71cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZVJtQ2IoY2hpbGRFbG0sIGxpc3RlbmVycykge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBybUNiKCkge1xyXG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnRfMSA9IGFwaS5wYXJlbnROb2RlKGNoaWxkRWxtKTtcclxuICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRfMSwgY2hpbGRFbG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICog5Li76KaB5Yqf6IO95aaC5LiL77yaXHJcbiAgICAgKiAgICDliJ3lp4vljJZ2bm9kZe+8jOiwg+eUqGluaXTpkqnlrZBcclxuICAgICAqICAgIOWIm+W7uuWvueW6lHRhZ25hbWXnmoRET00gZWxlbWVudOiKgueCue+8jOW5tuWwhnZub2RlLnNlbOS4reeahGlk5ZCN5ZKMY2xhc3PlkI3mjILovb3kuIrljrtcclxuICAgICAqICAgIOWmguaenOacieWtkHZub2Rl77yM6YCS5b2S5Yib5bu6RE9NIGVsZW1lbnToioLngrnvvIzlubbmt7vliqDliLDniLZ2bm9kZeWvueW6lOeahGVsZW1lbnToioLngrnkuIrljrvvvIzlkKbliJnlpoLmnpzmnIl0ZXh05bGe5oCn77yM5YiZ5Yib5bu6dGV4dOiKgueCue+8jOW5tua3u+WKoOWIsOeItnZub2Rl5a+55bqU55qEZWxlbWVudOiKgueCueS4iuWOu1xyXG4gICAgICogICAgdm5vZGXovazmjaLmiJBkb23oioLngrnmk43kvZzlrozmiJDlkI7vvIzosIPnlKhjcmVhdGXpkqnlrZBcclxuICAgICAqICAgIOWmguaenHZub2Rl5LiK5pyJaW5zZXJ06ZKp5a2Q77yM6YKj5LmI5bCx5bCG6L+Z5Liqdm5vZGXmlL7lhaVpbnNlcnRlZFZub2RlUXVldWXkuK3kvZzorrDlvZXvvIzliLDml7blho3lnKjlhajlsYDmibnph4/osIPnlKhpbnNlcnTpkqnlrZDlm57osINcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcclxuICAgICAgICB2YXIgaSwgZGF0YSA9IHZub2RlLmRhdGE7XHJcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvL+W9k+iKgueCueS4iuWtmOWcqGhvb2vogIzkuJRob29r5Lit5pyJaW5pdOmSqeWtkOaXtu+8jOWFiOiwg+eUqGluaXTlm57osIPvvIzlr7nliJrliJvlu7rnmoR2bm9kZei/m+ihjOWkhOeQhlxyXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuaW5pdCkpIHtcclxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xyXG4gICAgICAgICAgICAgICAgLy/ojrflj5Zpbml06ZKp5a2Q5L+u5pS55ZCO55qE5pWw5o2uXHJcbiAgICAgICAgICAgICAgICBkYXRhID0gdm5vZGUuZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbiwgc2VsID0gdm5vZGUuc2VsO1xyXG4gICAgICAgIGlmIChzZWwgPT09ICchJykge1xyXG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgdm5vZGUudGV4dCA9ICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzZWwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxyXG4gICAgICAgICAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XHJcbiAgICAgICAgICAgIC8v5YWIaWTlkI5jbGFzc1xyXG4gICAgICAgICAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcclxuICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xyXG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID8gc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDogc2VsO1xyXG4gICAgICAgICAgICAvL+WIm+W7uuS4gOS4qkRPTeiKgueCueW8leeUqO+8jOW5tuWvueWFtuWxnuaAp+WunuS+i+WMllxyXG4gICAgICAgICAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gaXNEZWYoZGF0YSkgJiYgaXNEZWYoaSA9IGRhdGEubnMpID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcpXHJcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XHJcbiAgICAgICAgICAgIC8v6I635Y+WaWTlkI0gI2EgLS0+IGFcclxuICAgICAgICAgICAgaWYgKGhhc2ggPCBkb3QpXHJcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XHJcbiAgICAgICAgICAgIC8v6I635Y+W57G75ZCN77yM5bm25qC85byP5YyWICAuYS5iIC0tPiBhIGJcclxuICAgICAgICAgICAgaWYgKGRvdElkeCA+IDApXHJcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuY3JlYXRlLmxlbmd0aDsgKytpKVxyXG4gICAgICAgICAgICAgICAgY2JzLmNyZWF0ZVtpXShlbXB0eU5vZGUsIHZub2RlKTtcclxuICAgICAgICAgICAgLy/lpoLmnpzlrZjlnKjlrZDlhYPntKBWbm9kZeiKgueCue+8jOWImemAkuW9kuWwhuWtkOWFg+e0oOiKgueCueaPkuWFpeWIsOW9k+WJjVZub2Rl6IqC54K55Lit77yM5bm25bCG5bey5o+S5YWl55qE5a2Q5YWD57Sg6IqC54K55ZyoaW5zZXJ0ZWRWbm9kZVF1ZXVl5Lit5L2c6K6w5b2VXHJcbiAgICAgICAgICAgIGlmIChpcy5hcnJheShjaGlsZHJlbikpIHtcclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjaCA9IGNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOWmguaenOWtmOWcqOWtkOaWh+acrOiKgueCue+8jOWImeebtOaOpeWwhuWFtuaPkuWFpeWIsOW9k+WJjVZub2Rl6IqC54K5XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rOyAvLyBSZXVzZSB2YXJpYWJsZVxyXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcclxuICAgICAgICAgICAgICAgICAgICBpLmNyZWF0ZShlbXB0eU5vZGUsIHZub2RlKTtcclxuICAgICAgICAgICAgICAgIC8v5aaC5p6c5pyJaW5zZXJ06ZKp5a2Q77yM5YiZ5o6o6L+baW5zZXJ0ZWRWbm9kZVF1ZXVl5Lit5L2c6K6w5b2V77yM5LuO6ICM5a6e546w5om56YeP5o+S5YWl6Kem5Y+RaW5zZXJ05Zue6LCDXHJcbiAgICAgICAgICAgICAgICBpZiAoaS5pbnNlcnQpXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOWmguaenOayoeWjsOaYjumAieaLqeWZqO+8jOWImeivtOaYjui/meS4quaYr+S4gOS4qnRleHToioLngrlcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdm5vZGUuZWxtO1xyXG4gICAgfVxyXG4gICAgLy8g5bCGdm5vZGXovazmjaLlkI7nmoRkb23oioLngrnmj5LlhaXliLBkb23moJHnmoTmjIflrprkvY3nva7kuK3ljrtcclxuICAgIGZ1bmN0aW9uIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpIHtcclxuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBjaCA9IHZub2Rlc1tzdGFydElkeF07XHJcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g55So5LqO5omL5Yqo6Kem5Y+RZGVzdG9yeemSqeWtkOWbnuiwg1xyXG4gICAgZnVuY3Rpb24gaW52b2tlRGVzdHJveUhvb2sodm5vZGUpIHtcclxuICAgICAgICB2YXIgaSwgaiwgZGF0YSA9IHZub2RlLmRhdGE7XHJcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvL+WFiOinpuWPkeivpeiKgueCueS4iueahGRlc3Rvcnnlm57osINcclxuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxyXG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XHJcbiAgICAgICAgICAgIC8v5Zyo6Kem5Y+R5YWo5bGA5LiL55qEZGVzdG9yeeWbnuiwg1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmRlc3Ryb3kubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgICAgICBjYnMuZGVzdHJveVtpXSh2bm9kZSk7XHJcbiAgICAgICAgICAgIC8v6YCS5b2S6Kem5Y+R5a2Q6IqC54K555qEZGVzdG9yeeWbnuiwg1xyXG4gICAgICAgICAgICBpZiAodm5vZGUuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaSA9IHZub2RlLmNoaWxkcmVuW2pdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9IG51bGwgJiYgdHlwZW9mIGkgIT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5Li76KaB5Yqf6IO95piv5om56YeP5Yig6ZmkRE9N6IqC54K577yM6ZyA6KaB6YWN5ZCIaW52b2tlRGVzdG9yeUhvb2vlkoxjcmVhdGVSbUNi5pyN55So77yM5pWI5p6c5pu05L2zXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcGFyZW50RWxtIOeItuiKgueCuVxyXG4gICAgICogQHBhcmFtIHZub2RlcyAg5Yig6Zmk6IqC54K55pWw57uEXHJcbiAgICAgKiBAcGFyYW0gc3RhcnRJZHggIOWIoOmZpOi1t+Wni+WdkOagh1xyXG4gICAgICogQHBhcmFtIGVuZElkeCAg5Yig6Zmk57uT5p2f5Z2Q5qCHXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCkge1xyXG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcclxuICAgICAgICAgICAgdmFyIGlfMSA9IHZvaWQgMCwgbGlzdGVuZXJzID0gdm9pZCAwLCBybSA9IHZvaWQgMCwgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xyXG4gICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL+iwg+eUqGRlc3Ryb3npkqnlrZBcclxuICAgICAgICAgICAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhjaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/lr7nlhajlsYByZW1vdmXpkqnlrZDov5vooYzorqHmlbBcclxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgcm0gPSBjcmVhdGVSbUNiKGNoLmVsbSwgbGlzdGVuZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICAvL+iwg+eUqOWFqOWxgHJlbW92ZeWbnuiwg+WHveaVsO+8jOW5tuavj+asoeWHj+WwkeS4gOS4qnJlbW92ZemSqeWtkOiuoeaVsFxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYnMucmVtb3ZlW2lfMV0oY2gsIHJtKTtcclxuICAgICAgICAgICAgICAgICAgICAvL+iwg+eUqOWGhemDqHZub2RlLmRhdGEuaG9va+S4reeahHJlbW92ZemSqeWtkO+8iOWPquacieS4gOS4qu+8iVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaV8xKGNoLCBybSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL+WmguaenOayoeacieWGhemDqHJlbW92ZemSqeWtkO+8jOmcgOimgeiwg+eUqHJt77yM56Gu5L+d6IO95aSfcmVtb3Zl6IqC54K5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJtKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7IC8vIFRleHQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRFbG0sIGNoLmVsbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDlr7nkuo7lkIzlsYLnmoTlrZDoioLngrnvvIxzbmFiYmRvbeaYr+S4u+imgeacieWIoOmZpOOAgeWIm+W7uueahOaTjeS9nO+8jOWQjOaXtumAmui/h+enu+S9jeeahOaWueazle+8jOi+vuWIsOacgOWkp+WkjeeUqOWtmOWcqOiKgueCueeahOebrueahOWFtuS4remcgOimgee7tOaKpOWbm+S4que0ouW8le+8jOWIhuWIq+aYr++8mlxyXG4gICAgLypcclxuICAgICAgb2xkU3RhcnRJZHggPT4g5pen5aS057Si5byVXHJcbiAgICAgIG9sZEVuZElkeCA9PiDml6flsL7ntKLlvJVcclxuICAgICAgbmV3U3RhcnRJZHggPT4g5paw5aS057Si5byVXHJcbiAgICAgIG5ld0VuZElkeCA9PiDmlrDlsL7ntKLlvJVcclxuICAgICovXHJcbiAgICAvLyDnhLblkI7lvIDlp4vlsIbml6flrZDoioLngrnnu4TlkozmlrDlrZDoioLngrnnu4Tov5vooYzpgJDkuIDmr5Tlr7nvvIznm7TliLDpgY3ljoblrozku7vkuIDlrZDoioLngrnnu4TvvIzmr5Tlr7nnrZbnlaXmnIk156eN77yaXHJcbiAgICAvKipcclxuICAgICAqIG9sZFN0YXJ0Vm5vZGXlkoxuZXdTdGFydFZub2Rl6L+b6KGM5q+U5a+577yM5aaC5p6c55u45Ly877yM5YiZ6L+b6KGMcGF0Y2jvvIznhLblkI7mlrDml6flpLTntKLlvJXpg73lkI7np7tcclxuICAgICAqIG9sZEVuZFZub2Rl5ZKMbmV3RW5kVm5vZGXov5vooYzmr5Tlr7nvvIzlpoLmnpznm7jkvLzvvIzliJnov5vooYxwYXRjaO+8jOeEtuWQjuaWsOaXp+Wwvue0ouW8leWJjeenu1xyXG4gICAgICogb2xkU3RhcnRWbm9kZeWSjG5ld0VuZFZub2Rl6L+b6KGM5q+U5a+577yM5aaC5p6c55u45Ly877yM5YiZ6L+b6KGMcGF0Y2jvvIzlsIbml6foioLngrnnp7vkvY3liLDmnIDlkI5cclxuICAgICAqICAgIOeEtuWQjuaXp+WktOe0ouW8leWQjuenu++8jOWwvue0ouW8leWJjeenu++8jOS4uuS7gOS5iOimgei/meagt+WBmuWRou+8n+aIkeS7rOaAneiAg+S4gOenjeaDheWGte+8jOWmguaXp+iKgueCueS4uuOAkDUsMSwyLDMsNOOAkVxyXG4gICAgICAgICAg77yM5paw6IqC54K55Li644CQMSwyLDMsNCw144CR77yM5aaC5p6c57y65LmP6L+Z56eN5Yik5pat77yM5oSP5ZGz552A6ZyA6KaB5YWI5bCGNS0+MSwxLT4yLDItPjMsMy0+NCw0LT415LqUXHJcbiAgICAgICAgICDmrKHliKDpmaTmj5LlhaXmk43kvZzvvIzljbPkvb/mmK/mnInkuoZrZXktaW5kZXjmnaXlpI3nlKjvvIzkuZ/kvJrlh7rnjrDkuZ/kvJrlh7rnjrDjgJA1LDEsMiwzLDTjgJEtPlxyXG4gICAgICAgICAg44CQMSw1LDIsMyw044CRLT7jgJAxLDIsNSwzLDTjgJEtPuOAkDEsMiwzLDUsNOOAkS0+44CQMSwyLDMsNCw144CR5YWxNOasoeaTjeS9nO+8jOWmguaenFxyXG4gICAgICAgICAg5pyJ5LqG6L+Z56eN5Yik5pat77yM5oiR5Lus5Y+q6ZyA6KaB5bCGNeaPkuWFpeWIsOaXp+Wwvue0ouW8leWQjumdouWNs+WPr++8jOS7juiAjOWunueOsOWPs+enu1xyXG4gICAgICogb2xkRW5kVm5vZGXlkoxuZXdTdGFydFZub2Rl6L+b6KGM5q+U5a+577yM5aSE55CG5ZKM5LiK6Z2i57G75Ly877yM5Y+q5LiN6L+H5pS55Li65bem56e7XHJcbiAgICAgKiDlpoLmnpzku6XkuIrmg4XlhrXpg73lpLHotKXkuobvvIzmiJHku6zlsLHlj6rog73lpI3nlKhrZXnnm7jlkIznmoToioLngrnkuobjgILpppblhYjmiJHku6zopoHpgJrov4djcmVhdGVLZXlUb09sZElkeFxyXG4gICAgICogICAg5Yib5bu6a2V5LWluZGV455qE5pig5bCE77yM5aaC5p6c5paw6IqC54K55Zyo5pen6IqC54K55Lit5LiN5a2Y5Zyo77yM5oiR5Lus5bCG5a6D5o+S5YWl5Yiw5pen5aS057Si5byV6IqC54K55YmN77yMXHJcbiAgICAgICAgICDnhLblkI7mlrDlpLTntKLlvJXlkJHlkI7vvJvlpoLmnpzmlrDoioLngrnlnKjlsLHml6foioLngrnnu4TkuK3lrZjlnKjvvIzlhYjmib7liLDlr7nlupTnmoTml6foioLngrnvvIznhLblkI5wYXRjaO+8jOW5tuWwhlxyXG4gICAgICAgICAg5pen6IqC54K557uE5Lit5a+55bqU6IqC54K56K6+572u5Li6dW5kZWZpbmVkLOS7o+ihqOW3sue7j+mBjeWOhui/h+S6hu+8jOS4jeWGjemBjeWOhu+8jOWQpuWImeWPr+iDveWtmOWcqOmHjeWkjVxyXG4gICAgICAgICAg5o+S5YWl55qE6Zeu6aKY77yM5pyA5ZCO5bCG6IqC54K556e75L2N5Yiw5pen5aS057Si5byV6IqC54K55LmL5YmN77yM5paw5aS057Si5byV5ZCR5ZCOXHJcbiAgICAgKiDpgY3ljoblrozkuYvlkI7vvIzlsIbliankvZnnmoTmlrBWbm9kZea3u+WKoOWIsOacgOWQjuS4gOS4quaWsOiKgueCueeahOS9jee9ruWQjuaIluiAheWIoOmZpOWkmuS9meeahOaXp+iKgueCuVxyXG4gICAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBwYXJlbnRFbG0g54i26IqC54K5XHJcbiAgICAgKiBAcGFyYW0gb2xkQ2gg5pen6IqC54K55pWw57uEXHJcbiAgICAgKiBAcGFyYW0gbmV3Q2gg5paw6IqC54K55pWw57uEXHJcbiAgICAgKiBAcGFyYW0gaW5zZXJ0ZWRWbm9kZVF1ZXVlXHJcbiAgICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xyXG4gICAgICAgIHZhciBvbGRTdGFydElkeCA9IDAsIG5ld1N0YXJ0SWR4ID0gMDtcclxuICAgICAgICB2YXIgb2xkRW5kSWR4ID0gb2xkQ2gubGVuZ3RoIC0gMTtcclxuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xyXG4gICAgICAgIHZhciBvbGRFbmRWbm9kZSA9IG9sZENoW29sZEVuZElkeF07XHJcbiAgICAgICAgdmFyIG5ld0VuZElkeCA9IG5ld0NoLmxlbmd0aCAtIDE7XHJcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcclxuICAgICAgICB2YXIgbmV3RW5kVm5vZGUgPSBuZXdDaFtuZXdFbmRJZHhdO1xyXG4gICAgICAgIHZhciBvbGRLZXlUb0lkeDtcclxuICAgICAgICB2YXIgaWR4SW5PbGQ7XHJcbiAgICAgICAgdmFyIGVsbVRvTW92ZTtcclxuICAgICAgICB2YXIgYmVmb3JlO1xyXG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XHJcbiAgICAgICAgICAgIGlmIChvbGRTdGFydFZub2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTsgLy8gVm5vZGUgbWlnaHQgaGF2ZSBiZWVuIG1vdmVkIGxlZnRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChvbGRFbmRWbm9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChuZXdTdGFydFZub2RlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChuZXdFbmRWbm9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDlpoLmnpzml6flpLTntKLlvJXoioLngrnlkozmlrDlpLTntKLlvJXoioLngrnnm7jlkIxcclxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICAvL+WvueaXp+WktOe0ouW8leiKgueCueWSjOaWsOWktOe0ouW8leiKgueCuei/m+ihjGRpZmbmm7TmlrDvvIwg5LuO6ICM6L6+5Yiw5aSN55So6IqC54K55pWI5p6cXHJcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgICAgICAgICAvL+aXp+WktOe0ouW8leWQkeWQjlxyXG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xyXG4gICAgICAgICAgICAgICAgLy/mlrDlpLTntKLlvJXlkJHlkI5cclxuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL+WmguaenOaXp+Wwvue0ouW8leiKgueCueWSjOaWsOWwvue0ouW8leiKgueCueebuOS8vO+8jOWPr+S7peWkjeeUqFxyXG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xyXG4gICAgICAgICAgICAgICAgLy/ml6flsL7ntKLlvJXoioLngrnlkozmlrDlsL7ntKLlvJXoioLngrnov5vooYzmm7TmlrBcclxuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgICAgICAgICAgLy/ml6flsL7ntKLlvJXlkJHliY1cclxuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xyXG4gICAgICAgICAgICAgICAgLy/mlrDlsL7ntKLlvJXlkJHliY1cclxuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5pen5aS057Si5byV6IqC54K55ZKM5paw5aS057Si5byV6IqC54K555u45Ly877yM5Y+v5Lul6YCa6L+H56e75Yqo5p2l5aSN55SoXHJcbiAgICAgICAgICAgIC8v5aaC5pen6IqC54K55Li644CQNSwxLDIsMyw044CR77yM5paw6IqC54K55Li644CQMSwyLDMsNCw144CR77yM5aaC5p6c57y65LmP6L+Z56eN5Yik5pat77yM5oSP5ZGz552AXHJcbiAgICAgICAgICAgIC8v6YKj5qC36ZyA6KaB5YWI5bCGNS0+MSwxLT4yLDItPjMsMy0+NCw0LT415LqU5qyh5Yig6Zmk5o+S5YWl5pON5L2c77yM5Y2z5L2/5piv5pyJ5LqGa2V5LWluZGV45p2l5aSN55So77yMXHJcbiAgICAgICAgICAgIC8vIOS5n+S8muWHuueOsOOAkDUsMSwyLDMsNOOAkS0+44CQMSw1LDIsMyw044CRLT7jgJAxLDIsNSwzLDTjgJEtPuOAkDEsMiwzLDUsNOOAkS0+44CQMSwyLDMsNCw144CRXHJcbiAgICAgICAgICAgIC8vIOWFsTTmrKHmk43kvZzvvIzlpoLmnpzmnInkuobov5nnp43liKTmlq3vvIzmiJHku6zlj6rpnIDopoHlsIY15o+S5YWl5Yiw5pyA5ZCO5LiA5qyh5pON5L2c5Y2z5Y+vXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSkpIHsgLy8gVm5vZGUgbW92ZWQgcmlnaHRcclxuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhvbGRFbmRWbm9kZS5lbG0pKTtcclxuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcclxuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5Y6f55CG5LiO5LiK6Z2i55u45ZCMXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHsgLy8gVm5vZGUgbW92ZWQgbGVmdFxyXG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcclxuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xyXG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8v5aaC5p6c5LiK6Z2i55qE5Yik5pat6YO95LiN6YCa6L+H77yM5oiR5Lus5bCx6ZyA6KaBa2V5LWluZGV46KGo5p2l6L6+5Yiw5pyA5aSn56iL5bqm5aSN55So5LqGXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy/lpoLmnpzkuI3lrZjlnKjml6foioLngrnnmoRrZXktaW5kZXjooajvvIzliJnliJvlu7pcclxuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2xkS2V5VG9JZHggPSBjcmVhdGVLZXlUb09sZElkeChvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL+aJvuWIsOaWsOiKgueCueWcqOaXp+iKgueCuee7hOS4reWvueW6lOiKgueCueeahOS9jee9rlxyXG4gICAgICAgICAgICAgICAgaWR4SW5PbGQgPSBvbGRLZXlUb0lkeFtuZXdTdGFydFZub2RlLmtleV07XHJcbiAgICAgICAgICAgICAgICAvL+WmguaenOaWsOiKgueCueWcqOaXp+iKgueCueS4reS4jeWtmOWcqO+8jOaIkeS7rOWwhuWug+aPkuWFpeWIsOaXp+WktOe0ouW8leiKgueCueWJje+8jOeEtuWQjuaWsOWktOe0ouW8leWQkeWQjlxyXG4gICAgICAgICAgICAgICAgaWYgKGlzVW5kZWYoaWR4SW5PbGQpKSB7IC8vIE5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy/lpoLmnpzmlrDoioLngrnlnKjlsLHml6foioLngrnnu4TkuK3lrZjlnKjvvIzlhYjmib7liLDlr7nlupTnmoTml6foioLngrlcclxuICAgICAgICAgICAgICAgICAgICBlbG1Ub01vdmUgPSBvbGRDaFtpZHhJbk9sZF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy/lhYjlsIbmlrDoioLngrnlkozlr7nlupTml6foioLngrnkvZzmm7TmlrBcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShlbG1Ub01vdmUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v54S25ZCO5bCG5pen6IqC54K557uE5Lit5a+55bqU6IqC54K56K6+572u5Li6dW5kZWZpbmVkLOS7o+ihqOW3sue7j+mBjeWOhui/h+S6hu+8jOS4jeWcqOmBjeWOhu+8jOWQpuWImeWPr+iDveWtmOWcqOmHjeWkjeaPkuWFpeeahOmXrumimFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbGRDaFtpZHhJbk9sZF0gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8v5o+S5YWl5Yiw5pen5aS057Si5byV6IqC54K55LmL5YmNXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBlbG1Ub01vdmUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8v5paw5aS057Si5byV5ZCR5ZCOXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggfHwgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XHJcbiAgICAgICAgICAgIC8v5b2T5pen5aS057Si5byV5aSn5LqO5pen5bC+57Si5byV5pe277yM5Luj6KGo5pen6IqC54K557uE5bey57uP6YGN5Y6G5a6M77yM5bCG5Ymp5L2Z55qE5pawVm5vZGXmt7vliqDliLDmnIDlkI7kuIDkuKrmlrDoioLngrnnmoTkvY3nva7lkI5cclxuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XHJcbiAgICAgICAgICAgICAgICBiZWZvcmUgPSBuZXdDaFtuZXdFbmRJZHggKyAxXSA9PSBudWxsID8gbnVsbCA6IG5ld0NoW25ld0VuZElkeCArIDFdLmVsbTtcclxuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgbmV3Q2gsIG5ld1N0YXJ0SWR4LCBuZXdFbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy/lpoLmnpzmlrDoioLngrnnu4TlhYjpgY3ljoblrozvvIzpgqPkuYjku6Pooajml6foioLngrnnu4TkuK3liankvZnoioLngrnpg73kuI3pnIDopoHvvIzmiYDku6Xnm7TmjqXliKDpmaRcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XHJcbiAgICAgICAgdmFyIGksIGhvb2s7XHJcbiAgICAgICAgLy8g5ZyocGF0Y2jkuYvliY3vvIzlhYjosIPnlKh2bm9kZS5kYXRh55qEcHJlcGF0Y2jpkqnlrZBcclxuICAgICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmRhdGEpICYmIGlzRGVmKGhvb2sgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBob29rLnByZXBhdGNoKSkge1xyXG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG07XHJcbiAgICAgICAgdmFyIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW47XHJcbiAgICAgICAgdmFyIGNoID0gdm5vZGUuY2hpbGRyZW47XHJcbiAgICAgICAgLy8g5aaC5p6cb2xkdm5vZGXlkox2bm9kZeeahOW8leeUqOebuOWQjO+8jOivtOaYjuayoeWPkeeUn+S7u+S9leWPmOWMluebtOaOpei/lOWbnu+8jOmBv+WFjeaAp+iDvea1qui0uVxyXG4gICAgICAgIGlmIChvbGRWbm9kZSA9PT0gdm5vZGUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyDlpoLmnpx2bm9kZeWSjG9sZHZub2Rl55u45Ly877yM6YKj5LmI5oiR5Lus6KaB5a+5b2xkdm5vZGXmnKzouqvov5vooYzmm7TmlrBcclxuICAgICAgICBpZiAodm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vIOmmluWFiOiwg+eUqOWFqOWxgOeahHVwZGF0ZemSqeWtkO+8jOWvuXZub2RlLmVsbeacrOi6q+WxnuaAp+i/m+ihjOabtOaWsFxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnVwZGF0ZS5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgICAgIGNicy51cGRhdGVbaV0ob2xkVm5vZGUsIHZub2RlKTtcclxuICAgICAgICAgICAgLy8g54S25ZCO6LCD55Sodm5vZGUuZGF0YemHjOmdoueahHVwZGF0ZemSqeWtkCzlho3mrKHlr7l2bm9kZS5lbG3mm7TmlrBcclxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vaztcclxuICAgICAgICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpXHJcbiAgICAgICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOWmguaenHZub2Rl5LiN5pivdGV4dOiKgueCuVxyXG4gICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XHJcbiAgICAgICAgICAgIC8vIOWmguaenHZub2Rl5ZKMb2xkVm5vZGXpg73mnInlrZDoioLngrlcclxuICAgICAgICAgICAgaWYgKGlzRGVmKG9sZENoKSAmJiBpc0RlZihjaCkpIHtcclxuICAgICAgICAgICAgICAgIC8vIOW9k1Zub2Rl5ZKMb2xkdm5vZGXnmoTlrZDoioLngrnkuI3lkIzml7bvvIzosIPnlKh1cGRhdGVjaGlscmVu5Ye95pWw77yMZGlmZuWtkOiKgueCuVxyXG4gICAgICAgICAgICAgICAgaWYgKG9sZENoICE9PSBjaClcclxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVDaGlsZHJlbihlbG0sIG9sZENoLCBjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDlpoLmnpx2bm9kZeacieWtkOiKgueCue+8jG9sZHZub2Rl5rKh5a2Q6IqC54K5XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKGNoKSkge1xyXG4gICAgICAgICAgICAgICAgLy9vbGR2bm9kZeaYr3RleHToioLngrnvvIzliJnlsIZlbG3nmoR0ZXh05riF6ZmkXHJcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpXHJcbiAgICAgICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xyXG4gICAgICAgICAgICAgICAgLy/lubbmt7vliqB2bm9kZeeahGNoaWxkcmVuXHJcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMoZWxtLCBudWxsLCBjaCwgMCwgY2gubGVuZ3RoIC0gMSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyDlpoLmnpxvbGR2bm9kZeaciWNoaWxkcmVu77yM6ICMdm5vZGXmsqFjaGlsZHJlbu+8jOWImeenu+mZpGVsbeeahGNoaWxkcmVuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZENoKSkge1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIOWmguaenHZub2Rl5ZKMb2xkdm5vZGXpg73msqFjaGlkbHJlbu+8jOS4lHZub2Rl5rKhdGV4dO+8jOWImeWIoOmZpG9sZHZub2Rl55qEdGV4dFxyXG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xyXG4gICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOWmguaenG9sZHZub2Rl55qEdGV4dOWSjHZub2Rl55qEdGV4dOS4jeWQjO+8jOWImeabtOaWsOS4unZub2Rl55qEdGV4dFxyXG4gICAgICAgIGVsc2UgaWYgKG9sZFZub2RlLnRleHQgIT09IHZub2RlLnRleHQpIHtcclxuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhdGNo5a6M77yM6Kem5Y+RcG9zdHBhdGNo6ZKp5a2QXHJcbiAgICAgICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcclxuICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIOaIkeS7rOmcgOimgeaYjuehrueahOS4gOS4quaYr++8jOWmguaenOaMieeFp+S8oOe7n+eahGRpZmbnrpfms5XvvIzpgqPkuYjkuLrkuobmib7liLDmnIDlsI/lj5jljJbvvIzpnIDopoHpgJDlsYLpgJDlsYLnmoTljrvmkJzntKLmr5TovoPvvIzov5nmoLfml7bpl7TlpI3mnYLluqblsIbkvJrovr7liLAgTyhuXjMp55qE57qn5Yir77yM5Luj5Lu35Y2B5YiG6auYXHJcbiAgICAvLyB2ZG9t6YeH5Y+W55qE5piv5LiA56eN566A5YyW55qE5oCd6Lev77yM5Y+q5q+U6L6D5ZCM5bGC6IqC54K577yM5aaC5p6c5LiN5ZCM77yM6YKj5LmI5Y2z5L2/6K+l6IqC54K555qE5a2Q6IqC54K55rKh5Y+Y5YyW77yM5oiR5Lus5Lmf5LiN5aSN55So77yM55u05o6l5bCG5LuO54i26IqC54K55byA5aeL55qE5a2Q5qCR5YWo6YOo5Yig6Zmk77yM54S25ZCO5YaN6YeN5paw5Yib5bu66IqC54K55re75Yqg5Yiw5paw55qE5L2N572u44CC5aaC5p6c54i26IqC54K55rKh5Y+Y5YyW77yM5oiR5Lus5bCx5q+U6L6D5omA5pyJ5ZCM5bGC55qE5a2Q6IqC54K577yM5a+56L+Z5Lqb5a2Q6IqC54K56L+b6KGM5Yig6Zmk44CB5Yib5bu644CB56e75L2N5pON5L2cXHJcbiAgICAvLyBwYXRjaOWPqumcgOimgeWvueS4pOS4qnZub2Rl6L+b6KGM5Yik5pat5piv5ZCm55u45Ly877yM5aaC5p6c55u45Ly877yM5YiZ5a+55LuW5Lus6L+b6KGMcGF0Y2hWbm9kZeaTjeS9nO+8jOWQpuWImeebtOaOpeeUqHZub2Rl5pu/5o2ib2xkdm5vZGVcclxuICAgIHJldHVybiBmdW5jdGlvbiBwYXRjaChvbGRWbm9kZSwgdm5vZGUpIHtcclxuICAgICAgICB2YXIgaSwgZWxtLCBwYXJlbnQ7XHJcbiAgICAgICAgLy8g6K6w5b2V6KKr5o+S5YWl55qEdm5vZGXpmJ/liJfvvIznlKjkuo7mibnop6blj5FpbnNlcnRcclxuICAgICAgICB2YXIgaW5zZXJ0ZWRWbm9kZVF1ZXVlID0gW107XHJcbiAgICAgICAgLy/osIPnlKjlhajlsYBwcmXpkqnlrZBcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcclxuICAgICAgICAgICAgY2JzLnByZVtpXSgpO1xyXG4gICAgICAgIC8vIOWmguaenG9sZHZub2Rl5pivZG9t6IqC54K577yM6L2s5YyW5Li6b2xkdm5vZGVcclxuICAgICAgICBpZiAoIWlzVm5vZGUob2xkVm5vZGUpKSB7XHJcbiAgICAgICAgICAgIG9sZFZub2RlID0gZW1wdHlOb2RlQXQob2xkVm5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDlpoLmnpxvbGR2bm9kZeS4jnZub2Rl55u45Ly877yM6L+b6KGM5pu05pawXHJcbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XHJcbiAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8g5ZCm5YiZ77yM5bCGdm5vZGXmj5LlhaXvvIzlubblsIZvbGR2bm9kZeS7juWFtueItuiKgueCueS4iuebtOaOpeWIoOmZpFxyXG4gICAgICAgICAgICBlbG0gPSBvbGRWbm9kZS5lbG07XHJcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XHJcbiAgICAgICAgICAgIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcclxuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xyXG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudCwgW29sZFZub2RlXSwgMCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8g5o+S5YWl5a6M5ZCO77yM6LCD55So6KKr5o+S5YWl55qEdm5vZGXnmoRpbnNlcnTpkqnlrZBcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIOeEtuWQjuiwg+eUqOWFqOWxgOS4i+eahHBvc3TpkqnlrZBcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnBvc3QubGVuZ3RoOyArK2kpXHJcbiAgICAgICAgICAgIGNicy5wb3N0W2ldKCk7XHJcbiAgICAgICAgLy8g6L+U5Zuedm5vZGXnlKjkvZzkuIvmrKFwYXRjaOeahG9sZHZub2RlXHJcbiAgICAgICAgcmV0dXJuIHZub2RlO1xyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmluaXQgPSBpbml0O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1zbmFiYmRvbS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xyXG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcclxuZnVuY3Rpb24gY29weVRvVGh1bmsodm5vZGUsIHRodW5rKSB7XHJcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XHJcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmsuZGF0YS5mbjtcclxuICAgIHZub2RlLmRhdGEuYXJncyA9IHRodW5rLmRhdGEuYXJncztcclxuICAgIHRodW5rLmRhdGEgPSB2bm9kZS5kYXRhO1xyXG4gICAgdGh1bmsuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcclxuICAgIHRodW5rLnRleHQgPSB2bm9kZS50ZXh0O1xyXG4gICAgdGh1bmsuZWxtID0gdm5vZGUuZWxtO1xyXG59XHJcbmZ1bmN0aW9uIGluaXQodGh1bmspIHtcclxuICAgIHZhciBjdXIgPSB0aHVuay5kYXRhO1xyXG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xyXG4gICAgY29weVRvVGh1bmsodm5vZGUsIHRodW5rKTtcclxufVxyXG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmspIHtcclxuICAgIHZhciBpLCBvbGQgPSBvbGRWbm9kZS5kYXRhLCBjdXIgPSB0aHVuay5kYXRhO1xyXG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xyXG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xyXG4gICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVuayk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xyXG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgY29weVRvVGh1bmsob2xkVm5vZGUsIHRodW5rKTtcclxufVxyXG5leHBvcnRzLnRodW5rID0gZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XHJcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgYXJncyA9IGZuO1xyXG4gICAgICAgIGZuID0ga2V5O1xyXG4gICAgICAgIGtleSA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcclxuICAgICAgICBrZXk6IGtleSxcclxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxyXG4gICAgICAgIGZuOiBmbixcclxuICAgICAgICBhcmdzOiBhcmdzXHJcbiAgICB9KTtcclxufTtcclxuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy50aHVuaztcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcclxuLyoqXHJcbiAqIEBwYXJhbSBzZWzvvJrpgInmi6nlmajvvIzlj6/ku6XmmK9jdXN0b20gdGFnLCDlj6/ku6XmmK8nZGl2Jywnc3BhbicsZXRjLOS7o+ihqOi/meS4qnZpcnR1YWwgZG9t55qEdGFnIG5hbWVcclxuICogQHBhcmFtIGRhdGHvvJp2aXJ0dWFsIGRvbeaVsOaNrizlroPku6zkuI5kb20gZWxlbWVudOeahHByb3DjgIFhdHRy55qE6K+t5LmJ57G75Ly844CC5L2G5pivdmlydHVhbCBkb23ljIXlkKvnmoTmlbDmja7lj6/ku6Xmm7TngbXmtLtcclxuICogQHBhcmFtIGNoaWxkcmVu77ya5a2Q6IqC54K55pWw57uELOS9huaYr+i/meaYr3Zkb23nmoRjaGlsZHJlbi4gdmRvbeeahOWunueOsOmHjeeCueWwseaYr+WvuWNoaWxkcmVu55qEcGF0Y2jkuIpcclxuICogQHBhcmFtIHRleHTvvJrlr7nlupRlbGVtZW50LnRleHRDb250ZW50LOWcqGNoaWxkcmVu6YeM5a6a5LmJ5LiA5Liqc3RyaW5nLOmCo+S5iOaIkeS7rOS8muS4uui/meS4qnN0cmluZ+WIm+W7uuS4gOS4qnRleHROb2RlXHJcbiAqIEBwYXJhbSBlbG3vvJrlr7nnnJ/lrp5kb20gZWxlbWVudOeahOW8leeUqFxyXG4gKiBrZXnvvJrnlKjkuo7mj5DnpLpjaGlsZHJlbiBwYXRjaOi/h+eoi1xyXG4gKiBAcmV0dXJucyB7e3NlbDogKHN0cmluZ3x1bmRlZmluZWQpLCBkYXRhOiAoYW55fHVuZGVmaW5lZCksIGNoaWxkcmVuOiAoQXJyYXk8Vk5vZGV8c3RyaW5nPnx1bmRlZmluZWQpLCB0ZXh0OiAoc3RyaW5nfHVuZGVmaW5lZCksIGVsbTogKEVsZW1lbnR8VGV4dHx1bmRlZmluZWQpLCBrZXk6IGFueX19XHJcbiAqIGtleeWxnuaAp+eUqOS6juS4jeWQjHZub2Rl5LmL6Ze055qE5a+55q+UXHJcbiAqL1xyXG4vLyB2bm9kZeaehOmAoOWHveaVsFxyXG5mdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcclxuICAgIHZhciBrZXkgPSBkYXRhID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBkYXRhLmtleTtcclxuICAgIHJldHVybiB7IHNlbDogc2VsLCBkYXRhOiBkYXRhLCBjaGlsZHJlbjogY2hpbGRyZW4sXHJcbiAgICAgICAgdGV4dDogdGV4dCwgZWxtOiBlbG0sIGtleToga2V5IH07XHJcbn1cclxuZXhwb3J0cy52bm9kZSA9IHZub2RlO1xyXG5leHBvcnRzLmRlZmF1bHQgPSB2bm9kZTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dm5vZGUuanMubWFwIl19

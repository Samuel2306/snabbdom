(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.snabbdom_style = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtb2R1bGVzL3N0eWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICog5bCGZWxlbeS4iuWtmOWcqOS6jm9sZHZub2Rl5Lit5L2G5LiN5a2Y5Zyo5LqOdm5vZGXnmoRzdHlsZee9ruepulxyXG4gKiDlpoLmnpx2bm9kZS5zdHlsZeS4reeahGRlbGF5ZWTkuI5vbGR2bm9kZeeahOS4jeWQjO+8jOWImeabtOaWsGRlbGF5ZWTnmoTlsZ7mgKflgLzvvIzlubblnKjkuIvkuIDluKflsIZlbG3nmoRzdHlsZeiuvue9ruS4uuivpeWAvO+8jOS7juiAjOWunueOsOWKqOeUu+i/h+a4oeaViOaenFxyXG4gKiDpnZ5kZWxheWVk5ZKMcmVtb3Zl55qEc3R5bGXnm7TmjqXmm7TmlrBcclxuICogdm5vZGXooqtkZXN0cm955pe277yM55u05o6l5bCG5a+55bqUc3R5bGXmm7TmlrDkuLp2bm9kZS5kYXRhLnN0eWxlLmRlc3RvcnnnmoTlgLxcclxuICogdm5vZGXooqtyZW9tdmXml7bvvIzlpoLmnpxzdHlsZS5yZW1vdmXkuI3lrZjlnKjvvIznm7TmjqXosIPnlKjlhajlsYByZW1vdmXpkqnlrZDov5vlhaXkuIvkuIDkuKpyZW1vdmXov4fnqItcclxuIOWmguaenHN0eWxlLnJlbW92ZeWtmOWcqO+8jOmCo+S5iOaIkeS7rOWwsemcgOimgeiuvue9rnJlbW92ZeWKqOeUu+i/h+a4oeaViOaenO+8jOetieWIsOi/h+a4oeaViOaenOe7k+adn+S5i+WQju+8jOaJjeiwg+eUqFxyXG4g5LiL5LiA5LiqcmVtb3Zl6L+H56iLXHJcbiAqL1xyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XHJcbi8v5aaC5p6c5a2Y5ZyocmVxdWVzdEFuaW1hdGlvbkZyYW1l77yM5YiZ55u05o6l5L2/55So77yM5Lul5LyY5YyW5oCn6IO977yM5ZCm5YiZ55Soc2V0VGltZW91dFxyXG52YXIgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHx8IHNldFRpbWVvdXQ7XHJcbnZhciBuZXh0RnJhbWUgPSBmdW5jdGlvbiAoZm4pIHsgcmFmKGZ1bmN0aW9uICgpIHsgcmFmKGZuKTsgfSk7IH07XHJcbi8v6YCa6L+HbmV4dEZyYW1l5p2l5a6e546w5Yqo55S75pWI5p6cXHJcbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xyXG4gICAgbmV4dEZyYW1lKGZ1bmN0aW9uICgpIHsgb2JqW3Byb3BdID0gdmFsOyB9KTtcclxufVxyXG5mdW5jdGlvbiB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpIHtcclxuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlLCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XHJcbiAgICAvL+WmguaenG9sZHZub2Rl5ZKMdm5vZGXpg73msqHmnIlzdHlsZe+8jOebtOaOpei/lOWbnlxyXG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgaWYgKG9sZFN0eWxlID09PSBzdHlsZSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBvbGRTdHlsZSA9IG9sZFN0eWxlIHx8IHt9O1xyXG4gICAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcclxuICAgIHZhciBvbGRIYXNEZWwgPSAnZGVsYXllZCcgaW4gb2xkU3R5bGU7XHJcbiAgICAvL+mBjeWOhm9sZHZub2Rl55qEc3R5bGVcclxuICAgIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xyXG4gICAgICAgIC8v5aaC5p6cdm5vZGXkuK3ml6Dor6VzdHlsZe+8jOWImee9ruepulxyXG4gICAgICAgIGlmICghc3R5bGVbbmFtZV0pIHtcclxuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9ICcnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XHJcbiAgICAgICAgY3VyID0gc3R5bGVbbmFtZV07XHJcbiAgICAgICAgLy/lpoLmnpx2bm9kZeeahHN0eWxl5Lit5pyJZGVsYXllZOS4lOS4jm9sZHZub2Rl5Lit55qE5LiN5ZCM77yM5YiZ5Zyo5LiL5LiA5bin6K6+572uZGVsYXllZOeahOWPguaVsFxyXG4gICAgICAgIGlmIChuYW1lID09PSAnZGVsYXllZCcgJiYgc3R5bGUuZGVsYXllZCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lMiBpbiBzdHlsZS5kZWxheWVkKSB7XHJcbiAgICAgICAgICAgICAgICBjdXIgPSBzdHlsZS5kZWxheWVkW25hbWUyXTtcclxuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBzZXROZXh0RnJhbWUoZWxtLnN0eWxlLCBuYW1lMiwgY3VyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL+WmguaenOS4jeaYr2RlbGF5ZWTlkoxyZW1vdmXnmoRzdHlsZe+8jOS4lOS4jeWQjOS6jm9sZHZub2Rl55qE5YC877yM5YiZ55u05o6l6K6+572u5paw5YC8XHJcbiAgICAgICAgZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xyXG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuLy/orr7nva7oioLngrnooqtkZXN0b3J55pe255qEc3R5bGVcclxuZnVuY3Rpb24gYXBwbHlEZXN0cm95U3R5bGUodm5vZGUpIHtcclxuICAgIHZhciBzdHlsZSwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBzID0gdm5vZGUuZGF0YS5zdHlsZTtcclxuICAgIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcclxuICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcclxuICAgIH1cclxufVxyXG4vL+WIoOmZpOaViOaenO+8jOW9k+aIkeS7rOWIoOmZpOS4gOS4quWFg+e0oOaXtu+8jOWFiOWbnuiwg+eUqOWIoOmZpOi/h+W6puaViOaenO+8jOi/h+a4oeWujOaJjeS8muWwhuiKgueCuXJlbW92ZVxyXG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xyXG4gICAgdmFyIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xyXG4gICAgLy/lpoLmnpzmsqHmnIlzdHlsZeaIluayoeaciXN0eWxlLnJlbW92ZVxyXG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xyXG4gICAgICAgIC8v55u05o6l6LCD55Socm3vvIzljbPlrp7pmYXkuIrmmK/osIPnlKjlhajlsYDnmoRyZW1vdmXpkqnlrZBcclxuICAgICAgICBybSgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIGkgPSAwLCBjb21wU3R5bGUsIHN0eWxlID0gcy5yZW1vdmUsIGFtb3VudCA9IDAsIGFwcGxpZWQgPSBbXTtcclxuICAgIC8v6K6+572u5bm26K6w5b2VcmVtb3Zl5Yqo5L2c5ZCO5Yig6Zmk6IqC54K55YmN55qE5qC35byPXHJcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcclxuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XHJcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XHJcbiAgICB9XHJcbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XHJcbiAgICAvL+aLv+WIsOaJgOaciemcgOimgei/h+a4oeeahOWxnuaAp1xyXG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XHJcbiAgICAvL+Wvuei/h+a4oeWxnuaAp+iuoeaVsO+8jOi/memHjGFwcGxpZWQubGVuZ3RoID49YW1vdW5077yM5Zug5Li65pyJ5Lqb5bGe5oCn5piv5LiN6ZyA6KaB6L+H5rih55qEXHJcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgaWYgKGFwcGxpZWQuaW5kZXhPZihwcm9wc1tpXSkgIT09IC0xKVxyXG4gICAgICAgICAgICBhbW91bnQrKztcclxuICAgIH1cclxuICAgIC8v5b2T6L+H5rih5pWI5p6c55qE5a6M5oiQ5ZCO77yM5omNcmVtb3Zl6IqC54K577yM6LCD55So5LiL5LiA5LiqcmVtb3Zl6L+H56iLXHJcbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xyXG4gICAgICAgIGlmIChldi50YXJnZXQgPT09IGVsbSlcclxuICAgICAgICAgICAgLS1hbW91bnQ7XHJcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcclxuICAgICAgICAgICAgcm0oKTtcclxuICAgIH0pO1xyXG59XHJcbmV4cG9ydHMuc3R5bGVNb2R1bGUgPSB7XHJcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGVTdHlsZSxcclxuICAgIGRlc3Ryb3k6IGFwcGx5RGVzdHJveVN0eWxlLFxyXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXHJcbn07XHJcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuc3R5bGVNb2R1bGU7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCJdfQ==

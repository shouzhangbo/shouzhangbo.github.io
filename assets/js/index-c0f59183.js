(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function o(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=o(n);fetch(n.href,r)}})();document.addEventListener("DOMContentLoaded",function(){l(),d(),u(),f(),m(),p()});function l(){document.querySelectorAll('.nav-link[href^="#"]').forEach(e=>{e.addEventListener("click",function(o){o.preventDefault();const i=this.getAttribute("href").substring(1),n=document.getElementById(i);if(n){const r=document.querySelector(".header").offsetHeight,s=n.offsetTop-r;window.scrollTo({top:s,behavior:"smooth"})}})})}function d(){const t=document.querySelector(".header");window.addEventListener("scroll",function(){(window.pageYOffset||document.documentElement.scrollTop)>100?(t.style.background="rgba(255, 255, 255, 0.98)",t.style.boxShadow="0 2px 20px rgba(30, 144, 255, 0.1)"):(t.style.background="rgba(255, 255, 255, 0.95)",t.style.boxShadow="none")})}function u(){const t=document.querySelector(".nav-toggle"),e=document.querySelector(".nav-menu");t&&e&&(t.addEventListener("click",function(){e.classList.toggle("show"),t.classList.toggle("active")}),document.querySelectorAll(".nav-link").forEach(i=>{i.addEventListener("click",function(){e.classList.remove("show"),t.classList.remove("active")})}))}function f(){const t=document.querySelector(".form");t&&t.addEventListener("submit",function(e){e.preventDefault();const o=new FormData(this),i=o.get("name"),n=o.get("email"),r=o.get("message");if(!i||!n||!r){c("请填写所有必填字段","error");return}if(!g(n)){c("请输入有效的邮箱地址","error");return}c("感谢您的留言！我们会尽快回复您。","success"),this.reset()})}function m(){const t={threshold:.1,rootMargin:"0px 0px -50px 0px"},e=new IntersectionObserver(function(i){i.forEach(n=>{n.isIntersecting&&n.target.classList.add("fade-in-up")})},t);document.querySelectorAll(".service-card, .feature-item, .contact-item, .about-text").forEach(i=>{e.observe(i)})}function p(){const t=document.querySelector(".hero");if(t){const e=document.createElement("div");e.className="scroll-indicator",e.innerHTML="↓",e.setAttribute("title","向下滚动查看更多"),e.addEventListener("click",function(){const o=document.getElementById("about");if(o){const i=document.querySelector(".header").offsetHeight,n=o.offsetTop-i;window.scrollTo({top:n,behavior:"smooth"})}}),t.appendChild(e),window.addEventListener("scroll",function(){(window.pageYOffset||document.documentElement.scrollTop)>200?e.style.opacity="0":e.style.opacity="1"})}}function g(t){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)}function c(t,e="info"){const o=document.createElement("div");o.className=`notification notification-${e}`,o.textContent=t,o.style.cssText=`
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${e==="success"?"#4CAF50":e==="error"?"#f44336":"#2196F3"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `,document.body.appendChild(o),setTimeout(()=>{o.style.transform="translateX(0)"},100),setTimeout(()=>{o.style.transform="translateX(400px)",setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},300)},3e3)}window.addEventListener("load",function(){document.querySelectorAll(".section").forEach((e,o)=>{setTimeout(()=>{e.style.opacity="1",e.style.transform="translateY(0)"},o*200)})});document.addEventListener("keydown",function(t){if(t.key==="Escape"){const e=document.querySelector(".nav-menu"),o=document.querySelector(".nav-toggle");e&&e.classList.contains("show")&&(e.classList.remove("show"),o.classList.remove("active"))}});"ontouchstart"in window&&document.body.classList.add("touch-device");function a(){if(window.innerWidth<=768){const t=document.createElement("style");t.textContent=`
            .nav-menu.show {
                display: flex;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                flex-direction: column;
                padding: 1rem;
                box-shadow: 0 4px 12px rgba(30, 144, 255, 0.15);
                border-top: 1px solid rgba(30, 144, 255, 0.1);
            }
            
            .nav-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .nav-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .nav-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
        `,document.head.appendChild(t)}}window.addEventListener("resize",a);a();

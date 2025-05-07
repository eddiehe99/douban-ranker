// ==UserScript==
// @name         豆瓣榜单助手·Douban-Ranker
// @namespace    https://github.com/eddiehe99/douban-ranker
// @homepageURL  https://douban-ranker.eddiehe.top
// @supportURL   https://github.com/eddiehe99/douban-ranker/issues
// @updateURL    https://douban-ranker.eddiehe.top/douban-ranker.user.js
// @downloadURL  https://douban-ranker.eddiehe.top/douban-ranker.user.js
// @version      0.2.4
// @description  在豆瓣电影和播客页面展示作品在不同榜单中的排名
// @author       Eddie He
// @contributor  CRonaldoWei
// @icon         https://img3.doubanio.com/favicon.ico
// @match        https://movie.douban.com/subject/*
// @match        https://www.douban.com/podcast/*
// @include      https://movie.douban.com/*
// @include      https://music.douban.com/*
// @include      https://book.douban.com/*
// @include      https://www.douban.com/podcast/*
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
    'use strict';

    console.log("脚本: 豆瓣榜单助手·Douban-Ranker--开始执行--GitHub: https://github.com/eddiehe99/douban-ranker");

    // 配置常量
    const CONFIG = {
        movieRankUrl: "https://rank4douban.eddiehe.top/data.json",
        podcastRankUrl: "https://xyzrank.eddiehe.top/full.json",
        cssUrl: "https://img1.doubanio.com/cuphead/movie-static/charts/top250.24c18.css",
        toggleButtonId: "rank_toggle",
        top250Class: "top250"
    };

    // 添加样式
    if (!document.querySelector(`link[href*="${CONFIG.cssUrl}"]`)) {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = CONFIG.cssUrl;
        document.head.appendChild(styleLink);
    }

    /**
     * 创建排名组件
     * @param {Object} options 
     * @param {string} options.prefix 前缀（如"TOP"）
     * @param {number} options.position 排名位置
     * @param {string} options.title 榜单标题
     * @param {string} options.shortTitle 简短标题
     * @param {string} options.href 榜单链接
     * @returns {string} HTML字符串
     */
    function createRankItem({ prefix = 'No.', position, title, shortTitle, href }) {
        return [
            `<div class="${CONFIG.top250Class}" style="display: inline-block;">`,
            `<span class="top250-no">${prefix}${position}</span>`,
            `<span class="top250-link">`,
            `<a href="${href}" title="${title}" target="_blank">${shortTitle}</a>`,
            `</span>`,
            `</div> `,
        ].join('');
    }

    /**
     * 初始化展示逻辑
     * @param {HTMLElement} container 插入位置
     * @param {Array<string>} items 排名组件数组
     */
    function initToggle(container, items) {
        // 添加样式
        if (!document.querySelector(`link[href*="${CONFIG.cssUrl}"]`)) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = CONFIG.cssUrl;
            document.head.appendChild(styleLink);
        }

        // 将 HTML 字符串转换为真实的 DOM 节点
        const fragment = document.createDocumentFragment();
        items.forEach(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.style.display = "inline-block";
            fragment.appendChild(tempDiv.firstElementChild); // 取出真正的 div.top250 元素
            const space = document.createTextNode(' ');
            fragment.appendChild(space);
        });

        // 在 container 之前插入 fragment
        container.parentNode.insertBefore(fragment, container);

        // 折叠逻辑
        const allItems = document.querySelectorAll(`.${CONFIG.top250Class}`);
        if (allItems.length > 4) {
            // 创建折叠按钮
            const toggleBtn = document.createElement('div');
            toggleBtn.id = CONFIG.toggleButtonId;
            toggleBtn.innerHTML = '<a href="javascript:void(0)">展示剩余 →</a>';
            toggleBtn.setAttribute('data-toggle', 'show');
            toggleBtn.style.display = 'inline-block';

            // 在 container 之前插入 toggleBtn
            container.parentNode.insertBefore(toggleBtn, container);

            Array.from(allItems).slice(4).forEach(item => item.style.display = 'none');

            // 点击按钮切换显示/隐藏
            toggleBtn.addEventListener('click', function () {
                const toggleState = this.getAttribute('data-toggle');
                if (toggleState === 'show') {
                    Array.from(allItems).slice(4).forEach(item => item.style.display = "inline-block");
                    this.setAttribute('data-toggle', 'hide');
                    this.innerHTML = '<a href="javascript:void(0)">隐藏剩余 ←</a>';
                } else {
                    Array.from(allItems).slice(4).forEach(item => item.style.display = "none");
                    this.setAttribute('data-toggle', 'show');
                    this.innerHTML = '<a href="javascript:void(0)">展示剩余 →</a>';
                }
            });
        }
    }

    /**
     * 处理电影页面
     */
    function handleMoviePage() {
        const matchResult = window.location.href.match(/https:\/\/movie\.douban\.com\/subject\/(\d+)/);
        if (!matchResult) return;

        const doubanId = matchResult[1];
        const header = document.querySelector("#content > h1");
        if (!header) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: CONFIG.movieRankUrl,
            onload: function (response) {
                try {
                    const data = JSON.parse(response.responseText);
                    const lists = Object.values(data);
                    const rankItems = lists
                        .filter(list => list.list[doubanId])
                        .map(list => ({
                            prefix: list.prefix || 'No.',
                            position: list.list[doubanId],
                            title: list.title,
                            shortTitle: list.short_title,
                            href: list.href
                        }))
                        .map(createRankItem);

                    if (rankItems.length) initToggle(header, rankItems);
                } catch (e) {
                    console.error("【豆瓣榜单助手·Douban-Ranker】电影榜单数据处理失败:", e);
                    alert("豆瓣榜单助手·Douban-Ranker：电影榜单数据处理时发生错误，请稍后再试！");
                }
            },
            onerror: function (error) {
                console.error("【豆瓣榜单助手·Douban-Ranker】电影榜单网络请求失败:", error);
                alert("豆瓣榜单助手 · Douban-Ranker：电影榜单网络请求时发生错误，请检查您的网络连接后重试！");
            }
        });
    }

    /**
     * 处理播客页面
     */
    function handlePodcastPage() {
        const header = document.querySelector("#content > h1");
        if (!header) return;

        const podcastName = header.innerText.trim();
        GM_xmlhttpRequest({
            method: 'GET',
            url: CONFIG.podcastRankUrl,
            onload: function (response) {
                try {
                    const data = JSON.parse(response.responseText);
                    const podcast = data.data?.podcasts?.find(p => p.name === podcastName);

                    if (podcast && podcast.rank) {
                        const item = createRankItem({
                            position: podcast.rank,
                            shortTitle: '中文播客榜',
                            href: podcast.links[0]?.url || '#'
                        });
                        initToggle(header, [item]);
                    }
                } catch (e) {
                    console.error("【豆瓣榜单助手·Douban-Ranker】播客榜单数据处理失败:", e);
                    alert("豆瓣榜单助手·Douban-Ranker：播客榜单数据处理时发生错误，请稍后再试！");
                }
            },
            onerror: function (error) {
                console.error("【豆瓣榜单助手·Douban-Ranker】播客榜单网络请求失败:", error);
                alert("豆瓣榜单助手·Douban-Ranker：播客榜单网络请求时发生错误，请检查您的网络连接后重试！");
            }
        });
    }

    // 页面适配入口
    switch (location.host) {
        case 'movie.douban.com':
            handleMoviePage();
            break;
        case 'www.douban.com':
            if (location.pathname.startsWith('/podcast')) handlePodcastPage();
            break;
    }
})();
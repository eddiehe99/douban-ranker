// ==UserScript==
// @name         豆瓣榜单助手 · Douban-Ranker
// @namespace    https://github.com/eddiehe99/douban-ranker
// @homepageURL  https://douban-ranker.eddiehe.top
// @supportURL   https://github.com/eddiehe99/douban-ranker/issues
// @updateURL    https://douban-ranker.eddiehe.top/douban-ranker.user.js
// @downloadURL  https://douban-ranker.eddiehe.top/douban-ranker.user.js
// @version      0.2.3
// @description  在豆瓣电影和播客页面展示电影在不同榜单中的排名
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
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';

    console.log("脚本: 豆瓣榜单助手 · Douban-Ranker --- 开始执行 --- GitHub: https://github.com/eddiehe99/douban-ranker");

    // 检查当前页面是否为豆瓣电影页面
    if (location.host === "movie.douban.com") {
        // 获取当前豆瓣电影页面的电影 ID
        const url = window.location.href;
        const dbidMatch = url.match(/https:\/\/movie.douban.com\/subject\/(\d+)/);
        if (!dbidMatch) return;
        const douban_id = dbidMatch[1];

        // 从远程 JSON 加载榜单数据
        GM_xmlhttpRequest({
            method: 'GET',
            url: "https://rank4douban.eddiehe.top/data.json",
            onload: function (response) {
                let rank_json = JSON.parse(response.responseText);
                let insert_html_list = [];
                for (let i in rank_json) {
                    let top_list = rank_json[i];
                    let list_num = top_list.list[douban_id];
                    if (list_num) {
                        let list_order = top_list.top;
                        insert_html_list[list_order] = [
                            '<div class="top250">',
                            '<span class="top250-no">',
                            top_list.prefix ? top_list.prefix : 'No.',
                            list_num,
                            '</span>',
                            '<span class="top250-link">',
                            '<a',
                            ' href="', top_list.href, '"',
                            ' title="', top_list.title, '"',
                            ' target="_blank"',
                            '>',
                            top_list.short_title,
                            '</a>',
                            '</span>',
                            '</div>'
                        ].join('');
                    }
                }
                if (insert_html_list.length > 0) {
                    // 加载样式
                    if (document.querySelector('link[href*="top250.css"]') === null) {
                        const cssLink = document.createElement('link');
                        cssLink.rel = 'stylesheet';
                        cssLink.href = 'https://img1.doubanio.com/cuphead/movie-static/charts/top250.24c18.css';
                        document.head.appendChild(cssLink);
                    }

                    // 插入 HTML
                    insert_html_list.push([
                        '<div style="display: none;" id="rank_toggle" data-toggle="show">',
                        '<a href="javascript:void(0)">展示剩余 →</a>',
                        '</div>'
                    ].join(''));
                    const after = document.querySelector("#content > h1");
                    if (after) {
                        after.insertAdjacentHTML('beforebegin', insert_html_list.join(' '));

                        // 展示/隐藏逻辑
                        const topSelector = document.querySelectorAll(".top250");
                        topSelector.forEach(item => item.style.display = "inline-block");
                        if (topSelector.length > 4) {
                            Array.from(topSelector).slice(4).forEach(item => item.style.display = "none");
                            const toggleButton = document.getElementById('rank_toggle');
                            toggleButton.style.display = "inline-block";
                            toggleButton.addEventListener('click', function () {
                                const toggleState = this.getAttribute('data-toggle');
                                if (toggleState === 'show') {
                                    topSelector.forEach(item => item.style.display = "inline-block");
                                    this.setAttribute('data-toggle', 'hide');
                                    this.innerHTML = '<a href="javascript:void(0)">隐藏剩余 ←</a>';
                                } else {
                                    Array.from(topSelector).slice(4).forEach(item => item.style.display = "none");
                                    this.setAttribute('data-toggle', 'show');
                                    this.innerHTML = '<a href="javascript:void(0)">展示剩余 →</a>';
                                }
                            });
                        }
                    }
                }
            },
            onerror: function (error) {
                console.error("Failed to load rank data:", error);
                alert("无法加载榜单信息，请稍后再试！");
            }
        });
    }
    // 检查当前页面是否为 www.douban.com/podcast 页面
    else if (location.host === "www.douban.com" && location.pathname.startsWith("/podcast")) {
        // 获取当前豆瓣播客页面的播客名称
        // <div id="wrapper">
        //     <div id="content">
        //         <h1>枫言枫语播客</h1>
        //         ...
        //     </div>
        // </div>
        const after = document.querySelector("#content > h1");
        const podcast_name = after.innerText;

        // 从远程 JSON 加载榜单数据
        GM_xmlhttpRequest({
            method: 'GET',
            url: "https://xyzrank.eddiehe.top/full.json",
            onload: function (response) {
                let rank_json = JSON.parse(response.responseText);
                let insert_html_list = [];

                const foundPodcast = rank_json.data.podcasts.find(
                    podcast => podcast.name === podcast_name
                );

                if (foundPodcast) {
                    insert_html_list[0] = [
                        '<div class="top250">',
                        '<span class="top250-no">',
                        `No.${foundPodcast.rank}`,
                        '</span>',
                        '<span class="top250-link">',
                        '<a',
                        ' href="', `${foundPodcast.links[0].url}`, '"',
                        ' title="', '中文播客榜', '"',
                        ' target="_blank"',
                        '>',
                        '中文播客榜',
                        '</a>',
                        '</span>',
                        '</div>'
                    ].join('');
                }

                if (insert_html_list.length > 0) {
                    // 加载样式
                    if (document.querySelector('link[href*="top250.css"]') === null) {
                        const cssLink = document.createElement('link');
                        cssLink.rel = 'stylesheet';
                        cssLink.href = 'https://img1.doubanio.com/cuphead/movie-static/charts/top250.24c18.css';
                        document.head.appendChild(cssLink);
                    }

                    // 插入 HTML
                    insert_html_list.push([
                        '<div style="display: none;" id="rank_toggle" data-toggle="show">',
                        '<a href="javascript:void(0)">展示剩余 →</a>',
                        '</div>'
                    ].join(''));
                    const after = document.querySelector("#content > h1");
                    if (after) {
                        after.insertAdjacentHTML('beforebegin', insert_html_list.join(' '));
                    }
                }

            }
        });
    }

})();
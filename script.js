// ==UserScript==
// @name         从小说站到绿站 by PipeYume
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  在小说源站获取轻小说机翻机器人的体验。目前功能。检测小说站标题，获取绿站的中文译名标题加在其下，点击中文译名标题可以跳转到绿站。80%都是GPT写的。TODO: 1. 匹配绿站支持的所有小说站域名。2. 在小说站显示绿站的翻译。
// @author       PipeYume
// @match        *://kakuyomu.jp/*
// @match        *://syosetu.org/*
// @match        *://novelup.plus/*
// @match        *://syosetu.com/*
// @match        *://ncode.syosetu.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Default settings
    const defaultShowTranslatedTitle = true;
    const defaultBaseURL = 'https://books.fishhawk.top';

    // Get the current settings or use the defaults
    const showTranslatedTitle = GM_getValue('showTranslatedTitle', defaultShowTranslatedTitle);
    let baseURL = GM_getValue('baseURL', defaultBaseURL);

    GM_registerMenuCommand(`切换显示翻译标题 (当前: ${showTranslatedTitle ? '开启' : '关闭'})`, () => {
        GM_setValue('showTranslatedTitle', !showTranslatedTitle);
        alert(`显示翻译标题现已${!showTranslatedTitle ? '开启' : '关闭'}`);
        location.reload(); // Reload the page to apply the new setting
    });

    GM_registerMenuCommand(`切换绿站 URL (当前: ${baseURL})`, () => {
        let newURL = prompt("请输入新的绿站 URL:", baseURL);
        if (newURL) {
            baseURL = newURL;
            GM_setValue('baseURL', baseURL);
            alert(`绿站 URL 已切换为 ${baseURL}`);
            location.reload(); // Reload the page to apply the new setting
        }
    });

    GM_registerMenuCommand('清除书籍信息缓存', () => {
        GM_deleteValue('bookInfoCache');
        alert('书籍信息缓存已清除');
    });

    // Retrieve bookInfoCache from local storage or initialize as empty object
    let bookInfoCache = GM_getValue('bookInfoCache', {});

    // Function to save bookInfoCache to local storage
    function saveBookInfoCache() {
        GM_setValue('bookInfoCache', bookInfoCache);
    }

    const siteConfigs = {
        'kakuyomu.jp': {
            "toGreenSiteUrl": {
                pattern: /^https:\/\/kakuyomu\.jp\/works\/(\d+)(?:\/episodes\/(\d+))?$/,
                convert: (match) => `${baseURL}/novel/kakuyomu/${match[1]}${match[2] ? `/${match[2]}` : ''}`
            },
            "toBookInfoApiUrl": {
                pattern: /^https:\/\/kakuyomu\.jp\/works\/(\d+)$/,
                convert: (match) => `${baseURL}/api/novel/kakuyomu/${match[1]}`
            }
        },
        'syosetu.org': {
            "toGreenSiteUrl": {
                pattern: /^https:\/\/syosetu\.org\/novel\/(\d+)(\/\d+)?\/?(\.html)?$/,
                convert: (match) => `${baseURL}/novel/hameln/${match[1]}${match[2] ? `/${match[2].slice(1)}` : ''}`
            },
            "toBookInfoApiUrl": {
                pattern: /^https:\/\/syosetu\.org\/novel\/(\d+)\/?$/,
                convert: (match) => `${baseURL}/api/novel/hameln/${match[1]}`
            }
        },
        'novelup.plus': {
            "toGreenSiteUrl": {
                pattern: /^https:\/\/novelup\.plus\/story\/(\d+)(\/\d+)?\/?$/,
                convert: (match) => `${baseURL}/novel/novelup/${match[1]}${match[2] ? `/${match[2].slice(1)}` : ''}`
            },
            "toBookInfoApiUrl": {
                pattern: /^https:\/\/novelup\.plus\/story\/(\d+)$/,
                convert: (match) => `${baseURL}/api/novel/novelup/${match[1]}`
            }
        },
        'ncode.syosetu.com': {
            "toGreenSiteUrl": {
                pattern: /^https:\/\/ncode\.syosetu\.com\/([a-z0-9]+)(\/\d+)?\/?$/,
                convert: (match) => `${baseURL}/novel/syosetu/${match[1]}${match[2] ? `/${match[2].slice(1)}` : ''}`
            },
            "toBookInfoApiUrl": {
                pattern: /^https:\/\/ncode\.syosetu\.com\/([a-z0-9]+)\/?$/,
                convert: (match) => `${baseURL}/api/novel/syosetu/${match[1]}`
            }
        }
    };

    // Function to convert the original URL to the green site URL based on the domain
    function convertUrl(originalUrl, task_in_config) {
        const url = new URL(originalUrl);
        if(siteConfigs[url.hostname]){
            const Config = siteConfigs[url.hostname][task_in_config];
            if (Config) {
                const match = originalUrl.match(Config.pattern);
                if (match) {
                    return `${Config.convert(match)}`;
                }
            }
        }
        return null;
    }

    function findDeepestElementWithText(element, text, maxLength = 15) {
        // 标题太长，在小说站会被截断，所以只用对比 text的前面的字符。比如显示成 "xxx..."
        text = text.length > maxLength ? text.slice(0, maxLength) : text;
        if (element.textContent.includes(text.trim())){
            for (let child of element.children) {
                if (child.children.length > 0) {
                    const found = findDeepestElementWithText(child, text);
                    if (found) return found;
                } else if (child.textContent.includes(text.trim())) {
                    return child;
                }
            }
            return element;
        }
        return null
    }
    function insertTranslatedTitle(link, data, greenSiteUrl) {
        const titleJp = data.titleJp;
        const titleZh = data.titleZh;
        
        // 查找包含 titleJp 的最底层子元素
        const targetElement = findDeepestElementWithText(link, titleJp.trim());
    
        if (targetElement) {
            // 如果 .translated-title 元素不存在，创建一个新的
            let translatedTitleElement = targetElement.parentElement.querySelector('.translated-title');
            if (!translatedTitleElement) {
                translatedTitleElement = document.createElement('div');
                translatedTitleElement.className = 'translated-title';
                translatedTitleElement.style.color = 'green'; // 可选：自定义样式
                translatedTitleElement.style.fontWeight = 'bold';
            } else {
                // 如果已经存在，先清空内容
                translatedTitleElement.textContent = "";
            }
    
            // 创建带有链接的翻译标题
            if (greenSiteUrl) {
                const translatedTitleLink = document.createElement('a');
                translatedTitleLink.href = greenSiteUrl;
                translatedTitleLink.textContent = titleZh ? titleZh : "暂无译名";
                translatedTitleLink.style.color = 'green'; // 可选：链接的自定义样式
                translatedTitleElement.appendChild(translatedTitleLink);
            } else {
                translatedTitleElement.textContent = titleZh ? titleZh : "暂无译名";
            }
    
            // 插入到 targetElement 之后
            targetElement.parentElement.insertBefore(translatedTitleElement, targetElement.nextSibling);
        }
    }

    function fetchAndInsertTranslatedTitle(link) {
        const href = link.href;
        const bookInfoApiUrl = convertUrl(link.href, "toBookInfoApiUrl");
        const greenSiteUrl = convertUrl(link.href, "toGreenSiteUrl");
        if (!bookInfoApiUrl) return;
        if (bookInfoCache[bookInfoApiUrl]) {
            // Use cached data
            insertTranslatedTitle(link, bookInfoCache[bookInfoApiUrl], greenSiteUrl);
        } else {
            GM_xmlhttpRequest({
                method: 'GET',
                url: bookInfoApiUrl,
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        // Cache the data
                        if(data.titleJp){
                            bookInfoCache[bookInfoApiUrl] = {"titleJp": data.titleJp, "titleZh": data.titleZh ? data.titleZh: '暂无译名'};
                        }
                        saveBookInfoCache(); // Save updated cache to local storage
                        insertTranslatedTitle(link, data, greenSiteUrl);
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            });
        }
    }

    // Function to process all links on the page
    function processLinks() {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (showTranslatedTitle) {
                let translatedTitleElement = link.querySelector('.translated-title');
                if (!translatedTitleElement) {
                    fetchAndInsertTranslatedTitle(link);
                }
            }
        });
    }

    // Initial processing
    processLinks();

    // Function to throttle the processing of DOM changes
    function throttle(fn, wait) {
        let timeout = null;
        return function (...args) {
            if (timeout) return;
            timeout = setTimeout(() => {
                fn(...args);
                timeout = null;
            }, wait);
        };
    }
    // Optimized MutationObserver
    const observer = new MutationObserver(throttle((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // Process links only when there are new links added
                processLinks();
            }
        });
    }, 1000)); // Adjust the throttle time as needed
    // Start observing the document for changes
    const targetNode = document.body; // You can change this to a more specific target if needed
    const config = { childList: true, subtree: true };
    observer.observe(targetNode, config);
})();
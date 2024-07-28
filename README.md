# 从小说站到绿站 by PipeYume

## 概述

这是一个用于大部分日文轻小说网站的用户脚本，旨在通过在源站上检测内容，并添加来自[轻小说机翻机器人站](https://books.fishhawk.top)(又称绿站)的中文译名标题和中文译文。80%代码由GPT生成。

## 功能

- **标题检测**：在小说源站上检测轻小说链接，并判断其文本是否是标题。
- **添加译名**：在标题下方添加绿站的中文译名标题链接。
- **快速跳转**：点击中文译名标题，可以快速跳转到绿站相应的小说页面。
- **多站点支持**：支持多个小说站点，包括 `kakuyomu.jp`, `syosetu.org`, `novelup.plus`。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 创建一个新脚本，并将此脚本的代码复制粘贴到其中。
3. 保存并启用脚本。

## 使用

- **切换显示翻译标题**：在脚本管理器中可以切换是否显示翻译标题。
- **切换绿站 URL**：支持切换绿站的不同 URL。
- **清除书籍信息缓存**：可以清除本地存储的书籍信息缓存。

## 支持的站点

- `kakuyomu.jp`
- `syosetu.org`
- `novelup.plus`
- 其它站点正在写

## 开发与贡献

此脚本仍在开发中，欢迎反馈与贡献！有任何问题或建议，请联系作者 PipeYume。

## TODO

- **扩展站点支持**：匹配绿站支持的所有小说站域名，扩展更多的站点支持。
- **增加翻译展示**：将译文添加到源站的原文上。

## 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](LICENSE) 文件。

# Wikidot for Obsidian

在 Obsidian 中编写 Wikidot 源码，边编辑边查看排版，完成后将源码复制到你的基金会草稿页。

## 安装

需要 Obsidian 1.5.0 或更高版本。下载本仓库，将 `main.js`、`manifest.json`、`styles.css` 和 `templates` 文件夹放入知识库的 `.obsidian/plugins/flipiris-wikidot/`，然后在「设置 → 第三方插件」中启用 Wikidot for Obsidian。更新时保留同样的文件结构。

## 开始写作

1. 打开命令面板，运行 **Wikidot for Obsidian: New Wikidot draft**，或右键文件夹新建文稿。
2. 输入文件名与页面标题。默认创建 `.ftml` 文件，也可选择 `.wikidot` 或 `.wd`。
3. 在笔记顶部切换 **Source editing**（源码）、**Live editing**（实时阅览）和 **Preview**（完整预览）。
4. 完成后复制源码到 Wikidot 草稿页，在网站上再次预览并检查后发布。插件不会登录或发布。

## 编辑与排版

在行首或空白处输入 `/` 打开插入菜单，选择标题样式、div、表格、折叠块、标签页、图片或 CSS 模块等。输入 `[[` 可补全标签和属性；成对块会自动补齐结束标签。选中文字后可使用浮动菜单添加格式。简单表格中按 Tab 移至下一格，末格按 Tab 可添加一行。

实时阅览中可以直接编辑文字；光标触及语法时显示相应源码。设置中的 div 边框、块布局和定位效果可分别调整。实时阅览着重编辑，完整颜色与页面样式请在 Preview 检查。

例如，在源码中输入：

```text
+ 记录

[[collapsible show="展开记录" hide="收起记录"]]
在这里填写正文。
[[/collapsible]]
```

## 预览与 include

Preview 可选择 Minimal、SCP CN Wiki 或本地 HTML 母体。默认的 SCP CN Wiki 使用插件内置的站点外壳；自定义母体可在设置中选择，正文插入位置使用 `<!--WIKIDOT_EDITOR_CONTENT-->` 标记。预览环境与标题可按文稿设置。

公开 Wikidot include 默认启用，支持嵌套与参数。首次读取需要网络；源码和样式会缓存。使用笔记顶部的缓存管理按钮查看、刷新或删除缓存；远程内容变化后可刷新缓存。字体和图片可能仍需联网。预览不会上传本地正文。

本地预览是独立实现，并非 Wikidot 服务器：动态模块、脚本和部分站点组件可能与线上不同；评分是静态占位，公式显示为 TeX 源码。请以目标网站的预览为准。

## 导出与文件

命令 **Export as minimal HTML** 和 **Export as Markdown** 可导出当前文稿；导出文件保存在原文稿旁，同名时自动编号。HTML 不包含站点外壳及页面 CSS；Markdown 不包含 CSS、HTML 和 embed 块。源文件仍是纯文本，禁用插件后不会被删除。

## 开发

源码位于 `src/`，运行 `node scripts/build.cjs` 生成 `main.js`，运行 `node --test src/*.test.cjs` 执行测试。默认母体位于 `templates/scp-cn.html`。

# Vue-Renderer

> A simple vue renderer

## 已实现(参考 Vue 3)

- 通过编写 `h()` 来渲染页面，支持：父子组件传参、class、style、事件等
- 支持 **函数式组件** / **类组件** / **Fragment** / **Portal**
- `patch` 策略
- `diff` 算法：*React diff* / *Vue 2.6 diff* / *Vue 3 diff*
- 生命周期钩子：`mounted` / `unmounted`

## 运行项目

1. 安装依赖(仅依赖 *parcel*)：`npm i`
2. 运行项目：执行 `npm start` 后将自动打开浏览器
3. 打包项目：执行 `npm run build`
4. 尝试使用：更改 *src/index.js* 并保存，浏览器将自动响应更改

## 项目结构

```c
.
├── README.md
├── index.html ------------ 入口文件
└── src
    ├── component.js ------ 类组件的基类
    ├── flags.js ---------- 标识文件，声明了节点与子节点的类型
    ├── h.js -------------- h 方法，将返回 VNode
    ├── index.js ---------- 测试文件
    ├── render.js --------- 根据 VNode 渲染视图，包含来 patch 策略与 diff 方法
    └── utils.js ---------- 工具方法
```

## 阅读路径

1. `src/flags.js`：清晰节点以及子节点的类型，这里使用了位运算进行优化
2. `src/h.js`：清晰 *VNode* 是如何生成的，*VNode* 是 *render* 函数执行的单位
3. `src/utils.js`：清晰 `patchData()` 做了什么
4. `src/render.js`：主要文件，其入口为 `render()`，然后会走向两个策略方法 `mount()` / `patch`
    - `mount()`：根据节点的类型判断使用的 *mount* 策略
    - `patch`：根据节点的类型判断使用的 *patch* 策略


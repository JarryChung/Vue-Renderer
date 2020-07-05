/**
 * 使用位运算符提高性能
 * 基本元素直接定义，混合元素由基本元素使用或运算得来
 * 当判断某基本元素是否属于某混合元素时，使用与运算，其结果大于 0 时表真
 */
const VNodeFlags = {
  // html 标签
  ELEMENT_HTML: 1,
  // SVG 标签
  ELEMENT_SVG: 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL: 1 << 2,
  // 需要被 keepAlive 的有状态组件
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
  // 已经被 keepAlive 的有状态组件
  COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
  // 函数式组件
  COMPONENT_FUNCTIONAL: 1 << 5,

  // 纯文本
  TEXT: 1 << 6,
  // Fragment (片段)
  FRAGMENT: 1 << 7,
  // Portal (提供了一种独特的方法来将子级渲染到父组件的 DOM 层次结构之外的 DOM 节点中)
  PORTAL: 1 << 8
}
// html 和 svg 都是标签元素，可以用 ELEMENT 表示
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG
// 普通有状态组件、需要被 keepAlive 的有状态组件、已经被 keepAlice 的有状态组件 都是“有状态组件”，统一用 COMPONENT_STATEFUL 表示
VNodeFlags.COMPONENT_STATEFUL =
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE
// 有状态组件 和  函数式组件都是“组件”，用 COMPONENT 表示
VNodeFlags.COMPONENT =
  VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL

const ChildrenFlags = {
  // 未知的 children 类型
  UNKNOWN_CHILDREN: 0,
  // 没有 children
  NO_CHILDREN: 1,
  // children 是单个 VNode
  SINGLE_VNODE: 1 << 1,

  // children 是多个拥有 key 的 VNode
  KEYED_VNODES: 1 << 2,
  // children 是多个没有 key 的 VNode
  NONE_KEYED_VNODES: 1 << 3
}

ChildrenFlags.MULTIPLE_VNODES =
  ChildrenFlags.KEYED_VNODES | ChildrenFlags.NONE_KEYED_VNODES

export { VNodeFlags, ChildrenFlags }

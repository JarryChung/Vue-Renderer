import { h, Fragment, Portal } from './h.js'
import { Component } from './component.js'
import render from './render.js'

const dynamicClass = ['class-b', 'class-c']

function handler() {
  console.log('click handler')
}

// 有状态组件
class StateFulComponent extends Component {
  render () {
    return h(
      'div',
      {
        style: {
          background: 'red'
        }
      },
      [
        h('span', null, '我是组件的标题1......'),
        h('span', null, '我是组件的标题2......')
      ]
    )
  }
}

// 函数式组件
function FunctionalComponent () {
  // 返回要渲染的内容描述，即 VNode
  return h(
    'div',
    {
      style: {
        background: 'green'
      }
    },
    [
      h('span', null, '我是组件的标题1......'),
      h('span', null, '我是组件的标题2......')
    ]
  )
}

// 使用 h 函数创建 vnode
const blockVnode = h(
  'div',
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    }
  },
  h('div', {
    style: {
      height: '50px',
      width: '50px',
      background: 'green'
    },
    class: ['cls-cool', dynamicClass],
    onclick: handler
  }, 'hi')
)

const inputVnode = h('input', {
  class: 'cls-a',
  type: 'checkbox',
  checked: true,
  custom: '1'
})

const fragmentVnode = h(Fragment, null, [
  h('span', null, 'fragment1......'),
  h('span', null, 'fragment2......')
])

const portalVnode = h(Portal, { target: '#portal' }, [
  h('span', null, 'portal1......'),
  h('span', null, 'portal2......')
])

const compVnode = h('div', null, [h(StateFulComponent), h(FunctionalComponent)])

const vnode = h('div', null, [blockVnode, inputVnode, fragmentVnode, portalVnode, compVnode])
// 使用 render 函数渲染
// 第一次渲染 VNode 到 #app，此时会调用 mount 函数
// render(vnode, document.getElementById('app'))

// const newVnode = h(StateFulComponent)
// 第二次渲染新的 VNode 到相同的 #app 元素，此时会调用 patch 函数
// render(newVnode, document.getElementById('app'))

// 测试 vnodeData、 子节点、文本更新
// const prevVNode = h(
//   'div',
//   null,
//   h('p', {
//     style: {
//       height: '100px',
//       width: '100px',
//       background: 'green'
//     }
//   }, h('p', null, '子节点 222'))
// )
// const nextVNode = h(
//   'div',
//   null,
//   h('p', {
//     style: {
//       height: '100px',
//       width: '100px',
//       background: 'red'
//     }
//   }, h('p', null, '子节点 111'))
// )

// 测试 Fragment
// const prevVNode = h(Fragment, null, [
//   h('p', null, '旧片段子节点 1'),
//   h('p', null, '旧片段子节点 2')
// ])
// const nextVNode = h(Fragment, null, [
//   h('p', null, '新片段子节点 1'),
//   h('p', null, '新片段子节点 2')
// ])

// 测试 portal
const prevVNode = h(
  Portal,
  { target: '#old-portal' },
  h('p', null, '旧的 Portal')
)
const nextVNode = h(
  Portal,
  { target: '#new-portal' },
  h('p', null, '新的 Portal')
)

// setTimeout(() => {
//   render(prevVNode, document.getElementById('app'))
// }, 3000)
// setTimeout(() => {
//   render(nextVNode, document.getElementById('app'))
// }, 6000)

// class MyComponent {
//   // 自身状态 or 本地状态
//   localState = 1

//   // mounted 钩子
//   mounted() {
//     // 两秒钟之后修改本地状态的值，并重新调用 _update() 函数更新组件
//     setInterval(() => {
//       this.localState++
//       this._update()
//     }, 2000)
//   }

//   render() {
//     return h('div', null, this.localState)
//   }
// }
// render(h(MyComponent), document.getElementById('app'))

// props 传值
// 子组件类
class ChildComponent111 {
  render() {
    // 子组件中访问外部状态：this.$props.text
    return h('div', null, this.$props.text)
  }
}
class ChildComponent222 {
  unmounted () {
    console.log('unmounted')
  }
  render() {
    // 子组件中访问外部状态：this.$props.text
    return h('div', null, this.$props.text)
  }
}
// 父组件类
class ParentComponent {
  is = false

  mounted() {
    // 两秒钟后将 localState 的值修改为 'two'
    setTimeout(() => {
      this.is = true
      this._update()
      // 父组件调用 _update 方法，进入 patchComponent 方法，在 patchComponent 中调用了子组件的 _update
    }, 2000)
  }

  render() {
    return this.is ? h(ChildComponent111, { text: '111' }) : h(ChildComponent222, { text: '222' })
  }
}

// 有状态组件 VNode
render(h(ParentComponent), document.getElementById('app'))

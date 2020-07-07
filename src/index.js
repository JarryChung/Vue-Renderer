import { h, Fragment, Portal } from './h.js'
import { Component } from './component.js'
import render from './render.js'

// 动态 class，支持字符串、数组、对象形式
const classList = ['cls-a', 'cls-b']
const classObj = { 'cls-a': true, 'cls-b': false }
const onClickToAlert = () => { window.alert('U click me!!!') }

// 函数式组件
const FunctionalComponent = (props) => {
  return h(
    'div',
    {
      class: classObj
    },
    [
      h('div', { key: 1 }, `父节点的值是${props.number}`),
      h('div', { key: 2 }, `子节点接收到的值是${props.number}`),
      h('div', { key: 3, onclick: onClickToAlert }, `下一次更新的值是${props.number + 1}`),
    ]
  )
}

// 子组件1，用来测试生命周期 mounted/unmounted
class Comp1 extends Component {
  mounted () {
    console.log('Comp1 mounted!!!')
  }

  unmounted () {
    console.log('Comp1 [un]mounted!!!')
  }

  render () {
    return h('div', null, 'This is Comp1')
  }
}

// 子组件2，用来测试生命周期 mounted/unmounted
class Comp2 extends Component {
  mounted () {
    console.log('Comp2 mounted!!!')
  }

  unmounted () {
    console.log('Comp2 [un]mounted!!!')
  }

  render () {
    return h('div', null, 'This is Comp2')
  }
}

// 切换使用子组件 1/2，用来激活子组件 1/2 的生命周期
class Comp extends Component {
  isUseComp1 = true

  mounted () {
    console.log('Comp mounted!!!')
  }

  unmounted () {
    console.log('Comp [un]mounted!!!')
  }

  render () {
    return h('div', {} ,[
      h('button', {
        onclick: () => {
          this.isUseComp1 = !this.isUseComp1
          this._update()
        }
      }, '点击切换 Comp1/Comp2，打开控制台查看 mounted/unmounted 情况'),
      h(this.isUseComp1 ? Comp1 : Comp2)
    ])
  }
}

// 有状态的组件，根组件
class StatefulComponent extends Component {
  number = 1121
  target = ['#old-portal', '#new-portal']
  targetIndex = 0

  mounted () {
    console.log('StatefulComponent mounted!!!')
  }

  render () {
    return h(
      'div',
      {
        class: classList,
        style: {
          width: '500px',
          padding: '12px'
        }
      },
      [
        h(FunctionalComponent, { number: this.number }),
        h('button', {
          onclick: () => {
            this.number++
            this._update() // 因为没有响应式系统，因此需要手动更新
          }
        }, '点击这里父节点自增 1'),
        h(Fragment, null, [
          h('p', null, '这是 Fragment 111'),
          h('p', null, '这是 Fragment 222')
        ]),
        h(Portal, { target: this.target[this.targetIndex] }, [
          h('span', null, '这是 Portal'),
          h('button', {
            onclick: () => {
              this.targetIndex = this.targetIndex ^ 1
              this._update()
            }
          }, '点击这里切换 Portal 挂载点')
        ]),
        h(Comp)
      ]
    )
  }
}

render(h(StatefulComponent), document.querySelector('#app'))

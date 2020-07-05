import { VNodeFlags, ChildrenFlags } from './flags'
import { createTextVNode } from './h'
import { patchData } from './utils.js'

/**
 * 根据新旧 vnode 的情况决定使用 mount 还是 patch
 * mount：没有旧 vnode，只有新 vnode
 * patch：同时存在新旧 vnode
 * remove：没有新 vnode，只有旧 vnode
 * @param {*} vnode 新的 vnode
 * @param {*} container 目标挂载容器，里面可能存在旧的 vnode
 */
export default function render(vnode, container) {
  const prevVNode = container.vnode
  if (prevVNode == null) {
    if (vnode) {
      // 没有旧的 VNode，使用 `mount` 函数挂载全新的 VNode
      mount(vnode, container)
      // 将新的 VNode 添加到 container.vnode 属性下，这样下一次渲染时旧的 VNode 就存在了
      container.vnode = vnode
    }
  } else {
    if (vnode) {
      // 有旧的 VNode，则调用 `patch` 函数打补丁
      patch(prevVNode, vnode, container)
      // 更新 container.vnode
      container.vnode = vnode
    } else {
      // 有旧的 VNode 但是没有新的 VNode，这说明应该移除 DOM，在浏览器中可以使用 removeChild 函数。
      container.removeChild(prevVNode.el)
      container.vnode = null
    }
  }
}

// mount
function mount(vnode, container, isSVG) {
  // 通过判断不同类型的vnode来选择不同的挂载策略
  const { flags } = vnode
  if (flags & VNodeFlags.ELEMENT) {
    // 挂载普通标签
    mountElement(vnode, container, isSVG)
  } else if (flags & VNodeFlags.COMPONENT) {
    // 挂载组件
    mountComponent(vnode, container, isSVG)
  } else if (flags & VNodeFlags.TEXT) {
    // 挂载纯文本
    mountText(vnode, container)
  } else if (flags & VNodeFlags.FRAGMENT) {
    // 挂载 Fragment
    mountFragment(vnode, container, isSVG)
  } else if (flags & VNodeFlags.PORTAL) {
    // 挂载 Portal
    mountPortal(vnode, container, isSVG)
  }
}

function mountElement(vnode, container, isSVG) {
  // 父元素是 svg 元素，那么子元素也一定是 svg 元素
  // 因为 svg 的书写总是以 <svg> 标签开始的，所有其他 svg 相关的标签都是 <svg> 标签的子代元素
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
  const el = isSVG
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)
  vnode.el = el
  const data = vnode.data
  if (data) {
    for (let key in data) {
      patchData(el, key, null, data[key])
    }
  }

  const { childFlags, children } = vnode
  // 检测如果没有子节点则无需递归挂载
  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      // 如果是单个子节点则调用 mount 函数挂载
      // 这里需要把 isSVG 传递下去
      mount(children, el, isSVG)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      for (let i = 0; i < children.length; i++) {
        // 如果是单多个子节点则遍历并调用 mount 函数挂载
        // 这里需要把 isSVG 传递下去
        mount(children[i], el, isSVG)
      }
    }
  }

  container.appendChild(el)
}

function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children)
  vnode.el = el
  container.appendChild(el)
}

function mountFragment(vnode, container, isSVG) {
  // 对于 Fragment 类型的 VNode 的挂载，就等价于只挂载一个 VNode 的 children
  // Fragment vnode 的 el 指向：
  // 1. 只有一个子节点，那么指向这个子节点
  // 2. 有多个子节点，那么指向第一个子节点
  // 3. 没有子节点，那么指向占位的空文本节点
  // 因为：在 patch 阶段对DOM元素进行移动时，应该确保将其放到正确的位置，而不应该始终使用 appendChild 函数，
  //      有时需要使用 insertBefore 函数，这时候我们就需要拿到相应的节点引用，
  //      此时 vnode.el 属性是必不可少的，正如代码中即使 Fragment 没有子节点我们依然需要一个占位的空文本节点作为位置的引用
  const { children, childFlags } = vnode
  switch (childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      // 如果是单个子节点，则直接调用 mount
      mount(children, container, isSVG)
      // 单个子节点，就指向该节点
      vnode.el = children.el
      break
    case ChildrenFlags.NO_CHILDREN:
      // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
      const placeholder = createTextVNode('')
      mountText(placeholder, container)
      // 没有子节点指向占位的空文本节点
      vnode.el = placeholder.el
      break
    default:
      // 多个子节点，遍历挂载之
      for (let i = 0; i < children.length; i++) {
        mount(children[i], container, isSVG)
      }
      // 多个子节点，指向第一个子节点
      vnode.el = children[0].el
  }
}

function mountPortal(vnode, container) {
  // Portal 可以不严谨地认为是指定挂载节点的 Fragment
  const { tag, children, childFlags } = vnode

  // 获取挂载点
  const target = typeof tag === 'string' ? document.querySelector(tag) : tag

  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    // 将 children 挂载到 target 上，而非 container
    mount(children, target)
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    for (let i = 0; i < children.length; i++) {
      // 将 children 挂载到 target 上，而非 container
      mount(children[i], target)
    }
  }

  // 特性：虽然 Portal 的内容可以被渲染到任意位置，但它的行为仍然像普通的DOM元素一样，如事件的捕获/冒泡机制仍然按照代码所编写的DOM结构实施
  // 因此在原来的位置创建一个空文本节点，以支持该特性
  // 占位的空文本节点
  const placeholder = createTextVNode('')
  // 将该节点挂载到 container 中
  mountText(placeholder, container, null)
  // el 属性引用该节点
  vnode.el = placeholder.el
}

function mountComponent(vnode, container, isSVG) {
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG)
  } else {
    mountFunctionalComponent(vnode, container, isSVG)
  }
}

function mountStatefulComponent(vnode, container, isSVG) {
  // 创建组件实例
  // 如果一个 VNode 描述的是有状态组件，那么 vnode.tag 属性值就是组件类的引用，所以通过 new 关键字创建组件实例
  const instance = (vnode.children = new vnode.tag())
  // 初始化 props
  instance.$props = vnode.data

  instance._update = function() {
    // 组件必然有 render 函数，该 render 函数返回一个 vnode
    if (instance._mounted) {
      // 更新
      // 1、拿到旧的 VNode
      const prevVNode = instance.$vnode
      // 2、重渲染新的 VNode
      const nextVNode = (instance.$vnode = instance.render())
      // 3、patch 更新
      patch(prevVNode, nextVNode, prevVNode.el.parentNode)
      // 4、更新 vnode.el 和 $el
      instance.$el = vnode.el = instance.$vnode.el
    } else {
      // 1、渲染VNode
      instance.$vnode = instance.render()
      // 2、挂载
      mount(instance.$vnode, container, isSVG)
      // 3、组件已挂载的标识
      instance._mounted = true
      // 4、el 属性值 和 组件实例的 $el 属性都引用组件的根 DOM 元素
      instance.$el = vnode.el = instance.$vnode.el
      // 5、调用 mounted 钩子
      instance.mounted && instance.mounted()
    }
  }

  // 仅仅在这里的调用 _update 才会调用 mounted 钩子
  instance._update()
}

function mountFunctionalComponent(vnode, container, isSVG) {
  // 在函数式组件类型的 vnode 上添加 handle 属性，它是一个对象
  vnode.handle = {
    prev: null,
    next: vnode,
    container,
    update: () => {
      if (vnode.handle.prev) {
        // 更新
        // prevVNode 是旧的组件VNode，nextVNode 是新的组件VNode
        const prevVNode = vnode.handle.prev
        const nextVNode = vnode.handle.next
        // prevTree 是组件产出的旧的 VNode
        const prevTree = prevVNode.children
        // 更新 props 数据
        const props = nextVNode.data
        // nextTree 是组件产出的新的 VNode
        const nextTree = (nextVNode.children = nextVNode.tag(props))
        // 调用 patch 函数更新
        patch(prevTree, nextTree, vnode.handle.container)
      } else {
        // 获取 props
        const props = vnode.data
        // 获取 VNode
        const $vnode = (vnode.children = vnode.tag(props))
        // 挂载
        mount($vnode, container, isSVG)
        // el 元素引用该组件的根元素
        vnode.el = $vnode.el
      }
    }
  }
  // 立即调用 vnode.handle.update 完成初次挂载
  vnode.handle.update()
}

// patch
function patch(prevVNode, nextVNode, container) {
  // 分别拿到新旧 VNode 的类型，即 flags
  const nextFlags = nextVNode.flags
  const prevFlags = prevVNode.flags

  // 只有相同类型的 VNode 才有比对的意义
  // 检查新旧 VNode 的类型是否相同，如果类型不同，则直接调用 replaceVNode 函数替换 VNode
  // 如果新旧 VNode 的类型相同，则根据不同的类型调用不同的比对函数
  if (prevFlags !== nextFlags) {
    replaceVNode(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.ELEMENT) {
    patchElement(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.COMPONENT) {
    patchComponent(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.TEXT) {
    patchText(prevVNode, nextVNode)
  } else if (nextFlags & VNodeFlags.FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container)
  } else if (nextFlags & VNodeFlags.PORTAL) {
    patchPortal(prevVNode, nextVNode)
  }
}

function replaceVNode(prevVNode, nextVNode, container) {
  // 将旧的 VNode 所渲染的 DOM 从容器中移除
  container.removeChild(prevVNode.el)

  // 如果将要被移除的 VNode 类型是组件，则需要调用该组件实例的 unmounted 钩子函数
  if (prevVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    // 类型为有状态组件的 VNode，其 children 属性被用来存储组件实例对象
    const instance = prevVNode.children
    instance.unmounted && instance.unmounted()
  }

  // 再把新的 VNode 挂载到容器中
  mount(nextVNode, container)
}

function patchElement(prevVNode, nextVNode, container) {
  // 如果新旧 VNode 描述的是不同的标签，则调用 replaceVNode 函数，使用新的 VNode 替换旧的 VNode
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container)
    return
  }
  // 否则需要比对 vnodeData 以及 children
  // 拿到 el 元素，注意这时要让 nextVNode.el 也引用该元素
  const el = (nextVNode.el = prevVNode.el)
  // 拿到 新旧 VNodeData
  const prevData = prevVNode.data
  const nextData = nextVNode.data
  if (nextData) {
    // 遍历新的 VNodeData，将旧值和新值都传递给 patchData 函数
    for (let key in nextData) {
      const prevValue = prevData[key]
      const nextValue = nextData[key]
      patchData(el, key, prevValue, nextValue)
    }
  }
  if (prevData) {
    // 遍历旧的 VNodeData，将已经不存在于新的 VNodeData 中的数据移除
    for (let key in prevData) {
      const prevValue = prevData[key]
      if (prevValue && !nextData.hasOwnProperty(key)) {
        // 第四个参数为 null，代表移除数据
        patchData(el, key, prevValue, null)
      }
    }
  }

  // 调用 patchChildren 函数递归的更新子节点
  patchChildren(
    prevVNode.childFlags, // 旧的 VNode 子节点的类型
    nextVNode.childFlags, // 新的 VNode 子节点的类型
    prevVNode.children, // 旧的 VNode 子节点
    nextVNode.children, // 新的 VNode 子节点
    el // 当前标签元素，即这些子节点的父节点
  )
}

/**
 * patchChildren 策略
 * 1.1 旧的单个子节点、新的子节点为单个子节点，两个子节点之间 patch
 * 1.2 旧的单个子节点、没有新的子节点，移除旧的子节点
 * 1.3 旧的单个子节点、但有多个新的子节点，移除旧的单个子节点，并添加多个新的子节点
 * 2.1 没有旧的子节点、新的子节点为单个子节点，此时只需要把新的单个子节点添加到容器元素即可
 * 2.2 没有旧的子节点、同时也没有新的子节点，那自然什么都不用做了
 * 2.3 没有旧的子节点、但有多个新的子节点，那把这多个子节点都添加到容器元素即可
 * 3.1 有多个旧的子节点，但新的子节点是单个子节点，这时只需要把所有旧的子节点移除，再将新的单个子节点添加到容器元素即可
 * 3.2 有多个旧的子节点，但没有新的子节点，这时只需要把所有旧的子节点移除即可
 * 3.3 新旧子节点都是多个子节点，此时将进入到 diff 阶段(只有当新旧子节点都是多个子节点时才有必要进行真正的核心 diff，从而尽可能的复用子节点)
 */
function patchChildren(
  prevChildFlags,
  nextChildFlags,
  prevChildren,
  nextChildren,
  container
) {
  switch (prevChildFlags) {
    // 旧的 children 是单个子节点
    case ChildrenFlags.SINGLE_VNODE:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 也是单个子节点时
          patch(prevChildren, nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时
          container.removeChild(prevChildren.el)
          break
        default:
          // 新的 children 中有多个子节点时
          // 移除旧的单个子节点
          container.removeChild(prevChildren.el)
          // 遍历新的多个子节点，逐个挂载到容器中
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    // 旧的 children 中没有子节点时
    case ChildrenFlags.NO_CHILDREN:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点时
          // 使用 mount 函数将新的子节点挂载到容器元素
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时
          // 什么都不做
          break
        default:
          // 新的 children 中有多个子节点时
          // 遍历多个新的子节点，逐个使用 mount 函数挂载到容器元素
          for (let i = 0; i < nextChildren.length; i++) {
            mount(nextChildren[i], container)
          }
          break
      }
      break
    // 旧的 children 中有多个子节点时
    default:
      switch (nextChildFlags) {
        case ChildrenFlags.SINGLE_VNODE:
          // 新的 children 是单个子节点时
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          mount(nextChildren, container)
          break
        case ChildrenFlags.NO_CHILDREN:
          // 新的 children 中没有子节点时
          for (let i = 0; i < prevChildren.length; i++) {
            container.removeChild(prevChildren[i].el)
          }
          break
        default:
          // 新的 children 中有多个子节点时
          // 简单 diff 算法(舍弃)
          // // 遍历旧的子节点，将其全部移除
          // for (let i = 0; i < prevChildren.length; i++) {
          //   container.removeChild(prevChildren[i].el)
          // }
          // // 遍历新的子节点，将其全部添加
          // for (let i = 0; i < nextChildren.length; i++) {
          //   mount(nextChildren[i], container)
          // }

          // 参考 diff 策略： https://neil.fraser.name/writing/diff/
          // 未采用 key 时，会采用以下算法
          // 获取公共长度，取新旧 children 长度较小的那一个
          const prevLen = prevChildren.length
          const nextLen = nextChildren.length
          const commonLength = prevLen > nextLen ? nextLen : prevLen
          for (let i = 0; i < commonLength; i++) {
            patch(prevChildren[i], nextChildren[i], container)
          }
          // 如果 nextLen > prevLen，将多出来的元素添加
          if (nextLen > prevLen) {
            for (let i = commonLength; i < nextLen; i++) {
              mount(nextChildren[i], container)
            }
          } else if (prevLen > nextLen) {
            // 如果 prevLen > nextLen，将多出来的元素移除
            for (let i = commonLength; i < prevLen; i++) {
              container.removeChild(prevChildren[i].el)
            }
          }
          break
      }
      break
  }
}

function patchText(prevVNode, nextVNode) {
  // 拿到文本元素 el，同时让 nextVNode.el 指向该文本元素
  const el = (nextVNode.el = prevVNode.el)
  // 只有当新旧文本内容不一致时才有必要更新
  if (nextVNode.children !== prevVNode.children) {
    el.nodeValue = nextVNode.children
  }
}

function patchFragment(prevVNode, nextVNode, container) {
  // 直接调用 patchChildren 函数更新 新旧片段的子节点即可
  patchChildren(
    prevVNode.childFlags, // 旧片段的子节点类型
    nextVNode.childFlags, // 新片段的子节点类型
    prevVNode.children,   // 旧片段的子节点
    nextVNode.children,   // 新片段的子节点
    container
  )

  switch (nextVNode.childFlags) {
    // 如果新的片段的 children 类型是单个子节点，则意味着其 vnode.children 属性的值就是 VNode 对象
    // 所以直接将 nextVNode.children.el 赋值给 nextVNode.el 即可
    case ChildrenFlags.SINGLE_VNODE:
      nextVNode.el = nextVNode.children.el
      break
    // 如果新的片段没有子节点，对于没有子节点的片段我们会使用一个空的文本节点占位
    // 而 prevVNode.el 属性引用的就是该空文本节点
    // 所以直接通过旧片段的 prevVNode.el 拿到该空文本元素并赋值给新片段的 nextVNode.el 即可
    case ChildrenFlags.NO_CHILDREN:
      nextVNode.el = prevVNode.el
      break
    default:
      // 如果新的片段的类型是多个子节点，则 nextVNode.children 是一个 VNode 数组
      // 让新片段的 nextVNode.el 属性引用数组中的第一个元素即可
      nextVNode.el = nextVNode.children[0].el
  }
}

function patchPortal (prevVNode, nextVNode) {
  // 第五个参数是旧的挂载容器，
  // 也就是说即使新的 Portal 的挂载目标变了，但是在这一步的更新完成之后 Portal 的内容仍然存在于旧的容器中
  patchChildren(
    prevVNode.childFlags,
    nextVNode.childFlags,
    prevVNode.children,
    nextVNode.children,
    prevVNode.tag // 注意容器元素是旧的 container
  )

  // 对于 Portal 类型的 VNode 来说其 el 属性始终是一个占位的文本节点
  // 让 nextVNode.el 指向 prevVNode.el
  nextVNode.el = prevVNode.el

  // 更新后的子节点也存在于旧的容器中, 如果新旧容器不同，需要搬运子节点
  if (nextVNode.tag !== prevVNode.tag) {
    // 获取新的容器元素，即挂载目标
    const container =
      typeof nextVNode.tag === 'string'
        ? document.querySelector(nextVNode.tag)
        : nextVNode.tag

    switch (nextVNode.childFlags) {
      case ChildrenFlags.SINGLE_VNODE:
        // 如果新的 Portal 是单个子节点，就把该节点搬运到新容器中
        // appendChild 方法会移除旧节点下的 el，将该 el 放在新节点上，即搬运
        container.appendChild(nextVNode.children.el)
        break
      case ChildrenFlags.NO_CHILDREN:
        // 新的 Portal 没有子节点，不需要搬运
        break
      default:
        // 如果新的 Portal 是多个子节点，遍历逐个将它们搬运到新容器中
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el)
        }
        break
    }
  }
}

function patchComponent(prevVNode, nextVNode, container) {
  // tag 属性的值是组件类，通过比较新旧组件类是否相等来判断是否是相同的组件
  if (nextVNode.tag !== prevVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container)
  } else
  // 以下需要区分 有状态组件 与 函数式组件，其主要区别在于如何存储新旧节点以及 update 方法
  // 对于有状态组件，它是实例话类而来的，因此可以直接将 update 方法放在实例中进行保存
  // 而函数式组件是无状态的，因此需要将 update 方法以及相关信息存储在对象中，并将这个对象挂载到函数变量上

  // 检查组件是否是有状态组件
  if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    // 1、获取组件实例
    const instance = (nextVNode.children = prevVNode.children)
    // 2、更新 props
    instance.$props = nextVNode.data
    // 3、更新组件
    instance._update()
  } else {
    // 更新函数式组件
    // 通过 prevVNode.handle 拿到 handle 对象
    const handle = (nextVNode.handle = prevVNode.handle)
    // 更新 handle 对象
    handle.prev = prevVNode
    handle.next = nextVNode
    handle.container = container

    // 调用 update 函数完成更新
    handle.update()
  }
}

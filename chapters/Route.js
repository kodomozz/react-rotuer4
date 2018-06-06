import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";
import matchPath from "./matchPath";

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    path: PropTypes.string,
    exact: PropTypes.bool,
    strict: PropTypes.bool,
    sensitive: PropTypes.bool,
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      route: PropTypes.object.isRequired,
      staticContext: PropTypes.object
    })
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };
 // 设置上下文 属性， 先取到上下文中的属性， 然后通过计算 新的覆盖旧的
  getChildContext() {
    return {
      router: {
        ...this.context.router,  
        route: {
          location: this.props.location || this.context.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props, this.context.router)
  };
//  strict, exact, sensitive 等参数是 path-to-regexp库中提供的参数，具体在 matchPath 一节中会讲到 
  computeMatch(
    { computedMatch, location, path, strict, exact, sensitive },
    router
  ) {
    // 如果在 Switch 函数中匹配过了，则直接返回不在匹配
    if (computedMatch) return computedMatch; 
    // 没有 router 属性的话直接抛出异常 不能将route  用在 router 外面, 只要是在 Router里面， 
    // 就可以拿到上下文中的router
    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    const { route } = router;
    const pathname = (location || route.location).pathname;
    // 通过 matchPath方法匹配，如果匹配成功 返回如下：

    // return {
    //   path, 
    //   url: path === "/" && url === "" ? "/" : url, 
    //   isExact, 
    //   params: keys.reduce((memo, key, index) => {
    //     memo[key.name] = values[index];
    //     return memo;
    //   }, {})
    // };

    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }

  componentWillMount() {
    // 总结下下面的意思， 不能同时存在 component， render, children, 如果同时存在的话，优先级高的覆盖优先级低的
    // component > render > children 
    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }

  componentWillReceiveProps(nextProps, nextContext) {
    // 下面两个判断是意思是 不能原来传了location, 后面不传，或者原来没有，但是后面又传了
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
    // 当有新的props 传入时重新匹配
    this.setState({
      match: this.computeMatch(nextProps, nextContext.router)
    });
  }

  render() {
    const { match } = this.state;
    const { children, component, render } = this.props;
    const { history, route, staticContext } = this.context.router;
    const location = this.props.location || route.location;
    const props = { match, location, history, staticContext };
    //  注意： 如果没有匹配成功则返回的为 null 
    //  如果匹配成功则返回 将 { match, location, history, staticContext }等属性 给 component添加上
    if (component) return match ? React.createElement(component, props) : null;

    if (render) return match ? render(props) : null;

    if (typeof children === "function") return children(props);
    // children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    //  在propTypes定义的时候明确 children 可以是 函数或者 
    // 所有可以被渲染的对象：数字，字符串，DOM 元素或包含这些类型的数组。
    //如果不是 函数 则 不处理 将children 原封返回
    if (children && !isEmptyChildren(children))
      return React.Children.only(children);

    return null;
  }
}

export default Route;


// Route 是react-router 组件中最重要的一个没有之一
// 使用 matchPath 方法 匹配路径， 渲染匹配成功的 component
class Router extends React.Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    children: PropTypes.node
  };
  // 获取上下文属性 router
  static contextTypes = {
    router: PropTypes.object
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };
 // 定义上下文属性 router
  getChildContext() {
    return {
      router: {
        ...this.context.router,
        history: this.props.history,
        route: {
          location: this.props.history.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  componentWillMount() {
    const { children, history } = this.props;
    // 如果children 不是null 或者 单子元素的话 抛出erorr 必须为一个子元素
    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    // Do this here so we can setState when a <Redirect> changes the
    // location in componentWillMount. This happens e.g. when doing
    // server rendering using a <StaticRouter>.

  // 监听 history 的变化 如果已有一变化则执行 computeMatch, 返回 path、url、params、isExact四个属性
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    // 当接受到新的属性的时候 比较props中的history, 如果新的history 和 旧的history 不一致，
    // 则警告 不能改变 history 的类型， 例如不能从hashHistory 变为 browserHistory
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    // ummount 时 取消history监听事件
    this.unlisten();
  }

  render() {
    const { children } = this.props;
    return children ? React.Children.only(children) : null;
  }
}

export default Router;

// Router 创建Route容器， 相当于Redux 中的 <Provider>，用context来保持与 location 的同步
// 在componentWillMount时 增加事件的监听， componentWillUnmount 时取消时间监听

